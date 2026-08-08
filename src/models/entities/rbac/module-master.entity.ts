import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'module_masters', schema: 'e_schooling' })
export class ModuleMaster {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
    comment: 'Display name e.g. Attendance Management, Fee Management',
  })
  name: string;

  @Index({ unique: true })
  @Column({
    name: 'code',
    type: 'varchar',
    nullable: false,
    comment: 'System mapping code e.g. ATTENDANCE, FEES, ADMISSION',
  })
  code: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Module domain capabilities description',
  })
  description?: string;

  @Index()
  @Column({
    name: 'platform_feature_id',
    type: 'bigint',
    nullable: true,
    comment:
      'Reference to underlying PlatformFeature metered/billed capability',
  })
  platformFeatureId?: string;

  @Index()
  @Column({
    name: 'parent_module_id',
    type: 'bigint',
    nullable: true,
    comment: 'Self reference for nested menu tree',
  })
  parentModuleId?: string;

  @Column({
    name: 'route_path',
    type: 'varchar',
    nullable: true,
    comment: 'Frontend route path',
  })
  routePath?: string;

  @Column({
    name: 'icon',
    type: 'varchar',
    nullable: true,
    comment: 'Menu icon identifier',
  })
  icon?: string;

  @Column({
    name: 'display_order',
    type: 'int',
    default: 0,
    comment: 'Order in sidebar',
  })
  displayOrder: number;

  @Column({
    name: 'show_in_sidebar',
    type: 'boolean',
    default: true,
    comment: 'Visibility toggle for sidebar',
  })
  showInSidebar: boolean;

  @Column({
    name: 'is_menu_group',
    type: 'boolean',
    default: false,
    comment: 'True if this is just a folder/label',
  })
  isMenuGroup: boolean;

  @Column({
    name: 'is_visible',
    type: 'boolean',
    default: true,
    comment: 'Dynamic visibility toggle',
  })
  isVisible: boolean;

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
