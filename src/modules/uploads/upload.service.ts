import { Injectable, OnModuleInit } from '@nestjs/common';
import { MinioClient } from '../../config/minio.config';

@Injectable()
export class UploadService implements OnModuleInit {
  bucket = process.env.MINIO_BUCKET;

  async onModuleInit() {
    const exists = await MinioClient.bucketExists(this.bucket);
    if (!exists) await MinioClient.makeBucket(this.bucket);
  }

  async upload(file: Express.Multer.File) {
    const name = Date.now() + '-' + file.originalname;

    await MinioClient.putObject(
      this.bucket,
      name,
      file.buffer,
    );

    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this.bucket}/${name}`;
  }
}