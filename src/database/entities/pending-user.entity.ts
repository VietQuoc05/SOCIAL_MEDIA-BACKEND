import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('pending_users')
export class PendingUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================
  // ✅ REGISTRATION DATA
  // ============================
  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string; // đã hash

  @Column()
  username: string;

  @Column()
  displayName: string;

  // ============================
  // ✅ VERIFY TOKEN
  // ============================
  @Column()
  verifyToken: string;

  // ============================
  // ✅ CREATED
  // ============================
  @CreateDateColumn()
  createdAt: Date;
}