import {
  NotFoundException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reaction } from '../../database/entities/reaction.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
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

    private gateway: EventsGateway,
  ) {}

  // ============================
  // ✅ TOGGLE POST LIKE ❤️
  // ============================
  async togglePostReaction(userId: string, postId: string) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
      relations: ['user', 'post'],
    });

    // ✅ UNLIKE
    if (existing) {
      await this.repo.remove(existing);

      await this.postRepo.decrement(
        { id: postId },
        'interactionScore',
        2,
      );

      this.gateway.emitReactionUpdate({
        postId,
        action: 'removed',
      });

      return {
        liked: false,
      };
    }

    // ✅ LIKE
    const reaction = this.repo.create({
      user: { id: userId },
      post: { id: postId },
    });

    await this.repo.save(reaction);

    await this.postRepo.increment(
      { id: postId },
      'interactionScore',
      2,
    );

    this.gateway.emitReactionUpdate({
      postId,
      action: 'created',
    });

    return {
      liked: true,
    };
  }

  // ============================
  // ✅ TOGGLE COMMENT LIKE ❤️
  // ============================
  async toggleCommentReaction(
    userId: string,
    commentId: string,
  ) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
      relations: ['user', 'comment'],
    });

    // ✅ UNLIKE
    if (existing) {
      await this.repo.remove(existing);

      await this.commentRepo.decrement(
        { id: commentId },
        'interactionScore',
        2,
      );

      this.gateway.emitReactionUpdate({
        commentId,
        action: 'removed',
      });

      return {
        liked: false,
      };
    }

    // ✅ LIKE
    const reaction = this.repo.create({
      user: { id: userId },
      comment: { id: commentId },
    });

    await this.repo.save(reaction);

    await this.commentRepo.increment(
      { id: commentId },
      'interactionScore',
      2,
    );

    this.gateway.emitReactionUpdate({
      commentId,
      action: 'created',
    });

    return {
      liked: true,
    };
  }

  // ============================
  // ✅ REMOVE POST LIKE (OPTIONAL)
  // ============================
  async removePostReaction(userId: string, postId: string) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Reaction not found');
    }

    await this.repo.remove(existing);

    await this.postRepo.decrement(
      { id: postId },
      'interactionScore',
      2,
    );

    this.gateway.emitReactionUpdate({
      postId,
      action: 'removed',
    });

    return { liked: false };
  }

  // ============================
  // ✅ REMOVE COMMENT LIKE (OPTIONAL)
  // ============================
  async removeCommentReaction(
    userId: string,
    commentId: string,
  ) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Reaction not found');
    }

    await this.repo.remove(existing);

    await this.commentRepo.decrement(
      { id: commentId },
      'interactionScore',
      2,
    );

    this.gateway.emitReactionUpdate({
      commentId,
      action: 'removed',
    });

    return { liked: false };
  }
}