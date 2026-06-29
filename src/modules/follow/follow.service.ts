import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private repo: Repository<Follow>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  // ✅ SUGGESTED FOR YOU (users with most mutual friends, not yet followed)
  async getSuggestedUsers(userId: string, limit = 5) {
    // 1. Get IDs of users the current user is already following
    const following = await this.repo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    const followingIds = following.map(f => f.following.id);
    // Include own ID to exclude self
    const excludeIds = [...followingIds, userId];

    // 2. Get all users not in excludeIds
    const candidates = await this.userRepo.find({
      where: { isDeleted: false },
      take: 50,
      order: { createdAt: 'DESC' },
    });

    const filteredCandidates = candidates.filter(u => !excludeIds.includes(u.id));

    // 3. For each candidate, count mutual friends
    const myFollowingIds = followingIds;
    const suggestedWithMutual = await Promise.all(
      filteredCandidates.map(async (candidate) => {
        // Get candidate's followers
        const candidateFollowers = await this.repo.find({
          where: { following: { id: candidate.id } },
          relations: ['follower'],
        });
        const candidateFollowerIds = candidateFollowers.map(f => f.follower.id);

        // Count mutual = my following that also follow candidate
        const mutualCount = myFollowingIds.filter(id =>
          candidateFollowerIds.includes(id),
        ).length;

        return {
          id: candidate.id,
          username: candidate.username,
          displayName: candidate.displayName,
          avatar: candidate.avatar,
          mutualFriendCount: mutualCount,
        };
      }),
    );

    // 4. Sort by mutual count descending, take top N
    suggestedWithMutual.sort((a, b) => b.mutualFriendCount - a.mutualFriendCount);
    return suggestedWithMutual.slice(0, limit);
  }
}
