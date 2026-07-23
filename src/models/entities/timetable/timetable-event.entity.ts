import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TimetableEventTypeEnum } from '../../enums/enums';

@Entity({ name: 'academic_timetable_events', schema: 'e_schooling' })
export class TimetableEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'title', type: 'varchar', nullable: false, comment: 'Event title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Event description' })
  description: string;

  @Column({ name: 'date', type: 'date', nullable: false, comment: 'Event date (YYYY-MM-DD)' })
  date: string;

  @Column({ name: 'start_time', type: 'varchar', nullable: true, comment: 'Start time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', nullable: true, comment: 'End time' })
  endTime: string;

  @Column({ name: 'type', type: 'varchar', nullable: false, default: TimetableEventTypeEnum.EVENT, comment: 'Type (class, exam, event, holiday)' })
  type: TimetableEventTypeEnum;

  @Column({ name: 'location', type: 'varchar', nullable: true, comment: 'Event location/venue' })
  location: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
