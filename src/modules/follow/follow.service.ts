import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Follow } from '../../database/entities/follow.entity';
import { User } from '../../database/entities/user.entity';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private repo: Repository<Follow>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private notificationsService: NotificationsService,
  ) {}

  async follow(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const target = await this.userRepo.findOne({
      where: { id: targetId, isDeleted: false },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.repo.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new BadRequestException('Follow request already sent');
      }
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('Already following');
      }
      if (existing.status === 'REJECTED') {
        existing.status = 'PENDING';
        await this.repo.save(existing);
        await this.notificationsService.create({
          recipientId: targetId,
          actorId: userId,
          type: NotificationType.FOLLOW_REQUEST,
        });
        return existing;
      }
    }

    const isPrivate = !target.isPublicFollowers;
    const status = isPrivate ? 'PENDING' : 'ACCEPTED';

    const follow = this.repo.create({
      follower: { id: userId },
      following: { id: targetId },
      status,
    });

    const saved = await this.repo.save(follow);

    if (isPrivate) {
      await this.notificationsService.create({
        recipientId: targetId,
        actorId: userId,
        type: NotificationType.FOLLOW_REQUEST,
      });
    }

    return saved;
  }

  async unfollow(userId: string, targetId: string) {
    const follow = await this.repo.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    if (follow.status === 'PENDING') {
      await this.repo.delete(follow.id);
      return { success: true };
    }

    await this.repo.delete({
      follower: { id: userId },
      following: { id: targetId },
    });

    return { success: true };
  }

  async acceptFollowRequest(followerId: string, followingId: string) {
    const follow = await this.repo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
      relations: ['follower', 'following'],
    });

    if (!follow) {
      throw new NotFoundException('Follow request not found');
    }

    if (follow.status !== 'PENDING') {
      throw new BadRequestException('No pending follow request');
    }

    follow.status = 'ACCEPTED';
    await this.repo.save(follow);

    await this.notificationsService.markReadByTypeAndActor(
      followingId,
      followerId,
      NotificationType.FOLLOW_REQUEST,
    );

    await this.notificationsService.create({
      recipientId: followerId,
      actorId: followingId,
      type: NotificationType.FOLLOW_ACCEPTED,
    });

    return follow;
  }

  async rejectFollowRequest(followerId: string, followingId: string) {
    const follow = await this.repo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow request not found');
    }

    if (follow.status !== 'PENDING') {
      throw new BadRequestException('No pending follow request');
    }

    follow.status = 'REJECTED';
    await this.repo.save(follow);

    await this.notificationsService.markReadByTypeAndActor(
      followingId,
      followerId,
      NotificationType.FOLLOW_REQUEST,
    );

    await this.repo.delete(follow.id);

    return { success: true };
  }

  async getFollowers(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.repo.find({
      where: { following: { id: userId }, status: 'ACCEPTED' },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowing(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.repo.find({
      where: { follower: { id: userId }, status: 'ACCEPTED' },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowStats(userId: string) {
    const [followers, following] = await Promise.all([
      this.repo.count({
        where: { following: { id: userId }, status: 'ACCEPTED' },
      }),
      this.repo.count({
        where: { follower: { id: userId }, status: 'ACCEPTED' },
      }),
    ]);

    return { followers, following };
  }

  async getSuggestedUsers(userId: string, limit = 5) {
    const following = await this.repo.find({
      where: { follower: { id: userId }, status: 'ACCEPTED' },
      relations: ['following'],
    });
    const followingIds = following.map(f => f.following.id);
    const excludeIds = [...followingIds, userId];

    const candidates = await this.userRepo.find({
      where: { isDeleted: false },
      take: 50,
      order: { createdAt: 'DESC' },
    });

    const filteredCandidates = candidates.filter(u => !excludeIds.includes(u.id));

    const myFollowingIds = followingIds;
    const suggestedWithMutual = await Promise.all(
      filteredCandidates.map(async (candidate) => {
        const candidateFollowers = await this.repo.find({
          where: { following: { id: candidate.id }, status: 'ACCEPTED' },
          relations: ['follower'],
        });
        const candidateFollowerIds = candidateFollowers.map(f => f.follower.id);

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

    suggestedWithMutual.sort((a, b) => b.mutualFriendCount - a.mutualFriendCount);
    return suggestedWithMutual.slice(0, limit);
  }

  async getPendingRequests(userId: string) {
    return this.repo.find({
      where: { following: { id: userId }, status: 'PENDING' },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowStatus(followerId: string, targetId: string) {
    const follow = await this.repo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: targetId },
      },
    });

    if (!follow) return 'not_follow_yet';
    if (follow.status === 'PENDING') return 'pending';
    if (follow.status === 'ACCEPTED') return 'followed';
    if (follow.status === 'REJECTED') return 'not_follow_yet';

    return 'not_follow_yet';
  }
}
