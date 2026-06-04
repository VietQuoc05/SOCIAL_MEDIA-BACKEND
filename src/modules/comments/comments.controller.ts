import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import { CreateCommentDto } from './dto/create-comment.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  // ✅ CREATE
  @ApiOperation({ summary: 'Create a comment' })
  @Post(':postId')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.create(user.id, postId, dto);
  }

  // ✅ DELETE
  @ApiOperation({ summary: 'Delete comment (author or post owner)' })
  @Delete(':id/:postId')
  delete(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.delete(user.id, id, postId);
  }

  // ✅ GET TREE + HOT
  @ApiOperation({ summary: 'Get comments (tree + hot sorting)' })
  @Get('post/:postId')
  getByPost(@Param('postId') postId: string) {
    return this.service.getByPost(postId);
  }
}
``