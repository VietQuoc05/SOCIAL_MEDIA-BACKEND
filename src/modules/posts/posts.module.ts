import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from '../../database/entities/post.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Reaction } from '../../database/entities/reaction.entity';
import { User } from '../../database/entities/user.entity';

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

import { UploadModule } from '../uploads/upload.module';
import { EventsModule } from '../../events/events.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Follow,
      Reaction,
      User,
    ]),
    UploadModule,
    EventsModule,
    UsersModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}