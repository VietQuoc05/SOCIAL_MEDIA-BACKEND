import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
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
    @Req() req: any,
  ) {
    try {
      const body = req.body || {};
      const result = await this.service.getPresignedPutUrl(body.fileName || '', body.contentType || '');
      return result;
    } catch (error: any) {
      console.error('Presigned URL error:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Post('file')
  async uploadFile(
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const contentType = req.headers['content-type'] as string;
    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new BadRequestException('Expected multipart/form-data');
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks);

      try {
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
        if (!boundaryMatch) {
          throw new BadRequestException('No boundary found in content-type');
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2];
        const boundaryBuffer = Buffer.from(`--${boundary}`, 'utf-8');

        let fileBuffer: Buffer | null = null;
        let filename: string | undefined;
        let mimetype: string | undefined;

        let start = 0;
        for (let i = 0; i < body.length; i++) {
          if (body.slice(i, i + boundaryBuffer.length).equals(boundaryBuffer)) {
            if (i > start) {
              const part = body.slice(start, i);
              const headerEnd = part.indexOf(Buffer.from('\r\n\r\n', 'utf-8'));
              if (headerEnd !== -1) {
                const headerSection = part.slice(0, headerEnd).toString('utf-8');
                let bodySection = part.slice(headerEnd + 4);

                while (
                  bodySection.length > 0 &&
                  bodySection[bodySection.length - 1] === 0x0A &&
                  bodySection.length > 1 &&
                  bodySection[bodySection.length - 2] === 0x0D
                ) {
                  bodySection = bodySection.slice(0, -2);
                }

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
          throw new BadRequestException('No file found in multipart body');
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
        } as any);

        return result;
      } catch (error: any) {
        console.error('Upload error:', error.message, error.stack);
        throw new BadRequestException(error.message || 'Upload failed');
      }
    });

    req.on('error', (err) => {
      console.error('Request stream error:', err);
      throw new BadRequestException('Request reading failed');
    });
  }
}
