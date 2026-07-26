import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource, In } from 'typeorm';
import { Student } from '../../../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../../../models/entities/student/student-enrollment.entity';
import { Class } from '../../../../models/entities/academic/class.entity';
import { Section } from '../../../../models/entities/academic/section.entity';

@Injectable()
export class StudentExportProcessor {
  private readonly logger = new Logger(StudentExportProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: Job): Promise<unknown> {
    const { schoolId, classId, sectionId, search } = job.data;
    this.logger.log(`[StudentExportProcessor] Processing student export job ${job.id} for school: ${schoolId}`);

    await job.updateProgress(10);

    const studentRepo = this.dataSource.getRepository(Student);
    const enrollmentRepo = this.dataSource.getRepository(StudentEnrollment);

    const queryBuilder = studentRepo.createQueryBuilder('student')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isDeleted = :isDeleted', { isDeleted: false });

    if (classId || sectionId) {
      queryBuilder.innerJoin(StudentEnrollment, 'enrollment',
        'enrollment.studentId = student.id AND enrollment.isCurrent = :isCurrent AND enrollment.isDeleted = :enrollmentDeleted',
        { isCurrent: true, enrollmentDeleted: false });
      if (classId) queryBuilder.andWhere('enrollment.classId = :classId', { classId });
      if (sectionId) queryBuilder.andWhere('enrollment.sectionId = :sectionId', { sectionId });
    }

    if (search) {
      const searchTerm = `%${search}%`;
      queryBuilder.andWhere(
        '(LOWER(student.firstName) LIKE LOWER(:searchTerm) OR LOWER(student.lastName) LIKE LOWER(:searchTerm) OR LOWER(student.admissionNumber) LIKE LOWER(:searchTerm) OR LOWER(student.studentCode) LIKE LOWER(:searchTerm))',
        { searchTerm },
      );
    }

    await job.updateProgress(40);
    const students = await queryBuilder.orderBy('student.createdAt', 'DESC').getMany();

    await job.updateProgress(70);
    const studentIds = students.map(s => s.id);
    const enrollments = studentIds.length > 0
      ? await enrollmentRepo.find({ where: { studentId: In(studentIds), schoolId, isCurrent: true, isDeleted: false } })
      : [];
    const classes = studentIds.length > 0 ? await this.dataSource.getRepository(Class).find({ where: { schoolId, isDeleted: false } }) : [];
    const sections = studentIds.length > 0 ? await this.dataSource.getRepository(Section).find({ where: { schoolId, isDeleted: false } }) : [];

    const headers = ['Admission Number', 'Student Code', 'First Name', 'Last Name', 'Gender', 'DOB', 'Phone', 'Email', 'Class', 'Section', 'Roll Number', 'Father Name', 'Mother Name', 'Status'];
    const rows = students.map((s) => {
      const e = enrollments.find((env) => env.studentId === s.id);
      const cls = e ? classes.find((c) => String(c.id) === String(e.classId)) : null;
      const sec = e ? sections.find((secItem) => String(secItem.id) === String(e.sectionId)) : null;

      return [
        `"${s.admissionNumber || ''}"`,
        `"${s.studentCode || ''}"`,
        `"${s.firstName || ''}"`,
        `"${s.lastName || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.dob || ''}"`,
        `"${s.mobile || s.phone || ''}"`,
        `"${s.email || ''}"`,
        `"${cls?.name || ''}"`,
        `"${sec?.name || ''}"`,
        `"${e?.rollNumber || ''}"`,
        `"${s.fatherName || ''}"`,
        `"${s.motherName || ''}"`,
        `"${s.isActive ? 'ACTIVE' : 'INACTIVE'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    await job.updateProgress(100);

    return {
      success: true,
      jobType: 'student_export',
      totalExported: students.length,
      csvContent,
      filename: `students-export-school-${schoolId}-${Date.now()}.csv`,
      message: `Exported ${students.length} student records successfully.`,
    };
  }
}
