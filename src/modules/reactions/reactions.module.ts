import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reaction } from '../../database/entities/reaction.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';

import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';

// ✅ IMPORT EVENTS MODULE
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reaction, Post, Comment]),
    EventsModule, // ✅ QUAN TRỌNG
  ],
  providers: [ReactionsService],
  controllers: [ReactionsController],
})
export class ReactionsModule {}