import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SecretsStackProps extends cdk.StackProps {
  envName: string;
}

export class SecretsStack extends cdk.Stack {
  readonly appSecrets: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    this.appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `bloc/${props.envName}/app`,
      description: 'Application secrets for Bloc backend',
    });

    new cdk.CfnOutput(this, 'AppSecretsArn', {
      value: this.appSecrets.secretArn,
    });
  }
}
