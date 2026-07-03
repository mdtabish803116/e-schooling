import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'module_operation_permissions', schema: 'e_schooling' })
export class ModuleOperationPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'module_id', type: 'bigint', nullable: false, comment: 'Reference to ModuleMaster' })
  moduleId: string;

  @Index()
  @Column({ name: 'operation_id', type: 'bigint', nullable: false, comment: 'Reference to OperationMaster' })
  operationId: string;



  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Permission description' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
