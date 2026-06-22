import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ CONVERSATION
  // ============================
  @Column()
  @Index()
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  // ============================
  // ✅ SENDER
  // ============================
  @Column()
  @Index()
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  // ============================
  // ✅ CONTENT
  // ============================
  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  image: string;

  // ============================
  // ✅ READ STATUS
  // ============================
  @Column({ nullable: true })
  readAt: Date;

  // ============================
  // ✅ TIME
  // ============================
  @CreateDateColumn()
  createdAt: Date;
}