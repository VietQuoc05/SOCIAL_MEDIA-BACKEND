import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { Reaction } from '../../database/entities/reaction.entity';

import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

import { EventsModule } from '../../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Post,
      Reaction,
    ]),
    EventsModule,
    NotificationsModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}