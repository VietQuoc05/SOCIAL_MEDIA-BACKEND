import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

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
  async uploadFile(
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const contentType = req.headers['content-type'] as string;
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return { error: 'Expected multipart/form-data' };
    }

    const body = req.body;
    const buffer = (req as any).buffer;

    if (!buffer || buffer.length === 0) {
      return { error: 'No file data received' };
    }

    try {
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
      if (!boundaryMatch) {
        return { error: 'No boundary found in content-type' };
      }
      const boundary = boundaryMatch[1] || boundaryMatch[2];
      const boundaryBuffer = Buffer.from(`--${boundary}`, 'utf-8');
      const boundaryEndBuffer = Buffer.from(`--${boundary}--`, 'utf-8');

      let fileBuffer: Buffer | null = null;
      let filename: string | undefined;
      let mimetype: string | undefined;

      let start = 0;
      for (let i = 0; i < buffer.length; i++) {
        if (buffer.slice(i, i + boundaryBuffer.length).equals(boundaryBuffer)) {
          if (i > start) {
            const part = buffer.slice(start, i);
            const headerEnd = part.indexOf(Buffer.from('\r\n\r\n', 'utf-8'));
            if (headerEnd !== -1) {
              const headerSection = part.slice(0, headerEnd).toString('utf-8');
              const bodySection = part.slice(headerEnd + 4);

              const filenameMatch = headerSection.match(/filename="([^"]*)"/);
              const contentTypeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/);

              if (filenameMatch && bodySection.length > 0) {
                filename = decodeURIComponent(filenameMatch[1]);
                mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
                fileBuffer = bodySection;
              }
            }
          }
          start = i + boundaryBuffer.length + 2;
        }
      }

      if (!fileBuffer) {
        return { error: 'No file found in multipart body' };
      }

      const result = await this.service.uploadFileToStorage({
        originalname: filename || 'upload',
        mimetype: mimetype || 'image/jpeg',
        buffer: fileBuffer,
        size: fileBuffer.length,
        fieldname: 'file',
        destination: '',
        encoding: '7bit',
        filename: filename || 'upload',
        path: '',
        stream: null as any,
      } as Express.Multer.File);

      return result;
    } catch (error: any) {
      console.error('Upload error:', error.message, error.stack);
      return { error: error.message };
    }
  }
}
