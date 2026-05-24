#!/usr/bin/env node
/**
 * CDK entry point — wires up all Bloc backend stacks for a given environment.
 *
 * Deploy:  cd infrastructure && npm run deploy -- -c env=staging
 * Synth:    npm run synth
 *
 * Stack order matters only for cross-stack references (VPC, secrets, endpoints
 * are passed from earlier stacks into ComputeStack).
 */
import * as cdk from 'aws-cdk-lib';
import { ComputeStack } from '../lib/compute-stack';
import { DataStack } from '../lib/data-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

// Target environment — override with: cdk deploy -c env=production
const envName = app.node.tryGetContext('env') ?? 'staging';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'us-east-1';

const env: cdk.Environment = { account, region };

// --- Foundation: networking and secrets (no dependencies on other stacks) ---

const networkStack = new NetworkStack(app, `BlocNetwork-${envName}`, {
  env,
  envName,
});

const secretsStack = new SecretsStack(app, `BlocSecrets-${envName}`, {
  env,
  envName,
});

// --- Data & storage (depend on VPC from NetworkStack) ---

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

// --- Compute: pulls together VPC, DB, Redis, S3, and app secrets ---

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
