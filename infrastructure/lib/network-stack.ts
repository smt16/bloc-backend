import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  envName: string;
}

/**
 * NetworkStack — VPC and security groups shared by all other stacks.
 *
 * Layout:
 *   Public subnets  → ALB (created by ComputeStack)
 *   Private subnets → ECS tasks, RDS, ElastiCache
 *
 * A single NAT gateway keeps staging costs low; production can add more later.
 */
export class NetworkStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;
  readonly ecsSecurityGroup: ec2.SecurityGroup;
  readonly dataSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // 2 AZs for RDS/ElastiCache subnet group requirements
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Reserved for custom ECS task SG rules; ALB↔ECS wiring is handled by
    // ApplicationLoadBalancedFargateService in ComputeStack.
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'ECS tasks security group',
      allowAllOutbound: true,
    });

    // Shared by RDS and ElastiCache — only accepts traffic from within the VPC
    this.dataSecurityGroup = new ec2.SecurityGroup(this, 'DataSecurityGroup', {
      vpc: this.vpc,
      description: 'RDS and Redis security group',
      allowAllOutbound: false,
    });
    this.dataSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow VPC to PostgreSQL',
    );
    this.dataSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow VPC to Redis',
    );
  }
}
