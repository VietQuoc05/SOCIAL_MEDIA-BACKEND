import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { Reaction } from '../../database/entities/reaction.entity'; // ✅ ADD

import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

import { EventsGateway } from '../../events/events.gateway'; // ✅ ADD

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Post,
      Reaction, // ✅ QUAN TRỌNG
    ]),
  ],
  providers: [
    CommentsService,
    EventsGateway, // ✅ QUAN TRỌNG
  ],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}