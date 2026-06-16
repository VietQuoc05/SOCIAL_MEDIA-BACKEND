import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly service: UploadService) {}

  @Post('presign')
  async getPresignedUrl(@CurrentUser() user: any, @Body() body: { fileName: string; contentType: string }) {
    try {
      const result = await this.service.getPresignedPutUrl(body.fileName, body.contentType);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  async uploadFile(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    try {
      const result = await this.service.uploadFileToStorage(file);
      return result;
    } catch (error: any) {
      console.error('Upload error:', error.message, error.stack);
      throw new BadRequestException(error.message || 'Upload failed');
    }
  }
}
