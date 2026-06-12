import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private bucket = process.env.S3_BUCKET || 'social';
  private supabaseUrl = process.env.SUPABASE_URL || '';
  private supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  getBucketName() {
    return this.bucket;
  }

  getPublicUrl(fileName: string) {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${fileName}`;
  }

  async getPresignedPutUrl(fileName: string, contentType: string, expiresIn = 3600) {
    const key = `${Date.now()}-${fileName}`;

    const response = await fetch(
      `${this.supabaseUrl}/storage/v1/object/upload/sign/${this.bucket}/${key}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn, contentType }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get signed URL: ${error}`);
    }

    const data = await response.json();
    const signedUrl = data.signedUrl || data.url;
    return { key, url: signedUrl.startsWith('http') ? signedUrl : `${this.supabaseUrl}${signedUrl}` };
  }

  async getPresignedGetUrl(fileName: string, expiresIn = 3600) {
    const response = await fetch(
      `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get signed URL: ${error}`);
    }

    const data = await response.json();
    const signedUrl = data.signedUrl || data.url;
    return signedUrl.startsWith('http') ? signedUrl : `${this.supabaseUrl}${signedUrl}`;
  }
}