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

  private getExtensionFromMime(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'image/heif': '.heif',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
    };
    return map[mimetype] || '';
  }

  async uploadFileToStorage(file: Express.Multer.File) {
    const ext = this.getExtensionFromMime(file.mimetype);
    const baseName = file.originalname?.trim() || `file`;
    const key = `${Date.now()}-${baseName}${ext}`;
    const bucket = this.s3Service.getBucketName();
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${key}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.mimetype,
        },
        body: new Uint8Array(file.buffer),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload to storage failed: ${error}`);
    }

    return { key, url: this.s3Service.getPublicUrl(key) };
  }
}
