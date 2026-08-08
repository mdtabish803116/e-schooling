import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserTypeEnum } from '../../models/enums/enums';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
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
import {
  ApiResponse,
  ApiResponseException,
} from '../../shared/utils/response.utils';

@Injectable()
export class SchoolUsersService {
  constructor(private dataSource: DataSource) {}

  private async assertAccessToSchool(
    caller: AuthContext,
    schoolId: string,
  ): Promise<void> {
    if (caller.actorType === 'school_owner') {
      const membership = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
      if (!membership)
        throw new ForbiddenException('You do not have access to this school');
    } else if (caller.actorType === 'school_user') {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException('You do not belong to this school');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  async createUser(
    caller: AuthContext,
    schoolId: string,
    dto: CreateSchoolUserDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUsername = await queryRunner.manager.findOne(SchoolUser, {
        where: { schoolId, username: dto.username },
      });
      if (existingUsername)
        throw new BadRequestException('Username already exists in this school');

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const user = new SchoolUser();
      user.name = dto.name;
      user.username = dto.username;
      user.phone = dto.phone || '';
      user.userType = dto.userType;
      user.schoolId = schoolId;
      user.schoolOwnerId = caller.id;
      user.passwordHash = passwordHash;
      user.isActive = true;
      user.createdById = caller.id;

      const savedUser = await queryRunner.manager.save(user);

      // Create associated SchoolUserProfile
      const profile = new SchoolUserProfile();
      profile.schoolUserId = savedUser.id;
      profile.firstName =
        dto.profile?.firstName || dto.name.split(' ')[0] || '';
      profile.lastName =
        dto.profile?.lastName || dto.name.split(' ').slice(1).join(' ') || '';
      profile.email = dto.profile?.email || '';
      profile.designation =
        dto.profile?.designation ||
        (dto.userType === UserTypeEnum.ACADEMIC ? 'Teacher' : 'Staff');
      profile.departmentName = dto.profile?.departmentName || 'General';
      profile.joiningDate =
        dto.profile?.joiningDate || new Date().toISOString().split('T')[0];

      if (dto.profile) {
        Object.assign(profile, dto.profile);
      }
      await queryRunner.manager.save(profile);

      // Assign initial roleIds if provided
      if (dto.roleIds && dto.roleIds.length > 0) {
        for (const roleId of dto.roleIds) {
          const userRole = new SchoolUserRole();
          userRole.userId = savedUser.id;
          userRole.roleId = roleId;
          userRole.isActive = true;
          userRole.createdById = caller.id;
          await queryRunner.manager.save(userRole);
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'School user created successfully',
        user: {
          id: savedUser.id,
          name: savedUser.name,
          username: savedUser.username,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listUsers(caller: AuthContext, schoolId: string) {
    try {
      await this.assertAccessToSchool(caller, schoolId);

      const school = await this.dataSource
        .getRepository(School)
        .findOne({ where: { id: schoolId } });
      const schoolName = school?.schoolName || `School #${schoolId}`;

      const users = await this.dataSource.getRepository(SchoolUser).find({
        where: { schoolId, isActive: true, isDeleted: false },
        order: { createdAt: 'DESC' },
      });

      if (users.length === 0) {
        return ApiResponse.success([], 'Users list fetched successfully');
      }

      const userIds = users.map((u) => u.id);
      const creatorIds = [
        ...new Set(users.map((u) => u.createdById).filter(Boolean)),
      ];

      // Fetch creator names
      const creators =
        creatorIds.length > 0
          ? await this.dataSource
              .getRepository(SchoolOwner)
              .find({ where: { id: In(creatorIds) } })
          : [];
      const creatorMap = new Map(
        creators.map((c) => [c.id, c.fullName || 'Administrator']),
      );

      // Fetch active roles assigned to these users
      const userRoles = await this.dataSource
        .getRepository(SchoolUserRole)
        .find({
          where: { userId: In(userIds), isActive: true, isDeleted: false },
        });

      const roleIds = [...new Set(userRoles.map((ur) => ur.roleId))];

      const roles =
        roleIds.length > 0
          ? await this.dataSource.getRepository(SchoolRole).find({
              where: {
                id: In(roleIds),
                schoolId,
                isActive: true,
                isDeleted: false,
              },
              select: ['id', 'name', 'description', 'isActive'],
            })
          : [];

      const rolesMap = new Map(roles.map((r) => [r.id, r]));

      const userRolesMap = new Map<
        string,
        Array<{
          id: string;
          name: string;
          description?: string | null;
          isActive: boolean;
        }>
      >();

      for (const ur of userRoles) {
        const roleObj = rolesMap.get(ur.roleId);
        if (roleObj) {
          let userRolesList = userRolesMap.get(ur.userId);
          if (!userRolesList) {
            userRolesList = [];
            userRolesMap.set(ur.userId, userRolesList);
          }
          userRolesList.push({
            id: roleObj.id,
            name: roleObj.name,
            description: roleObj.description,
            isActive: roleObj.isActive,
          });
        }
      }

      const profiles = await this.dataSource
        .getRepository(SchoolUserProfile)
        .find({ where: { schoolUserId: In(userIds) } });

      const profilesMap = new Map(profiles.map((p) => [p.schoolUserId, p]));

      // Ensure missing profiles are initialized
      for (const u of users) {
        if (!profilesMap.has(u.id)) {
          const newProfile = new SchoolUserProfile();
          newProfile.schoolUserId = u.id;
          newProfile.firstName = u.name.split(' ')[0] || u.name;
          newProfile.lastName = u.name.split(' ').slice(1).join(' ') || '';
          newProfile.designation =
            u.userType === UserTypeEnum.ACADEMIC ? 'Teacher' : 'Staff';
          const savedProf = await this.dataSource
            .getRepository(SchoolUserProfile)
            .save(newProfile);
          profilesMap.set(u.id, savedProf);
        }
      }

      const formattedUsers = users.map((u) => {
        const prof = profilesMap.get(u.id) || null;
        const userRolesList = userRolesMap.get(u.id) || [];
        return {
          ...u,
          schoolName,
          createdByName: creatorMap.get(u.createdById) || 'Administrator',
          profile: prof,
          roles: userRolesList,
          roleNames:
            userRolesList.map((r) => r.name).join(', ') || 'No Role Assigned',
        };
      });

      return ApiResponse.success(
        formattedUsers,
        'Users list fetched successfully',
      );
    } catch (error: unknown) {
      if (error instanceof ApiResponseException) {
        throw error;
      }
      const err = error as {
        status?: number;
        getStatus?: () => number;
        message?: string;
        name?: string;
      };
      const status = err.status || (err.getStatus ? err.getStatus() : 500);
      const message = err.message || 'An error occurred';
      throw new ApiResponseException(
        message,
        status,
        err.name || 'INTERNAL_SERVER_ERROR',
      );
    }
  }

  /**
   * Assign School Roles to a User (Handles Reactivation for Soft-Deleted records).
   */
  async assignSchoolRoles(
    caller: AuthContext,
    schoolId: string,
    userId: string,
    dto: AssignSchoolRoleDto,
  ) {
    try {
      await this.assertAccessToSchool(caller, schoolId);

      const user = await this.dataSource
        .getRepository(SchoolUser)
        .findOne({ where: { id: userId, schoolId } });
      if (!user || user.isDeleted)
        throw new NotFoundException('This user does not exist');
      if (!user.isActive) {
        throw new BadRequestException(
          'This user is inactive. Please activate it first before assigning roles.',
        );
      }

      // Validate all roleIds exist, belong to this school, and are not deleted/inactive
      for (const schoolRoleId of dto.roleIds) {
        const role = await this.dataSource.getRepository(SchoolRole).findOne({
          where: { id: schoolRoleId, schoolId },
        });
        if (!role || role.isDeleted) {
          throw new NotFoundException('This role does not exist');
        }
        if (!role.isActive) {
          throw new BadRequestException(
            `This role is inactive. Please activate it first before assigning roles.`,
          );
        }
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. Deactivate/Soft-delete other roles not in the current assign list
        if (dto.roleIds.length > 0) {
          await queryRunner.manager.update(
            SchoolUserRole,
            {
              userId,
              roleId: Not(In(dto.roleIds)),
            },
            { isActive: false, updatedById: caller.id },
          );
        } else {
          await queryRunner.manager.update(
            SchoolUserRole,
            { userId },
            { isActive: false, updatedById: caller.id },
          );
        }

        // 2. Loop and upsert/reactivate the assigned roles
        for (const schoolRoleId of dto.roleIds) {
          const role = await queryRunner.manager.findOne(SchoolRole, {
            where: { id: schoolRoleId, schoolId },
          });
          if (!role || role.isDeleted)
            throw new NotFoundException('This role does not exist');
          if (!role.isActive) {
            throw new BadRequestException(
              'This role is inactive. Please activate it first before assigning roles.',
            );
          }

          let mapping = await queryRunner.manager.findOne(SchoolUserRole, {
            where: { userId, roleId: schoolRoleId },
          });

          if (mapping) {
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
        return ApiResponse.success(
          null,
          'School roles assigned/reactivated successfully',
          200,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (error instanceof ApiResponseException) {
        throw error;
      }
      const err = error as {
        status?: number;
        getStatus?: () => number;
        message?: string;
        name?: string;
      };
      const status = err.status || (err.getStatus ? err.getStatus() : 500);
      const message = err.message || 'An error occurred';
      throw new ApiResponseException(
        message,
        status,
        err.name || 'INTERNAL_SERVER_ERROR',
      );
    }
  }

  async upsertUserProfile(
    caller: AuthContext,
    schoolId: string,
    userId: string,
    dto: UpdateSchoolUserProfileDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    const user = await this.dataSource
      .getRepository(SchoolUser)
      .findOne({ where: { id: userId, schoolId } });
    if (!user || user.isDeleted)
      throw new NotFoundException('This user does not exist');

    const profileRepo = this.dataSource.getRepository(SchoolUserProfile);
    let profile = await profileRepo.findOne({
      where: { schoolUserId: userId },
    });

    if (!profile) {
      profile = new SchoolUserProfile();
      profile.schoolUserId = userId;
    }

    Object.assign(profile, dto);
    const savedProfile = await profileRepo.save(profile);
    return {
      message: 'User profile updated successfully',
      profile: savedProfile,
    };
  }

  async getUserProfile(caller: AuthContext, schoolId: string, userId: string) {
    try {
      await this.assertAccessToSchool(caller, schoolId);

      const school = await this.dataSource
        .getRepository(School)
        .findOne({ where: { id: schoolId } });
      const schoolName = school?.schoolName || `School #${schoolId}`;

      const user = await this.dataSource
        .getRepository(SchoolUser)
        .findOne({ where: { id: userId, schoolId } });
      if (!user || user.isDeleted)
        throw new NotFoundException('This user does not exist');

      let creatorName = 'Administrator';
      if (user.createdById) {
        const owner = await this.dataSource
          .getRepository(SchoolOwner)
          .findOne({ where: { id: user.createdById } });
        if (owner) creatorName = owner.fullName || 'Administrator';
      }

      let profile = await this.dataSource
        .getRepository(SchoolUserProfile)
        .findOne({ where: { schoolUserId: userId } });

      if (!profile) {
        profile = new SchoolUserProfile();
        profile.schoolUserId = userId;
        profile.firstName = user.name.split(' ')[0] || user.name;
        profile.lastName = user.name.split(' ').slice(1).join(' ') || '';
        profile.designation =
          user.userType === UserTypeEnum.ACADEMIC ? 'Teacher' : 'Staff';
        profile = await this.dataSource
          .getRepository(SchoolUserProfile)
          .save(profile);
      }

      // Fetch active roles assigned to this user
      const userRoles = await this.dataSource
        .getRepository(SchoolUserRole)
        .find({
          where: { userId, isActive: true, isDeleted: false },
        });

      const roleIds = userRoles.map((ur) => ur.roleId);

      const roles =
        roleIds.length > 0
          ? await this.dataSource.getRepository(SchoolRole).find({
              where: {
                id: In(roleIds),
                schoolId,
                isActive: true,
                isDeleted: false,
              },
              select: ['id', 'name', 'description', 'isActive'],
            })
          : [];

      const formattedUser = {
        ...user,
        schoolName,
        createdByName: creatorName,
      };

      const result = {
        user: formattedUser,
        profile,
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          isActive: r.isActive,
        })),
        roleNames: roles.map((r) => r.name).join(', ') || 'No Role Assigned',
      };

      return ApiResponse.success(result, 'User profile fetched successfully');
    } catch (error: unknown) {
      if (error instanceof ApiResponseException) {
        throw error;
      }
      const err = error as {
        status?: number;
        getStatus?: () => number;
        message?: string;
        name?: string;
      };
      const status = err.status || (err.getStatus ? err.getStatus() : 500);
      const message = err.message || 'An error occurred';
      throw new ApiResponseException(
        message,
        status,
        err.name || 'INTERNAL_SERVER_ERROR',
      );
    }
  }

  /**
   * Fetches the permitted operations for the current user in a specific module.
   */
  async getMyPermissions(
    caller: AuthContext,
    schoolId: string,
    moduleCode: string,
  ) {
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

    const roleIds = userRoles.map((ur) => ur.roleId);

    // 2. Fetch active operations mapped to these roles for the specific module
    const permissions = await this.dataSource
      .getRepository(SchoolRolePermission)
      .createQueryBuilder('rp')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permissionId')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .select(['LOWER(o.code) as operation'])
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .andWhere('LOWER(m.code) = LOWER(:moduleCode)', { moduleCode })
      .andWhere('rp.isActive = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.isActive = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.isActive = true')
      .andWhere('o.isActive = true')
      .getRawMany();

    // 3. Extract unique operation strings (e.g. ['create', 'view', 'update'])
    const uniqueOperations = Array.from(
      new Set(permissions.map((p) => p.operation)),
    );

    return {
      isOwner: false,
      hasRoleAssigned: true,
      operations: uniqueOperations,
    };
  }

  async changeMyPassword(
    caller: AuthContext,
    schoolId: string,
    body: { oldPassword?: string; newPassword?: string },
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestException(
        'Both oldPassword and newPassword are required',
      );
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters',
      );
    }

    const user = await this.dataSource
      .getRepository(SchoolUser)
      .findOne({ where: { id: caller.id, schoolId } });

    if (!user) throw new NotFoundException('User account not found');

    const matches = await bcrypt.compare(
      body.oldPassword,
      user.passwordHash || '',
    );
    if (!matches) {
      throw new BadRequestException('Incorrect old password');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(body.newPassword, salt);
    await this.dataSource.getRepository(SchoolUser).save(user);

    return ApiResponse.success(null, 'Password updated successfully');
  }

  async resetUserPassword(
    caller: AuthContext,
    schoolId: string,
    userId: string,
    newPassword?: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    const user = await this.dataSource
      .getRepository(SchoolUser)
      .findOne({ where: { id: userId, schoolId } });

    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const pass = newPassword || 'TempPass@123';
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(pass, salt);
    await this.dataSource.getRepository(SchoolUser).save(user);

    return ApiResponse.success(
      { username: user.username, temporaryPassword: pass },
      'Password reset successfully',
    );
  }
}
