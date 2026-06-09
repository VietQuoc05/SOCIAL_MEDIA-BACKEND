import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity('reactions')

// ✅ mỗi user chỉ like 1 post
@Unique(['user', 'post'])

// ✅ mỗi user chỉ like 1 comment
@Unique(['user', 'comment'])
export class Reaction {
  // ============================
  // ✅ ID
  // ============================
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ USER
  // ============================
  @ManyToOne(() => User, user => user.reactions, {
    onDelete: 'CASCADE',
  })
  @Index()
  user: User;

  // ============================
  // ✅ POST (OPTIONAL)
  // ============================
  @ManyToOne(() => Post, post => post.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @Index()
  post: Post | null;

  // ============================
  // ✅ COMMENT (OPTIONAL)
  // ============================
  @ManyToOne(() => Comment, comment => comment.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @Index()
  comment: Comment | null;

  // ============================
  // ✅ CREATED TIME
  // ============================
  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
``