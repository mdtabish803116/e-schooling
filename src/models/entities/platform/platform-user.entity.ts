import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PlatformRoleEnum } from '../../enums/enums';

@Entity({ name: 'platform_users', schema: 'e_schooling' })
export class PlatformUser {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'User full name' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'User email address' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  @Column({ name: 'role', type: 'varchar', nullable: true, comment: 'super_admin | ops | support' })
  role: PlatformRoleEnum;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
