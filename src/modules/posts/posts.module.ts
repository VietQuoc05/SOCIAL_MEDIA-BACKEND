import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from '../../database/entities/post.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Reaction } from '../../database/entities/reaction.entity';

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

// ✅ ADD
import { UploadModule } from '../uploads/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Follow,
      Reaction,
    ]),
    UploadModule, // ✅ QUAN TRỌNG: dùng UploadService
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}