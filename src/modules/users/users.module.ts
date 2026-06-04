import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';
import { Follow } from '../../database/entities/follow.entity'; ✅
import { Post } from '../../database/entities/post.entity';     ✅

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Follow, // ✅ FIX QUAN TRỌNG
      Post,   // ✅ FIX QUAN TRỌNG
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
``