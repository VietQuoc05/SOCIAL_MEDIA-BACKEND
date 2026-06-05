import {
 GeneratedColumn,  Entity,
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

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  @Index()
  username: string;

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

  // ✅ PRIVACY SETTINGS 🔥
  @Column({ default: true })
  isPublicFollowers: boolean;

  @Column({ default: true })
  isPublicFollowing: boolean;

  // ✅ RELATIONS
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

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}

