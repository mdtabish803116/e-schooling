import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'school_announcements', schema: 'e_schooling' })
export class AnnouncementEntity {
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
    name: 'academic_session_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Academic Session',
  })
  academicSessionId: string | null;

  @Column({
    name: 'title',
    type: 'varchar',
    nullable: false,
    comment: 'Announcement Title',
  })
  title: string;

  @Column({
    name: 'summary',
    type: 'text',
    nullable: true,
    comment: 'Short summary or preview text',
  })
  summary: string;

  @Column({
    name: 'content',
    type: 'text',
    nullable: false,
    comment: 'Announcement body or rich content',
  })
  content: string;

  @Column({
    name: 'category',
    type: 'varchar',
    nullable: false,
    default: 'GENERAL',
    comment: 'Category (GENERAL, ACADEMIC, EXAMINATION, EVENT, EMERGENCY, etc.)',
  })
  category: string;

  @Column({
    name: 'priority',
    type: 'varchar',
    nullable: false,
    default: 'NORMAL',
    comment: 'Priority (NORMAL, HIGH, URGENT)',
  })
  priority: string;

  @Column({
    name: 'status',
    type: 'varchar',
    nullable: false,
    default: 'PUBLISHED',
    comment: 'Status (DRAFT, SCHEDULED, PUBLISHED, ARCHIVED)',
  })
  status: string;

  @Column({
    name: 'require_acknowledgement',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Requires recipient sign-off',
  })
  requireAcknowledgement: boolean;

  @Column({
    name: 'delivery_channels',
    type: 'jsonb',
    nullable: true,
    comment: 'Delivery channel choices (IN_APP, PUSH, EMAIL, SMS)',
  })
  deliveryChannels: any;

  @Column({
    name: 'publish_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Scheduled publish time',
  })
  publishAt: Date | null;

  @Column({
    name: 'published_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Actual published timestamp',
  })
  publishedAt: Date | null;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Expiration or auto-archive timestamp',
  })
  expiresAt: Date | null;

  @Column({
    name: 'targets',
    type: 'jsonb',
    nullable: true,
    comment: 'Target audience specifications',
  })
  targets: any;

  @Column({
    name: 'attachments',
    type: 'jsonb',
    nullable: true,
    comment: 'Uploaded attachment metadata list',
  })
  attachments: any;

  @Column({
    name: 'recipient_summary',
    type: 'jsonb',
    nullable: true,
    comment: 'Breakdown counts of targeted users',
  })
  recipientSummary: any;

  @Column({
    name: 'analytics',
    type: 'jsonb',
    nullable: true,
    comment: 'Analytics counters',
  })
  analytics: any;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status flag',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete flag',
  })
  isDeleted: boolean;

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Creator User ID',
  })
  createdById: string | null;

  @Column({
    name: 'created_by_name',
    type: 'varchar',
    nullable: true,
    comment: 'Creator Display Name',
  })
  createdByName: string;

  @Column({
    name: 'created_by_role',
    type: 'varchar',
    nullable: true,
    comment: 'Creator Role Title',
  })
  createdByRole: string;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Updater User ID',
  })
  updatedById: string | null;

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
