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
  // ✅ BUILD REACTION SUMMARY
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
  // ✅ FIND BY USER
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
  // ✅ FEED 3 NHÓM (FINAL 🔥)
  // ============================
  async getFeed(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // ✅ lấy following
    const following = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    const followingIds = following.map(f => f.following.id);

    // ✅ lấy followers
    const followers = await this.followRepo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });
    const followerIds = followers.map(f => f.follower.id);

    // ✅ mutual
    const mutualIds = followingIds.filter(id =>
      followerIds.includes(id),
    );

    // -------- NHÓM 1 --------
    const group1 = mutualIds.length
      ? await this.repo.find({
          where: {
            authorId: In(mutualIds),
            createdAt: MoreThan(oneWeekAgo),
          },
          relations: ['author'],
          order: { interactionScore: 'DESC' },
        })
      : [];

    // -------- NHÓM 2 --------
    const group2 = followingIds.length
      ? await this.repo.find({
          where: {
            authorId: In(followingIds),
            createdAt: MoreThan(oneWeekAgo),
          },
          relations: ['author'],
          order: { interactionScore: 'DESC' },
        })
      : [];

    // -------- NHÓM 3 --------
    const excludeIds = [
      ...group1.map(p => p.id),
      ...group2.map(p => p.id),
    ];

    const group3 = await this.repo
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
      .getMany();

    // -------- MERGE --------
    let posts = [...group1, ...group2, ...group3];

    // ✅ remove duplicate
    const uniqueMap = new Map();
    posts.forEach(p => {
      if (!uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    });

    posts = Array.from(uniqueMap.values()).slice(0, 50);

    // ✅ reaction summary
    const reactions = await this.reactionRepo.find({
      where: { post: { id: In(posts.map(p => p.id)) } },
      relations: ['post', 'user'],
    });

    return this.attachSummary(posts, reactions, userId);
  }
}
``