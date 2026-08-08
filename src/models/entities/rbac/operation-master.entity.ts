import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'operation_masters', schema: 'e_schooling' })
export class OperationMaster {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
    comment: 'Display operation name e.g. View, Create, Approve',
  })
  name: string;

  @Index({ unique: true })
  @Column({
    name: 'code',
    type: 'varchar',
    nullable: false,
    comment: 'Action shortcode e.g. VIEW, CREATE, UPDATE, DELETE',
  })
  code: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Action perimeter context',
  })
  description?: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Creator tracking reference',
  })
  createdById?: string;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Updater tracking reference',
  })
  updatedById?: string;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

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
