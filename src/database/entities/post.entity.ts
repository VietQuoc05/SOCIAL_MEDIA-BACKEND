import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

@Entity('posts') // ✅ đặt tên table rõ ràng
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ AUTHOR RELATION (QUAN TRỌNG)
  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'authorId' }) // ✅ FIX QUAN TRỌNG
  @Index()
  author: User;

  @Column({ type: 'uuid' })
  authorId: string; // ✅ thêm explicit FK (tránh lỗi TypeORM)

  // ✅ CAPTION
  @Column({ type: 'text', nullable: true })
  caption: string;

  // ✅ IMAGES
  @Column('text', { array: true, default: [] })
  images: string[];

  // ✅ INTERACTION SCORE
  @Column({ type: 'int', default: 0 })
  interactionScore: number;

  // ✅ RELATIONS
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.post)
  reactions: Reaction[];

  // ✅ CREATED AT
  @CreateDateColumn()
  @Index()
  createdAt: Date;
}