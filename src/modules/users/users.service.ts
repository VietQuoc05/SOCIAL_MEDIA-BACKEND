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

  async create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'username'],
    });
  }

  async findById(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['followers', 'following'],
    });

    if (!user) throw new NotFoundException();

    return user;
  }

  async updateProfile(userId: string, dto: any) {
    const user = await this.repo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException();

    Object.assign(user, dto);

    return this.repo.save(user);
  }

  async findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async search(keyword: string) {
    return this.repo.find({
      where: [
        { username: ILike(`%${keyword}%`) },
        { email: ILike(`%${keyword}%`) },
      ],
      take: 20,
    });
  }
}