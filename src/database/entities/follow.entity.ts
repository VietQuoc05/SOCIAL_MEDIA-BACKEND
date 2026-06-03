import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('follows')
@Unique(['follower', 'following'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ USER A (người follow)
  @ManyToOne(() => User, (user) => user.following, {
    onDelete: 'CASCADE',
    nullable: false, // ✅ chống null
  })
  @JoinColumn({ name: 'followerId' })
  @Index()
  follower: User;

  // ✅ USER B (người được follow)
  @ManyToOne(() => User, (user) => user.followers, {
    onDelete: 'CASCADE',
    nullable: false, // ✅ chống null
  })
  @JoinColumn({ name: 'followingId' })
  @Index()
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}