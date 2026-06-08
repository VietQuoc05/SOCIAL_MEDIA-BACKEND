import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,  
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

@Entity('posts')
@Index(['createdAt']) // ✅ cursor pagination
@Index(['interactionScore']) // ✅ sort hot posts
@Index(['authorId']) // ✅ filter theo user/feed
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ AUTHOR
  // ============================
  @ManyToOne(() => User, user => user.posts, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'uuid' })
  authorId: string;

  // ============================
  // ✅ CONTENT
  // ============================
  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column('text', { array: true, default: [] })
  images: string[];

  // ============================
  // ✅ INTERACTION
  // ============================
  @Column({ type: 'int', default: 0 })
  interactionScore: number;

  // ============================
  // ✅ RELATIONS
  // ============================
  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @OneToMany(() => Reaction, reaction => reaction.post)
  reactions: Reaction[];

  // ============================
  // ✅ TIME
  // ============================
  @CreateDateColumn()
  createdAt: Date;
}

