import {
  Injectable,
  NotFoundException,
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
      where: {
        email,
        isDeleted: false,
      },
      select: ['id', 'email', 'password', 'username'],
    });
  }

  // ============================
  // ✅ BUILD USER STATS 🔥
  // ============================
  private async buildUserStats(
    targetUserId: string,
    currentUserId?: string,
  ) {
    const followers = await this.followRepo.find({
      where: { following: { id: targetUserId } },
      relations: ['follower'],
    });

    const following = await this.followRepo.find({
      where: { follower: { id: targetUserId } },
      relations: ['following'],
    });

    const followersCount = followers.length;
    const followingCount = following.length;

    const postsCount = await this.postRepo.count({
      where: { authorId: targetUserId },
    });

    // ✅ mutual friends
    let mutualFriendCount = 0;

    if (currentUserId && currentUserId !== targetUserId) {
      const myFollowing = await this.followRepo.find({
        where: { follower: { id: currentUserId } },
        relations: ['following'],
      });

      const myFollowingIds = myFollowing.map(
        f => f.following.id,
      );

      const targetFollowersIds = followers.map(
        f => f.follower.id,
      );

      mutualFriendCount = targetFollowersIds.filter(id =>
        myFollowingIds.includes(id),
      ).length;
    }

    return {
      followersCount,
      followingCount,
      postsCount,
      mutualFriendCount,
    };
  }

  // ============================
  // ✅ FIND BY ID (FULL PROFILE)
  // ============================
  async findById(id: string, currentUserId?: string) {
    const user = await this.repo.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.buildUserStats(
      id,
      currentUserId,
    );

    return {
      ...user,
      ...stats,
    };
  }

  // ============================
  // ✅ UPDATE PROFILE
  // ============================
  async updateProfile(userId: string, dto: any) {
    const user = await this.repo.findOne({
      where: {
        id: userId,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);

    return this.repo.save(user);
  }

  // ============================
  // ✅ GET ALL USERS
  // ============================
  async findAll() {
    return this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // ✅ SEARCH USER
  // ============================
  async search(keyword: string) {
    return this.repo.find({
      where: [
        { username: ILike(`%${keyword}%`), isDeleted: false },
        { email: ILike(`%${keyword}%`), isDeleted: false },
      ],
      take: 20,
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // ✅ SOFT DELETE
  // ============================
  async softDelete(userId: string) {
    const user = await this.repo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isDeleted = true;

    await this.repo.save(user);

    return { message: 'User deleted (soft)' };
  }
}