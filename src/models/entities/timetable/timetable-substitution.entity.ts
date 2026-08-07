import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TimetableSlot } from './timetable-slot.entity';
import { SchoolUser } from '../school/school-user.entity';

@Entity({ name: 'academic_timetable_substitutions', schema: 'e_schooling' })
export class TimetableSubstitution {
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
    name: 'slot_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to TimetableSlot',
  })
  slotId: string;

  @Index()
  @Column({
    name: 'original_teacher_id',
    type: 'bigint',
    nullable: false,
    comment: 'Original assigned teacher',
  })
  originalTeacherId: string;

  @Index()
  @Column({
    name: 'substitute_teacher_id',
    type: 'bigint',
    nullable: false,
    comment: 'Substitute assigned teacher',
  })
  substituteTeacherId: string;

  @Column({
    name: 'date',
    type: 'date',
    nullable: false,
    comment: 'Date of substitution',
  })
  date: string;

  @Index()
  @Column({
    name: 'period_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Period',
  })
  periodId: string;

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

  @ManyToOne(() => TimetableSlot)
  @JoinColumn({ name: 'slot_id' })
  slot: TimetableSlot;

  @ManyToOne(() => SchoolUser)
  @JoinColumn({ name: 'original_teacher_id' })
  originalTeacher: SchoolUser;

  @ManyToOne(() => SchoolUser)
  @JoinColumn({ name: 'substitute_teacher_id' })
  substituteTeacher: SchoolUser;
}
