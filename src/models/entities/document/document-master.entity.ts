import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'document_masters', schema: 'e_schooling' })
export class DocumentMaster {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Document master name',
  })
  name: string;

  @Index()
  @Column({
    name: 'code',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Slug code unique per school',
  })
  code: string;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Optional description',
  })
  description: string | null;

  @Index()
  @Column({
    name: 'category',
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'other',
    comment: 'Category: identity, medical, academic, etc.',
  })
  category: string;

  @Column({
    name: 'accepted_file_types',
    type: 'text',
    array: true,
    nullable: false,
    default: () => '\'{"pdf","jpg","png"}\'',
    comment: 'Accepted file extensions',
  })
  acceptedFileTypes: string[];

  @Column({
    name: 'max_file_size_mb',
    type: 'smallint',
    nullable: false,
    default: 5,
    comment: 'Max size limit in MB',
  })
  maxFileSizeMb: number;

  @Column({
    name: 'is_mandatory',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Mandatory flag',
  })
  isMandatory: boolean;

  @Column({
    name: 'applicable_modules',
    type: 'text',
    array: true,
    nullable: false,
    default: () => "'{}'",
    comment: 'Modules using this document type',
  })
  applicableModules: string[];

  @Column({
    name: 'expiry_tracking_enabled',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Track expiry date',
  })
  expiryTrackingEnabled: boolean;

  @Column({
    name: 'verification_required',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Requires verification',
  })
  verificationRequired: boolean;

  @Index()
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
    name: 'is_deleted',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Deletion timestamp',
  })
  deletedAt: Date | null;

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User who created',
  })
  createdById: string | null;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User who last updated',
  })
  updatedById: string | null;

  @Index()
  @Column({
    name: 'deleted_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User who deleted',
  })
  deletedById: string | null;

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
