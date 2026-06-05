import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Get,
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

  // ✅ CREATE COMMENT
  @ApiOperation({ summary: 'Create a comment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
        parentId: {
          type: 'string',
        },
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

  @ApiOperation({ summary: 'Delete comment' })
  @Delete(':id/:postId')
  delete(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.delete(user.id, id, postId);
  }

  @ApiOperation({ summary: 'Get comments' })
  @Get('post/:postId')
  getByPost(@Param('postId') postId: string) {
    return this.service.getByPost(postId);
  }
}