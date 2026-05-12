import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { School } from '../../models/entities/school/school.entity';
import { SchoolMember } from '../../models/entities/school/school-member.entity';
import { SchoolOwnerRoleEnum, StatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolDto } from '../../interfaces/request/school/create-school.dto';
import { UpdateSchoolDto } from '../../interfaces/request/school/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private dataSource: DataSource) {}

  /**
   * Helper to generate unique internal school code based on school name.
   * Format: SCH-{FIRST_WORD}_{RANDOM_4_DIGITS}
   */
  private generateSchoolCode(schoolName: string): string {
    const firstWord = schoolName.trim().split(' ')[0].toUpperCase();
    const cleanWord = firstWord.replace(/[^A-Z]/g, '').substring(0, 5) || 'SCH';
    const randomNums = Math.floor(1000 + Math.random() * 9000);
    return `SCH-${cleanWord}_${randomNums}`;
  }

  /**
   * Verifies that the logged-in owner manages/owns the requested school.
   */
  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!membership) {
      throw new ForbiddenException('You do not have access to manage this school');
    }
  }

  /**
   * Create a new school post-login.
   * Generates internal/external codes based on school name and atomically attaches the owner.
   */
  async createSchool(caller: AuthContext, dto: CreateSchoolDto) {
    if (caller.actorType !== 'school_owner') {
      throw new ForbiddenException('Only registered school owners can create new schools');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const internalCode = this.generateSchoolCode(dto.schoolName);
      // Generate external code based on internal code if not manually specified
      const externalCode = dto.externalSchoolCode || `EXT-${internalCode.replace('SCH-', '')}`;

      // Verify code uniqueness just in case
      const existing = await queryRunner.manager.findOne(School, {
        where: { internalSchoolCode: internalCode },
      });
      if (existing) {
        throw new BadRequestException('School code collision. Please try submitting again.');
      }

      const school = new School();
      school.schoolName = dto.schoolName;
      school.internalSchoolCode = internalCode;
      school.externalSchoolCode = externalCode;
      school.email = dto.email;
      school.phone = dto.phone;
      school.logoUrl = dto.logoUrl ?? '';
      school.totalClasses = dto.totalClasses ?? 0;
      school.totalSections = dto.totalSections ?? 0;
      school.totalStudents = dto.totalStudents ?? 0;
      school.totalTeachers = dto.totalTeachers ?? 0;
      school.addressArea = dto.addressArea ?? '';
      school.addressLandmark = dto.addressLandmark ?? '';
      school.addressCity = dto.addressCity ?? '';
      school.addressDistrict = dto.addressDistrict ?? '';
      school.addressState = dto.addressState ?? '';
      school.addressPincode = dto.addressPincode ?? '';
      school.status = StatusEnum.ACTIVE;
      school.createdById = caller.id;

      const savedSchool = await queryRunner.manager.save(school);

      // Atomically link the calling school owner to this school as the primary owner
      const member = new SchoolMember();
      member.schoolId = savedSchool.id;
      member.schoolOwnerId = caller.id;
      member.role = SchoolOwnerRoleEnum.OWNER;
      member.isPrimaryOwner = true;
      member.status = StatusEnum.ACTIVE;
      member.createdById = caller.id;

      await queryRunner.manager.save(member);

      await queryRunner.commitTransaction();

      return {
        message: 'School created successfully',
        school: savedSchool,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update school details.
   */
  async updateSchool(caller: AuthContext, schoolId: string, dto: UpdateSchoolDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const schoolRepo = this.dataSource.getRepository(School);
    const school = await schoolRepo.findOne({ where: { id: schoolId } });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (dto.schoolName !== undefined) school.schoolName = dto.schoolName;
    if (dto.email !== undefined) school.email = dto.email;
    if (dto.phone !== undefined) school.phone = dto.phone;
    if (dto.logoUrl !== undefined) school.logoUrl = dto.logoUrl;
    if (dto.externalSchoolCode !== undefined) school.externalSchoolCode = dto.externalSchoolCode;
    if (dto.totalClasses !== undefined) school.totalClasses = dto.totalClasses;
    if (dto.totalSections !== undefined) school.totalSections = dto.totalSections;
    if (dto.totalStudents !== undefined) school.totalStudents = dto.totalStudents;
    if (dto.totalTeachers !== undefined) school.totalTeachers = dto.totalTeachers;
    if (dto.addressArea !== undefined) school.addressArea = dto.addressArea;
    if (dto.addressLandmark !== undefined) school.addressLandmark = dto.addressLandmark;
    if (dto.addressCity !== undefined) school.addressCity = dto.addressCity;
    if (dto.addressDistrict !== undefined) school.addressDistrict = dto.addressDistrict;
    if (dto.addressState !== undefined) school.addressState = dto.addressState;
    if (dto.addressPincode !== undefined) school.addressPincode = dto.addressPincode;

    school.updatedById = caller.id;

    const updatedSchool = await schoolRepo.save(school);

    return {
      message: 'School updated successfully',
      school: updatedSchool,
    };
  }

  /**
   * List all schools belonging to the logged-in owner.
   */
  async listSchools(caller: AuthContext) {
    // Find all school IDs the owner is a member of
    const memberships = await this.dataSource.getRepository(SchoolMember).find({
      where: { schoolOwnerId: caller.id, status: StatusEnum.ACTIVE },
      select: ['schoolId', 'isPrimaryOwner', 'createdAt'],
    });

    if (!memberships || memberships.length === 0) {
      return { schools: [] };
    }

    const schoolIds = memberships.map((m) => m.schoolId);

    const schools = await this.dataSource.getRepository(School).createQueryBuilder('school')
      .where('school.id IN (:...schoolIds)', { schoolIds })
      .orderBy('school.createdAt', 'DESC')
      .getMany();

    // Map ownership details
    const result = schools.map((school) => {
      const membership = memberships.find((m) => m.schoolId === school.id);
      return {
        ...school,
        isPrimaryOwner: membership?.isPrimaryOwner ?? false,
      };
    });

    return { schools: result };
  }

  /**
   * Get detail of a specific school.
   */
  async getSchool(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const school = await this.dataSource.getRepository(School).findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return { school };
  }
}

