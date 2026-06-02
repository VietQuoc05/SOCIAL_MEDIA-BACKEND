import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reaction } from '../../database/entities/reaction.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';

import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reaction, Post, Comment]),
  ],
  providers: [ReactionsService],
  controllers: [ReactionsController],
})
export class ReactionsModule {}