import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { ReactionType } from '../../common/enums/reaction.enum';

@Entity()
@Unique(['user', 'post'])
@Unique(['user', 'comment'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.reactions, {
    onDelete: 'CASCADE',
  })
  @Index()
  user: User;

  @ManyToOne(() => Post, (post) => post.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @Index()
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @Index()
  comment: Comment;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @CreateDateColumn()
  createdAt: Date;
}