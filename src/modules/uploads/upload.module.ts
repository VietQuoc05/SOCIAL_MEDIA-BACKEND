import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';

@Module({
  providers: [UploadService],
  exports: [UploadService],  // QUAN TRỌNG
})
export class UploadModule {}