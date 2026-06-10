import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
  Query,
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
@ApiBearerAuth()
@Controller('follow')
export class FollowController {
  constructor(private readonly service: FollowService) {}

  @ApiOperation({ summary: 'Get followers' })
  @Get('followers')
  followers(@CurrentUser() user: any, @Query('userId') userId?: string) {
    return this.service.getFollowers(userId || user.id);
  }

  @ApiOperation({ summary: 'Get following' })
  @Get('following')
  following(@CurrentUser() user: any, @Query('userId') userId?: string) {
    return this.service.getFollowing(userId || user.id);
  }

  @ApiOperation({ summary: 'Get follow stats' })
  @Get('stats')
  stats(@CurrentUser() user: any, @Query('userId') userId?: string) {
    return this.service.getFollowStats(userId || user.id);
  }

  @ApiOperation({ summary: 'Follow user' })
  @Post(':id')
  follow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.follow(user.id, id);
  }

  @ApiOperation({ summary: 'Unfollow user' })
  @Delete(':id')
  unfollow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unfollow(user.id, id);
  }
}
