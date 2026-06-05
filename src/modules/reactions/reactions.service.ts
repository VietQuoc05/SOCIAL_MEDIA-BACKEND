import {BadRequestException,
  NotFoundException,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
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

  // ============================
  // ✅ REACT POST (+2)
  // ============================
  async reactPost(userId: string, postId: string, type: string) {
    const reactionType = type as ReactionType;

    if (!Object.values(ReactionType).includes(reactionType)) {
      throw new BadRequestException('Invalid reaction type');
    }

    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });

    // ✅ nếu đã có → chỉ update type
    if (existing) {
      existing.type = reactionType;
      return this.repo.save(existing);
    }

    // ✅ new → +2 score
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

    return this.repo.save(reaction);
  }

  // ============================
  // ✅ REMOVE POST REACTION (-2)
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
    }

    return { message: 'Reaction removed' };
  }

  // ============================
  // ✅ REACT COMMENT (+2)
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
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
    });

    // ✅ nếu đã có → chỉ update
    if (existing) {
      existing.type = reactionType;
      return this.repo.save(existing);
    }

    // ✅ new → +2 score
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

    return this.repo.save(reaction);
  }

  // ============================
  // ✅ REMOVE COMMENT REACTION (-2)
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
    }

    return { message: 'Reaction removed' };
  }

  // ============================
  // ✅ UPDATE REACTION (NO SCORE CHANGE)
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

    // ✅ ONLY update type — không đổi score
    reaction.type = reactionType;

    return this.repo.save(reaction);
  }
}

