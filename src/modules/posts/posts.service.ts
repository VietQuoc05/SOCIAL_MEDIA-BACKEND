import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';

import { Post } from '../../database/entities/post.entity';
import { Follow } from '../../database/entities/follow.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private repo: Repository<Post>,

    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
  ) {}

  async create(userId: string, dto: any) {
    const post = this.repo.create({
      author: { id: userId },
      caption: dto.caption,
      images: dto.images || [],
    });

    return this.repo.save(post);
  }

  async update(postId: string, userId: string, dto: any) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException();
    if (post.author.id !== userId) throw new ForbiddenException();

    Object.assign(post, dto);

    return this.repo.save(post);
  }

  async delete(postId: string, userId: string) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException();
    if (post.author.id !== userId) throw new ForbiddenException();

    return this.repo.delete(postId);
  }

  async findAll() {
    return this.repo.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string) {
    return this.repo.find({
      where: { author: { id: userId } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  // 🔥 FEED LOGIC
  async getFeed(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const follows = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });

    const followingIds = follows.map(f => f.following.id);

    let posts = [];

    if (followingIds.length > 0) {
      posts = await this.repo.find({
        where: {
          author: { id: In(followingIds) },
          createdAt: MoreThan(oneWeekAgo),
        },
        relations: ['author'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
    }

    if (posts.length < 50) {
      const excludeIds = posts.map(p => p.id);

      const extra = await this.repo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.createdAt > :date', { date: oneWeekAgo })
        .andWhere(
          excludeIds.length
            ? 'post.id NOT IN (:...ids)'
            : '1=1',
          { ids: excludeIds },
        )
        .orderBy('post.interactionScore', 'DESC')
        .limit(50 - posts.length)
        .getMany();

      posts = [...posts, ...extra];
    }

    return posts;
  }
}