import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Follow } from '../../database/entities/follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private repo: Repository<Follow>,
  ) {}

  // ✅ FOLLOW
  async follow(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const exists = await this.repo.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    if (exists) {
      throw new BadRequestException('Already following');
    }

    // ✅ FIX CHÍNH
    const follow = this.repo.create({
      follower: { id: userId },
      following: { id: targetId },
    });

    return this.repo.save(follow);
  }

  // ✅ UNFOLLOW
  async unfollow(userId: string, targetId: string) {
    return this.repo.delete({
      follower: { id: userId },
      following: { id: targetId },
    });
  }

  // ✅ LẤY FOLLOWERS (ai follow mình)
  async getFollowers(userId: string) {
    return this.repo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });
  }

  // ✅ LẤY FOLLOWING (mình follow ai)
  async getFollowing(userId: string) {
    return this.repo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
  }

  // ✅ COUNT (QUAN TRỌNG)
  async getFollowStats(userId: string) {
    const followers = await this.repo.count({
      where: { following: { id: userId } },
    });

    const following = await this.repo.count({
      where: { follower: { id: userId } },
    });

    return { followers, following };
  }
}