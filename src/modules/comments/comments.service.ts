import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { Reaction } from '../../database/entities/reaction.entity';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private repo: Repository<Comment>,

    @InjectRepository(Post)
    private postRepo: Repository<Post>,

    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,

    private gateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  // ============================
  // ✅ CREATE COMMENT
  // ============================
  async create(userId: string, postId: string, dto: any) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const comment = this.repo.create({
      author: { id: userId },
      post: { id: postId },
      content: dto.content,
      parent: dto.parentId ? { id: dto.parentId } : null,
    });

    await this.postRepo.increment(
      { id: postId },
      'interactionScore',
      1,
    );

    const saved = await this.repo.save(comment);

    const commentWithAuthor = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['author', 'reactions', 'reactions.user'],
    });

    this.gateway.emitNewComment({
      ...commentWithAuthor,
      postId: postId,
    });

    if (dto.parentId) {
      const parentComment = await this.repo.findOne({
        where: { id: dto.parentId },
        relations: ['author'],
      });

      if (parentComment && parentComment.author.id !== userId) {
        await this.notificationsService.create({
          recipientId: parentComment.author.id,
          actorId: userId,
          type: NotificationType.COMMENT_REPLY,
          postId: postId,
          commentId: saved.id,
        });
      }
    }

    return saved;
  }

  // ============================
  // ✅ UPDATE COMMENT
  // ============================
  async update(userId: string, commentId: string, dto: any) {
    const comment = await this.repo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) throw new NotFoundException();

    if (comment.author.id !== userId) {
      throw new ForbiddenException();
    }

    if (dto.content !== undefined) {
      comment.content = dto.content;
    }

    return this.repo.save(comment);
  }

  // ============================
  // ✅ DELETE COMMENT
  // ============================
  async delete(userId: string, commentId: string, postId: string) {
    const comment = await this.repo.findOne({
      where: { id: commentId },
      relations: ['author', 'post', 'post.author'],
    });

    if (!comment) throw new NotFoundException();

    if (
      comment.author.id !== userId &&
      comment.post.author.id !== userId
    ) {
      throw new ForbiddenException();
    }

    await this.repo.delete(commentId);

    await this.postRepo.decrement(
      { id: postId },
      'interactionScore',
      1,
    );

    this.gateway.emitNewComment({
      deleted: true,
      commentId,
      postId,
    });

    return { message: 'Comment deleted' };
  }

  // ============================
  // ✅ REACTION SUMMARY ❤️ ONLY
  // ============================
  private buildReactionSummary(
    reactions: Reaction[],
    userId?: string,
  ) {
    const totalReactions = reactions.length;

    const isLiked = userId
      ? reactions.some(r => r.user?.id === userId)
      : false;

    return {
      totalReactions,
      isLiked,
    };
  }

  // ============================
  // ✅ GET COMMENTS TREE
  // ============================
  async getByPost(postId: string, userId?: string) {
    const comments = await this.repo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .leftJoinAndSelect('reactions.user', 'reactionUser')
      .leftJoinAndSelect('comment.parent', 'parent')
      .where('comment.postId = :postId', { postId })
      .getMany();

    const map = new Map<string, any>();

    comments.forEach(c => {
      const summary = this.buildReactionSummary(
        c.reactions || [],
        userId,
      );

      map.set(c.id, {
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt,
        ...summary,
        parentId: c.parent ? c.parent.id : null,
        replies: [],
      });
    });

    const tree: any[] = [];

    map.forEach(comment => {
      if (comment.parentId) {
        const parent = map.get(comment.parentId);
        if (parent) parent.replies.push(comment);
      } else {
        tree.push(comment);
      }
    });

    // ✅ sort by like ❤️
    tree.sort(
      (a, b) => b.totalReactions - a.totalReactions,
    );

    return tree;
  }
}
