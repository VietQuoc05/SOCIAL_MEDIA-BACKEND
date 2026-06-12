import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class S3Service {
  private bucket = process.env.S3_BUCKET || 'social';
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getBucketName() {
    return this.bucket;
  }

  getPublicUrl(fileName: string) {
    const supabaseUrl = process.env.SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${this.bucket}/${fileName}`;
  }

  async getPresignedPutUrl(fileName: string, contentType: string, expiresIn = 3600) {
    const key = `${Date.now()}-${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(key);

    if (error) {
      throw error;
    }

    return { key, url: data.signedUrl };
  }

  async getPresignedGetUrl(fileName: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(fileName, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }
}