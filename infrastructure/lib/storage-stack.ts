import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  envName: string;
}

/**
 * StorageStack — media file storage and CDN delivery.
 *
 * Flow:
 *   Upload  → client gets a presigned S3 PUT URL from the API
 *   Serve   → CloudFront reads from S3 via Origin Access Control (OAC)
 *
 * The bucket is fully private; all public access goes through CloudFront.
 */
export class StorageStack extends cdk.Stack {
  readonly mediaBucket: s3.Bucket;
  readonly cloudfrontDomain: string;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: undefined, // let CDK generate a unique name
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'production',
      // CORS allows the mobile app to upload directly via presigned URLs
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const distribution = new cloudfront.Distribution(this, 'MediaCdn', {
      defaultBehavior: {
        // OAC replaces the older OAI pattern — S3 only trusts this distribution
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.mediaBucket,
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    this.cloudfrontDomain = distribution.distributionDomainName;

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.cloudfrontDomain,
    });
  }
}
