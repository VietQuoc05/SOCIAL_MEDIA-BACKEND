import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private service: CommentsService) {}

  @Post(':postId')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user,
    @Body() dto,
  ) {
    return this.service.create(user.sub, postId, dto);
  }

  @Delete(':id/:postId')
  delete(
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.service.delete(id, postId);
  }
}