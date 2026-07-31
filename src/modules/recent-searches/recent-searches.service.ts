import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RecentSearch } from '../../database/entities/recent-search.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class RecentSearchesService {
  constructor(
    @InjectRepository(RecentSearch)
    private repo: Repository<RecentSearch>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(userId: string, searchedUserId: string) {
    if (userId === searchedUserId) {
      throw new BadRequestException('Cannot search yourself');
    }

    const target = await this.userRepo.findOne({
      where: { id: searchedUserId, isDeleted: false },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.repo.findOne({
      where: { userId, searchedUserId },
    });

    if (existing) {
      existing.displayName = target.displayName;
      existing.username = target.username;
      existing.avatar = target.avatar;
      await this.repo.save(existing);
      await this.repo.update(existing.id, { createdAt: new Date() });
      return existing;
    }

    const count = await this.repo.count({ where: { userId } });

    if (count >= 10) {
      const oldest = await this.repo.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      });
      if (oldest) {
        await this.repo.delete(oldest.id);
      }
    }

    const recentSearch = this.repo.create({
      userId,
      searchedUserId,
      displayName: target.displayName,
      username: target.username,
      avatar: target.avatar,
    });

    return this.repo.save(recentSearch);
  }

  async findAll(userId: string) {
    const searches = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return searches.map((s) => ({
      id: s.id,
      searchedUserId: s.searchedUserId,
      displayName: s.displayName,
      username: s.username,
      avatar: s.avatar,
      createdAt: s.createdAt,
    }));
  }

  async remove(userId: string, id: string) {
    const search = await this.repo.findOne({
      where: { id, userId },
    });

    if (!search) {
      throw new NotFoundException('Recent search not found');
    }

    await this.repo.delete(id);
    return { success: true };
  }

  async clearAll(userId: string) {
    await this.repo.delete({ userId });
    return { success: true };
  }
}
