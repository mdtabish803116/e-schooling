import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

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

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive | blocked | deleted' })
  status: StatusEnum;

  @Column({ name: 'email_verified', type: 'boolean', nullable: true, comment: 'Email verification status' })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', nullable: true, comment: 'Phone verification status' })
  phoneVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true, comment: 'Last login timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
