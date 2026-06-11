import { Injectable, OnModuleInit } from '@nestjs/common';
import { MinioClient } from '../../config/minio.config';

@Injectable()
export class UploadService implements OnModuleInit {
  private bucket = process.env.MINIO_BUCKET || 'social';

  async onModuleInit() {
    try {
      const exists = await MinioClient.bucketExists(this.bucket);
      if (!exists) {
        await MinioClient.makeBucket(this.bucket);
        console.log(`✅ Bucket "${this.bucket}" created`);
      } else {
        console.log(`ℹ️  Bucket "${this.bucket}" already exists`);
      }
    } catch (err: any) {
      console.warn(`⚠️  Bucket check/create skipped: ${err?.message || err}`);
    }

    try {
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { '*': '*' },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      });
      await MinioClient.setBucketPolicy(this.bucket, policy);
      console.log(`✅ Bucket "${this.bucket}" set to public read`);
    } catch (err: any) {
      console.warn(`⚠️  Bucket policy skipped: ${err?.message || err}`);
      console.warn(`   Không sao nếu bucket đã public hoặc endpoint không hỗ trợ setBucketPolicy`);
    }
  }

  // ✅ UPLOAD 1 FILE
  async uploadFile(file: Express.Multer.File) {
    const fileName = `${Date.now()}-${file.originalname}`;
    try {
      await MinioClient.putObject(
        this.bucket,
        fileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );
      return fileName;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`❌ Upload failed: bucket=${this.bucket}, file=${fileName}, error=${msg}`);
      throw new Error(`Upload failed: ${msg}`);
    }
  }

  // ✅ UPLOAD MULTIPLE
  async uploadMultiple(files: Express.Multer.File[]) {
    return Promise.all(
      files.map((file) => this.uploadFile(file)),
    );
  }

  // ✅ GET FULL URL
  getFileUrl(fileName: string) {
    const publicUrl = process.env.MINIO_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl}/${fileName}`;
    }
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const host = process.env.MINIO_ENDPOINT;
    return `${protocol}://${host}/${this.bucket}/${fileName}`;
  }
}