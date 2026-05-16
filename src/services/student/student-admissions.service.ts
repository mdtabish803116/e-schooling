import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school_owner_members.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { Role } from '../../models/entities/rbac/role.entity';
import { StudentAdmissionDto } from '../../interfaces/request/student/student-admission.dto';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { EnrollmentStatusEnum, EnrollmentTypeEnum } from '../../models/enums/enums';

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

    // Validate class, section, session
    const targetClass = await this.dataSource.getRepository(Class).findOne({ where: { id: dto.classId, schoolId } });
    if (!targetClass) throw new NotFoundException('Class not found');

    const targetSection = await this.dataSource.getRepository(Section).findOne({ where: { id: dto.sectionId, schoolId } });
    if (!targetSection) throw new NotFoundException('Section not found');

    const targetSession = await this.dataSource.getRepository(AcademicSession).findOne({ where: { id: dto.academicSessionId, schoolId } });
    if (!targetSession) throw new NotFoundException('Academic session not found');

    const targetRole = await this.dataSource.getRepository(Role).findOne({ where: { id: dto.roleId, schoolId } });
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
}
