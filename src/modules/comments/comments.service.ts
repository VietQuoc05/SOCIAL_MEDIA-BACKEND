import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private repo: Repository<Comment>,

    @InjectRepository(Post)
    private postRepo: Repository<Post>,
  ) {}

  // ============================
  // ✅ CREATE COMMENT
  // ============================
  async create(userId: string, postId: string, dto: any) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.repo.create({
      author: { id: userId },
      post: { id: postId },
      content: dto.content,
      image: dto.image,
      parent: dto.parentId ? { id: dto.parentId } : null,
    });

    await this.postRepo.increment(
      { id: postId },
      'interactionScore',
      1,
    );

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

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      comment.author.id !== userId &&
      comment.post.author.id !== userId
    ) {
      throw new ForbiddenException('No permission');
    }

    await this.repo.delete(commentId);

    await this.postRepo.decrement(
      { id: postId },
      'interactionScore',
      1,
    );

    return { message: 'Comment deleted' };
  }

  // ============================
  // ✅ BUILD REACTION SUMMARY 🔥
  // ============================
  private buildReactionSummary(reactions: any[], userId?: string) {
    const counts: Record<string, number> = {};
    let myReaction: string | null = null;

    reactions.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;

      if (userId && r.user?.id === userId) {
        myReaction = r.type;
      }
    });

    const totalReactions = Object.values(counts).reduce(
      (a, b) => a + b,
      0,
    );

    const topReactions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    return {
      reactions: counts,
      totalReactions,
      topReactions,
      myReaction,
    };
  }

  // ============================
  // ✅ GET COMMENTS TREE + HOT + SUMMARY
  // ============================
  async getByPost(postId: string, userId?: string) {
    const comments = await this.repo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .leftJoinAndSelect('reactions.user', 'reactionUser') // ✅ QUAN TRỌNG
      .leftJoinAndSelect('comment.parent', 'parent')
      .where('comment.postId = :postId', { postId })
      .getMany();

    const map = new Map();

    comments.forEach(c => {
      const summary = this.buildReactionSummary(
        c.reactions || [],
        userId,
      );

      map.set(c.id, {
        id: c.id,
        content: c.content,
        image: c.image,
        author: c.author,
        createdAt: c.createdAt,
        ...summary,
        parentId: c.parent ? c.parent.id : null,
        replies: [],
      });
    });

    const tree = [];

    map.forEach(comment => {
      if (comment.parentId) {
        const parent = map.get(comment.parentId);
        if (parent) parent.replies.push(comment);
      } else {
        tree.push(comment);
      }
    });

    // ✅ SORT HOT COMMENT
    const getScore = (c: any) => c.totalReactions || 0;

    tree.sort((a, b) => getScore(b) - getScore(a));

    tree.forEach(c => {
      c.replies.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      );
    });

    return tree;
  }
}
