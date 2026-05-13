import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * ModuleOperationPermission represents a dynamic multi-tenant capability mapping layer
 * linking granular ModuleMaster domains to explicit OperationMaster execution perimeters.
 */
@Entity({ name: 'module_operation_permissions', schema: 'e_schooling' })
@Index(['resource', 'action', 'schoolId'])
export class ModuleOperationPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'module_id', type: 'bigint', nullable: true, comment: 'Reference to ModuleMaster catalog' })
  moduleId: string;

  @Index()
  @Column({ name: 'operation_id', type: 'bigint', nullable: true, comment: 'Reference to OperationMaster action' })
  operationId: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Target school context. Null signifies global baseline' })
  schoolId: string;

  @Column({ name: 'resource', type: 'varchar', nullable: false, comment: 'Feature module domain shortcode' })
  resource: string;

  @Column({ name: 'action', type: 'varchar', nullable: false, comment: 'Action perimeter instruction' })
  action: string;

  @Index()
  @Column({ name: 'key', type: 'varchar', nullable: false, comment: 'Computed dynamic application evaluation key' })
  key: string;

  @Column({ name: 'description', type: 'varchar', nullable: true, comment: 'Capability documentation outline' })
  description: string;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Creator user tracking reference' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Updater user tracking reference' })
  updatedById: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
