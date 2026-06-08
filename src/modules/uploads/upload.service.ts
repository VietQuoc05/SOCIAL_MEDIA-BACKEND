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
    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this.bucket}/${fileName}`;
  }
}
``