import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'school_role_permissions', schema: 'e_schooling' })
export class SchoolRolePermission {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'role_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to SchoolRole',
  })
  roleId: string;

  @Index()
  @Column({
    name: 'permission_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to ModuleOperationPermission',
  })
  permissionId: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Creator',
  })
  createdById?: string;

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
