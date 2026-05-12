import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Permission represents a specific action allowed on a specific resource/feature.
 *
 * These are created exclusively by Platform Admins and are global (not school-specific).
 * School owners then assign these permissions to Roles they create per school.
 *
 * Example records:
 *   resource: 'attendance',  action: 'view',   key: 'attendance:view'
 *   resource: 'attendance',  action: 'create', key: 'attendance:create'
 *   resource: 'classes',     action: 'update', key: 'classes:update'
 *   resource: 'fees',        action: 'manage', key: 'fees:manage'
 */
@Entity({ name: 'permissions', schema: 'e_schooling' })
@Index(['resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  /**
   * The feature/module this permission belongs to.
   * e.g. attendance | classes | students | fees | timetable | exams | reports
   */
  @Column({ name: 'resource', type: 'varchar', nullable: false, comment: 'Feature module e.g. attendance, classes, students, fees' })
  resource: string;

  /**
   * The action allowed on the resource.
   * e.g. view | create | update | delete | manage (manage = full access)
   */
  @Column({ name: 'action', type: 'varchar', nullable: false, comment: 'Action e.g. view, create, update, delete, manage' })
  action: string;

  /**
   * Unique machine-readable key: "{resource}:{action}"
   * Used for permission checks in guards/services.
   * e.g. "attendance:view", "classes:create"
   */
  @Index({ unique: true })
  @Column({ name: 'key', type: 'varchar', nullable: false, comment: 'Unique key: resource:action e.g. attendance:view' })
  key: string;

  @Column({ name: 'description', type: 'varchar', nullable: true, comment: 'Human-readable description of what this permission allows' })
  description: string;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to PlatformUser who created this' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to PlatformUser who last updated this' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}

