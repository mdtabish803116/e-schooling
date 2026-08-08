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
import { SchoolUser } from '../school/school-user.entity';

@Entity({ name: 'teacher_section_assignments', schema: 'e_schooling' })
export class TeacherSectionAssignment {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Index()
  @Column({
    name: 'academic_session_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to AcademicSession',
  })
  academicSessionId: string | null;

  @Index()
  @Column({
    name: 'teacher_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  teacherId: string;

  @ManyToOne(() => SchoolUser)
  @JoinColumn({ name: 'teacher_id' })
  teacher: SchoolUser;

  @Index()
  @Column({
    name: 'class_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Class',
  })
  classId: string;

  @Index()
  @Column({
    name: 'section_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Section',
  })
  sectionId: string | null;

  @Column({
    name: 'is_class_teacher',
    type: 'boolean',
    nullable: true,
    comment: 'Whether this teacher is the class teacher',
  })
  isClassTeacher: boolean;

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

  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Creator',
  })
  createdById: string;

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
