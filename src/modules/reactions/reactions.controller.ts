import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';

import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import { ReactDto } from './dto/react.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Reactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly service: ReactionsService) {}

  // ============================
  // ✅ REACT POST
  // ============================
  @ApiOperation({ summary: 'React to a post' })
  @Post('post/:id')
  reactPost(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReactDto,
  ) {
    return this.service.reactPost(user.id, id, dto.type);
  }

  // ============================
  // ✅ REMOVE POST REACTION
  // ============================
  @ApiOperation({ summary: 'Remove reaction from post' })
  @Delete('post/:id')
  removePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removePostReaction(user.id, id);
  }

  // ============================
  // ✅ REACT COMMENT
  // ============================
  @ApiOperation({ summary: 'React to a comment' })
  @Post('comment/:id')
  reactComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReactDto,
  ) {
    return this.service.reactComment(user.id, id, dto.type);
  }

  // ============================
  // ✅ REMOVE COMMENT REACTION
  // ============================
  @ApiOperation({ summary: 'Remove reaction from comment' })
  @Delete('comment/:id')
  removeComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removeCommentReaction(user.id, id);
  }

  // ============================
  // ✅ UPDATE REACTION 🔥
  // ============================
  @ApiOperation({ summary: 'Update reaction' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
          example: 'love',
        },
      },
      required: ['type'],
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('type') type: string,
  ) {
    return this.service.updateReaction(user.id, id, type);
  }
}