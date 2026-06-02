import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { Post } from './post.entity';
import { Reaction } from './reaction.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  @Index()
  author: User;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @Index()
  post: Post;

  // reply
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  image: string;

  @OneToMany(() => Reaction, (reaction) => reaction.comment)
  reactions: Reaction[];

  @Column({ default: 0 })
  interactionScore: number;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
