import { Injectable, OnModuleInit } from '@nestjs/common';
import { MinioClient } from '../../config/minio.config';

@Injectable()
export class UploadService implements OnModuleInit {
  private bucket = process.env.MINIO_BUCKET || 'social';

  async onModuleInit() {
    const exists = await MinioClient.bucketExists(this.bucket);

    if (!exists) {
      await MinioClient.makeBucket(this.bucket);
    }

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
    console.log(`✅ Bucket "${this.bucket}" created and set to public read`);
  }

  // ✅ UPLOAD 1 FILE
  async uploadFile(file: Express.Multer.File) {
    const fileName = `${Date.now()}-${file.originalname}`;

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
  }

  // ✅ UPLOAD MULTIPLE
  async uploadMultiple(files: Express.Multer.File[]) {
    return Promise.all(
      files.map((file) => this.uploadFile(file)),
    );
  }

  // ✅ GET FULL URL
  getFileUrl(fileName: string) {
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const host = process.env.MINIO_ENDPOINT;
    return `${protocol}://${host}/${this.bucket}/${fileName}`;
  }
}