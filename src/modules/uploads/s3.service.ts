import { Injectable } from '@nestjs/common';
import { s3Client } from '../../config/s3.config';
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private bucket = process.env.S3_BUCKET || 'social';

  getBucketName() {
    return this.bucket;
  }

  getPublicUrl(fileName: string) {
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl}/${fileName}`;
    }
    const endpoint = process.env.S3_ENDPOINT;
    const useSSL = process.env.S3_USE_SSL === 'true';
    if (endpoint) {
      const protocol = useSSL ? 'https' : 'http';
      return `${protocol}://${endpoint}/${this.bucket}/${fileName}`;
    }
    return fileName;
  }

  async getPresignedPutUrl(fileName: string, contentType: string, expiresIn = 3600) {
    const key = `${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { key, url };
  }

  async getPresignedGetUrl(fileName: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
  }

}