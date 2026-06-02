import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';

import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('follow')
export class FollowController {
  constructor(private service: FollowService) {}

  @Post(':id')
  follow(@Param('id') id: string, @CurrentUser() user) {
    return this.service.follow(user.sub, id);
  }

  @Delete(':id')
  unfollow(@Param('id') id: string, @CurrentUser() user) {
    return this.service.unfollow(user.sub, id);
  }

  @Get('followers')
  followers(@CurrentUser() user) {
    return this.service.getFollowers(user.sub);
  }

  @Get('following')
  following(@CurrentUser() user) {
    return this.service.getFollowing(user.sub);
  }
}