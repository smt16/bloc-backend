import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string | undefined;
  private readonly cloudfrontDomain: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
    });
    this.bucket = this.configService.get<string>('aws.s3Bucket');
    this.cloudfrontDomain = this.configService.get<string>(
      'aws.cloudfrontDomain',
    );
  }

  getPresignedUploadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.bucket) {
      throw new NotImplementedException('S3 bucket is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.bucket) {
      throw new NotImplementedException('S3 bucket is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  buildCdnUrl(key: string): string {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`;
    }

    if (!this.bucket) {
      throw new NotImplementedException(
        'CloudFront domain and S3 bucket are not configured',
      );
    }

    const region = this.configService.get<string>('aws.region');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
