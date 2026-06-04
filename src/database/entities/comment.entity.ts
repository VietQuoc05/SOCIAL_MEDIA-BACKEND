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

@Entity('comments')
export class Comment {
  // ============================
  // ✅ PRIMARY KEY
  // ============================
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ AUTHOR
  // ============================
  @ManyToOne(() => User, user => user.comments, {
    onDelete: 'CASCADE',
  })
  @Index()
  author: User;

  // ============================
  // ✅ POST
  // ============================
  @ManyToOne(() => Post, post => post.comments, {
    onDelete: 'CASCADE',
  })
  @Index()
  post: Post;

  // ============================
  // ✅ PARENT COMMENT (REPLY)
  // ============================
  @ManyToOne(() => Comment, comment => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent: Comment;

  // ============================
  // ✅ CHILD COMMENTS (REPLIES)
  // ============================
  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  // ============================
  // ✅ CONTENT
  // ============================
  @Column({ type: 'text' })
  content: string;

  // ============================
  // ✅ IMAGE (OPTIONAL)
  // ============================
  @Column({ nullable: true })
  image?: string;

  // ============================
  // ✅ REACTIONS
  // ============================
  @OneToMany(() => Reaction, reaction => reaction.comment)
  reactions: Reaction[];

  // ============================
  // ✅ INTERACTION SCORE
  // ============================
  @Column({ default: 0 })
  interactionScore: number;

  // ============================
  // ✅ FLAGS (OPTIONAL FUTURE USE)
  // ============================
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isEdited: boolean;

  // ============================
  // ✅ CREATED TIME
  // ============================
  @CreateDateColumn()
  @Index()
  createdAt: Date;
}