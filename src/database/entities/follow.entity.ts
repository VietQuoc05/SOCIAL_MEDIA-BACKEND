import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Index,
  CreateDateColumn,
  JoinColumn,
  Column,
} from 'typeorm';

import { User } from './user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ USER A (follower)
  // ============================
  @Column()
  @Index()
  followerId: string;

  @ManyToOne(() => User, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  // ============================
  // ✅ USER B (following)
  // ============================
  @Column()
  @Index()
  followingId: string;

  @ManyToOne(() => User, (user) => user.followers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'followingId' })
  following: User;

  // ============================
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'ACCEPTED' })
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}
``