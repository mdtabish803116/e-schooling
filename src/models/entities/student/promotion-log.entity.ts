import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ActionTypeEnum } from '../../enums/enums';

@Entity({ name: 'promotion_logs', schema: 'e_schooling' })
export class PromotionLog {
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
    name: 'student_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Student',
  })
  studentId: string;

  @Index()
  @Column({
    name: 'from_enrollment_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to previous StudentEnrollment',
  })
  fromEnrollmentId: string;

  @Index()
  @Column({
    name: 'to_enrollment_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to new StudentEnrollment',
  })
  toEnrollmentId: string;

  @Index()
  @Column({
    name: 'from_class_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to previous Class',
  })
  fromClassId: string;

  @Index()
  @Column({
    name: 'from_section_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to previous Section',
  })
  fromSectionId: string;

  @Index()
  @Column({
    name: 'to_class_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to new Class',
  })
  toClassId: string;

  @Index()
  @Column({
    name: 'to_section_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to new Section',
  })
  toSectionId: string;

  @Column({
    name: 'action_type',
    type: 'varchar',
    nullable: true,
    comment: 'promotion | demotion | section_transfer',
  })
  actionType: ActionTypeEnum;

  @Column({
    name: 'remarks',
    type: 'text',
    nullable: true,
    comment: 'Promotion remarks',
  })
  remarks: string;

  @Index()
  @Column({
    name: 'performed_by',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  performedBy: string;

  @Column({
    name: 'performed_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Performance timestamp',
  })
  performedAt: Date;

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
}
