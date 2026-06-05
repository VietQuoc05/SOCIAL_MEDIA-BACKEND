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

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Follow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth() // ✅ QUAN TRỌNG
@Controller('follow')
export class FollowController {
  constructor(private readonly service: FollowService) {}

  // ============================
  // ✅ GET FOLLOWERS
  // ============================
  @ApiOperation({ summary: 'Get followers' })
  @Get('followers')
  followers(@CurrentUser() user: any) {
    return this.service.getFollowers(user.id);
  }

  // ============================
  // ✅ GET FOLLOWING
  // ============================
  @ApiOperation({ summary: 'Get following' })
  @Get('following')
  following(@CurrentUser() user: any) {
    return this.service.getFollowing(user.id);
  }

  // ============================
  // ✅ FOLLOW STATS 🔥
  // ============================
  @ApiOperation({ summary: 'Get follow stats' })
  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.service.getFollowStats(user.id);
  }

  // ============================
  // ✅ FOLLOW USER
  // ============================
  @ApiOperation({ summary: 'Follow user' })
  @Post(':id')
  follow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.follow(user.id, id);
  }

  // ============================
  // ✅ UNFOLLOW USER
  // ============================
  @ApiOperation({ summary: 'Unfollow user' })
  @Delete(':id')
  unfollow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unfollow(user.id, id);
  }
}