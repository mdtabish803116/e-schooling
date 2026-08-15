import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'school_owners', schema: 'e_schooling' })
export class SchoolOwner {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    nullable: false,
    comment: 'Legal full name of the owner',
  })
  fullName: string;

  @Index({ unique: true })
  @Column({
    name: 'email',
    type: 'varchar',
    nullable: false,
    comment: 'Primary contact and login email',
  })
  email: string;

  @Index({ unique: true })
  @Column({
    name: 'phone',
    type: 'varchar',
    nullable: false,
    comment: 'Contact phone number (Mobile)',
  })
  phone: string;

  @Column({
    name: 'profile_pic_url',
    type: 'varchar',
    nullable: true,
    comment: 'Profile picture URL of the owner',
  })
  profilePicUrl: string;

  @Column({
    name: 'terms_accepted',
    type: 'boolean',
    default: false,
    comment: 'Whether user accepted terms and conditions',
  })
  termsAccepted: boolean;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: false,
    comment: 'Bcrypt hashed password',
  })
  passwordHash: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Account activation status',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Last successful login timestamp',
  })
  lastLoginAt: Date;

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
    comment: 'Record creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Last update timestamp',
  })
  updatedAt: Date;
}
