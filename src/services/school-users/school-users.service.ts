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
import { SchoolUserProfile } from '../../models/entities/school/school-user-profile.entity';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolUserDto } from '../../interfaces/request/school-user/create-school-user.dto';
import { AssignSchoolRoleDto } from '../../interfaces/request/school-user/assign-school-role.dto';
import { UpdateSchoolUserProfileDto } from '../../interfaces/request/school-user/update-school-user-profile.dto';

@Injectable()
export class SchoolUsersService {
  constructor(private dataSource: DataSource) { }

  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });
    if (!membership) throw new ForbiddenException('You do not have access to this school');
  }

  async createUser(caller: AuthContext, schoolId: string, dto: CreateSchoolUserDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

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
    await this.assertOwnershipOfSchool(caller.id, schoolId);
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
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user) throw new NotFoundException('School user not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const schoolRoleId of dto.roleIds) {
        const role = await queryRunner.manager.findOne(SchoolRole, { where: { id: schoolRoleId, schoolId } });
        if (!role) throw new NotFoundException(`School role ${schoolRoleId} not found`);

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
    await this.assertOwnershipOfSchool(caller.id, schoolId);

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
    await this.assertOwnershipOfSchool(caller.id, schoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user) throw new NotFoundException('School user not found');

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
    await this.assertOwnershipOfSchool(caller.id, schoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: userId, schoolId } });
    if (!user) throw new NotFoundException('School user not found');

    const profile = await this.dataSource.getRepository(SchoolUserProfile).findOne({ where: { schoolUserId: userId } });
    return { user, profile: profile || null };
  }
}
