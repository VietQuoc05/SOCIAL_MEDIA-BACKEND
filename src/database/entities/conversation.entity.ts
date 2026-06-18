import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';

import { User } from './user.entity';

@Entity('conversations')
@Unique(['user1Id', 'user2Id'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ USER 1
  // ============================
  @Column()
  @Index()
  user1Id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  // ============================
  // ✅ USER 2
  // ============================
  @Column()
  @Index()
  user2Id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2Id' })
  user2: User;

  // ============================
  // ✅ LAST MESSAGE (preview)
  // ============================
  @Column({ type: 'text', nullable: true })
  lastMessage: string;

  @Column({ nullable: true })
  lastMessageImage: string;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  lastSenderId: string;

  // ============================
  // ✅ TIME
  // ============================
  @CreateDateColumn()
  createdAt: Date;
}