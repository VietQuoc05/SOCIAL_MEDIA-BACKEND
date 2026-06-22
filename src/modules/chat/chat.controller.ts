import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @ApiOperation({ summary: 'Get or create conversation with another user' })
  @Post('conversation/:userId')
  getOrCreateConversation(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getOrCreateConversation(user.id, otherUserId);
  }

  @ApiOperation({ summary: 'Get all conversations for current user' })
  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.service.getConversations(user.id);
  }

  @ApiOperation({ summary: 'Get messages in a conversation' })
  @Get('messages/:conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getMessages(
      conversationId,
      user.id,
      cursor || undefined,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @ApiOperation({ summary: 'Send a message' })
  @Post('message')
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.sendMessage(
      user.id,
      dto.conversationId,
      dto.content,
      dto.image,
    );
  }

  @ApiOperation({ summary: 'Mark messages as read in a conversation' })
  @Post('read/:conversationId')
  markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.markAsRead(conversationId, user.id);
  }
}
