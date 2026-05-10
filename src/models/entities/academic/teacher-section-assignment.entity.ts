import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'teacher_section_assignments', schema: 'e_schooling' })
export class TeacherSectionAssignment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'teacher_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  teacherId: string;

  @Index()
  @Column({ name: 'class_id', type: 'bigint', nullable: true, comment: 'Reference to Class' })
  classId: string;

  @Index()
  @Column({ name: 'section_id', type: 'bigint', nullable: true, comment: 'Reference to Section' })
  sectionId: string;

  @Column({ name: 'is_class_teacher', type: 'boolean', nullable: true, comment: 'Whether this teacher is the class teacher' })
  isClassTeacher: boolean;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
