import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  // ✅ CREATE USER
  async create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  // ✅ FIND BY EMAIL (dùng cho login)
  async findByEmail(email: string) {
    return this.repo.findOne({
      where: {
        email,
        isDeleted: false, // ✅ không cho login user đã xoá
      },
      select: ['id', 'email', 'password', 'username'],
    });
  }

  // ✅ FIND BY ID
  async findById(id: string) {
    const user = await this.repo.findOne({
      where: {
        id,
        isDeleted: false, // ✅ cực kỳ quan trọng
      },
      relations: ['followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ✅ UPDATE PROFILE
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

  // ✅ GET ALL USERS (CHUẨN PRODUCTION)
  async findAll() {
    return this.repo.find({
      where: {
        isDeleted: false, // ✅ FIX QUAN TRỌNG
      },
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ SEARCH USER
  async search(keyword: string) {
    return this.repo.find({
      where: [
        {
          username: ILike(`%${keyword}%`),
          isDeleted: false, // ✅ FIX
        },
        {
          email: ILike(`%${keyword}%`),
          isDeleted: false, // ✅ FIX
        },
      ],
      take: 20,
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ SOFT DELETE USER (THÊM MỚI)
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