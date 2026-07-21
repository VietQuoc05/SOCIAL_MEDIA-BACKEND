import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Or } from 'typeorm';

import { Post } from '../../database/entities/post.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Reaction } from '../../database/entities/reaction.entity';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private repo: Repository<Post>,

    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,

    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,

    private usersService: UsersService,

    private gateway: EventsGateway,
  ) {}

  // ============================
  // ✅ CREATE
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

    const saved = await this.repo.save(post);

    const postWithAuthor = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });

    this.gateway.emitPostCreated(postWithAuthor);

    const { totalPosts } = await this.usersService.recountTotalPosts(userId);

    return { ...saved, totalPosts };
  }

  // ============================
  // ✅ DETAIL
  // ============================
  async findById(postId: string, userId?: string) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException('Post not found');

    const reactions = await this.reactionRepo.find({
      where: { post: { id: postId } },
      relations: ['post', 'user'],
    });

    const [result] = this.attachSummary(
      [post],
      reactions,
      userId,
    );

    return result;
  }

  // ============================
  // ✅ UPDATE
  // ============================
  async update(postId: string, userId: string, dto: any) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException();

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
        throw new BadRequestException(
          'Images must be an array',
        );
      }
      post.images = dto.images;
    }

    return this.repo.save(post);
  }

  // ============================
  // ✅ DELETE
  // ============================
  async delete(postId: string, userId: string) {
    const post = await this.repo.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException();

    if (post.author.id !== userId) {
      throw new ForbiddenException('No permission');
    }

    await this.repo.delete(postId);

    this.gateway.emitPostDeleted(postId);

    const { totalPosts } = await this.usersService.recountTotalPosts(userId);

    return { message: 'Post deleted', totalPosts };
  }

  // ============================
  // ✅ REACTION SUMMARY (🔥 SIMPLIFIED)
  // ============================
  private buildReactionSummary(
    reactions: Reaction[],
    userId?: string,
  ) {
    const totalReactions = reactions.length;

    const isLiked = userId
      ? reactions.some(r => r.user?.id === userId)
      : false;

    return {
      totalReactions,
      isLiked,
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
      const postId = r.post?.id;
      if (!postId) return;

      if (!map[postId]) map[postId] = [];
      map[postId].push(r);
    });

    return posts.map(post => ({
      ...post,
      ...this.buildReactionSummary(
        map[post.id] || [],
        userId,
      ),
    }));
  }

  // ============================
  // ✅ FEED (INFINITE SCROLL)
  // ============================
  async getFeed(
    userId: string,
    cursor?: string,
    limit = 10,
  ) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const followedUsers = await this.followRepo.find({
      where: { followerId: userId, status: 'ACCEPTED' },
      select: ['followingId'],
    });

    const followedIds = followedUsers.map(f => f.followingId);

    const visibilityConditions: string[] = [
      'post.authorId = :userId',
      'author.isPublicFollowers = :isPublic',
    ];

    const parameters: Record<string, any> = {
      userId,
      isPublic: true,
    };

    if (followedIds.length > 0) {
      visibilityConditions.push('post.authorId IN (:...followedIds)');
      parameters.followedIds = followedIds;
    }

    const qb = this.repo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.createdAt > :date', {
        date: oneWeekAgo,
      })
      .andWhere(visibilityConditions.join(' OR '), parameters);

    if (cursor) {
      qb.andWhere('post.createdAt < :cursor', {
        cursor: new Date(cursor),
      });
    }

    qb.orderBy('post.interactionScore', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit);

    const posts = await qb.getMany();

    let reactions: Reaction[] = [];

    if (posts.length > 0) {
      reactions = await this.reactionRepo.find({
        where: {
          post: { id: In(posts.map(p => p.id)) },
        },
        relations: ['post', 'user'],
      });
    }

    const data = this.attachSummary(posts, reactions, userId);

    return {
      data,
      nextCursor:
        posts.length > 0
          ? posts[posts.length - 1].createdAt
          : null,
      hasMore: posts.length === limit,
    };
  }

  // ============================
  // ✅ FIND ALL
  // ============================
  async findAll(userId?: string) {
    const posts = await this.repo.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    let reactions: Reaction[] = [];

    if (posts.length > 0) {
      reactions = await this.reactionRepo.find({
        where: {
          post: { id: In(posts.map(p => p.id)) },
        },
        relations: ['post', 'user'],
      });
    }

    return this.attachSummary(posts, reactions, userId);
  }

  // ============================
  // ✅ POSTS BY USER
  // ============================
  async findByUser(
    userId: string,
    currentUserId?: string,
  ) {
    const posts = await this.repo.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    let reactions: Reaction[] = [];

    if (posts.length > 0) {
      reactions = await this.reactionRepo.find({
        where: {
          post: { id: In(posts.map(p => p.id)) },
        },
        relations: ['post', 'user'],
      });
    }

    return this.attachSummary(posts, reactions, currentUserId);
  }
}
``