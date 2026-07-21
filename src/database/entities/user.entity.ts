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

  // ============================
  // ✅ BASIC INFO
  // ============================
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  username: string; // ✅ giữ nguyên (có dấu)

  @Column({ unique: true })
  @Index()
  displayName: string; // ✅ NEW (IG style)

  // ============================
  // ✅ PROFILE
  // ============================
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

  // ============================
  // ✅ PRIVACY
  // ============================
  @Column({ default: true })
  isPublicFollowers: boolean;

  @Column({ default: true })
  isPublicFollowing: boolean;

  // ============================
  // ✅ RELATIONS
  // ============================
  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];

  @OneToMany(() => Reaction, reaction => reaction.user)
  reactions: Reaction[];

  @OneToMany(() => Follow, follow => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, follow => follow.following)
  followers: Follow[];

  // ============================
  // ✅ STATUS
  // ============================
  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifyToken: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpire: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: 0 })
  totalPosts: number;

  // ============================
  // ✅ CREATED
  // ============================
  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
``