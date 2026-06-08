import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Post } from '../../database/entities/post.entity';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// ✅ ADD
import { UploadModule } from '../uploads/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Follow,
      Post,
    ]),
    UploadModule, // ✅ ADD
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
``