import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WorkerJobContext } from '../../worker-job.interface';
import { DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../../../models/entities/student/student-enrollment.entity';
import { School } from '../../../../models/entities/school/school.entity';
import { Class } from '../../../../models/entities/academic/class.entity';
import { Section } from '../../../../models/entities/academic/section.entity';
import { AcademicSession } from '../../../../models/entities/academic/academic-session.entity';
import { EnrollmentStatusEnum, EnrollmentTypeEnum } from '../../../../models/enums/enums';
import { processInBatches } from '../../../../shared/utils/batch-processor.util';

@Injectable()
export class StudentImportProcessor {
  private readonly logger = new Logger(StudentImportProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { schoolId, caller, rows } = job.data || {};
    this.logger.log(`[StudentImportProcessor] Processing student import job ${job.id} for school: ${schoolId} (${rows?.length || 0} rows)`);

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
      throw new NotFoundException('No active academic session found in the database. Please create a session first.');
    }

    const classRepo = this.dataSource.getRepository(Class);
    const sectionRepo = this.dataSource.getRepository(Section);

    const defaultClass = await classRepo.findOne({ where: { schoolId, isDeleted: false } });
    if (!defaultClass) throw new NotFoundException('No default class found for school');

    const defaultSection = await sectionRepo.findOne({ where: { classId: defaultClass.id, isDeleted: false } });
    if (!defaultSection) throw new NotFoundException('No default section found for class');

    const totalRows = rows?.length || 0;
    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; error: string }[] = [];

    // Process incoming student rows in chunked transactions (Batch size = 250 rows per transaction)
    await processInBatches<any>({
      items: rows || [],
      batchSize: 250,
      dataSource: this.dataSource,
      onProgress: async (_processed, _total, percentage) => {
        await job.updateProgress(percentage);
      },
      processBatch: async (chunk: any[], queryRunner: QueryRunner) => {
        for (let i = 0; i < chunk.length; i++) {
          const row = chunk[i];
          try {
            if (!row.firstName || !row.lastName) {
              throw new Error('firstName and lastName are required');
            }

            let targetClass = row.classId ? await queryRunner.manager.findOne(Class, { where: { id: row.classId, schoolId } }) : null;
            if (!targetClass && row.className) {
              targetClass = await queryRunner.manager.findOne(Class, { where: { name: row.className, schoolId } });
            }
            if (!targetClass) targetClass = defaultClass;

            let targetSection = row.sectionId ? await queryRunner.manager.findOne(Section, { where: { id: row.sectionId, classId: targetClass.id } }) : null;
            if (!targetSection && row.sectionName) {
              targetSection = await queryRunner.manager.findOne(Section, { where: { name: row.sectionName, classId: targetClass.id } });
            }
            if (!targetSection) {
              targetSection = await queryRunner.manager.findOne(Section, { where: { classId: targetClass.id, isDeleted: false } }) || defaultSection;
            }

            const admissionNumber = row.admissionNumber || `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Check if student already exists for Idempotency / UPSERT
            let student = await queryRunner.manager.findOne(Student, { where: { schoolId, admissionNumber } });
            if (!student) {
              const studentCode = `STU-${school.internalSchoolCode || 'SCH'}-${Date.now().toString().slice(-4)}-${i + 1}`;
              const salt = await bcrypt.genSalt(10);
              const passwordHash = await bcrypt.hash(row.dob || '2010-01-01', salt);

              student = queryRunner.manager.create(Student, {
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
                admissionNumber,
                studentCode,
                passwordHash,
                createdById: caller?.id || 'system',
                isActive: true,
                isDeleted: false,
              });
              student = await queryRunner.manager.save(Student, student);
            } else {
              // UPSERT update existing student
              student.firstName = row.firstName;
              student.lastName = row.lastName;
              if (row.phone) student.phone = row.phone;
              if (row.email) student.email = row.email;
              student = await queryRunner.manager.save(Student, student);
            }

            // Enrollment Upsert
            let enrollment = await queryRunner.manager.findOne(StudentEnrollment, {
              where: { schoolId, studentId: student.id, academicSessionId: activeSession.id },
            });

            if (!enrollment) {
              enrollment = queryRunner.manager.create(StudentEnrollment, {
                schoolId,
                studentId: student.id,
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
            } else {
              enrollment.classId = targetClass.id;
              enrollment.sectionId = targetSection.id;
              if (row.rollNumber) enrollment.rollNumber = String(row.rollNumber);
            }
            await queryRunner.manager.save(StudentEnrollment, enrollment);
            successCount++;
          } catch (err: any) {
            failedCount++;
            errors.push({ row: i + 1, error: err.message });
          }
        }
      },
    });

    return {
      success: true,
      jobType: 'student_import',
      totalRows,
      successCount,
      failedCount,
      errors,
      message: `Student bulk import completed in batch transactions: ${successCount} imported/upserted, ${failedCount} failed.`,
    };
  }
}
