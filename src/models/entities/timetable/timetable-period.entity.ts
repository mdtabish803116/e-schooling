import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PeriodTypeEnum } from '../../enums/enums';

@Entity({ name: 'academic_timetable_periods', schema: 'e_schooling' })
export class TimetablePeriod {
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
    nullable: false,
    comment: 'Period name (e.g. Period 1)',
  })
  name: string;

  @Column({
    name: 'start_time',
    type: 'varchar',
    nullable: false,
    comment: 'Start time (e.g. 08:30 AM)',
  })
  startTime: string;

  @Column({
    name: 'end_time',
    type: 'varchar',
    nullable: false,
    comment: 'End time (e.g. 09:20 AM)',
  })
  endTime: string;

  @Column({
    name: 'type',
    type: 'varchar',
    nullable: false,
    default: PeriodTypeEnum.TEACHING,
    comment: 'Type (Teaching, Break, Assembly)',
  })
  type: PeriodTypeEnum;

  @Column({
    name: 'display_order',
    type: 'integer',
    nullable: false,
    default: 1,
    comment: 'Sorting display order',
  })
  displayOrder: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
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
  createdById: string;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Updater',
  })
  updatedById: string;

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
