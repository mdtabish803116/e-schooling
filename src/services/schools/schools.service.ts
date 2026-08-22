import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, In, MoreThanOrEqual } from 'typeorm';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import {
  validateEmail,
  validateMobile,
} from '../../shared/utils/validation.utils';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import {
  SchoolOwnerRoleEnum,
  SubscriptionStatusEnum,
  OverrideTypeEnum,
  PlanCodeEnum,
} from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolDto } from '../../interfaces/request/school/create-school.dto';
import { UpdateSchoolDto } from '../../interfaces/request/school/update-school.dto';
import { SchoolAnalyticsQueryDto } from '../../interfaces/request/school/school-analytics.dto';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';

import { AcademicSession } from '../../models/entities/academic/academic-session.entity';

@Injectable()
export class SchoolsService {
  constructor(private dataSource: DataSource) {}

  /**
   * Helper to generate unique internal school code.
   */
  private async generateUniqueSchoolCode(schoolName: string): Promise<string> {
    const firstWord = schoolName.trim().split(' ')[0].toUpperCase();
    const cleanWord = firstWord.replace(/[^A-Z]/g, '').substring(0, 5) || 'SCH';

    let isUnique = false;
    let code = '';

    while (!isUnique) {
      const randomNums = Math.floor(1000 + Math.random() * 9000);
      code = `SCH-${cleanWord}_${randomNums}`;
      const existing = await this.dataSource
        .getRepository(School)
        .findOne({ where: { internalSchoolCode: code } });
      if (!existing) isUnique = true;
    }
    return code;
  }

  private async assertOwnershipOfSchool(
    ownerId: string,
    schoolId: string,
  ): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });
    if (!membership)
      throw new ForbiddenException(
        'You do not have access to manage this school',
      );
  }

  /**
   * Create a new school.
   * Note: Subscription must be initiated separately via SubscriptionsService.
   */
  async createSchool(caller: AuthContext, dto: CreateSchoolDto) {
    if (caller.actorType !== 'school_owner')
      throw new ForbiddenException(
        'Only registered school owners can create new schools',
      );

    const schoolName = dto.schoolName
      ? dto.schoolName.trim().replace(/\s{2,}/g, ' ')
      : '';
    const email = dto.email ? dto.email.trim().toLowerCase() : '';
    const phone = dto.phone ? dto.phone.trim() : '';

    if (!schoolName || schoolName.length < 3 || schoolName.length > 150) {
      throw new BadRequestException(
        'School name must be between 3 and 150 characters long.',
      );
    }

    if (!validateEmail(email))
      throw new BadRequestException(
        'Please enter a valid school email address.',
      );
    if (!validateMobile(phone))
      throw new BadRequestException(
        'Please enter a valid school phone number (10 to 15 digits).',
      );

    // Uniqueness check for school email
    const existingSchoolEmail = await this.dataSource
      .getRepository(School)
      .findOne({
        where: { email, isDeleted: false },
      });
    if (existingSchoolEmail) {
      throw new BadRequestException(
        'This school email address is already registered. Please use another email.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check duplicate school for this owner
      const ownerMemberships = await queryRunner.manager.find(
        SchoolOwnerMember,
        {
          where: { schoolOwnerId: caller.id, isDeleted: false },
        },
      );
      if (ownerMemberships.length > 0) {
        const schoolIds = ownerMemberships.map((m) => m.schoolId);
        const existingSchools = await queryRunner.manager.find(School, {
          where: { id: In(schoolIds), isDeleted: false },
        });
        const hasDuplicate = existingSchools.some(
          (s) => s.schoolName.trim().toLowerCase() === schoolName.toLowerCase(),
        );
        if (hasDuplicate) {
          throw new BadRequestException(
            'You already have an active school registered with this name.',
          );
        }
      }

      const internalCode = await this.generateUniqueSchoolCode(schoolName);

      const school = new School();
      school.schoolName = schoolName;
      school.email = email;
      school.phone = phone;
      school.internalSchoolCode = internalCode;
      school.externalSchoolCode = dto.externalSchoolCode
        ? dto.externalSchoolCode.trim()
        : null;
      school.logoUrl = dto.logoUrl ? dto.logoUrl.trim() : '';
      school.totalClasses = Number(dto.totalClasses) || 0;
      school.totalSections = Number(dto.totalSections) || 0;
      school.totalStudents = Number(dto.totalStudents) || 0;
      school.totalTeachers = Number(dto.totalTeachers) || 0;
      school.addressArea = dto.addressArea ? dto.addressArea.trim() : '';
      school.addressLandmark = dto.addressLandmark
        ? dto.addressLandmark.trim()
        : '';
      school.addressCity = dto.addressCity ? dto.addressCity.trim() : '';
      school.addressDistrict = dto.addressDistrict
        ? dto.addressDistrict.trim()
        : '';
      school.addressState = dto.addressState ? dto.addressState.trim() : '';
      school.addressPincode = dto.addressPincode
        ? dto.addressPincode.trim()
        : '';
      school.isActive = true;
      school.isDeleted = false;
      school.createdById = caller.id;

      const savedSchool = await queryRunner.manager.save(school);

      // Create owner membership
      const member = new SchoolOwnerMember();
      member.schoolId = savedSchool.id;
      member.schoolOwnerId = caller.id;
      member.role = SchoolOwnerRoleEnum.OWNER;
      member.isPrimaryOwner = true;
      member.isActive = true;
      member.createdById = caller.id;
      await queryRunner.manager.save(member);

      // Auto-create initial active academic session (e.g. 2026-2027)
      const currentYear = new Date().getFullYear();
      const initialSession = new AcademicSession();
      initialSession.schoolId = savedSchool.id;
      initialSession.name = `${currentYear}-${currentYear + 1}`;
      initialSession.startDate = `${currentYear}-04-01`;
      initialSession.endDate = `${currentYear + 1}-03-31`;
      initialSession.isCurrent = true;
      initialSession.isActive = true;
      initialSession.isDeleted = false;
      initialSession.createdById = caller.id;
      await queryRunner.manager.save(initialSession);

      await queryRunner.commitTransaction();

      return {
        message: 'School registered successfully.',
        school: savedSchool,
        initialSession,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateSchool(
    caller: AuthContext,
    schoolId: string,
    dto: UpdateSchoolDto,
  ) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);
    const schoolRepo = this.dataSource.getRepository(School);
    const school = await schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    if (dto.schoolName !== undefined) {
      const schoolName = dto.schoolName.trim().replace(/[<>]/g, '');
      if (schoolName.length < 3 || schoolName.length > 100) {
        throw new BadRequestException(
          'School name must be between 3 and 100 characters long.',
        );
      }
      if (/\s{2,}/.test(dto.schoolName)) {
        throw new BadRequestException(
          'Multiple consecutive spaces are not allowed in school name.',
        );
      }
      dto.schoolName = schoolName;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase().replace(/[<>]/g, '');
      if (!validateEmail(email))
        throw new BadRequestException(
          'Please enter a valid school email address.',
        );
      const existing = await schoolRepo.findOne({ where: { email } });
      if (existing && existing.id !== schoolId) {
        throw new BadRequestException(
          'This school email address is already registered to another school.',
        );
      }
      dto.email = email;
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim().replace(/[<>]/g, '');
      if (!validateMobile(phone))
        throw new BadRequestException(
          'Please enter a valid school phone number (10 to 15 digits).',
        );
      dto.phone = phone;
    }

    Object.assign(school, dto);
    school.updatedById = caller.id;
    const updatedSchool = await schoolRepo.save(school);

    return { message: 'School updated successfully', school: updatedSchool };
  }

  async listSchools(caller: AuthContext) {
    const memberships = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .find({
        where: { schoolOwnerId: caller.id, isActive: true },
      });
    if (!memberships.length) return { schools: [] };

    const schoolIds = memberships.map((m) => m.schoolId);
    const schools = await this.dataSource.getRepository(School).find({
      where: { id: In(schoolIds) },
      order: { createdAt: 'DESC' },
    });

    const enrichedSchools = await Promise.all(
      schools.map(async (s) => {
        // 1. Fetch active academic session for current active academic year
        const activeSession = await this.dataSource
          .getRepository(AcademicSession)
          .findOne({
            where: [
              { schoolId: s.id, isCurrent: true, isActive: true, isDeleted: false },
              { schoolId: s.id, isActive: true, isDeleted: false },
            ],
            order: { startDate: 'DESC' },
          });

        // 2. Count live active students for current active academic year
        let totalStudents = 0;
        if (activeSession) {
          totalStudents = await this.dataSource
            .getRepository(StudentEnrollment)
            .count({
              where: {
                schoolId: s.id,
                academicSessionId: activeSession.id,
                isActive: true,
                isDeleted: false,
              },
            });
        } else {
          totalStudents = await this.dataSource
            .getRepository(Student)
            .count({
              where: { schoolId: s.id, isActive: true, isDeleted: false },
            });
        }

        // 3. Count live active staff (schoolUsers table)
        const totalStaff = await this.dataSource
          .getRepository(SchoolUser)
          .count({
            where: { schoolId: s.id, isActive: true, isDeleted: false },
          });

        // 4. Count live active classes (class table)
        const totalClasses = await this.dataSource
          .getRepository(Class)
          .count({
            where: { schoolId: s.id, isActive: true, isDeleted: false },
          });

        return {
          ...s,
          session: activeSession ? activeSession.name : undefined,
          totalStudents: Number(totalStudents),
          totalTeachers: Number(totalStaff),
          totalClasses: Number(totalClasses),
          isPrimaryOwner:
            memberships.find((m) => m.schoolId === s.id)?.isPrimaryOwner ?? false,
        };
      }),
    );

    return {
      schools: enrichedSchools,
    };
  }

  async getSchool(caller: AuthContext, schoolId: string) {
    if (caller.actorType === 'school_owner') {
      await this.assertOwnershipOfSchool(caller.id, schoolId);
    } else if (
      caller.actorType === 'school_user' ||
      caller.actorType === 'student'
    ) {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException('Access denied to school details');
      }
    }
    const school = await this.dataSource
      .getRepository(School)
      .findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    // 1. Fetch active academic session for current active academic year
    const activeSession = await this.dataSource
      .getRepository(AcademicSession)
      .findOne({
        where: [
          { schoolId: school.id, isCurrent: true, isActive: true, isDeleted: false },
          { schoolId: school.id, isActive: true, isDeleted: false },
        ],
        order: { startDate: 'DESC' },
      });

    // 2. Count live active students for current active academic year
    let totalStudents = 0;
    if (activeSession) {
      totalStudents = await this.dataSource
        .getRepository(StudentEnrollment)
        .count({
          where: {
            schoolId: school.id,
            academicSessionId: activeSession.id,
            isActive: true,
            isDeleted: false,
          },
        });
    } else {
      totalStudents = await this.dataSource
        .getRepository(Student)
        .count({
          where: { schoolId: school.id, isActive: true, isDeleted: false },
        });
    }

    // 3. Count live active staff (schoolUsers table)
    const totalStaff = await this.dataSource
      .getRepository(SchoolUser)
      .count({
        where: { schoolId: school.id, isActive: true, isDeleted: false },
      });

    // 4. Count live active classes (class table)
    const totalClasses = await this.dataSource
      .getRepository(Class)
      .count({
        where: { schoolId: school.id, isActive: true, isDeleted: false },
      });

    // 5. Count live active sections (section table)
    const totalSections = await this.dataSource
      .getRepository(Section)
      .count({
        where: { schoolId: school.id, isActive: true, isDeleted: false },
      });

    return {
      school: {
        ...school,
        session: activeSession ? activeSession.name : undefined,
        academicSessionId: activeSession ? activeSession.id : undefined,
        totalStudents: Number(totalStudents),
        totalTeachers: Number(totalStaff),
        totalClasses: Number(totalClasses),
        totalSections: Number(totalSections),
      },
    };
  }

  /**
   * Optimized Master Context API.
   * Uses bulk-fetching to prevent N+1 query performance issues.
   */
  async getOwnerMasterContext(caller: AuthContext) {
    const memberships = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .find({
        where: { schoolOwnerId: caller.id, isActive: true },
      });
    if (!memberships.length) return { schools: [] };

    const schoolIds = memberships.map((m) => m.schoolId);

    // 1. Bulk fetch all primary school assets and platform features in parallel
    const [
      schools,
      subscriptions,
      roles,
      modules,
      features,
      planFeatureMappings,
      overrides,
    ] = await Promise.all([
      this.dataSource
        .getRepository(School)
        .find({ where: { id: In(schoolIds) } }),
      this.dataSource.getRepository(SchoolSubscription).find({
        where: { schoolId: In(schoolIds) },
        relations: ['subscriptionPlan'],
      }),
      this.dataSource.getRepository(SchoolRole).find({
        where: { schoolId: In(schoolIds), isActive: true, isDeleted: false },
      }),
      this.dataSource
        .getRepository(ModuleMaster)
        .find({ where: { isActive: true }, order: { displayOrder: 'ASC' } }),
      this.dataSource
        .getRepository(PlatformFeature)
        .find({ where: { isActive: true } }),
      this.dataSource
        .getRepository(SubscriptionPlanPlatformFeatureMapping)
        .find({ where: { isActive: true, isEnabled: true } }),
      this.dataSource.getRepository(SchoolFeatureOverride).find({
        where: { schoolId: In(schoolIds), isActive: true, isDeleted: false },
      }),
    ]);

    // 2. Bulk fetch all role permissions
    const roleIds = roles.map((r) => r.id);
    const rolePermissionMap: Record<string, any[]> = {};

    if (roleIds.length > 0) {
      const permissions = await this.dataSource
        .getRepository(SchoolRolePermission)
        .createQueryBuilder('rp')
        .innerJoinAndSelect(
          ModuleOperationPermission,
          'p',
          'p.id = rp.permission_id',
        )
        .select([
          'rp.role_id as role_id',
          'p.id as p_id',
          'p.description as p_desc',
        ])
        .where('rp.role_id IN (:...roleIds)', { roleIds })
        .andWhere('rp.isActive = true')
        .getRawMany();

      permissions.forEach((p) => {
        if (!rolePermissionMap[p.role_id]) rolePermissionMap[p.role_id] = [];
        rolePermissionMap[p.role_id].push({
          id: p.p_id,
          description: p.p_desc,
        });
      });
    }

    // 3. Aggregate results in memory with dynamic entitlement checks and real-time expiry validation
    const results = schools.map((school) => {
      const schoolSub = subscriptions.find((s) => s.schoolId === school.id);
      const schoolRoles = roles.filter((r) => r.schoolId === school.id);

      let isExpired = true;
      let isTrialExpired = false;
      let canAccessTrial = true;

      const now = new Date();

      if (schoolSub) {
        canAccessTrial = false; // Already utilized their trial or subscription choice
        if (schoolSub.subscriptionState === SubscriptionStatusEnum.TRIAL) {
          const hasExpired = schoolSub.trialEndAt && schoolSub.trialEndAt < now;
          isExpired = !!hasExpired;
          isTrialExpired = !!hasExpired;
        } else if (
          schoolSub.subscriptionState === SubscriptionStatusEnum.ACTIVE
        ) {
          const hasExpired =
            schoolSub.currentPeriodEnd && schoolSub.currentPeriodEnd < now;
          isExpired = !!hasExpired;
        } else {
          isExpired = true; // EXPIRED, CANCELLED, etc.
        }
      }

      // Compute which PlatformFeatures are allowed for this school branch
      const allowedFeatureIds = new Set<string>();

      if (!isExpired && schoolSub) {
        // Find baseline features for this plan
        const planMappings = planFeatureMappings.filter(
          (m) => m.subscriptionPlanId === schoolSub.subscriptionPlanId,
        );
        const planFeatureIds = new Set(
          planMappings.map((m) => m.platformFeatureId),
        );

        // Filter overrides for this school
        const schoolOverrides = overrides.filter(
          (o) => o.schoolId === school.id,
        );

        features.forEach((f) => {
          // Find if there is an active override for this feature code
          const activeOverride = schoolOverrides
            .filter(
              (o) =>
                o.platformFeatureId === f.id &&
                (!o.startDate || o.startDate <= now) &&
                (!o.endDate || o.endDate >= now),
            )
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

          if (activeOverride) {
            if (
              activeOverride.overrideType !== OverrideTypeEnum.DISABLE &&
              activeOverride.isEnabled
            ) {
              allowedFeatureIds.add(f.id);
            }
          } else {
            if (planFeatureIds.has(f.id)) {
              allowedFeatureIds.add(f.id);
            }
          }
        });
      }

      // Filter sidebarModules based on calculated allowed feature IDs
      const filteredModules = isExpired
        ? []
        : modules.filter((module) => {
            if (!module.platformFeatureId) {
              return true; // Free module (e.g. Dashboard)
            }
            return allowedFeatureIds.has(module.platformFeatureId);
          });

      return {
        id: school.id,
        name: school.schoolName,
        code: school.internalSchoolCode,
        email: school.email,
        phone: school.phone,
        isPrimaryOwner:
          memberships.find((m) => m.schoolId === school.id)?.isPrimaryOwner ??
          false,
        subscription: schoolSub
          ? {
              planId: schoolSub.subscriptionPlanId,
              planName: schoolSub.subscriptionPlan?.name,
              planCode: schoolSub.subscriptionPlan?.code,
              status: schoolSub.subscriptionState,
              expiryDate:
                schoolSub.subscriptionState === SubscriptionStatusEnum.TRIAL
                  ? schoolSub.trialEndAt
                  : schoolSub.currentPeriodEnd,
              isExpired,
              isTrialExpired,
              canAccessTrial,
            }
          : {
              planId: null,
              planName: null,
              planCode: null,
              status: null,
              expiryDate: null,
              isExpired: true,
              isTrialExpired: false,
              canAccessTrial: true,
            },
        roles: schoolRoles.map((r) => ({
          id: r.id,
          name: r.name,
          permissions: rolePermissionMap[r.id] || [],
        })),
        sidebarModules: filteredModules,
      };
    });

    return { schools: results };
  }

  /**
   * Get single school master context details.
   */
  async getSingleSchoolMasterContext(caller: AuthContext, schoolId: string) {
    let member: SchoolOwnerMember | null = null;
    // 1. Verify access
    if (caller.actorType === 'school_owner') {
      member = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
        where: { schoolOwnerId: caller.id, schoolId, isActive: true },
      });
      if (!member) {
        throw new ForbiddenException(
          'School context not found or access denied',
        );
      }
    } else if (
      caller.actorType === 'school_user' ||
      caller.actorType === 'student'
    ) {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException('Access denied to school details');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }

    // 2. Fetch all primary assets for this school and platform features in parallel
    const [
      school,
      subscriptions,
      roles,
      modules,
      features,
      planFeatureMappings,
      overrides,
    ] = await Promise.all([
      this.dataSource
        .getRepository(School)
        .findOne({ where: { id: schoolId } }),
      this.dataSource
        .getRepository(SchoolSubscription)
        .find({ where: { schoolId }, relations: ['subscriptionPlan'] }),
      this.dataSource
        .getRepository(SchoolRole)
        .find({ where: { schoolId, isActive: true, isDeleted: false } }),
      this.dataSource
        .getRepository(ModuleMaster)
        .find({ where: { isActive: true }, order: { displayOrder: 'ASC' } }),
      this.dataSource
        .getRepository(PlatformFeature)
        .find({ where: { isActive: true } }),
      this.dataSource
        .getRepository(SubscriptionPlanPlatformFeatureMapping)
        .find({ where: { isActive: true, isEnabled: true } }),
      this.dataSource
        .getRepository(SchoolFeatureOverride)
        .find({ where: { schoolId, isActive: true, isDeleted: false } }),
    ]);

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // 3. Fetch role permissions
    const roleIds = roles.map((r) => r.id);
    const rolePermissionMap: Record<string, any[]> = {};

    if (roleIds.length > 0) {
      const permissions = await this.dataSource
        .getRepository(SchoolRolePermission)
        .createQueryBuilder('rp')
        .innerJoinAndSelect(
          ModuleOperationPermission,
          'p',
          'p.id = rp.permission_id',
        )
        .select([
          'rp.role_id as role_id',
          'p.id as p_id',
          'p.description as p_desc',
        ])
        .where('rp.role_id IN (:...roleIds)', { roleIds })
        .andWhere('rp.is_active = true')
        .getRawMany();

      permissions.forEach((p) => {
        if (!rolePermissionMap[p.role_id]) rolePermissionMap[p.role_id] = [];
        rolePermissionMap[p.role_id].push({
          id: p.p_id,
          description: p.p_desc,
        });
      });
    }

    // 4. Determine subscription status & allowed features
    const schoolSub = subscriptions.find((s) => s.schoolId === school.id);
    const schoolRoles = roles.filter((r) => r.schoolId === school.id);

    let isExpired = true;
    let isTrialExpired = false;
    let canAccessTrial = true;

    const now = new Date();

    if (schoolSub) {
      canAccessTrial = false;
      if (schoolSub.subscriptionState === SubscriptionStatusEnum.TRIAL) {
        const hasExpired = schoolSub.trialEndAt && schoolSub.trialEndAt < now;
        isExpired = !!hasExpired;
        isTrialExpired = !!hasExpired;
      } else if (
        schoolSub.subscriptionState === SubscriptionStatusEnum.ACTIVE
      ) {
        const hasExpired =
          schoolSub.currentPeriodEnd && schoolSub.currentPeriodEnd < now;
        isExpired = !!hasExpired;
      } else {
        isExpired = true;
      }
    }

    const allowedFeatureIds = new Set<string>();

    if (!isExpired && schoolSub) {
      const planMappings = planFeatureMappings.filter(
        (m) => m.subscriptionPlanId === schoolSub.subscriptionPlanId,
      );
      const planFeatureIds = new Set(
        planMappings.map((m) => m.platformFeatureId),
      );
      const schoolOverrides = overrides.filter((o) => o.schoolId === school.id);

      features.forEach((f) => {
        const activeOverride = schoolOverrides
          .filter(
            (o) =>
              o.platformFeatureId === f.id &&
              (!o.startDate || o.startDate <= now) &&
              (!o.endDate || o.endDate >= now),
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

        if (activeOverride) {
          if (
            activeOverride.overrideType !== OverrideTypeEnum.DISABLE &&
            activeOverride.isEnabled
          ) {
            allowedFeatureIds.add(f.id);
          }
        } else {
          if (planFeatureIds.has(f.id)) {
            allowedFeatureIds.add(f.id);
          }
        }
      });
    }

    let filteredModules = isExpired
      ? []
      : modules.filter((module) => {
          if (!module.platformFeatureId) {
            return true;
          }
          return allowedFeatureIds.has(module.platformFeatureId);
        });

    // 5. If caller is staff (school_user), filter by their granular permissions
    if (caller.actorType === 'school_user') {
      const userRoles = await this.dataSource
        .getRepository(SchoolUserRole)
        .find({
          where: { userId: caller.id, isActive: true, isDeleted: false },
        });
      const userRoleIds = userRoles.map((ur) => ur.roleId);
      const permittedModuleCodes = new Set<string>();

      if (userRoleIds.length > 0) {
        const userPermissions = await this.dataSource
          .getRepository(SchoolRolePermission)
          .createQueryBuilder('rp')
          .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
          .innerJoin(ModuleMaster, 'm', 'm.id = p.module_id')
          .select(['LOWER(m.code) as modulecode'])
          .where('rp.role_id IN (:...userRoleIds)', { userRoleIds })
          .andWhere('rp.is_active = true')
          .andWhere('rp.is_delete = false')
          .andWhere('p.is_active = true')
          .andWhere('p.is_delete = false')
          .andWhere('m.is_active = true')
          .getRawMany();
        userPermissions.forEach((p) =>
          permittedModuleCodes.add(p.modulecode.toLowerCase()),
        );
      }

      filteredModules = filteredModules.filter((module) => {
        const codeLower = module.code.toLowerCase();
        if (codeLower === 'dashboard' || codeLower === 'home') return true;
        return permittedModuleCodes.has(codeLower);
      });
    }

    return {
      id: school.id,
      name: school.schoolName,
      code: school.internalSchoolCode,
      email: school.email,
      phone: school.phone,
      isPrimaryOwner:
        caller.actorType === 'school_owner'
          ? (member?.isPrimaryOwner ?? false)
          : false,
      subscription: schoolSub
        ? {
            planId: schoolSub.subscriptionPlanId,
            planName: schoolSub.subscriptionPlan?.name,
            planCode: schoolSub.subscriptionPlan?.code,
            status: schoolSub.subscriptionState,
            expiryDate:
              schoolSub.subscriptionState === SubscriptionStatusEnum.TRIAL
                ? schoolSub.trialEndAt
                : schoolSub.currentPeriodEnd,
            isExpired,
            isTrialExpired,
            canAccessTrial,
          }
        : {
            planId: null,
            planName: null,
            planCode: null,
            status: null,
            expiryDate: null,
            isExpired: true,
            isTrialExpired: false,
            canAccessTrial: true,
          },
      roles: schoolRoles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: rolePermissionMap[r.id] || [],
      })),
      sidebarModules: filteredModules,
    };
  }

  async getGlobalOwnerAnalytics(
    caller: AuthContext,
    query: SchoolAnalyticsQueryDto,
  ) {
    if (caller.actorType !== 'school_owner') {
      throw new ForbiddenException(
        'Only registered school owners can access global dashboard analytics',
      );
    }

    const memberships = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .find({
        where: { schoolOwnerId: caller.id, isActive: true },
      });
    const schoolIds = memberships.map((m) => m.schoolId);

    if (schoolIds.length === 0) {
      return {
        totalSchools: 0,
        totalStudents: 0,
        totalStaff: 0,
        totalRoles: 0,
        roleBreakdown: [],
        staffTypeBreakdown: { academic: 0, non_academic: 0 },
        totalClasses: 0,
        totalSections: 0,
      };
    }

    const totalSchools = schoolIds.length;

    // Total Students
    let totalStudents = 0;
    if (query.academicSessionId) {
      totalStudents = await this.dataSource
        .getRepository(StudentEnrollment)
        .count({
          where: {
            schoolId: In(schoolIds),
            academicSessionId: query.academicSessionId,
            isActive: true,
            isDeleted: false,
          },
        });
    } else {
      totalStudents = await this.dataSource.getRepository(Student).count({
        where: {
          schoolId: In(schoolIds),
          isActive: true,
          isDeleted: false,
        },
      });
    }

    // Total Staff
    const totalStaff = await this.dataSource.getRepository(SchoolUser).count({
      where: {
        schoolId: In(schoolIds),
        isActive: true,
        isDeleted: false,
      },
    });

    // Total Roles
    const totalRoles = await this.dataSource.getRepository(SchoolRole).count({
      where: {
        schoolId: In(schoolIds),
        isActive: true,
        isDeleted: false,
      },
    });

    // Role breakdown
    const rawRoles = await this.dataSource
      .getRepository(SchoolRole)
      .createQueryBuilder('role')
      .select('role.name', 'name')
      .addSelect('COUNT(role.id)', 'count')
      .where('role.schoolId IN (:...schoolIds)', { schoolIds })
      .andWhere('role.isActive = true')
      .andWhere('role.is_delete = false')
      .groupBy('role.name')
      .getRawMany();
    const roleBreakdown = rawRoles.map((r) => ({
      name: r.name,
      count: parseInt(r.count, 10),
    }));

    // Staff type breakdown
    const rawStaff = await this.dataSource
      .getRepository(SchoolUser)
      .createQueryBuilder('user')
      .select('user.userType', 'userType')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.schoolId IN (:...schoolIds)', { schoolIds })
      .andWhere('user.isActive = true')
      .andWhere('user.is_delete = false')
      .groupBy('user.userType')
      .getRawMany();

    const staffTypeBreakdown = { academic: 0, non_academic: 0 };
    rawStaff.forEach((s) => {
      if (s.userType === 'academic')
        staffTypeBreakdown.academic = parseInt(s.count, 10);
      if (s.userType === 'non_academic')
        staffTypeBreakdown.non_academic = parseInt(s.count, 10);
    });

    // Total Classes
    const totalClasses = await this.dataSource.getRepository(Class).count({
      where: {
        schoolId: In(schoolIds),
        isActive: true,
        isDeleted: false,
      },
    });

    // Total Sections
    const totalSections = await this.dataSource.getRepository(Section).count({
      where: {
        schoolId: In(schoolIds),
        isActive: true,
        isDeleted: false,
      },
    });

    return {
      totalSchools,
      totalStudents,
      totalStaff,
      totalRoles,
      roleBreakdown,
      staffTypeBreakdown,
      totalClasses,
      totalSections,
    };
  }

  async getSingleSchoolAnalytics(
    caller: AuthContext,
    schoolId: string,
    query: SchoolAnalyticsQueryDto,
  ) {
    const isOwner = caller.actorType === 'school_owner';

    if (isOwner) {
      const member = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({
          where: { schoolOwnerId: caller.id, schoolId, isActive: true },
        });
      if (!member) {
        throw new ForbiddenException(
          'School context not found or access denied',
        );
      }
    } else {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException(
          "Access denied to this school's analytics",
        );
      }
    }

    // Total Students
    let totalStudents = 0;
    if (query.academicSessionId) {
      totalStudents = await this.dataSource
        .getRepository(StudentEnrollment)
        .count({
          where: {
            schoolId,
            academicSessionId: query.academicSessionId,
            isActive: true,
            isDeleted: false,
          },
        });
    } else {
      totalStudents = await this.dataSource.getRepository(Student).count({
        where: {
          schoolId,
          isActive: true,
          isDeleted: false,
        },
      });
    }

    // Total Staff
    const totalStaff = await this.dataSource.getRepository(SchoolUser).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
      },
    });

    // Total Roles
    const totalRoles = await this.dataSource.getRepository(SchoolRole).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
      },
    });

    // Total Classes
    const totalClasses = await this.dataSource.getRepository(Class).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
      },
    });

    // Total Sections
    const totalSections = await this.dataSource.getRepository(Section).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
      },
    });

    // Student Growth metrics:
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);
    const oneYearAgo = new Date();
    oneYearAgo.setDate(now.getDate() - 365);

    const weekly = await this.dataSource.getRepository(Student).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
        createdAt: MoreThanOrEqual(oneWeekAgo),
      },
    });

    const monthly = await this.dataSource.getRepository(Student).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
        createdAt: MoreThanOrEqual(oneMonthAgo),
      },
    });

    const yearly = await this.dataSource.getRepository(Student).count({
      where: {
        schoolId,
        isActive: true,
        isDeleted: false,
        createdAt: MoreThanOrEqual(oneYearAgo),
      },
    });

    // Monthly trend for the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const rawMonthlyTrend = await this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .select('EXTRACT(MONTH FROM student.createdAt)', 'month')
      .addSelect('COUNT(student.id)', 'count')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isActive = true')
      .andWhere('student.is_delete = false')
      .andWhere('student.createdAt >= :startOfYear', { startOfYear })
      .groupBy('EXTRACT(MONTH FROM student.createdAt)')
      .getRawMany();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const trendMap = new Map<number, number>();
    rawMonthlyTrend.forEach((t) => {
      const m = parseInt(t.month, 10);
      trendMap.set(m, parseInt(t.count, 10));
    });

    const monthlyTrend = monthNames.map((name, index) => {
      const monthNum = index + 1;
      return {
        month: name,
        count: trendMap.get(monthNum) || 0,
      };
    });

    return {
      totalStudents,
      totalStaff,
      totalRoles,
      totalClasses,
      totalSections,
      studentGrowth: {
        weekly,
        monthly,
        yearly,
      },
      monthlyTrend,
    };
  }
}
