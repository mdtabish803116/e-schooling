import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { SchoolUserProfile } from '../../models/entities/school/school-user-profile.entity';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolUserDto } from '../../interfaces/request/school-user/create-school-user.dto';
import { AssignSchoolRoleDto } from '../../interfaces/request/school-user/assign-school-role.dto';
import { UpdateSchoolUserProfileDto } from '../../interfaces/request/school-user/update-school-user-profile.dto';

@Injectable()
export class SchoolUsersService {
  constructor(private dataSource: DataSource) { }

  private async assertAccessToSchool(caller: AuthContext, schoolId: string): Promise<void> {
    if (caller.actorType === 'school_owner') {
      const membership = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
      if (!membership) throw new ForbiddenException('You do not have access to this school');
    } else if (caller.actorType === 'school_user') {
      if (caller.schoolId !== schoolId) {
        throw new ForbiddenException('You do not belong to this school');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  async createUser(caller: AuthContext, schoolId: string, dto: CreateSchoolUserDto) {
    await this.assertAccessToSchool(caller, schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUsername = await queryRunner.manager.findOne(SchoolUser, {
        where: { schoolId, username: dto.username },
      });
      if (existingUsername) throw new BadRequestException('Username already exists in this school');

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const user = new SchoolUser();
      Object.assign(user, dto);
      user.schoolId = schoolId;
      user.schoolOwnerId = caller.id;
      user.passwordHash = passwordHash;
      user.isActive = true;
      user.createdById = caller.id;

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      return {
        message: 'School user created successfully',
        user: { id: savedUser.id, name: savedUser.name, username: savedUser.username }
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listUsers(caller: AuthContext, schoolId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    const users = await this.dataSource.getRepository(SchoolUser).find({
      where: { schoolId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return { users };
  }

  /**
   * Assign School Roles to a User (Handles Reactivation for Soft-Deleted records).
   */
  async assignSchoolRoles(caller: AuthContext, schoolId: string, userId: string, dto: AssignSchoolRoleDto) {
    await this.assertAccessToSchool(caller, schoolId);

    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user || user.isDeleted) throw new NotFoundException('This user does not exist');
    if (!user.isActive) {
      throw new BadRequestException('This user is inactive. Please activate it first before assigning roles.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const schoolRoleId of dto.roleIds) {
        const role = await queryRunner.manager.findOne(SchoolRole, { where: { id: schoolRoleId, schoolId } });
        if (!role || role.isDeleted) throw new NotFoundException('This role does not exist');
        if (!role.isActive) {
          throw new BadRequestException('This role is inactive. Please activate it first before assigning roles.');
        }

        let mapping = await queryRunner.manager.findOne(SchoolUserRole, { where: { userId, roleId: schoolRoleId } });

        if (mapping) {
          mapping.isDeleted = false;
          mapping.isActive = true;
        } else {
          mapping = new SchoolUserRole();
          mapping.userId = userId;
          mapping.roleId = schoolRoleId;
        }
        mapping.createdById = caller.id;
        mapping.updatedById = caller.id;
        await queryRunner.manager.save(mapping);
      }

      await queryRunner.commitTransaction();
      return { message: 'School roles assigned/reactivated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * De-assign / Deactivate a School Role from a User (Soft Delete).
   */
  async deassignSchoolRole(caller: AuthContext, schoolId: string, userId: string, schoolRoleId: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user || user.isDeleted) throw new NotFoundException('This user does not exist');

    const mappingRepo = this.dataSource.getRepository(SchoolUserRole);
    const mapping = await mappingRepo.findOne({ where: { userId, roleId: schoolRoleId } });

    if (mapping) {
      mapping.isDeleted = true;
      mapping.isActive = false;
      mapping.updatedById = caller.id;
      await mappingRepo.save(mapping);
    }

    return { message: 'School role de-assigned successfully (Soft Deleted)' };
  }

  async upsertUserProfile(caller: AuthContext, schoolId: string, userId: string, dto: UpdateSchoolUserProfileDto) {
    await this.assertAccessToSchool(caller, schoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user || user.isDeleted) throw new NotFoundException('This user does not exist');

    const profileRepo = this.dataSource.getRepository(SchoolUserProfile);
    let profile = await profileRepo.findOne({ where: { schoolUserId: userId } });

    if (!profile) {
      profile = new SchoolUserProfile();
      profile.schoolUserId = userId;
    }

    Object.assign(profile, dto);
    const savedProfile = await profileRepo.save(profile);
    return { message: 'User profile updated successfully', profile: savedProfile };
  }

  async getUserProfile(caller: AuthContext, schoolId: string, userId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user || user.isDeleted) throw new NotFoundException('This user does not exist');

    const profile = await this.dataSource.getRepository(SchoolUserProfile).findOne({ where: { schoolUserId: userId } });
    return { user, profile: profile || null };
  }

  /**
   * Fetches the permitted operations for the current user in a specific module.
   */
  async getMyPermissions(caller: AuthContext, schoolId: string, moduleCode: string) {
    await this.assertAccessToSchool(caller, schoolId);

    if (caller.actorType === 'school_owner') {
      return { isOwner: true, hasRoleAssigned: true, operations: [] };
    }

    if (!moduleCode) {
      throw new BadRequestException('moduleCode query parameter is required');
    }

    // 1. Get roles assigned to this user
    const userRoles = await this.dataSource.getRepository(SchoolUserRole).find({
      where: { userId: caller.id, isActive: true, isDeleted: false },
    });

    if (!userRoles.length) {
      return { isOwner: false, hasRoleAssigned: false, operations: [] };
    }

    const roleIds = userRoles.map(ur => ur.roleId);

    // 2. Fetch active operations mapped to these roles for the specific module
    const permissions = await this.dataSource.getRepository(SchoolRolePermission).createQueryBuilder('rp')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permissionId')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .select(["LOWER(o.code) as operation"])
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .andWhere('LOWER(m.code) = LOWER(:moduleCode)', { moduleCode })
      .andWhere('rp.isActive = true')
      .andWhere('rp.isDeleted = false')
      .andWhere('p.isActive = true')
      .andWhere('p.isDeleted = false')
      .andWhere('m.isActive = true')
      .andWhere('o.isActive = true')
      .getRawMany();

    // 3. Extract unique operation strings (e.g. ['create', 'view', 'update'])
    const uniqueOperations = Array.from(new Set(permissions.map(p => p.operation)));

    return { isOwner: false, hasRoleAssigned: true, operations: uniqueOperations };
  }
}
