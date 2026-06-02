import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Index,
  CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
@Unique(['follower', 'following'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  @Index()
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, {
    onDelete: 'CASCADE',
  })
  @Index()
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}