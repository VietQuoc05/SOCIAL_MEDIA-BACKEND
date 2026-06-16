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
    return map[mimetype] || '.bin';
  }

  private sanitizeFileName(name: string | undefined): string {
    if (!name || name.trim() === '') return 'file';
    let clean = name.trim();
    if (clean.includes('://')) {
      clean = clean.split('/').pop() || clean;
    }
    if (clean.includes('%')) {
      clean = decodeURIComponent(clean);
    }
    clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!clean || clean === '.') clean = 'file';
    const lastDot = clean.lastIndexOf('.');
    if (lastDot === -1) return clean;
    const namePart = clean.substring(0, lastDot);
    const extPart = clean.substring(lastDot);
    const sanitizedName = namePart.replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
    return sanitizedName + extPart;
  }

  async uploadFileToStorage(file: Express.Multer.File) {
    const ext = this.getExtensionFromMime(file.mimetype);
    const sanitized = this.sanitizeFileName(file.originalname);
    const key = `${Date.now()}-${sanitized}${ext}`;
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
          'x-upsert': 'true',
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
