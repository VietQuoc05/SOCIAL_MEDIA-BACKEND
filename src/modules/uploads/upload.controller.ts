import {
  Controller,
  Post,
  Body,
  UseGuards,
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
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.service.getPresignedPutUrl(body.fileName, body.contentType);
  }
}
