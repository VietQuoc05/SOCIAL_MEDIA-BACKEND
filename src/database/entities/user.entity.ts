import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Follow } from './follow.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ EMAIL
  @Column({ unique: true })
  @Index()
  email: string;

  // ✅ PASSWORD
  @Column({ select: false })
  password: string;

  // ✅ USERNAME
  @Column({ unique: true })
  @Index()
  username: string;

  // ✅ PROFILE
  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  cover: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  instagram: string;

  // ✅ POSTS
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  // ✅ COMMENTS
  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  // ✅ REACTIONS
  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];

  // ============================
  // ✅ FOLLOW SYSTEM (QUAN TRỌNG NHẤT)
  // ============================

  // ✅ người này FOLLOW ai (following list)
  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  // ✅ ai FOLLOW người này (followers list)
  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  // ============================
  // ✅ ROLE & STATUS
  // ============================

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  // ✅ CREATED TIME
  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
``