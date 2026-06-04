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

  // ✅ CREATE COMMENT
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

    await this.postRepo.increment({ id: postId }, 'interactionScore', 1);

    return this.repo.save(comment);
  }

  // ✅ DELETE COMMENT
  async delete(userId: string, commentId: string, postId: string) {
    const comment = await this.repo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    await this.repo.delete(commentId);

    await this.postRepo.decrement({ id: postId }, 'interactionScore', 1);

    return { message: 'Comment deleted' };
  }

  // ✅ GET COMMENTS TREE + REACTION COUNT 🔥
  async getByPost(postId: string) {
    const comments = await this.repo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .leftJoinAndSelect('comment.parent', 'parent')
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    const reactionCount = (reactions: any[]) => {
      const result = {};
      reactions.forEach(r => {
        result[r.type] = (result[r.type] || 0) + 1;
      });
      return result;
    };

    const map = new Map();

    comments.forEach(c => {
      map.set(c.id, {
        id: c.id,
        content: c.content,
        image: c.image,
        author: c.author,
        createdAt: c.createdAt,
        reactions: reactionCount(c.reactions || []),
        parentId: c.parent ? c.parent.id : null,
        replies: [],
      });
    });

    const tree = [];

    map.forEach(comment => {
      if (comment.parentId) {
        const parent = map.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        tree.push(comment);
      }
    });

    return tree;
  }
}