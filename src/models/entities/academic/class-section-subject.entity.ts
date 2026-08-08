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
import { Class } from './class.entity';
import { Section } from './section.entity';
import { Subject } from './subject.entity';

@Entity({ name: 'class_section_subjects', schema: 'e_schooling' })
export class ClassSectionSubject {
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
    name: 'class_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Class',
  })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Index()
  @Column({
    name: 'section_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Section',
  })
  sectionId: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Index()
  @Column({
    name: 'subject_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Subject',
  })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Index()
  @Column({
    name: 'teacher_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  teacherId: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

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

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;

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
