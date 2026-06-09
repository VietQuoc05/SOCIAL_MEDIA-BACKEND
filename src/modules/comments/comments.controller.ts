import {
  Controller,
  Body,  
  Post,
  Param,
  UseGuards,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

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

  // ============================
  // ✅ CREATE COMMENT (TEXT ONLY)
  // ============================
  @ApiOperation({ summary: 'Create a comment' })
  @Post(':postId')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.service.create(user.id, postId, dto);
  }

  // ============================
  // ✅ UPDATE COMMENT
  // ============================
  @ApiOperation({ summary: 'Update comment' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.service.update(user.id, id, dto);
  }

  // ============================
  // ✅ DELETE COMMENT
  // ============================
  @ApiOperation({ summary: 'Delete comment' })
  @Delete(':id/:postId')
  delete(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.delete(user.id, id, postId);
  }

  // ============================
  // ✅ GET COMMENTS
  // ============================
  @ApiOperation({ summary: 'Get comments by post' })
  @Get('post/:postId')
  getByPost(
    @Param('postId') postId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getByPost(postId, user?.id);
  }
}

