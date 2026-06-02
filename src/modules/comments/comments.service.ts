import { Injectable } from '@nestjs/common';
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

  async create(userId: string, postId: string, dto: any) {
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

  async delete(commentId: string, postId: string) {
    await this.repo.delete(commentId);

    await this.postRepo.decrement({ id: postId }, 'interactionScore', 1);
  }
}
``