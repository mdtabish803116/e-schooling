import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PlatformRoleEnum } from '../../enums/enums';

@Entity({ name: 'platform_users', schema: 'e_schooling' })
export class PlatformUser {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
    comment: 'User full name',
  })
  name: string;

  @Index({ unique: true })
  @Column({
    name: 'email',
    type: 'varchar',
    nullable: true,
    comment: 'User email address',
  })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    comment: 'Hashed password',
  })
  passwordHash: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

  @Column({
    name: 'current_session_token',
    type: 'varchar',
    nullable: true,
    comment: 'Active session token',
  })
  currentSessionToken: string;

  @Column({
    name: 'is_logged_in',
    type: 'boolean',
    default: false,
    comment: 'Active login flag',
  })
  isLoggedIn: boolean;

  @Column({
    name: 'failed_login_attempts',
    type: 'integer',
    default: 0,
    comment: 'Failed login count',
  })
  failedLoginAttempts: number;

  @Column({
    name: 'lockout_until',
    type: 'timestamp',
    nullable: true,
    comment: 'Lockout timestamp',
  })
  lockoutUntil: Date;

  @Column({
    name: 'is_locked',
    type: 'boolean',
    default: false,
    comment: 'Account lock status',
  })
  isLocked: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Last update timestamp',
  })
  updatedAt: Date;
}
