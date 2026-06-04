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

@Entity('reactions')

// ✅ 1 USER chỉ react 1 POST
@Unique(['user', 'post'])

// ✅ 1 USER chỉ react 1 COMMENT
@Unique(['user', 'comment'])
export class Reaction {
  // ============================
  // ✅ PRIMARY KEY
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
  // ✅ TYPE (LIKE / LOVE / ...)
  // ============================
  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  type: ReactionType;

  // ============================
  // ✅ CREATED TIME
  // ============================
  @CreateDateColumn()
  createdAt: Date;
}