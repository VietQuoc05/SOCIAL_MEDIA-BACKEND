import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly service: UploadService) {}

  @Post('presign')
  async getPresignedUrl(
    @CurrentUser() user: any,
    @Body() body: { fileName: string; contentType: string },
  ) {
    try {
      const result = await this.service.getPresignedPutUrl(body.fileName, body.contentType);
      console.log('Presigned URL result:', result);
      return result;
    } catch (error: any) {
      console.error('Presigned URL error:', error.message, error.stack);
      return { error: error.message };
    }
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'No file provided' };
    }
    try {
      const result = await this.service.uploadFileToStorage(file);
      return result;
    } catch (error: any) {
      console.error('Upload error:', error.message, error.stack);
      return { error: error.message };
    }
  }
}
