import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { validateEmail, validateMobile } from '../../shared/utils/validation.utils';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { SchoolOwnerRoleEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolDto } from '../../interfaces/request/school/create-school.dto';
import { UpdateSchoolDto } from '../../interfaces/request/school/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private dataSource: DataSource) { }

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
      const existing = await this.dataSource.getRepository(School).findOne({ where: { internalSchoolCode: code } });
      if (!existing) isUnique = true;
    }
    return code;
  }

  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });
    if (!membership) throw new ForbiddenException('You do not have access to manage this school');
  }

  /**
   * Create a new school.
   * Note: Subscription must be initiated separately via SubscriptionsService.
   */
  async createSchool(caller: AuthContext, dto: CreateSchoolDto) {
    if (caller.actorType !== 'school_owner') throw new ForbiddenException('Only registered school owners can create new schools');

    if (!validateEmail(dto.email)) throw new BadRequestException('Invalid school email address format');
    if (!validateMobile(dto.phone)) throw new BadRequestException('Invalid school phone number format');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const internalCode = await this.generateUniqueSchoolCode(dto.schoolName);
      
      const school = new School();
      Object.assign(school, dto);
      school.internalSchoolCode = internalCode;
      school.externalSchoolCode = dto.externalSchoolCode || null;
      school.isActive = true;
      school.createdById = caller.id;

      const savedSchool = await queryRunner.manager.save(school);

      const member = new SchoolOwnerMember();
      member.schoolId = savedSchool.id;
      member.schoolOwnerId = caller.id;
      member.role = SchoolOwnerRoleEnum.OWNER;
      member.isPrimaryOwner = true;
      member.isActive = true;
      member.createdById = caller.id;

      await queryRunner.manager.save(member);
      await queryRunner.commitTransaction();

      return {
        message: 'School registered successfully. Please select a subscription plan to continue.',
        school: savedSchool,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateSchool(caller: AuthContext, schoolId: string, dto: UpdateSchoolDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);
    const schoolRepo = this.dataSource.getRepository(School);
    const school = await schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    Object.assign(school, dto);
    school.updatedById = caller.id;
    const updatedSchool = await schoolRepo.save(school);

    return { message: 'School updated successfully', school: updatedSchool };
  }

  async listSchools(caller: AuthContext) {
    const memberships = await this.dataSource.getRepository(SchoolOwnerMember).find({
      where: { schoolOwnerId: caller.id, isActive: true },
    });
    if (!memberships.length) return { schools: [] };

    const schoolIds = memberships.map(m => m.schoolId);
    const schools = await this.dataSource.getRepository(School).find({
      where: { id: In(schoolIds) },
      order: { createdAt: 'DESC' }
    });

    return {
      schools: schools.map(s => ({
        ...s,
        isPrimaryOwner: memberships.find(m => m.schoolId === s.id)?.isPrimaryOwner ?? false
      }))
    };
  }

  async getSchool(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);
    const school = await this.dataSource.getRepository(School).findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    return { school };
  }

  /**
   * Optimized Master Context API.
   * Uses bulk-fetching to prevent N+1 query performance issues.
   */
  async getOwnerMasterContext(caller: AuthContext) {
    const memberships = await this.dataSource.getRepository(SchoolOwnerMember).find({
      where: { schoolOwnerId: caller.id, isActive: true },
    });
    if (!memberships.length) return { schools: [] };

    const schoolIds = memberships.map(m => m.schoolId);

    // 1. Bulk fetch all primary school assets
    const [schools, subscriptions, roles, modules] = await Promise.all([
      this.dataSource.getRepository(School).find({ where: { id: In(schoolIds) } }),
      this.dataSource.getRepository(SchoolSubscription).find({ where: { schoolId: In(schoolIds) }, relations: ['subscriptionPlan'] }),
      this.dataSource.getRepository(SchoolRole).find({ where: { schoolId: In(schoolIds), isActive: true, isDeleted: false } }),
      this.dataSource.getRepository(ModuleMaster).find({ where: { isActive: true }, order: { displayOrder: 'ASC' } }),
    ]);

    // 2. Bulk fetch all role permissions
    const roleIds = roles.map(r => r.id);
    let rolePermissionMap: Record<string, any[]> = {};

    if (roleIds.length > 0) {
      const permissions = await this.dataSource.getRepository(SchoolRolePermission).createQueryBuilder('rp')
        .innerJoinAndSelect(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
        .select(['rp.role_id as role_id', 'p.id as p_id', 'p.key as p_key', 'p.description as p_desc'])
        .where('rp.role_id IN (:...roleIds)', { roleIds })
        .andWhere('rp.isActive = true')
        .getRawMany();

      permissions.forEach(p => {
        if (!rolePermissionMap[p.role_id]) rolePermissionMap[p.role_id] = [];
        rolePermissionMap[p.role_id].push({ id: p.p_id, key: p.p_key, description: p.p_desc });
      });
    }

    // 3. Aggregate results in memory
    const results = schools.map(school => {
      const schoolSub = subscriptions.find(s => s.schoolId === school.id);
      const schoolRoles = roles.filter(r => r.schoolId === school.id);

      return {
        id: school.id,
        name: school.schoolName,
        code: school.internalSchoolCode,
        email: school.email,
        phone: school.phone,
        isPrimaryOwner: memberships.find(m => m.schoolId === school.id)?.isPrimaryOwner ?? false,
        subscription: schoolSub ? {
          planId: schoolSub.subscriptionPlanId,
          planName: schoolSub.subscriptionPlan?.name,
          planCode: schoolSub.subscriptionPlan?.code,
          status: schoolSub.subscriptionState,
          expiryDate: schoolSub.currentPeriodEnd,
        } : null,
        roles: schoolRoles.map(r => ({
          id: r.id,
          name: r.name,
          permissions: rolePermissionMap[r.id] || [],
        })),
        sidebarModules: modules,
      };
    });

    return { schools: results };
  }
}
