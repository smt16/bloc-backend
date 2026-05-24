import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  databaseSecret: secretsmanager.ISecret;
  redisEndpoint: string;
  mediaBucket: s3.IBucket;
  cloudfrontDomain: string;
  appSecrets: secretsmanager.ISecret;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

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

    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `bloc-backend-${props.envName}`,
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: props.envName !== 'production',
    });

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'FargateService',
        {
          cluster,
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: props.envName === 'production' ? 2 : 1,
          publicLoadBalancer: true,
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry(
              'public.ecr.aws/docker/library/node:22-alpine',
            ),
            containerPort: 3000,
            taskRole,
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: 'bloc-backend',
              logGroup,
            }),
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
            },
            secrets: {
              DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
                props.databaseSecret,
                'password',
              ),
              JWT_SECRET: ecs.Secret.fromSecretsManager(
                props.appSecrets,
                'JWT_SECRET',
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
      minCapacity: 1,
      maxCapacity: props.envName === 'production' ? 4 : 2,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
    });
  }
}
