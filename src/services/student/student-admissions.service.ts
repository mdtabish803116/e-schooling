import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, In } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { BulkProgressionDto } from '../../interfaces/request/student/bulk-progression.dto';
import { StudentAdmissionDto } from '../../interfaces/request/student/student-admission.dto';
import { UpdateStudentDto } from '../../interfaces/request/student/update-student.dto';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { School } from '../../models/entities/school/school.entity';
import { AdmissionApplication } from '../../models/entities/student/admission-application.entity';
import { AdmissionEnquiry } from '../../models/entities/student/admission-enquiry.entity';
import { PromotionLog } from '../../models/entities/student/promotion-log.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { Student } from '../../models/entities/student/student.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import {
  ActionTypeEnum,
  EnrollmentStatusEnum,
  EnrollmentTypeEnum,
  OverrideTypeEnum,
} from '../../models/enums/enums';
import { processInBatches } from '../../shared/utils/batch-processor.util';

export interface CreateEnquiryDto {
  studentName?: string;
  parentName?: string;
  contactNumber?: string;
  email?: string;
  targetClassId?: string;
  targetClassName?: string;
  gender?: string;
  previousSchool?: string;
  source?: string;
  notes?: string;
  assignedToStaffName?: string;
}

@Injectable()
export class StudentAdmissionsService {
  constructor(private dataSource: DataSource) {}

  private async assertOwnership(
    ownerId: string,
    schoolId: string,
  ): Promise<School> {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({
        where: { schoolOwnerId: ownerId, schoolId },
      });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to admit students to this school',
      );
    }
    const school = await this.dataSource
      .getRepository(School)
      .findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  private normalizeNameParts(
    firstName?: string,
    middleName?: string,
    lastName?: string,
  ) {
    const clean = (val?: string) =>
      val ? val.trim().replace(/\s+/g, ' ') : '';
    const f = clean(firstName);
    const m = clean(middleName);
    const l = clean(lastName);
    const fullName = [f, m, l].filter(Boolean).join(' ');
    return {
      firstName: f,
      middleName: m || null,
      lastName: l || null,
      fullName,
    };
  }

  private async generateStudentCode(
    schoolId: string,
    customCode?: string,
    queryRunner?: any,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;
    if (customCode && customCode.trim()) {
      const cleanCode = customCode.trim().toUpperCase();
      const existing = await manager.getRepository(Student).findOne({
        where: { schoolId, studentCode: cleanCode, isDeleted: false },
      });
      if (existing) {
        throw new ConflictException(
          `Student Code "${cleanCode}" is already assigned to another student in this school.`,
        );
      }
      return cleanCode;
    }

    try {
      const res = await manager.query(
        `SELECT NEXTVAL('e_schooling.student_code_seq') as seq;`,
      );
      const seqNum =
        res && res[0] ? res[0].seq : Date.now().toString().slice(-4);
      const code = `STU-${String(seqNum).padStart(4, '0')}`;

      const existing = await manager.getRepository(Student).findOne({
        where: { schoolId, studentCode: code, isDeleted: false },
      });
      if (existing) {
        return `STU-${String(Number(seqNum) + 100).padStart(4, '0')}`;
      }
      return code;
    } catch {
      const count = await manager
        .getRepository(Student)
        .count({ where: { schoolId } });
      return `STU-${String(count + 1).padStart(4, '0')}`;
    }
  }

  private async generateAdmissionNumber(
    schoolId: string,
    academicSessionId: string,
    customNo?: string,
    queryRunner?: any,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;
    if (customNo && customNo.trim()) {
      const cleanNo = customNo.trim().toUpperCase();
      const existing = await manager.getRepository(Student).findOne({
        where: { schoolId, admissionNumber: cleanNo, isDeleted: false },
      });
      if (existing) {
        throw new ConflictException(
          `Admission Number "${cleanNo}" is already in use in this school.`,
        );
      }
      return cleanNo;
    }

    const session = await manager
      .getRepository(AcademicSession)
      .findOne({ where: { id: academicSessionId } });
    const yearSuffix = session?.name
      ? session.name.replace(/[^0-9]/g, '').slice(-4)
      : '2627';

    try {
      const res = await manager.query(
        `SELECT NEXTVAL('e_schooling.admission_number_seq') as seq;`,
      );
      const seqNum =
        res && res[0] ? res[0].seq : Date.now().toString().slice(-4);
      return `ADM-${yearSuffix || '2627'}-${String(seqNum).padStart(4, '0')}`;
    } catch {
      const count = await manager
        .getRepository(Student)
        .count({ where: { schoolId } });
      return `ADM-${yearSuffix || '2627'}-${String(count + 1).padStart(4, '0')}`;
    }
  }

  private async generateRollNumber(
    schoolId: string,
    academicSessionId: string,
    classId: string,
    sectionId: string,
    customRoll?: string,
    queryRunner?: any,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;
    if (customRoll && customRoll.trim()) {
      const cleanRoll = customRoll.trim();
      const parsed = parseInt(cleanRoll, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new BadRequestException(
          'Roll Number must be a positive integer.',
        );
      }
      const existing = await manager.getRepository(StudentEnrollment).findOne({
        where: {
          schoolId,
          academicSessionId,
          classId,
          sectionId,
          rollNumber: String(parsed),
          isCurrent: true,
          isDeleted: false,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Roll Number ${parsed} is already assigned to another active student in this class and section.`,
        );
      }
      return String(parsed);
    }

    const result = await manager.query(
      `SELECT MAX(CAST(roll_number AS INTEGER)) as max_roll 
       FROM e_schooling.student_enrollments 
       WHERE school_id = $1 AND academic_session_id = $2 AND class_id = $3 AND section_id = $4 AND is_current = true AND is_delete = false AND roll_number ~ '^[0-9]+$'`,
      [schoolId, academicSessionId, classId, sectionId],
    );
    const nextRoll =
      result && result[0] && result[0].max_roll
        ? parseInt(result[0].max_roll, 10) + 1
        : 1;
    return String(nextRoll);
  }

  /* ────────────────────────────────────────────────────
     ADMIT STUDENT
  ──────────────────────────────────────────────────── */
  async admitStudent(
    caller: AuthContext,
    schoolId: string,
    dto: StudentAdmissionDto,
  ) {
    const school = await this.assertOwnership(caller.id, schoolId);

    if (!dto.academicSessionId) {
      const activeSession = await this.dataSource
        .getRepository(AcademicSession)
        .findOne({
          where: { schoolId, isCurrent: true, isDeleted: false },
        });
      if (!activeSession) {
        throw new NotFoundException(
          'No active academic session found in the database. Please create a session first.',
        );
      }
      dto.academicSessionId = activeSession.id;
    }

    // Check subscription quota
    const subRepo = this.dataSource.getRepository(SchoolSubscription);
    const subscription = await subRepo.findOne({
      where: { schoolId },
      relations: ['subscriptionPlan'],
    });
    if (!subscription)
      throw new BadRequestException(
        'No active subscription found for this school branch.',
      );

    let allowedLimit: number | null =
      subscription.subscriptionPlan?.maxStudents || null;
    if (allowedLimit !== null) {
      const overrideRepo = this.dataSource.getRepository(SchoolFeatureOverride);
      const studentFeature = await this.dataSource
        .getRepository(PlatformFeature)
        .findOne({ where: { code: 'STUDENT_MANAGEMENT' } });
      if (studentFeature) {
        const now = new Date();
        const activeOverrides = await overrideRepo.find({
          where: {
            schoolId,
            platformFeatureId: studentFeature.id,
            overrideType: OverrideTypeEnum.CUSTOM_LIMIT,
            isActive: true,
            isDeleted: false,
          },
        });
        for (const o of activeOverrides) {
          const started = !o.startDate || o.startDate <= now;
          const unexpired = !o.endDate || o.endDate >= now;
          if (started && unexpired && o.limitValue)
            allowedLimit += parseInt(o.limitValue, 10);
        }
      }
    }
    if (allowedLimit !== null) {
      const studentCount = await this.dataSource
        .getRepository(Student)
        .count({ where: { schoolId, isDeleted: false } });
      if (studentCount >= allowedLimit) {
        throw new BadRequestException(
          `Student admission capacity exceeded (${studentCount}/${allowedLimit}). Please upgrade your subscription plan.`,
        );
      }
    }

    // Validate academic references safely
    let targetClass: Class | null = null;
    if (dto.classId && !isNaN(Number(dto.classId))) {
      targetClass = await this.dataSource
        .getRepository(Class)
        .findOne({ where: { id: dto.classId, schoolId, isDeleted: false } });
    }
    if (!targetClass) {
      targetClass = await this.dataSource.getRepository(Class).findOne({
        where: { schoolId, isDeleted: false },
        order: { createdAt: 'ASC' },
      });
    }
    if (!targetClass)
      throw new NotFoundException('Class not found for this school');
    dto.classId = targetClass.id;

    let targetSection: Section | null = null;
    if (dto.sectionId && !isNaN(Number(dto.sectionId))) {
      targetSection = await this.dataSource
        .getRepository(Section)
        .findOne({ where: { id: dto.sectionId, schoolId, isDeleted: false } });
    }
    if (!targetSection) {
      targetSection = await this.dataSource.getRepository(Section).findOne({
        where: { classId: targetClass.id, schoolId, isDeleted: false },
        order: { createdAt: 'ASC' },
      });
    }
    if (!targetSection)
      throw new NotFoundException('Section not found for this class');
    dto.sectionId = targetSection.id;

    let targetSession: AcademicSession | null = null;
    if (
      dto.academicSessionId &&
      dto.academicSessionId !== 'sess-current' &&
      dto.academicSessionId !== 'current' &&
      dto.academicSessionId !== 'active' &&
      !isNaN(Number(dto.academicSessionId))
    ) {
      targetSession = await this.dataSource
        .getRepository(AcademicSession)
        .findOne({
          where: { id: dto.academicSessionId, schoolId, isDeleted: false },
        });
    }
    if (!targetSession) {
      const sessionRepo = this.dataSource.getRepository(AcademicSession);
      targetSession = await sessionRepo.findOne({
        where: { schoolId, isCurrent: true, isDeleted: false },
      });
      if (!targetSession) {
        targetSession = await sessionRepo.findOne({
          where: { schoolId, isDeleted: false },
          order: { createdAt: 'DESC' },
        });
      }
      if (!targetSession) {
        const newSession = sessionRepo.create({
          schoolId,
          name: '2025-2026',
          startDate: '2025-04-01',
          endDate: '2026-03-31',
          isCurrent: true,
          isActive: true,
        });
        targetSession = await sessionRepo.save(newSession);
      }
    }
    dto.academicSessionId = targetSession.id;

    let targetRoleId: string | undefined = undefined;
    if (dto.roleId && !isNaN(Number(dto.roleId))) {
      const targetRole = await this.dataSource
        .getRepository(SchoolRole)
        .findOne({ where: { id: dto.roleId, schoolId } });
      if (targetRole) {
        targetRoleId = targetRole.id;
      }
    }
    if (!targetRoleId) {
      const roleRepo = this.dataSource.getRepository(SchoolRole);
      const studentRole = await roleRepo.findOne({
        where: [
          { schoolId, name: 'Student' },
          { schoolId, name: 'student' },
        ],
      });
      if (studentRole) {
        targetRoleId = studentRole.id;
      } else {
        const anyRole = await roleRepo.findOne({ where: { schoolId } });
        if (anyRole) targetRoleId = anyRole.id;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { firstName, middleName, lastName, fullName } =
        this.normalizeNameParts(dto.firstName, dto.middleName, dto.lastName);

      if (!firstName || firstName.length < 2) {
        throw new BadRequestException(
          'First Name is required and must be at least 2 characters.',
        );
      }

      const studentCode = await this.generateStudentCode(
        schoolId,
        dto.studentCode,
        queryRunner,
      );
      const admissionNumber = await this.generateAdmissionNumber(
        schoolId,
        dto.academicSessionId,
        dto.admissionNumber,
        queryRunner,
      );
      const rollNumber = await this.generateRollNumber(
        schoolId,
        dto.academicSessionId,
        dto.classId,
        dto.sectionId,
        dto.rollNumber,
        queryRunner,
      );

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.dob, salt);

      const student = new Student();
      student.schoolId = schoolId;
      // Personal & Name structure
      student.firstName = firstName;
      student.middleName = middleName || '';
      student.lastName = lastName || '';
      student.fullName = fullName;
      student.gender = dto.gender;
      student.dob = dto.dob;
      if (dto.bloodGroup) student.bloodGroup = dto.bloodGroup;
      if (dto.religion) student.religion = dto.religion;
      if (dto.religionId) student.religionId = dto.religionId;
      if (dto.category) student.category = dto.category;
      if (dto.casteCategoryId) student.casteCategoryId = dto.casteCategoryId;
      if (dto.nationality) student.nationality = dto.nationality;
      if (dto.aadhaarNumber) student.aadhaarNumber = dto.aadhaarNumber.trim();
      if (dto.identityDocumentTypeId)
        student.identityDocumentTypeId = dto.identityDocumentTypeId;
      if (dto.identityDocumentNumber)
        student.identityDocumentNumber = dto.identityDocumentNumber.trim();
      // Contact
      if (dto.phone) student.phone = dto.phone;
      if (dto.mobile) student.mobile = dto.mobile.trim();
      if (dto.alternateMobile) student.alternateMobile = dto.alternateMobile;
      if (dto.email) student.email = dto.email.trim();
      // Address
      if (dto.address) student.address = dto.address;
      if (dto.village) student.village = dto.village;
      if (dto.district) student.district = dto.district;
      if (dto.state) student.state = dto.state;
      if (dto.pincode) student.pincode = dto.pincode;
      // Parent (legacy)
      if (dto.parentName) student.parentName = dto.parentName;
      if (dto.parentPhone) student.parentPhone = dto.parentPhone;
      // Father
      if (dto.fatherName) student.fatherName = dto.fatherName;
      if (dto.fatherOccupation) student.fatherOccupation = dto.fatherOccupation;
      if (dto.fatherMobile) student.fatherMobile = dto.fatherMobile;
      if (dto.fatherEmail) student.fatherEmail = dto.fatherEmail;
      if (dto.fatherAadhaar) student.fatherAadhaar = dto.fatherAadhaar;
      // Mother
      if (dto.motherName) student.motherName = dto.motherName;
      if (dto.motherOccupation) student.motherOccupation = dto.motherOccupation;
      if (dto.motherMobile) student.motherMobile = dto.motherMobile;
      if (dto.motherEmail) student.motherEmail = dto.motherEmail;
      if (dto.motherAadhaar) student.motherAadhaar = dto.motherAadhaar;
      // Guardian
      if (dto.guardianName) student.guardianName = dto.guardianName;
      if (dto.guardianRelation) student.guardianRelation = dto.guardianRelation;
      if (dto.guardianMobile) student.guardianMobile = dto.guardianMobile;
      if (dto.guardianEmail) student.guardianEmail = dto.guardianEmail;
      // Emergency
      if (dto.emergencyContactName)
        student.emergencyContactName = dto.emergencyContactName;
      if (dto.emergencyContactPhone)
        student.emergencyContactPhone = dto.emergencyContactPhone;
      if (dto.emergencyContactRelation)
        student.emergencyContactRelation = dto.emergencyContactRelation;
      // Medical
      if (dto.medicalCondition) student.medicalCondition = dto.medicalCondition;
      if (dto.allergies) student.allergies = dto.allergies;
      if (dto.disability) student.disability = dto.disability;
      if (dto.doctorName) student.doctorName = dto.doctorName;
      if (dto.doctorPhone) student.doctorPhone = dto.doctorPhone;
      // Admission
      if (dto.admissionDate) student.admissionDate = dto.admissionDate;
      if (dto.joiningDate) student.joiningDate = dto.joiningDate;
      if (dto.admissionType) student.admissionType = dto.admissionType;
      if (dto.previousSchool) student.previousSchool = dto.previousSchool;
      if (dto.profilePicUrl) student.profilePicUrl = dto.profilePicUrl;
      student.admissionNumber = admissionNumber;
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
      enrollment.rollNumber = rollNumber;
      enrollment.enrollmentType = EnrollmentTypeEnum.ADMISSION;
      enrollment.enrollmentState = EnrollmentStatusEnum.ACTIVE;
      enrollment.isCurrent = true;
      enrollment.createdById = caller.id;

      await queryRunner.manager.save(enrollment);

      if (targetRoleId) {
        const userRole = new SchoolUserRole();
        userRole.userId = savedStudent.id;
        userRole.roleId = targetRoleId;
        userRole.createdById = caller.id;
        userRole.userType = 'student';
        await queryRunner.manager.save(userRole);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Student admitted successfully',
        student: {
          id: savedStudent.id,
          studentCode: savedStudent.studentCode,
          firstName: savedStudent.firstName,
          middleName: savedStudent.middleName,
          lastName: savedStudent.lastName,
          fullName: savedStudent.fullName,
          admissionNumber: savedStudent.admissionNumber,
          rollNumber,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* ────────────────────────────────────────────────────
     GET ALL STUDENTS (paginated)
  ──────────────────────────────────────────────────── */
  async getStudents(
    caller: AuthContext,
    schoolId: string,
    query: {
      classId?: string;
      sectionId?: string;
      academicSessionId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
    if (!membership && caller.actorType === 'school_owner')
      throw new ForbiddenException(
        'You do not have permission to view students of this school',
      );
    else if (
      caller.actorType === 'school_user' &&
      String(caller.schoolId) !== String(schoolId)
    )
      throw new ForbiddenException('You do not belong to this school');

    const studentRepo = this.dataSource.getRepository(Student);
    const enrollmentRepo = this.dataSource.getRepository(StudentEnrollment);

    const page = query.page ? Math.max(1, parseInt(String(query.page), 10)) : 1;
    const limit = query.limit
      ? Math.max(1, parseInt(String(query.limit), 10))
      : 10;
    const skip = (page - 1) * limit;

    const queryBuilder = studentRepo
      .createQueryBuilder('student')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.is_delete = :isDeleted', { isDeleted: false });

    if (query.classId || query.sectionId || query.academicSessionId) {
      queryBuilder.innerJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.student_id = student.id AND enrollment.is_current = :isCurrent AND enrollment.is_delete = :enrollmentDeleted',
        { isCurrent: true, enrollmentDeleted: false },
      );
      if (query.classId)
        queryBuilder.andWhere('enrollment.class_id = :classId', {
          classId: query.classId,
        });
      if (query.sectionId)
        queryBuilder.andWhere('enrollment.section_id = :sectionId', {
          sectionId: query.sectionId,
        });
      if (query.academicSessionId)
        queryBuilder.andWhere(
          'enrollment.academic_session_id = :academicSessionId',
          { academicSessionId: query.academicSessionId },
        );
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      queryBuilder.andWhere(
        '(LOWER(student.firstName) LIKE LOWER(:searchTerm) OR LOWER(student.lastName) LIKE LOWER(:searchTerm) OR LOWER(student.admissionNumber) LIKE LOWER(:searchTerm) OR LOWER(student.studentCode) LIKE LOWER(:searchTerm))',
        { searchTerm },
      );
    }

    const total = await queryBuilder.getCount();
    const students = await queryBuilder
      .orderBy('student.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const studentIds = students.map((s) => s.id);
    const enrollments =
      studentIds.length > 0
        ? await enrollmentRepo.find({
            where: {
              studentId: In(studentIds),
              schoolId,
              isCurrent: true,
              isDeleted: false,
            },
          })
        : [];
    const classes =
      studentIds.length > 0
        ? await this.dataSource
            .getRepository(Class)
            .find({ where: { schoolId, isDeleted: false } })
        : [];
    const sections =
      studentIds.length > 0
        ? await this.dataSource
            .getRepository(Section)
            .find({ where: { schoolId, isDeleted: false } })
        : [];

    const data = students.map((student) => {
      const e = enrollments.find((env) => env.studentId === student.id);
      const cls = e
        ? classes.find((c) => String(c.id) === String(e.classId))
        : null;
      const sec = e
        ? sections.find((s) => String(s.id) === String(e.sectionId))
        : null;
      const maskDoc = (num?: string) =>
        num && num.length >= 4 ? `XXXX XXXX ${num.slice(-4)}` : num || null;

      const rawFull =
        student.fullName ||
        [student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(' ');

      return {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        middleName: student.middleName || null,
        lastName: student.lastName || null,
        fullName: rawFull,
        gender: student.gender,
        dob: student.dob,
        phone: student.phone,
        mobile: student.mobile || student.phone,
        email: student.email,
        religion: student.religion || null,
        religionId: student.religionId || null,
        category: student.category || null,
        casteCategoryId: student.casteCategoryId || null,
        identityDocumentTypeId: student.identityDocumentTypeId || null,
        identityDocumentNumber: maskDoc(student.identityDocumentNumber),
        aadhaarNumber: maskDoc(student.aadhaarNumber),
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        fatherName: student.fatherName,
        motherName: student.motherName,
        address: student.address,
        admissionNumber: student.admissionNumber,
        profilePicUrl: student.profilePicUrl,
        isActive: student.isActive,
        status: student.isActive ? 'ACTIVE' : 'INACTIVE',
        classId: e?.classId || null,
        className: cls?.name || null,
        sectionId: e?.sectionId || null,
        sectionName: sec?.name || null,
        rollNumber: e?.rollNumber || null,
        studentEnrollmentId: e?.id || null,
        academicSessionId: e?.academicSessionId || null,
      };
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ────────────────────────────────────────────────────
     GET STUDENT BY ID (full profile)
  ──────────────────────────────────────────────────── */
  async getStudentById(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
  ) {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
    if (!membership && caller.actorType === 'school_owner')
      throw new ForbiddenException(
        'You do not have permission to view students of this school',
      );
    else if (
      caller.actorType === 'school_user' &&
      String(caller.schoolId) !== String(schoolId)
    )
      throw new ForbiddenException('You do not belong to this school');

    const student = await this.dataSource
      .getRepository(Student)
      .findOne({ where: { id: studentId, schoolId, isDeleted: false } });
    if (!student) throw new NotFoundException('Student not found');

    let enrollment = await this.dataSource
      .getRepository(StudentEnrollment)
      .findOne({
        where: { studentId, schoolId, isCurrent: true, isDeleted: false },
      });
    if (!enrollment) {
      enrollment = await this.dataSource
        .getRepository(StudentEnrollment)
        .findOne({
          where: { studentId, schoolId, isDeleted: false },
          order: { createdAt: 'DESC' },
        });
    }

    const cls = enrollment?.classId
      ? await this.dataSource
          .getRepository(Class)
          .findOne({ where: { id: enrollment.classId } })
      : null;
    const sec = enrollment?.sectionId
      ? await this.dataSource
          .getRepository(Section)
          .findOne({ where: { id: enrollment.sectionId } })
      : null;

    const rawFull =
      student.fullName ||
      [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' ');

    return {
      id: student.id,
      studentCode: student.studentCode,
      // Personal
      firstName: student.firstName,
      middleName: student.middleName || null,
      lastName: student.lastName || null,
      fullName: rawFull,
      gender: student.gender,
      dob: student.dob,
      bloodGroup: student.bloodGroup || null,
      religion: student.religion || null,
      religionId: student.religionId || null,
      category: student.category || null,
      casteCategoryId: student.casteCategoryId || null,
      nationality: student.nationality || null,
      aadhaarNumber: student.aadhaarNumber || null,
      identityDocumentTypeId: student.identityDocumentTypeId || null,
      identityDocumentNumber: student.identityDocumentNumber || null,
      // Contact
      phone: student.phone || null,
      mobile: student.mobile || student.phone || null,
      alternateMobile: student.alternateMobile || null,
      email: student.email || null,
      // Address
      address: student.address || null,
      village: student.village || null,
      district: student.district || null,
      state: student.state || null,
      pincode: student.pincode || null,
      // Parent (legacy)
      parentName: student.parentName || null,
      parentPhone: student.parentPhone || null,
      // Father
      fatherName: student.fatherName || null,
      fatherOccupation: student.fatherOccupation || null,
      fatherMobile: student.fatherMobile || null,
      fatherEmail: student.fatherEmail || null,
      fatherAadhaar: student.fatherAadhaar || null,
      // Mother
      motherName: student.motherName || null,
      motherOccupation: student.motherOccupation || null,
      motherMobile: student.motherMobile || null,
      motherEmail: student.motherEmail || null,
      motherAadhaar: student.motherAadhaar || null,
      // Guardian
      guardianName: student.guardianName || null,
      guardianRelation: student.guardianRelation || null,
      guardianMobile: student.guardianMobile || null,
      guardianEmail: student.guardianEmail || null,
      // Emergency
      emergencyContactName: student.emergencyContactName || null,
      emergencyContactPhone: student.emergencyContactPhone || null,
      emergencyContactRelation: student.emergencyContactRelation || null,
      // Medical
      medicalCondition: student.medicalCondition || null,
      allergies: student.allergies || null,
      disability: student.disability || null,
      doctorName: student.doctorName || null,
      doctorPhone: student.doctorPhone || null,
      // Admission
      admissionNumber: student.admissionNumber,
      admissionDate: student.admissionDate || null,
      joiningDate: student.joiningDate || null,
      admissionType: student.admissionType || null,
      previousSchool: student.previousSchool || null,
      profilePicUrl: student.profilePicUrl || null,
      documents: Array.isArray(student.documents) ? student.documents : [],
      // Status
      isActive: student.isActive,
      status: student.isActive ? 'ACTIVE' : 'INACTIVE',
      // Enrollment
      classId: enrollment?.classId || null,
      className: cls?.name || null,
      sectionId: enrollment?.sectionId || null,
      sectionName: sec?.name || null,
      rollNumber: enrollment?.rollNumber || null,
      studentEnrollmentId: enrollment?.id || null,
      academicSessionId: enrollment?.academicSessionId || null,
      enrollmentType: enrollment?.enrollmentType || null,
      enrollmentState: enrollment?.enrollmentState || null,
      // Timestamps
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  /* ────────────────────────────────────────────────────
     UPDATE STUDENT
  ──────────────────────────────────────────────────── */
  async updateStudent(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
    dto: UpdateStudentDto,
  ) {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
    if (!membership && caller.actorType === 'school_owner')
      throw new ForbiddenException(
        'You do not have permission to update student records',
      );
    else if (
      caller.actorType === 'school_user' &&
      String(caller.schoolId) !== String(schoolId)
    )
      throw new ForbiddenException('You do not belong to this school');

    const student = await this.dataSource
      .getRepository(Student)
      .findOne({ where: { id: studentId, schoolId, isDeleted: false } });
    if (!student) throw new NotFoundException('Student not found');

    const studentFields: (keyof Student)[] = [
      'firstName',
      'middleName',
      'lastName',
      'gender',
      'dob',
      'bloodGroup',
      'religion',
      'religionId',
      'category',
      'casteCategoryId',
      'nationality',
      'aadhaarNumber',
      'identityDocumentTypeId',
      'identityDocumentNumber',
      'phone',
      'mobile',
      'alternateMobile',
      'email',
      'address',
      'village',
      'district',
      'state',
      'pincode',
      'parentName',
      'parentPhone',
      'fatherName',
      'fatherOccupation',
      'fatherMobile',
      'fatherEmail',
      'fatherAadhaar',
      'motherName',
      'motherOccupation',
      'motherMobile',
      'motherEmail',
      'motherAadhaar',
      'guardianName',
      'guardianRelation',
      'guardianMobile',
      'guardianEmail',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
      'medicalCondition',
      'allergies',
      'disability',
      'doctorName',
      'doctorPhone',
      'admissionNumber',
      'admissionDate',
      'joiningDate',
      'admissionType',
      'previousSchool',
      'profilePicUrl',
    ];

    for (const field of studentFields) {
      const value = dto[field as keyof UpdateStudentDto];
      if (value !== undefined) {
        Object.assign(student, { [field]: value });
      }
    }

    if (
      dto.firstName !== undefined ||
      dto.middleName !== undefined ||
      dto.lastName !== undefined
    ) {
      const { firstName, middleName, lastName, fullName } =
        this.normalizeNameParts(
          dto.firstName !== undefined ? dto.firstName : student.firstName,
          dto.middleName !== undefined ? dto.middleName : student.middleName,
          dto.lastName !== undefined ? dto.lastName : student.lastName,
        );
      student.firstName = firstName;
      student.middleName = middleName || '';
      student.lastName = lastName || '';
      student.fullName = fullName;
    }

    if (
      dto.studentCode !== undefined &&
      dto.studentCode.trim() !== student.studentCode
    ) {
      const cleanCode = dto.studentCode.trim().toUpperCase();
      const existing = await this.dataSource.getRepository(Student).findOne({
        where: { schoolId, studentCode: cleanCode, isDeleted: false },
      });
      if (existing && existing.id !== student.id) {
        throw new ConflictException(
          `Student Code "${cleanCode}" is already assigned to another student.`,
        );
      }
      student.studentCode = cleanCode;
    }

    if (dto.status) student.isActive = dto.status === 'ACTIVE';
    student.updatedById = caller.id;
    await this.dataSource.getRepository(Student).save(student);

    // rollNumber lives on the enrollment record
    if (dto.rollNumber !== undefined) {
      let enrollment = await this.dataSource
        .getRepository(StudentEnrollment)
        .findOne({
          where: { studentId, schoolId, isCurrent: true, isDeleted: false },
        });
      if (!enrollment) {
        enrollment = await this.dataSource
          .getRepository(StudentEnrollment)
          .findOne({
            where: { studentId, schoolId, isDeleted: false },
            order: { createdAt: 'DESC' },
          });
      }
      if (enrollment) {
        enrollment.isCurrent = true;
        enrollment.rollNumber = dto.rollNumber;
        await this.dataSource.getRepository(StudentEnrollment).save(enrollment);
      }
    }

    return this.getStudentById(caller, schoolId, studentId);
  }

  /* ────────────────────────────────────────────────────
     UPDATE PHOTO
  ──────────────────────────────────────────────────── */
  async updateStudentPhoto(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
    profilePicUrl: string,
  ) {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
    if (!membership && caller.actorType === 'school_owner')
      throw new ForbiddenException(
        'You do not have permission to update student photo',
      );
    else if (
      caller.actorType === 'school_user' &&
      String(caller.schoolId) !== String(schoolId)
    )
      throw new ForbiddenException('You do not belong to this school');

    const student = await this.dataSource
      .getRepository(Student)
      .findOne({ where: { id: studentId, schoolId, isDeleted: false } });
    if (!student) throw new NotFoundException('Student not found');

    student.profilePicUrl = profilePicUrl;
    student.updatedById = caller.id;
    await this.dataSource.getRepository(Student).save(student);

    return {
      message: 'Student photo updated successfully',
      profilePicUrl: student.profilePicUrl,
      studentId: student.id,
    };
  }

  /* ────────────────────────────────────────────────────
     BULK PROGRESS STUDENTS (Batch Transactional)
  ──────────────────────────────────────────────────── */
  async bulkProgressStudents(
    caller: AuthContext,
    schoolId: string,
    dto: BulkProgressionDto,
  ) {
    await this.assertOwnership(caller.id, schoolId);

    const targetClass = await this.dataSource
      .getRepository(Class)
      .findOne({ where: { id: dto.targetClassId, schoolId } });
    if (!targetClass) throw new NotFoundException('Target class not found');
    const targetSection = await this.dataSource
      .getRepository(Section)
      .findOne({ where: { id: dto.targetSectionId, schoolId } });
    if (!targetSection) throw new NotFoundException('Target section not found');

    // Auto-resolve active academic session if not supplied
    let resolvedSessionId = dto.targetSessionId;
    if (!resolvedSessionId) {
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
        throw new NotFoundException(
          'No active academic session found in the database. Please create a session first.',
        );
      }
      resolvedSessionId = activeSession.id;
    } else {
      const targetSession = await this.dataSource
        .getRepository(AcademicSession)
        .findOne({ where: { id: resolvedSessionId, schoolId } });
      if (!targetSession)
        throw new NotFoundException('Target academic session not found');
    }

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
    } else throw new BadRequestException('Invalid action type');

    const processedStudentIds: string[] = [];

    // Process student movements in chunked transactions (Batch size = 200 students)
    await processInBatches<string>({
      items: dto.studentIds || [],
      batchSize: 200,
      dataSource: this.dataSource,
      processBatch: async (studentChunk, queryRunner) => {
        const enrollmentRepo =
          queryRunner.manager.getRepository(StudentEnrollment);
        const logRepo = queryRunner.manager.getRepository(PromotionLog);

        for (const studentId of studentChunk) {
          const currentEnrollment = await enrollmentRepo.findOne({
            where: { studentId, schoolId, isCurrent: true, isDeleted: false },
          });
          let previousEnrollmentId: string | undefined;

          if (currentEnrollment) {
            previousEnrollmentId = currentEnrollment.id;
            currentEnrollment.isCurrent = false;
            currentEnrollment.enrollmentState = oldEnrollmentState;
            currentEnrollment.endDate = new Date().toISOString().split('T')[0];
            currentEnrollment.updatedById = caller.id;
            await enrollmentRepo.save(currentEnrollment);
          }

          const newEnrollment = new StudentEnrollment();
          newEnrollment.schoolId = schoolId;
          newEnrollment.studentId = studentId;
          newEnrollment.academicSessionId = resolvedSessionId;
          newEnrollment.classId = dto.targetClassId;
          newEnrollment.sectionId = dto.targetSectionId;
          newEnrollment.enrollmentType = enrollmentType;
          newEnrollment.enrollmentState = EnrollmentStatusEnum.ACTIVE;
          newEnrollment.isCurrent = true;
          if (previousEnrollmentId)
            newEnrollment.previousEnrollmentId = previousEnrollmentId;
          newEnrollment.createdById = caller.id;
          newEnrollment.startDate = new Date().toISOString().split('T')[0];
          const savedNewEnrollment = await enrollmentRepo.save(newEnrollment);

          const log = new PromotionLog();
          log.schoolId = schoolId;
          log.studentId = studentId;
          if (previousEnrollmentId) log.fromEnrollmentId = previousEnrollmentId;
          log.toEnrollmentId = savedNewEnrollment.id;
          if (currentEnrollment?.classId)
            log.fromClassId = currentEnrollment.classId;
          if (currentEnrollment?.sectionId)
            log.fromSectionId = currentEnrollment.sectionId;
          log.toClassId = dto.targetClassId;
          log.toSectionId = dto.targetSectionId;
          log.actionType = dto.actionType;
          log.remarks =
            dto.remarks || `Bulk progression of type: ${dto.actionType}`;
          log.performedBy = caller.id;
          log.performedAt = new Date();
          log.isActive = true;
          log.isDeleted = false;
          await logRepo.save(log);

          processedStudentIds.push(studentId);
        }
      },
    });

    return {
      message: `Successfully processed ${processedStudentIds.length} student(s) for ${dto.actionType} in batch transactions.`,
      processedStudentIds,
    };
  }

  /* ────────────────────────────────────────────────────
     STUDENT DOCUMENTS
  ──────────────────────────────────────────────────── */
  async getStudentDocuments(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
  ) {
    const student = await this.dataSource.getRepository(Student).findOne({
      where: { id: studentId, schoolId, isDeleted: false },
    });
    if (!student) throw new NotFoundException('Student not found');
    return Array.isArray(student.documents)
      ? (student.documents as Record<string, unknown>[])
      : [];
  }

  async uploadStudentDocument(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
    dto: { file: string; type: string; name?: string; originalName?: string },
  ) {
    const studentRepo = this.dataSource.getRepository(Student);
    const student = await studentRepo.findOne({
      where: { id: studentId, schoolId, isDeleted: false },
    });
    if (!student) throw new NotFoundException('Student not found');

    const documents = Array.isArray(student.documents) ? student.documents : [];
    const fileName = dto.file
      ? dto.file.split('/').pop() || 'document.pdf'
      : 'document.pdf';
    const newDoc = {
      id: `doc-${Date.now()}`,
      fileUrl: dto.file,
      file: dto.file,
      url: dto.file,
      type: dto.type || 'OTHER',
      name: dto.name || dto.type || fileName,
      originalName: dto.originalName || fileName,
      uploadedAt: new Date().toISOString(),
      uploadedById: caller.id,
    };
    documents.push(newDoc);
    student.documents = documents;
    await studentRepo.save(student);
    return newDoc;
  }

  async deleteStudentDocument(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
    documentId: string,
  ) {
    const studentRepo = this.dataSource.getRepository(Student);
    const student = await studentRepo.findOne({
      where: { id: studentId, schoolId, isDeleted: false },
    });
    if (!student) throw new NotFoundException('Student not found');

    const documents = Array.isArray(student.documents) ? student.documents : [];
    student.documents = documents.filter(
      (doc: { id?: string }) => doc.id !== documentId,
    );
    await studentRepo.save(student);
    return { message: 'Document deleted successfully' };
  }

  /* ────────────────────────────────────────────────────
     ADMISSION ENQUIRIES & PIPELINE (DB OPERATED)
  ──────────────────────────────────────────────────── */
  async getEnquiries(schoolId: string) {
    const repo = this.dataSource.getRepository(AdmissionEnquiry);
    return repo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  async createEnquiry(schoolId: string, dto: CreateEnquiryDto) {
    const repo = this.dataSource.getRepository(AdmissionEnquiry);
    const count = await repo.count({ where: { schoolId } });
    const enquiryNo = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const enquiry = repo.create({
      schoolId,
      enquiryNo,
      studentName: dto.studentName || '',
      parentName: dto.parentName || '',
      contactNumber: dto.contactNumber || '',
      email: dto.email,
      targetClassId: dto.targetClassId || 'cls-1',
      targetClassName: dto.targetClassName || 'Class 9',
      gender: dto.gender || 'MALE',
      previousSchool: dto.previousSchool,
      source: dto.source || 'WALK_IN',
      stage: 'ENQUIRY',
      enquiryStatus: 'NEW',
      notes: dto.notes,
      assignedToStaffName: dto.assignedToStaffName || 'Admission Counselor',
    });

    return repo.save(enquiry);
  }

  async updateEnquiryStatus(
    schoolId: string,
    id: string,
    enquiryStatus: string,
  ) {
    const repo = this.dataSource.getRepository(AdmissionEnquiry);
    let enquiry: AdmissionEnquiry | null = null;
    if (id && !isNaN(Number(id))) {
      enquiry = await repo.findOne({ where: { id, schoolId } });
    }
    if (!enquiry && id) {
      enquiry = await repo.findOne({ where: { enquiryNo: id, schoolId } });
    }
    if (!enquiry)
      throw new NotFoundException('Admission Enquiry record not found');

    enquiry.enquiryStatus = enquiryStatus;
    if (enquiryStatus === 'CONVERTED') {
      enquiry.stage = 'ADMITTED';
    }
    return repo.save(enquiry);
  }

  async getApplications(schoolId: string) {
    const repo = this.dataSource.getRepository(AdmissionApplication);
    return repo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateApplicationStage(
    schoolId: string,
    id: string,
    stage: string,
    remarks?: string,
  ) {
    const repo = this.dataSource.getRepository(AdmissionApplication);
    let application: AdmissionApplication | null = null;
    if (id && !isNaN(Number(id))) {
      application = await repo.findOne({ where: { id, schoolId } });
    }
    if (!application && id) {
      application = await repo.findOne({
        where: { applicationNo: id, schoolId },
      });
    }
    if (!application)
      throw new NotFoundException('Admission Application record not found');

    application.stage = stage;
    if (remarks) application.approvalRemarks = remarks;
    if (stage === 'VERIFICATION') application.verificationStatus = 'VERIFIED';
    return repo.save(application);
  }

  async convertApplicationToStudent(
    caller: AuthContext,
    schoolId: string,
    applicationId: string,
    dto: Partial<StudentAdmissionDto> = {},
    queryAcademicSessionId?: string,
  ) {
    const appRepo = this.dataSource.getRepository(AdmissionApplication);
    const enqRepo = this.dataSource.getRepository(AdmissionEnquiry);

    let app: AdmissionApplication | null = null;
    let enq: AdmissionEnquiry | null = null;

    if (applicationId && !isNaN(Number(applicationId))) {
      app = await appRepo.findOne({
        where: { id: applicationId, schoolId },
      });
      if (!app) {
        enq = await enqRepo.findOne({ where: { id: applicationId, schoolId } });
      }
    }
    if (!app && !enq && applicationId) {
      app = await appRepo.findOne({
        where: { applicationNo: applicationId, schoolId },
      });
      if (!app) {
        enq = await enqRepo.findOne({
          where: { enquiryNo: applicationId, schoolId },
        });
      }
    }

    if (app) {
      if (app.convertedStudentId || app.stage === 'ADMITTED') {
        throw new ConflictException(
          'This admission application has already been converted to an admitted student.',
        );
      }
      if (app.enquiryId) {
        const linkedEnq = await enqRepo.findOne({
          where: { id: app.enquiryId, schoolId },
        });
        if (
          linkedEnq &&
          (linkedEnq.enquiryStatus === 'CONVERTED' ||
            linkedEnq.stage === 'ADMITTED')
        ) {
          throw new ConflictException(
            'The student enquiry associated with this application has already been admitted.',
          );
        }
        if (!enq) enq = linkedEnq;
      }
    }

    if (enq) {
      if (enq.enquiryStatus === 'CONVERTED' || enq.stage === 'ADMITTED') {
        throw new ConflictException(
          'This student enquiry lead has already been converted to an admitted student.',
        );
      }
      const linkedApp = await appRepo.findOne({
        where: { enquiryId: enq.id, schoolId },
      });
      if (
        linkedApp &&
        (linkedApp.convertedStudentId || linkedApp.stage === 'ADMITTED')
      ) {
        throw new ConflictException(
          'An application associated with this student enquiry has already been admitted.',
        );
      }
      if (!app) app = linkedApp;
    }

    const firstName =
      dto.firstName ||
      app?.firstName ||
      enq?.studentName?.split(' ')[0] ||
      'Admitted';
    const lastName =
      dto.lastName ||
      app?.lastName ||
      enq?.studentName?.split(' ').slice(1).join(' ') ||
      'Student';
    const fatherName =
      dto.fatherName || app?.fatherName || enq?.parentName || 'Parent';
    const fatherMobile =
      dto.fatherMobile ||
      app?.fatherPhone ||
      enq?.contactNumber ||
      '9876543210';
    const gender = dto.gender || app?.gender || enq?.gender || 'MALE';
    const classId =
      dto.classId || app?.targetClassId || enq?.targetClassId || '1';
    const sectionId = dto.sectionId || '1';

    const rawSessionId =
      queryAcademicSessionId &&
      queryAcademicSessionId !== 'sess-current' &&
      queryAcademicSessionId !== 'current' &&
      queryAcademicSessionId !== 'active' &&
      !isNaN(Number(queryAcademicSessionId))
        ? queryAcademicSessionId
        : dto.academicSessionId;

    const academicSessionId =
      rawSessionId &&
      rawSessionId !== 'sess-current' &&
      rawSessionId !== 'current' &&
      rawSessionId !== 'active' &&
      !isNaN(Number(rawSessionId))
        ? rawSessionId
        : undefined;

    const admitPayload: StudentAdmissionDto = {
      firstName,
      lastName,
      gender,
      dob: dto.dob || app?.dob || '2015-01-01',
      fatherName,
      fatherMobile,
      classId,
      sectionId,
      academicSessionId: academicSessionId!,
      roleId: dto.roleId || '10',
      admissionNumber:
        dto.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`,
      state: dto.state || 'Default State',
      district: dto.district || 'Default District',
      pincode: dto.pincode || '100001',
    };

    const admittedStudent = (await this.admitStudent(
      caller,
      schoolId,
      admitPayload,
    )) as { student?: { id?: string }; id?: string };

    const convertedStudentId = String(
      admittedStudent?.student?.id || admittedStudent?.id || Date.now(),
    );

    if (app) {
      app.stage = 'ADMITTED';
      app.verificationStatus = 'VERIFIED';
      app.convertedStudentId = convertedStudentId;
      await appRepo.save(app);
    }
    if (enq) {
      enq.stage = 'ADMITTED';
      enq.enquiryStatus = 'CONVERTED';
      await enqRepo.save(enq);
    }

    return admittedStudent;
  }
}
