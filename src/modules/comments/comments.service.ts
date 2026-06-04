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

    await this.postRepo.increment(
      { id: postId },
      'interactionScore',
      1,
    );

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

    await this.postRepo.decrement(
      { id: postId },
      'interactionScore',
      1,
    );

    return { message: 'Comment deleted' };
  }
}
