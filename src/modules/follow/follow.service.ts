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
      throw new BadRequestException('Already following this user');
    }

    return this.repo
      .createQueryBuilder()
      .insert()
      .into(Follow)
      .values({
        follower: { id: userId },
        following: { id: targetId },
      })
      .execute();
  }

  async unfollow(userId: string, targetId: string) {
    return this.repo.delete({
      follower: { id: userId },
      following: { id: targetId },
    });
  }

  async getFollowers(userId: string) {
    return this.repo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });
  }

  async getFollowing(userId: string) {
    return this.repo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
  }
}
