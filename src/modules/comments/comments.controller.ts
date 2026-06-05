import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/upload.config';

@ApiTags('Comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        image: { type: 'string', format: 'binary' },
        parentId: { type: 'string' },
      },
    },
  })
  @Post(':postId')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: any,
    @UploadedFile() file,
    @Body() dto: any,
  ) {
    const image = file?.filename;
    return this.service.create(user.id, postId, {
      ...dto,
      ...(image && { image }),
    });
  }

  // ✅ UPDATE COMMENT
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id/:postId')
  delete(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.delete(user.id, id, postId);
  }

  @Get('post/:postId')
  getByPost(@Param('postId') postId: string) {
    return this.service.getByPost(postId);
  }
}