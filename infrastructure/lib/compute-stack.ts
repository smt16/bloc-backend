import * as cdk from 'aws-cdk-lib';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

/** Idle window before non-prod Fargate tasks scale to zero. */
const IDLE_SCALE_IN_MINUTES = 20;

export interface ComputeStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  databaseSecret: secretsmanager.ISecret;
  redisEndpoint: string;
  mediaBucket: s3.IBucket;
  cloudfrontDomain: string;
  appSecrets: secretsmanager.ISecret;
}

/**
 * ComputeStack — runs the NestJS backend on ECS Fargate behind an ALB.
 *
 * Request flow:
 *   Client → ALB (public) → Fargate task (private subnet, port 3000)
 *
 * Non-production: Fargate desired count scales to 0 after 20 minutes with no
 * ALB requests, then scales back to 1+ on the next request.
 *
 * The deploy workflow builds a Docker image, pushes to ECR, then updates
 * this service. The placeholder image below is replaced on first deploy.
 *
 * WebSocket support: Redis adapter in the app handles multi-instance fan-out,
 * so ALB sticky sessions are not required.
 */
export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const isProd = props.envName === 'production';

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true, // sends CPU/memory metrics to CloudWatch
    });

    // Task role — permissions the running container needs (not the deploy agent)
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    props.databaseSecret.grantRead(taskRole);
    props.appSecrets.grantRead(taskRole);
    props.mediaBucket.grantReadWrite(taskRole);

    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Target for the GitHub Actions deploy workflow (docker push destination)
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `bloc-backend-${props.envName}`,
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: props.envName !== 'production',
    });

    // Creates ALB + target group + Fargate service + task definition in one construct
    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'FargateService',
        {
          cluster,
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: 1,
          publicLoadBalancer: true,
          taskImageOptions: {
            // Placeholder — replaced by ECR image on first CI deploy
            image: ecs.ContainerImage.fromRegistry(
              'public.ecr.aws/docker/library/node:22-alpine',
            ),
            containerPort: 3000,
            taskRole,
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: 'bloc-backend',
              logGroup,
            }),
            // Non-sensitive config passed as plain env vars
            environment: {
              NODE_ENV: props.envName,
              PORT: '3000',
              API_PREFIX: 'api',
              AWS_REGION: cdk.Stack.of(this).region,
              S3_BUCKET: props.mediaBucket.bucketName,
              CLOUDFRONT_DOMAIN: props.cloudfrontDomain,
              REDIS_HOST: props.redisEndpoint,
              REDIS_PORT: '6379',
              POSTHOG_ENABLED: 'false',
              // Auth0 — set these per-env via context (`cdk deploy -c auth0Domain=...`)
              // or override at the pipeline level. Domain + audience are public values.
              AUTH0_DOMAIN:
                (this.node.tryGetContext('auth0Domain') as
                  | string
                  | undefined) ?? 'YOUR_AUTH0_DOMAIN',
              AUTH0_AUDIENCE:
                (this.node.tryGetContext('auth0Audience') as
                  | string
                  | undefined) ?? 'https://api.bloc.app',
              AUTH0_CUSTOM_CLAIM_NAMESPACE:
                (this.node.tryGetContext('auth0Namespace') as
                  | string
                  | undefined) ?? 'https://bloc.app/',
            },
            // Sensitive values injected from Secrets Manager at task startup
            secrets: {
              DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
                props.databaseSecret,
                'password',
              ),
            },
          },
        },
      );

    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
    });

    const scaling = fargateService.service.autoScaleTaskCount({
      // Non-prod can idle at 0 tasks; production stays warm.
      minCapacity: isProd ? 1 : 0,
      maxCapacity: isProd ? 4 : 2,
    });

    if (isProd) {
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
      });
    } else {
      // Scale to zero after IDLE_SCALE_IN_MINUTES with no ALB requests;
      // wake back up on the next request (cold start ~30–60s).
      const requestCount = fargateService.loadBalancer.metrics.requestCount({
        period: cdk.Duration.minutes(1),
      });

      scaling.scaleOnMetric('ScaleOutOnRequests', {
        metric: requestCount,
        adjustmentType: appscaling.AdjustmentType.EXACT_CAPACITY,
        evaluationPeriods: 1,
        cooldown: cdk.Duration.seconds(60),
        scalingSteps: [
          { lower: 1, change: 1 },
          { lower: 50, change: 2 },
        ],
      });

      scaling.scaleOnMetric('ScaleInWhenIdle', {
        metric: requestCount,
        adjustmentType: appscaling.AdjustmentType.EXACT_CAPACITY,
        evaluationPeriods: IDLE_SCALE_IN_MINUTES,
        datapointsToAlarm: IDLE_SCALE_IN_MINUTES,
        cooldown: cdk.Duration.minutes(5),
        scalingSteps: [
          { upper: 0, change: 0 },
          { upper: 0, change: 0 },
        ],
      });
    }

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
    });
  }
}
