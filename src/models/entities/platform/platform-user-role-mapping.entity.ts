import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PlatformRole } from './platform-role.entity';

@Entity({ name: 'platform_user_role_mappings', schema: 'e_schooling' })
export class PlatformUserRoleMapping {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'platform_user_id', type: 'bigint', nullable: false, comment: 'Reference to PlatformUser' })
  platformUserId: string;

  @Index()
  @Column({ name: 'platform_role_id', type: 'bigint', nullable: false, comment: 'Reference to PlatformRole' })
  platformRoleId: string;

  @ManyToOne(() => PlatformRole)
  @JoinColumn({ name: 'platform_role_id' })
  platformRole: PlatformRole;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
