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

  @Post('post/:id')
  reactPost(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReactDto,
  ) {
    return this.service.reactPost(user.id, id, dto.type);
  }

  @Delete('post/:id')
  removePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.removePostReaction(user.id, id);
  }

  @Post('comment/:id')
  reactComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReactDto,
  ) {
    return this.service.reactComment(user.id, id, dto.type);
  }

  @Delete('comment/:id')
  removeComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.removeCommentReaction(user.id, id);
  }

  // ✅ UPDATE REACTION
  @Patch(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'love' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('type') type: string,
  ) {
    return this.service.updateReaction(user.id, id, type);
  }
}
