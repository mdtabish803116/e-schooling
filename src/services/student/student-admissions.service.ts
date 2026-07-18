import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { StudentAdmissionDto } from '../../interfaces/request/student/student-admission.dto';
import { BulkProgressionDto } from '../../interfaces/request/student/bulk-progression.dto';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { EnrollmentStatusEnum, EnrollmentTypeEnum, OverrideTypeEnum, ActionTypeEnum } from '../../models/enums/enums';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { PromotionLog } from '../../models/entities/student/promotion-log.entity';

@Injectable()
export class StudentAdmissionsService {
  constructor(private dataSource: DataSource) { }

  private async assertOwnership(ownerId: string, schoolId: string): Promise<School> {
    const membership = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
      where: { schoolOwnerId: ownerId, schoolId }
    });

    if (!membership) {
      throw new ForbiddenException('You do not have permission to admit students to this school');
    }

    const school = await this.dataSource.getRepository(School).findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  private async generateStudentCode(schoolCode: string): Promise<string> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${schoolCode}-${randomSuffix}`;

    // Check uniqueness
    const existing = await this.dataSource.getRepository(Student).findOne({ where: { studentCode: code } });
    if (existing) {
      return this.generateStudentCode(schoolCode);
    }
    return code;
  }

  async admitStudent(caller: AuthContext, schoolId: string, dto: StudentAdmissionDto) {
    const school = await this.assertOwnership(caller.id, schoolId);

    // Validate Student Capacity Quota (Plan + Booster Overrides)
    const subRepo = this.dataSource.getRepository(SchoolSubscription);
    const subscription = await subRepo.findOne({
      where: { schoolId },
      relations: ['subscriptionPlan']
    });

    if (!subscription) {
      throw new BadRequestException('No active subscription found for this school branch.');
    }

    let allowedLimit: number | null = subscription.subscriptionPlan?.maxStudents || null;
    if (allowedLimit !== null) {
      const overrideRepo = this.dataSource.getRepository(SchoolFeatureOverride);
      const studentFeature = await this.dataSource.getRepository(PlatformFeature).findOne({
        where: { code: 'STUDENT_MANAGEMENT' }
      });

      if (studentFeature) {
        const now = new Date();
        const activeOverrides = await overrideRepo.find({
          where: {
            schoolId,
            platformFeatureId: studentFeature.id,
            overrideType: OverrideTypeEnum.CUSTOM_LIMIT,
            isActive: true,
            isDeleted: false
          }
        });

        for (const o of activeOverrides) {
          const started = !o.startDate || o.startDate <= now;
          const unexpired = !o.endDate || o.endDate >= now;
          if (started && unexpired && o.limitValue) {
            allowedLimit += parseInt(o.limitValue, 10);
          }
        }
      }
    }

    if (allowedLimit !== null) {
      const studentCount = await this.dataSource.getRepository(Student).count({
        where: { schoolId, isDeleted: false }
      });

      if (studentCount >= allowedLimit) {
        throw new BadRequestException(
          `Student admission capacity exceeded (${studentCount}/${allowedLimit}). Please upgrade your subscription plan or purchase student capacity boosters.`
        );
      }
    }

    // Validate class, section, session
    const targetClass = await this.dataSource.getRepository(Class).findOne({ where: { id: dto.classId, schoolId } });
    if (!targetClass) throw new NotFoundException('Class not found');

    const targetSection = await this.dataSource.getRepository(Section).findOne({ where: { id: dto.sectionId, schoolId } });
    if (!targetSection) throw new NotFoundException('Section not found');

    const targetSession = await this.dataSource.getRepository(AcademicSession).findOne({ where: { id: dto.academicSessionId, schoolId } });
    if (!targetSession) throw new NotFoundException('Academic session not found');

    const targetRole = await this.dataSource.getRepository(SchoolRole).findOne({ where: { id: dto.roleId, schoolId } });
    if (!targetRole) throw new NotFoundException('Role not found for this school');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const studentCode = await this.generateStudentCode(school.internalSchoolCode);

      // Default password is DOB (plain string) hashed
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.dob, salt);

      const student = new Student();
      student.schoolId = schoolId;
      student.firstName = dto.firstName;
      student.lastName = dto.lastName;
      student.gender = dto.gender;
      student.dob = dto.dob;
      student.phone = dto.phone;
      student.email = dto.email;
      student.parentName = dto.parentName;
      student.parentPhone = dto.parentPhone;
      student.address = dto.address;
      if (dto.profilePicUrl) {
        student.profilePicUrl = dto.profilePicUrl;
      }
      student.admissionNumber = dto.admissionNumber;
      student.studentCode = studentCode;
      student.passwordHash = passwordHash;
      student.createdById = caller.id;

      const savedStudent = await queryRunner.manager.save(student);

      const enrollment = new StudentEnrollment();
      enrollment.schoolId = schoolId;
      enrollment.studentId = savedStudent.id;
      enrollment.academicSessionId = dto.academicSessionId;
      enrollment.classId = dto.classId;
      enrollment.sectionId = dto.sectionId;
      enrollment.enrollmentType = EnrollmentTypeEnum.ADMISSION;
      enrollment.enrollmentState = EnrollmentStatusEnum.ACTIVE;
      enrollment.createdById = caller.id;

      await queryRunner.manager.save(enrollment);

      // Assign Role to Student
      const userRole = new SchoolUserRole();
      userRole.userId = savedStudent.id;
      userRole.roleId = dto.roleId;
      userRole.createdById = caller.id;
      userRole.userType = 'student';

      await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();

      return {
        message: 'Student admitted successfully',
        student: {
          id: savedStudent.id,
          studentCode: savedStudent.studentCode,
          firstName: savedStudent.firstName,
          lastName: savedStudent.lastName,
          admissionNumber: savedStudent.admissionNumber
        }
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkProgressStudents(caller: AuthContext, schoolId: string, dto: BulkProgressionDto) {
    await this.assertOwnership(caller.id, schoolId);

    // Validate target class, section, session
    const targetClass = await this.dataSource.getRepository(Class).findOne({ where: { id: dto.targetClassId, schoolId } });
    if (!targetClass) throw new NotFoundException('Target class not found');

    const targetSection = await this.dataSource.getRepository(Section).findOne({ where: { id: dto.targetSectionId, schoolId } });
    if (!targetSection) throw new NotFoundException('Target section not found');

    const targetSession = await this.dataSource.getRepository(AcademicSession).findOne({ where: { id: dto.targetSessionId, schoolId } });
    if (!targetSession) throw new NotFoundException('Target academic session not found');

    let enrollmentType: EnrollmentTypeEnum;
    let oldEnrollmentState: EnrollmentStatusEnum;

    if (dto.actionType === ActionTypeEnum.PROMOTION) {
      enrollmentType = EnrollmentTypeEnum.PROMOTION;
      oldEnrollmentState = EnrollmentStatusEnum.PROMOTED;
    } else if (dto.actionType === ActionTypeEnum.DEMOTION) {
      enrollmentType = EnrollmentTypeEnum.DEMOTION;
      oldEnrollmentState = EnrollmentStatusEnum.DEMOTED;
    } else if (dto.actionType === ActionTypeEnum.REPEAT) {
      enrollmentType = EnrollmentTypeEnum.REPEAT;
      oldEnrollmentState = EnrollmentStatusEnum.COMPLETED;
    } else if (dto.actionType === ActionTypeEnum.SPECIAL_PROMOTION) {
      enrollmentType = EnrollmentTypeEnum.SPECIAL_PROMOTION;
      oldEnrollmentState = EnrollmentStatusEnum.PROMOTED;
    } else if (dto.actionType === ActionTypeEnum.SECTION_TRANSFER) {
      enrollmentType = EnrollmentTypeEnum.TRANSFER;
      oldEnrollmentState = EnrollmentStatusEnum.TRANSFERRED;
    } else {
      throw new BadRequestException('Invalid action type');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollmentRepo = queryRunner.manager.getRepository(StudentEnrollment);
      const logRepo = queryRunner.manager.getRepository(PromotionLog);

      const processedStudentIds: string[] = [];

      for (const studentId of dto.studentIds) {
        // Find student's current active enrollment
        const currentEnrollment = await enrollmentRepo.findOne({
          where: { studentId, schoolId, isCurrent: true, isDeleted: false }
        });

        let previousEnrollmentId: string | undefined = undefined;
        if (currentEnrollment) {
          previousEnrollmentId = currentEnrollment.id;

          // 1. Deactivate current active enrollment
          currentEnrollment.isCurrent = false;
          currentEnrollment.enrollmentState = oldEnrollmentState;
          currentEnrollment.endDate = new Date().toISOString().split('T')[0];
          currentEnrollment.updatedById = caller.id;
          await enrollmentRepo.save(currentEnrollment);
        }

        // 2. Create new active enrollment
        const newEnrollment = new StudentEnrollment();
        newEnrollment.schoolId = schoolId;
        newEnrollment.studentId = studentId;
        newEnrollment.academicSessionId = dto.targetSessionId;
        newEnrollment.classId = dto.targetClassId;
        newEnrollment.sectionId = dto.targetSectionId;
        newEnrollment.enrollmentType = enrollmentType;
        newEnrollment.enrollmentState = EnrollmentStatusEnum.ACTIVE;
        newEnrollment.isCurrent = true;
        if (previousEnrollmentId) {
          newEnrollment.previousEnrollmentId = previousEnrollmentId;
        }
        newEnrollment.createdById = caller.id;
        newEnrollment.startDate = new Date().toISOString().split('T')[0];

        const savedNewEnrollment = await enrollmentRepo.save(newEnrollment);

        // 3. Log to promotion logs
        const log = new PromotionLog();
        log.schoolId = schoolId;
        log.studentId = studentId;
        if (previousEnrollmentId) {
          log.fromEnrollmentId = previousEnrollmentId;
        }
        log.toEnrollmentId = savedNewEnrollment.id;
        if (currentEnrollment?.classId) {
          log.fromClassId = currentEnrollment.classId;
        }
        if (currentEnrollment?.sectionId) {
          log.fromSectionId = currentEnrollment.sectionId;
        }
        log.toClassId = dto.targetClassId;
        log.toSectionId = dto.targetSectionId;
        log.actionType = dto.actionType;
        log.remarks = dto.remarks || `Bulk progression of type: ${dto.actionType}`;
        log.performedBy = caller.id;
        log.performedAt = new Date();
        log.isActive = true;
        log.isDeleted = false;

        await logRepo.save(log);

        processedStudentIds.push(studentId);
      }

      await queryRunner.commitTransaction();

      return {
        message: `Successfully processed ${processedStudentIds.length} student(s) for ${dto.actionType}.`,
        processedStudentIds
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStudents(
    caller: AuthContext,
    schoolId: string,
    query: { classId?: string; sectionId?: string },
  ) {
    const membership = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
      where: { schoolOwnerId: caller.id, schoolId }
    });
    if (!membership && caller.actorType === 'school_owner') {
      throw new ForbiddenException('You do not have permission to view students of this school');
    } else if (caller.actorType === 'school_user' && String(caller.schoolId) !== String(schoolId)) {
      throw new ForbiddenException('You do not belong to this school');
    }

    const enrollmentRepo = this.dataSource.getRepository(StudentEnrollment);
    const where: any = { schoolId, isCurrent: true, isActive: true, isDeleted: false };
    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;

    const enrollments = await enrollmentRepo.find({ where });
    if (enrollments.length === 0) return [];

    const studentIds = enrollments.map(e => e.studentId);
    const students = await this.dataSource.getRepository(Student).find({
      where: { id: In(studentIds), isDeleted: false }
    });

    return enrollments.map(e => {
      const student = students.find(s => s.id === e.studentId);
      if (!student) return null;
      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        dob: student.dob,
        phone: student.phone,
        email: student.email,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        address: student.address,
        admissionNumber: student.admissionNumber,
        profilePicUrl: student.profilePicUrl,
        isActive: student.isActive,
        classId: e.classId,
        sectionId: e.sectionId,
        rollNumber: e.rollNumber,
        studentEnrollmentId: e.id,
      };
    }).filter(Boolean);
  }
}

