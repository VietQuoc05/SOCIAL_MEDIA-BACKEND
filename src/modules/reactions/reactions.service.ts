import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reaction } from '../../database/entities/reaction.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { ReactionType } from '../../common/enums/reaction.enum';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private repo: Repository<Reaction>,

    @InjectRepository(Post)
    private postRepo: Repository<Post>,

    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,

    private gateway: EventsGateway, // ✅ realtime
  ) {}

  // ============================
  // ✅ REACT POST (+2 + REALTIME)
  // ============================
  async reactPost(userId: string, postId: string, type: string) {
    const reactionType = type as ReactionType;

    if (!Object.values(ReactionType).includes(reactionType)) {
      throw new BadRequestException('Invalid reaction type');
    }

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      existing.type = reactionType;

      const saved = await this.repo.save(existing);

      // ✅ realtime update
      this.gateway.emitReactionUpdate({
        postId,
        type: saved.type,
        action: 'updated',
      });

      return saved;
    }

    await this.postRepo.increment(
      { id: postId },
      'interactionScore',
      2,
    );

    const reaction = this.repo.create({
      user: { id: userId },
      post: { id: postId },
      type: reactionType,
    });

    const saved = await this.repo.save(reaction);

    // ✅ realtime emit
    this.gateway.emitReactionUpdate({
      postId,
      type: saved.type,
      action: 'created',
    });

    return saved;
  }

  // ============================
  // ✅ REMOVE POST REACTION (-2 + REALTIME)
  // ============================
  async removePostReaction(userId: string, postId: string) {
    const result = await this.repo.delete({
      user: { id: userId },
      post: { id: postId },
    });

    if (result.affected) {
      await this.postRepo.decrement(
        { id: postId },
        'interactionScore',
        2,
      );

      // ✅ realtime emit
      this.gateway.emitReactionUpdate({
        postId,
        action: 'removed',
      });
    }

    return { message: 'Reaction removed' };
  }

  // ============================
  // ✅ REACT COMMENT (+2 + REALTIME)
  // ============================
  async reactComment(
    userId: string,
    commentId: string,
    type: string,
  ) {
    const reactionType = type as ReactionType;

    if (!Object.values(ReactionType).includes(reactionType)) {
      throw new BadRequestException('Invalid reaction type');
    }

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, comment: { id: commentId } },
    });

    if (existing) {
      existing.type = reactionType;

      const saved = await this.repo.save(existing);

      this.gateway.emitReactionUpdate({
        commentId,
        type: saved.type,
        action: 'updated',
      });

      return saved;
    }

    await this.commentRepo.increment(
      { id: commentId },
      'interactionScore',
      2,
    );

    const reaction = this.repo.create({
      user: { id: userId },
      comment: { id: commentId },
      type: reactionType,
    });

    const saved = await this.repo.save(reaction);

    this.gateway.emitReactionUpdate({
      commentId,
      type: saved.type,
      action: 'created',
    });

    return saved;
  }

  // ============================
  // ✅ REMOVE COMMENT REACTION (-2 + REALTIME)
  // ============================
  async removeCommentReaction(
    userId: string,
    commentId: string,
  ) {
    const result = await this.repo.delete({
      user: { id: userId },
      comment: { id: commentId },
    });

    if (result.affected) {
      await this.commentRepo.decrement(
        { id: commentId },
        'interactionScore',
        2,
      );

      this.gateway.emitReactionUpdate({
        commentId,
        action: 'removed',
      });
    }

    return { message: 'Reaction removed' };
  }

  // ============================
  // ✅ UPDATE REACTION (NO SCORE + REALTIME)
  // ============================
  async updateReaction(
    userId: string,
    reactionId: string,
    type: string,
  ) {
    const reactionType = type as ReactionType;

    if (!Object.values(ReactionType).includes(reactionType)) {
      throw new BadRequestException('Invalid reaction type');
    }

    const reaction = await this.repo.findOne({
      where: { id: reactionId },
      relations: ['user'],
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    if (reaction.user.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    reaction.type = reactionType;

    const saved = await this.repo.save(reaction);

    this.gateway.emitReactionUpdate({
      id: reactionId,
      type: saved.type,
      action: 'updated',
    });

    return saved;
  }
}