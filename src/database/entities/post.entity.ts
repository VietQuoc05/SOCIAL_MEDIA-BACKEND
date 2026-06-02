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
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
  })
  @Index()
  author: User;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({ default: 0 })
  interactionScore: number;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.post)
  reactions: Reaction[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}