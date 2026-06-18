import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { Follow } from '../../database/entities/follow.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
  ) {}

  // ============================
  // ✅ GET OR CREATE CONVERSATION
  // ============================
  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot chat with yourself');
    }

    // Check mutual follow
    const [follow1, follow2] = await Promise.all([
      this.followRepo.findOne({
        where: { follower: { id: userId }, following: { id: otherUserId } },
      }),
      this.followRepo.findOne({
        where: { follower: { id: otherUserId }, following: { id: userId } },
      }),
    ]);

    if (!follow1 || !follow2) {
      throw new ForbiddenException('You must follow each other to chat');
    }

    // Ensure user1Id < user2Id for consistency
    const [user1Id, user2Id] = [userId, otherUserId].sort();

    let conversation = await this.conversationRepo.findOne({
      where: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        user1Id,
        user2Id,
      });
      conversation = await this.conversationRepo.save(conversation);
      conversation = await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ['user1', 'user2'],
      })!;
    }

    return conversation;
  }

  // ============================
  // ✅ GET CONVERSATIONS FOR USER
  // ============================
  async getConversations(userId: string) {
    const conversations = await this.conversationRepo.find({
      where: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      relations: ['user1', 'user2'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.lastMessage,
        lastMessageImage: conv.lastMessageImage,
        lastMessageAt: conv.lastMessageAt,
        lastSenderId: conv.lastSenderId,
        createdAt: conv.createdAt,
      };
    });
  }

  // ============================
  // ✅ GET MESSAGES IN CONVERSATION
  // ============================
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const where: any = { conversationId };
    if (cursor) {
      where.createdAt = LessThan(new Date(cursor));
    }

    const messages = await this.messageRepo.find({
      where,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return {
      data: messages.reverse(),
      nextCursor: hasMore && messages.length > 0 ? messages[0].createdAt.toISOString() : null,
      hasMore,
    };
  }

  // ============================
  // ✅ SEND MESSAGE
  // ============================
  async sendMessage(userId: string, conversationId: string, content?: string, image?: string) {
    if (!content && !image) {
      throw new BadRequestException('Message must have content or image');
    }

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Create message
    const message = this.messageRepo.create({
      conversationId,
      senderId: userId,
      content: content || null,
      image: image || null,
    });

    const saved = await this.messageRepo.save(message);

    // Update conversation last message
    await this.conversationRepo.update(conversationId, {
      lastMessage: content || (image ? '[Image]' : null),
      lastMessageImage: image || null,
      lastMessageAt: saved.createdAt,
      lastSenderId: userId,
    });

    // Return full message with sender
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
  }
}