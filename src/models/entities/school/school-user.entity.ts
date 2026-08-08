import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeEnum } from '../../enums/enums';
import { School } from './school.entity';

@Entity({ name: 'school_users', schema: 'e_schooling' })
export class SchoolUser {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to School',
  })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Index()
  @Column({
    name: 'school_owner_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolOwner',
  })
  schoolOwnerId: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
    comment: 'User name',
  })
  name: string;

  @Column({
    name: 'username',
    type: 'varchar',
    nullable: true,
    comment: 'Unique username',
  })
  username: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    comment: 'Hashed password',
  })
  passwordHash: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    nullable: true,
    comment: 'User phone number',
  })
  phone: string;

  @Column({
    name: 'user_type',
    type: 'varchar',
    nullable: true,
    comment: 'admin | teacher | accountant | staff',
  })
  userType: UserTypeEnum;

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

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolOwner',
  })
  createdById: string;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolOwner',
  })
  updatedById: string;

  @Column({
    name: 'state_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to parent State',
  })
  stateId: string;

  @Column({
    name: 'district_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to parent District',
  })
  districtId: string;

  @Column({
    name: 'reset_token',
    type: 'varchar',
    nullable: true,
    comment: 'Token/OTP used for password reset verification',
  })
  resetToken: string;

  @Column({
    name: 'reset_token_expires',
    type: 'timestamp',
    nullable: true,
    comment: 'Expiration timestamp for password reset token',
  })
  resetTokenExpires: Date;

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
