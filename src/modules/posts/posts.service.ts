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
import { Reaction } from '../../database/entities/reaction.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private repo: Repository<Post>,

    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,

    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,
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

    if (!post) throw new NotFoundException('Post not found');

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

    if (!post) throw new NotFoundException('Post not found');

    if (post.author.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    await this.repo.delete(postId);

    return { message: 'Post deleted' };
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
  // ✅ ATTACH SUMMARY
  // ============================
  private attachSummary(
    posts: Post[],
    reactions: Reaction[],
    userId?: string,
  ) {
    const map: Record<string, Reaction[]> = {};

    reactions.forEach(r => {
      const postId = r.post.id;

      if (!map[postId]) map[postId] = [];
      map[postId].push(r);
    });

    return posts.map(post => ({
      ...post,
      ...this.buildReactionSummary(map[post.id] || [], userId),
    }));
  }

  // ============================
  // ✅ FIND ALL
  // ============================
  async findAll(userId?: string) {
    const posts = await this.repo.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    const reactions = await this.reactionRepo.find({
      where: { post: { id: In(posts.map(p => p.id)) } },
      relations: ['post', 'user'],
    });

    return this.attachSummary(posts, reactions, userId);
  }

  // ============================
  // ✅ GET POSTS BY USER ✅ FIX BUILD ERROR
  // ============================
  async findByUser(userId: string, currentUserId?: string) {
    const posts = await this.repo.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    const reactions = await this.reactionRepo.find({
      where: { post: { id: In(posts.map(p => p.id)) } },
      relations: ['post', 'user'],
    });

    return this.attachSummary(posts, reactions, currentUserId);
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

    let posts: Post[] = [];

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

    const reactions = await this.reactionRepo.find({
      where: { post: { id: In(posts.map(p => p.id)) } },
      relations: ['post', 'user'],
    });

    return this.attachSummary(posts, reactions, userId);
  }
}
