import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
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

  // ============================
  // ✅ CREATE POST
  // ============================
  async create(userId: string, dto: any) {
    if (!dto.caption) {
      throw new BadRequestException('Caption is required');
    }

    if (!Array.isArray(dto.images)) {
      throw new BadRequestException('Images must be an array');
    }

    if (dto.images.length > 10) {
      throw new BadRequestException('Max 10 images allowed');
    }

    const post = this.repo.create({
      authorId: userId,
      caption: dto.caption,
      images: dto.images || [],
    });

    return this.repo.save(post);
  }

  // ============================
  // ✅ UPDATE POST
  // ============================
  async update(postId: string, userId: string, dto: any) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('No data to update');
    }

    if (dto.caption !== undefined) {
      post.caption = dto.caption;
    }

    if (dto.images !== undefined) {
      if (!Array.isArray(dto.images)) {
        throw new BadRequestException('Images must be an array');
      }

      post.images = dto.images;
    }

    return this.repo.save(post);
  }

  // ============================
  // ✅ DELETE POST
  // ============================
  async delete(postId: string, userId: string) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    await this.repo.delete(postId);

    return { message: 'Post deleted' };
  }

  // ============================
  // ✅ GET ALL POSTS
  // ============================
  async findAll() {
    return this.repo.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // ✅ GET POSTS BY USER
  // ============================
  async findByUser(userId: string) {
    return this.repo.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // ✅ FEED
  // ============================
  async getFeed(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const follows = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });

    const followingIds = follows.map(f => f.following.id);

    let posts = [];

    // ✅ ưu tiên post từ người follow
    if (followingIds.length > 0) {
      posts = await this.repo.find({
        where: {
          authorId: In(followingIds),
          createdAt: MoreThan(oneWeekAgo),
        },
        relations: ['author'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
    }

    // ✅ bổ sung post phổ biến
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