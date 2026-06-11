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
  getPresignedUrl(
    @CurrentUser() user: any,
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
  ) {
    return this.service.getPresignedPutUrl(fileName, contentType);
  }
}
