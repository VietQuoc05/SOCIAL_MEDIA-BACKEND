import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reactions')
export class ReactionsController {
  constructor(private service: ReactionsService) {}

  @Post('post/:id')
  reactPost(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body('type') type: string,
  ) {
    return this.service.reactPost(user.sub, id, type);
  }

  @Delete('post/:id')
  removePost(@Param('id') id: string, @CurrentUser() user) {
    return this.service.removePostReaction(user.sub, id);
  }

  @Post('comment/:id')
  reactComment(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body('type') type: string,
  ) {
    return this.service.reactComment(user.sub, id, type);
  }

  @Delete('comment/:id')
  removeComment(@Param('id') id: string, @CurrentUser() user) {
    return this.service.removeCommentReaction(user.sub, id);
  }
}