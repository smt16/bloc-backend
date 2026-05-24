#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ComputeStack } from '../lib/compute-stack';
import { DataStack } from '../lib/data-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

const envName = app.node.tryGetContext('env') ?? 'staging';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'us-east-1';

const env: cdk.Environment = { account, region };

const networkStack = new NetworkStack(app, `BlocNetwork-${envName}`, {
  env,
  envName,
});

const secretsStack = new SecretsStack(app, `BlocSecrets-${envName}`, {
  env,
  envName,
});

const dataStack = new DataStack(app, `BlocData-${envName}`, {
  env,
  envName,
  vpc: networkStack.vpc,
  dataSecurityGroup: networkStack.dataSecurityGroup,
});

const storageStack = new StorageStack(app, `BlocStorage-${envName}`, {
  env,
  envName,
});

new ComputeStack(app, `BlocCompute-${envName}`, {
  env,
  envName,
  vpc: networkStack.vpc,
  databaseSecret: dataStack.databaseSecret,
  redisEndpoint: dataStack.redisEndpoint,
  mediaBucket: storageStack.mediaBucket,
  cloudfrontDomain: storageStack.cloudfrontDomain,
  appSecrets: secretsStack.appSecrets,
});
