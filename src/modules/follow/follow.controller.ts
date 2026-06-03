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
  constructor(private readonly service: FollowService) {}

  // ============================
  // ✅ GET FOLLOWERS (AI FOLLOW MÌNH)
  // ============================
  @Get('followers')
  followers(@CurrentUser() user: any) {
    return this.service.getFollowers(user.id);
  }

  // ============================
  // ✅ GET FOLLOWING (MÌNH FOLLOW AI)
  // ============================
  @Get('following')
  following(@CurrentUser() user: any) {
    return this.service.getFollowing(user.id);
  }

  // ============================
  // ✅ FOLLOW STATS (COUNT)
  // ============================
  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.service.getFollowStats(user.id);
  }

  // ============================
  // ✅ FOLLOW USER
  // ⚠️ Route dynamic phải để cuối
  // ============================
  @Post(':id')
  follow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.follow(user.id, id);
  }

  // ============================
  // ✅ UNFOLLOW USER
  // ============================
  @Delete(':id')
  unfollow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unfollow(user.id, id);
  }
}
