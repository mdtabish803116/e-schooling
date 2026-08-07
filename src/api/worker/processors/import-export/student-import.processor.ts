import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../../../models/entities/student/student-enrollment.entity';
import { School } from '../../../../models/entities/school/school.entity';
import { Class } from '../../../../models/entities/academic/class.entity';
import { Section } from '../../../../models/entities/academic/section.entity';
import { AcademicSession } from '../../../../models/entities/academic/academic-session.entity';
import {
  EnrollmentStatusEnum,
  EnrollmentTypeEnum,
} from '../../../../models/enums/enums';

@Injectable()
export class StudentImportProcessor {
  private readonly logger = new Logger(StudentImportProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: Job): Promise<unknown> {
    const { schoolId, caller, rows } = job.data;
    this.logger.log(
      `[StudentImportProcessor] Processing student import job ${job.id} for school: ${schoolId} (${rows?.length || 0} rows)`,
    );

    const school = await this.dataSource
      .getRepository(School)
      .findOne({ where: { id: schoolId, isDeleted: false } });
    if (!school) throw new NotFoundException('School not found');

    const sessionRepo = this.dataSource.getRepository(AcademicSession);
    let activeSession = await sessionRepo.findOne({
      where: { schoolId, isCurrent: true, isDeleted: false },
    });
    if (!activeSession) {
      activeSession = await sessionRepo.findOne({
        where: { schoolId, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    }
    if (!activeSession) {
      activeSession = await sessionRepo.save(
        sessionRepo.create({
          schoolId,
          name: '2025-2026',
          isCurrent: true,
          isActive: true,
        }),
      );
    }

    const classRepo = this.dataSource.getRepository(Class);
    const sectionRepo = this.dataSource.getRepository(Section);

    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; error: string }[] = [];
    const totalRows = rows?.length || 0;

    for (let i = 0; i < totalRows; i++) {
      const row = rows[i];
      try {
        if (!row.firstName || !row.lastName) {
          throw new Error('firstName and lastName are required');
        }

        let targetClass = row.classId
          ? await classRepo.findOne({ where: { id: row.classId, schoolId } })
          : null;
        if (!targetClass && row.className) {
          targetClass = await classRepo.findOne({
            where: { name: row.className, schoolId },
          });
        }
        if (!targetClass) {
          targetClass = await classRepo.findOne({
            where: { schoolId, isDeleted: false },
          });
        }
        if (!targetClass) throw new Error('Target class not found');

        let targetSection = row.sectionId
          ? await sectionRepo.findOne({
              where: { id: row.sectionId, classId: targetClass.id },
            })
          : null;
        if (!targetSection && row.sectionName) {
          targetSection = await sectionRepo.findOne({
            where: { name: row.sectionName, classId: targetClass.id },
          });
        }
        if (!targetSection) {
          targetSection = await sectionRepo.findOne({
            where: { classId: targetClass.id, isDeleted: false },
          });
        }
        if (!targetSection) throw new Error('Target section not found');

        const studentCode = `STU-${school.internalSchoolCode || 'SCH'}-${Date.now().toString().slice(-4)}-${i + 1}`;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(row.dob || '2010-01-01', salt);

        const studentRepo = this.dataSource.getRepository(Student);
        const student = studentRepo.create({
          schoolId,
          firstName: row.firstName,
          lastName: row.lastName,
          gender: row.gender || 'male',
          dob: row.dob || '2010-01-01',
          phone: row.phone || row.mobile || null,
          mobile: row.mobile || row.phone || null,
          email: row.email || null,
          address: row.address || null,
          fatherName: row.fatherName || null,
          motherName: row.motherName || null,
          admissionNumber: row.admissionNumber || `ADM-${Date.now()}-${i + 1}`,
          studentCode,
          passwordHash,
          createdById: caller?.id || 'system',
          isActive: true,
          isDeleted: false,
        });

        const savedStudent = await studentRepo.save(student);

        const enrollmentRepo = this.dataSource.getRepository(StudentEnrollment);
        const enrollment = enrollmentRepo.create({
          schoolId,
          studentId: savedStudent.id,
          classId: targetClass.id,
          sectionId: targetSection.id,
          academicSessionId: activeSession.id,
          rollNumber: row.rollNumber ? String(row.rollNumber) : String(i + 1),
          enrollmentState: EnrollmentStatusEnum.ACTIVE,
          enrollmentType: EnrollmentTypeEnum.ADMISSION,
          isCurrent: true,
          startDate: new Date().toISOString().split('T')[0],
          createdById: caller?.id || 'system',
          isActive: true,
          isDeleted: false,
        });
        await enrollmentRepo.save(enrollment);
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ row: i + 1, error: err.message });
      }

      if (totalRows > 0) {
        const percent = Math.round(((i + 1) / totalRows) * 100);
        await job.updateProgress(percent);
      }
    }

    return {
      success: true,
      jobType: 'student_import',
      totalRows,
      successCount,
      failedCount,
      errors,
      message: `Student CSV bulk import completed: ${successCount} imported, ${failedCount} failed.`,
    };
  }
}
