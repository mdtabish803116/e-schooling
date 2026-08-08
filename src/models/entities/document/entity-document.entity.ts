import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'entity_documents', schema: 'e_schooling' })
export class EntityDocument {
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

  @Index()
  @Column({
    name: 'document_master_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Document Master',
  })
  documentMasterId: string;

  @Index()
  @Column({
    name: 'entity_type',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Entity type: student, staff, etc.',
  })
  entityType: string;

  @Index()
  @Column({
    name: 'entity_id',
    type: 'bigint',
    nullable: false,
    comment: 'Target entity ID',
  })
  entityId: string;

  @Column({
    name: 'file_url',
    type: 'text',
    nullable: false,
    comment: 'File storage URL',
  })
  fileUrl: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Original file name',
  })
  fileName: string | null;

  @Column({
    name: 'file_size_bytes',
    type: 'integer',
    nullable: true,
    comment: 'File size in bytes',
  })
  fileSizeBytes: number | null;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'File MIME type',
  })
  mimeType: string | null;

  @Index()
  @Column({
    name: 'expiry_date',
    type: 'date',
    nullable: true,
    comment: 'Expiration date',
  })
  expiryDate: string | null;

  @Index()
  @Column({
    name: 'verification_status',
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'pending',
    comment: 'Verification status: pending, verified, rejected',
  })
  verificationStatus: string;

  @Index()
  @Column({
    name: 'verified_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User who verified',
  })
  verifiedById: string | null;

  @Column({
    name: 'verified_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Verification timestamp',
  })
  verifiedAt: Date | null;

  @Column({
    name: 'rejection_reason',
    type: 'text',
    nullable: true,
    comment: 'Rejection reason if rejected',
  })
  rejectionReason: string | null;

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
    name: 'uploaded_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'User who uploaded',
  })
  uploadedById: string | null;

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
