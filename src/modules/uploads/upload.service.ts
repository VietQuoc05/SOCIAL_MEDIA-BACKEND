import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

  async getPresignedPutUrl(fileName: string, contentType: string) {
    return this.s3Service.getPresignedPutUrl(fileName, contentType);
  }

  async getPublicUrl(fileName: string) {
    return this.s3Service.getPublicUrl(fileName);
  }
}
