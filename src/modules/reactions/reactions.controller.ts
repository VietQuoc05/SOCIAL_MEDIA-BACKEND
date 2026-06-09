import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Reactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly service: ReactionsService) {}

  // ============================
  // ✅ TOGGLE POST LIKE ❤️
  // ============================
  @ApiOperation({ summary: 'Toggle like on post' })
  @Post('post/:id')
  togglePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.togglePostReaction(user.id, id);
  }

  // ============================
  // ✅ REMOVE POST LIKE (OPTIONAL)
  // ============================
  @ApiOperation({ summary: 'Remove like from post' })
  @Delete('post/:id')
  removePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removePostReaction(user.id, id);
  }

  // ============================
  // ✅ TOGGLE COMMENT LIKE ❤️
  // ============================
  @ApiOperation({ summary: 'Toggle like on comment' })
  @Post('comment/:id')
  toggleComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.toggleCommentReaction(
      user.id,
      id,
    );
  }

  // ============================
  // ✅ REMOVE COMMENT LIKE (OPTIONAL)
  // ============================
  @ApiOperation({ summary: 'Remove like from comment' })
  @Delete('comment/:id')
  removeComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removeCommentReaction(
      user.id,
      id,
    );
  }
}
