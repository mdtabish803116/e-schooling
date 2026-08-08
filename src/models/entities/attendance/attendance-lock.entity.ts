import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'attendance_locks', schema: 'e_schooling' })
export class AttendanceLock {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false })
  schoolId: string;

  @Index()
  @Column({ name: 'date', type: 'date', nullable: false })
  date: string;

  @Column({ name: 'is_locked', type: 'boolean', default: true })
  isLocked: boolean;

  @Column({ name: 'locked_by', type: 'varchar', nullable: true })
  lockedBy: string;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true })
  createdById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
