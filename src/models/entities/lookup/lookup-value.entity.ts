import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'lookup_values', schema: 'e_schooling' })
@Index('idx_lookup_values_category_active', ['category', 'isActive', 'displayOrder'])
export class LookupValueEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: true,
    comment: 'School tenant ID (null for system defaults)',
  })
  schoolId: string | null;

  @Column({
    name: 'category',
    type: 'varchar',
    length: 60,
    nullable: false,
    comment: 'Lookup category (e.g., GENDER, RELIGION, BOARD_TYPE)',
  })
  category: string;

  @Column({
    name: 'code',
    type: 'varchar',
    length: 80,
    nullable: false,
    comment: 'System lookup code identifier',
  })
  code: string;

  @Column({
    name: 'lookup_key',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Canonical lookup key',
  })
  lookupKey: string;

  @Column({
    name: 'lookup_value',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Human-readable label/display value',
  })
  lookupValue: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Optional description of the lookup value',
  })
  description: string | null;

  @Column({
    name: 'display_order',
    type: 'integer',
    default: 0,
    comment: 'Sorting/display order',
  })
  displayOrder: number;

  @Column({
    name: 'parent_id',
    type: 'bigint',
    nullable: true,
    comment: 'Parent lookup ID for hierarchical relationships',
  })
  parentId: string | null;

  @ManyToOne(() => LookupValueEntity, (lookup) => lookup.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: LookupValueEntity | null;

  @OneToMany(() => LookupValueEntity, (lookup) => lookup.parent)
  children?: LookupValueEntity[];

  @Column({
    name: 'is_system_default',
    type: 'boolean',
    default: false,
    comment: 'Flag indicating system-wide default entry',
  })
  isSystemDefault: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Status flag for active lookup entries',
  })
  isActive: boolean;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: 'Soft delete indicator',
  })
  isDeleted: boolean;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
    comment: 'Flexible JSON payload for category-specific configuration',
  })
  metadata: Record<string, any> | null;

  @Column({
    name: 'created_by_id',
    type: 'bigint',
    default: 1,
    comment: 'User ID of creator',
  })
  createdById: string;

  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    default: 1,
    comment: 'User ID of last updater',
  })
  updatedById: string;

  @Column({
    name: 'deleted_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User ID of soft deleter',
  })
  deletedById: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    comment: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    comment: 'Last update timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Deletion timestamp',
  })
  deletedAt: Date | null;
}

export default LookupValueEntity;
