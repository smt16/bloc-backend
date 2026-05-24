import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  dataSecurityGroup: ec2.ISecurityGroup;
}

/**
 * DataStack — persistent stateful services for the backend.
 *
 *   PostgreSQL (RDS)  → primary database (TypeORM)
 *   Redis (ElastiCache) → BullMQ job queues, pub/sub, Socket.IO adapter
 *
 * Both run in private subnets and are not publicly accessible.
 * Production gets Multi-AZ RDS and deletion protection; staging does not.
 */
export class DataStack extends cdk.Stack {
  readonly databaseSecret: secretsmanager.ISecret;
  readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Auto-generated password stored in Secrets Manager; ECS reads it at runtime
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `bloc/${props.envName}/database`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'bloc' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const dbInstance = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.dataSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      databaseName: 'bloc',
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // autoscales storage up to 100 GB under load
      multiAz: props.envName === 'production',
      deletionProtection: props.envName === 'production',
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // ElastiCache requires a subnet group spanning at least 2 AZs
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Redis subnet group',
        subnetIds: props.vpc.privateSubnets.map((subnet) => subnet.subnetId),
        cacheSubnetGroupName: `bloc-${props.envName}-redis`,
      },
    );

    // Single-node Redis — sufficient for Phase 1; upgrade to replication group later
    const redisCluster = new elasticache.CfnCacheCluster(this, 'Redis', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [props.dataSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
    });
    redisCluster.addDependency(redisSubnetGroup);

    this.redisEndpoint = redisCluster.attrRedisEndpointAddress;

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
    });
  }
}
