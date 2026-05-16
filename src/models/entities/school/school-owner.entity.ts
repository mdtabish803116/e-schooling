import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'school_owners', schema: 'e_schooling' })
export class SchoolOwner {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: false, comment: 'Legal full name of the owner' })
  fullName: string;

  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', nullable: false, comment: 'Primary contact and login email' })
  email: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'Contact phone number' })
  phone: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: false, comment: 'Bcrypt hashed password' })
  passwordHash: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: 'Account activation status' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true, comment: 'Last successful login timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
