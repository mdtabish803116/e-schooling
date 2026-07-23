import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TimetableSlot } from './timetable-slot.entity';
import { TimetableStatusEnum } from '../../enums/enums';

@Entity({ name: 'academic_timetables', schema: 'e_schooling' })
export class Timetable {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'name', type: 'varchar', nullable: false, comment: 'Timetable title' })
  name: string;

  @Index()
  @Column({ name: 'academic_year_id', type: 'varchar', nullable: true, comment: 'Academic year/session reference' })
  academicYearId: string | null;

  @Column({ name: 'status', type: 'varchar', nullable: false, default: TimetableStatusEnum.DRAFT, comment: 'Status (Draft, Published, Archived)' })
  status: TimetableStatusEnum;

  @Column({ name: 'version', type: 'numeric', precision: 5, scale: 2, default: 1.0, comment: 'Version number' })
  version: number;

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

  @OneToMany(() => TimetableSlot, (slot) => slot.timetable)
  slots: TimetableSlot[];
}
