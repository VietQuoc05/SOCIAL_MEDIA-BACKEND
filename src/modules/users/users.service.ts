import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../database/entities/user.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Post } from '../../database/entities/post.entity';

// ✅ normalize displayName util (inline cho tiện)
function normalizeDisplayName(input: string) {
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');

  if (cleaned.length < 6) {
    throw new BadRequestException(
      'DisplayName must be at least 6 characters',
    );
  }

  return cleaned;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,

    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,

    @InjectRepository(Post)
    private postRepo: Repository<Post>,
  ) {}

  // ============================
  // ✅ CREATE USER
  // ============================
  async create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  // ============================
  // ✅ FIND BY EMAIL
  // ============================
  async findByEmail(email: string) {
    return this.repo.findOne({
      where: { email, isDeleted: false },
      select: [
        'id',
        'email',
        'password',
        'username',
        'displayName', // ✅ thêm
      ],
    });
  }

  // ✅ NEW: CHECK DUPLICATE (REGISTER)
  async findByEmailOrDisplayName(
    email: string,
    displayName: string,
  ) {
    return this.repo.findOne({
      where: [{ email }, { displayName }],
    });
  }

  // ============================
  // ✅ STATS
  // ============================
  private async buildUserStats(userId: string) {
    const [followersCount, followingCount, postsCount] =
      await Promise.all([
        this.followRepo.count({
          where: { following: { id: userId } },
        }),
        this.followRepo.count({
          where: { follower: { id: userId } },
        }),
        this.postRepo.count({
          where: { authorId: userId },
        }),
      ]);

    return {
      followersCount,
      followingCount,
      postsCount,
    };
  }

  // ============================
  // ✅ MUTUAL FRIENDS
  // ============================
  private async getMutualCount(
    currentUserId: string,
    targetUserId: string,
  ) {
    const myFollowing = await this.followRepo.find({
      where: { follower: { id: currentUserId } },
      relations: ['following'],
    });

    const targetFollowers = await this.followRepo.find({
      where: { following: { id: targetUserId } },
      relations: ['follower'],
    });

    const myIds = myFollowing.map(f => f.following.id);
    const targetIds = targetFollowers.map(f => f.follower.id);

    return targetIds.filter(id => myIds.includes(id)).length;
  }

  // ============================
  // ✅ PROFILE
  // ============================
  async findById(id: string, currentUserId?: string) {
    const user = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    const stats = await this.buildUserStats(id);

    let mutualFriendCount = 0;
    let followStatus = 'not_follow_yet';

    if (currentUserId && currentUserId !== id) {
      const [isFollowing, mutual] = await Promise.all([
        this.followRepo.findOne({
          where: {
            follower: { id: currentUserId },
            following: { id },
          },
        }),
        this.getMutualCount(currentUserId, id),
      ]);

      followStatus = isFollowing
        ? 'followed'
        : 'not_follow_yet';

      mutualFriendCount = mutual;
    }

    const isPrivate = !user.isPublicFollowers;
    const isSelf = currentUserId === id;
    const isFollowingUser = followStatus === 'followed';

    let response: any = {
      ...user,
      ...stats,
      mutualFriendCount,
      followStatus,
    };

    if (isPrivate && !isSelf && !isFollowingUser) {
      response = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        cover: user.cover,
        bio: user.bio,
        isPublicFollowers: user.isPublicFollowers,
        isPublicFollowing: user.isPublicFollowing,
        ...stats,
        followStatus: 'not_follow_yet',
        mutualFriendCount: 0,
        isPrivate: true,
      };
    }

    return response;
  }

  // ============================
  // ✅ FOLLOWERS
  // ============================
  async getFollowers(userId: string, currentUserId?: string) {
    const user = await this.repo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.isPublicFollowers && currentUserId !== userId) {
      throw new ForbiddenException(
        'Followers list is private',
      );
    }

    const followers = await this.followRepo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });

    return followers.map(f => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.displayName, // ✅ thêm
      avatar: f.follower.avatar,
    }));
  }

  // ============================
  // ✅ FOLLOWING
  // ============================
  async getFollowing(userId: string, currentUserId?: string) {
    const user = await this.repo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.isPublicFollowing && currentUserId !== userId) {
      throw new ForbiddenException(
        'Following list is private',
      );
    }

    const following = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });

    return following.map(f => ({
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.displayName, // ✅ thêm
      avatar: f.following.avatar,
    }));
  }

  // ============================
  // ✅ UPDATE PROFILE
  // ============================
  async updateProfile(userId: string, dto: any) {
    const user = await this.repo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    // ✅ xử lý displayName
    if (dto.displayName) {
      const normalized = normalizeDisplayName(
        dto.displayName,
      );

      const exists = await this.repo.findOne({
        where: { displayName: normalized },
      });

      if (exists && exists.id !== userId) {
        throw new BadRequestException(
          'DisplayName already taken',
        );
      }

      user.displayName = normalized;
    }

    // ✅ username giữ nguyên
    if (dto.username) {
      user.username = dto.username;
    }

    Object.assign(user, dto);

    return this.repo.save(user);
  }

  // ============================
  // ✅ FIND ALL
  // ============================
  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // ✅ SEARCH (🔥 PRIORITY DISPLAYNAME)
  // ============================
  async search(keyword: string) {
    const q = keyword.toLowerCase();

    return this.repo
      .createQueryBuilder('user')
      .where('LOWER(user.displayName) LIKE :q', {
        q: `%${q}%`,
      })
      .orWhere('user.username ILIKE :k', {
        k: `%${keyword}%`,
      })
      .orderBy(
        `
        CASE 
          WHEN LOWER(user.displayName) LIKE :start THEN 0
          WHEN LOWER(user.displayName) LIKE :q THEN 1
          ELSE 2
        END
      `,
      )
      .setParameters({
        q: `%${q}%`,
        start: `${q}%`,
      })
      .limit(20)
      .getMany();
  }

  // ============================
  // ✅ SOFT DELETE
  // ============================
  async softDelete(userId: string) {
    const user = await this.repo.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException();

    user.isDeleted = true;
    await this.repo.save(user);

    return { message: 'User deleted' };
  }
}