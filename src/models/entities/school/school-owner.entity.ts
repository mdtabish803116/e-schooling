import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'school_owners', schema: 'e_schooling' })
export class SchoolOwner {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: true, comment: 'Owner full name' })
  fullName: string;

  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'Owner email address' })
  email: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'Owner phone number' })
  phone: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Column({ name: 'email_verified', type: 'boolean', nullable: true, comment: 'Email verification status' })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', nullable: true, comment: 'Phone verification status' })
  phoneVerified: boolean;

  @Column({ name: 'state_id', type: 'bigint', nullable: true, comment: 'Reference to parent State' })
  stateId: string;

  @Column({ name: 'district_id', type: 'bigint', nullable: true, comment: 'Reference to parent District' })
  districtId: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true, comment: 'Last login timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
