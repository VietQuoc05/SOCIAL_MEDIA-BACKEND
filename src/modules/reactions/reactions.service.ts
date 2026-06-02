import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reaction } from '../../database/entities/reaction.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { ReactionType } from '../../common/enums/reaction.enum';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private repo: Repository<Reaction>,

    @InjectRepository(Post)
    private postRepo: Repository<Post>,

    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
  ) {}

  async reactPost(userId: string, postId: string, type: string) {
    const reactionType = type as ReactionType; // ✅ FIX

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      existing.type = reactionType;
      return this.repo.save(existing);
    }

    await this.postRepo.increment({ id: postId }, 'interactionScore', 1);

    const reaction = this.repo.create({  // ✅ FIX
      user: { id: userId },
      post: { id: postId },
      type: reactionType,
    });

    return this.repo.save(reaction);
  }

  async removePostReaction(userId: string, postId: string) {
    const result = await this.repo.delete({
      user: { id: userId },
      post: { id: postId },
    });

    if (result.affected) {
      await this.postRepo.decrement({ id: postId }, 'interactionScore', 1);
    }
  }

  async reactComment(userId: string, commentId: string, type: string) {
    const reactionType = type as ReactionType; // ✅ FIX

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, comment: { id: commentId } },
    });

    if (existing) {
      existing.type = reactionType;
      return this.repo.save(existing);
    }

    await this.commentRepo.increment(
      { id: commentId },
      'interactionScore',
      1,
    );

    const reaction = this.repo.create({  // ✅ FIX
      user: { id: userId },
      comment: { id: commentId },
      type: reactionType,
    });

    return this.repo.save(reaction);
  }

  async removeCommentReaction(userId: string, commentId: string) {
    const result = await this.repo.delete({
      user: { id: userId },
      comment: { id: commentId },
    });

    if (result.affected) {
      await this.commentRepo.decrement(
        { id: commentId },
        'interactionScore',
        1,
      );
    }
  }
}
``