import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { User } from '../../database/entities/user.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Post } from '../../database/entities/post.entity';

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
      select: ['id', 'email', 'password', 'username'],
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

    return {
      ...user,
      ...stats,
      mutualFriendCount,
      followStatus,
    };
  }

  // ============================
  // ✅ FOLLOWERS LIST (PRIVACY)
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
      avatar: f.follower.avatar,
    }));
  }

  // ============================
  // ✅ FOLLOWING LIST (PRIVACY)
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
      avatar: f.following.avatar,
    }));
  }

  // ============================
  // ✅ UPDATE
  // ============================
  async updateProfile(userId: string, dto: any) {
    const user = await this.repo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);

    return this.repo.save(user);
  }

  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async search(keyword: string) {
    return this.repo.find({
      where: [
        { username: ILike(`%${keyword}%`), isDeleted: false },
        { email: ILike(`%${keyword}%`), isDeleted: false },
      ],
      take: 20,
    });
  }

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