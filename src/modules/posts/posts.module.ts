import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from '../../database/entities/post.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Reaction } from '../../database/entities/reaction.entity'; // ✅ THÊM

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Follow,
      Reaction, // ✅ FIX QUAN TRỌNG
    ]),
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
