import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SchoolMember } from '../../models/entities/school/school-member.entity';
import { UserRole } from '../../models/entities/rbac/user-role.entity';
import { Role } from '../../models/entities/rbac/role.entity';
import { StatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolUserDto } from '../../interfaces/request/school-user/create-school-user.dto';
import { AssignRoleDto } from '../../interfaces/request/school-user/assign-role.dto';

@Injectable()
export class SchoolUsersService {
  constructor(private dataSource: DataSource) {}

  /**
   * Verifies that the caller (school_owner) owns/manages the given school.
   * Throws ForbiddenException if not.
   */
  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }

  /**
   * Create a new school user (teacher / accountant / admin / staff)
   * under the specified school. Use the assign-roles endpoint to assign roles.
   */
  async createUser(caller: AuthContext, schoolId: string, dto: CreateSchoolUserDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check username uniqueness within school
      const existingUsername = await queryRunner.manager.findOne(SchoolUser, {
        where: { schoolId, username: dto.username },
      });
      if (existingUsername) {
        throw new BadRequestException('Username already exists in this school');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      // Create school user
      const user = new SchoolUser();
      user.schoolId = schoolId;
      user.schoolOwnerId = caller.id;
      user.name = dto.name;
      user.username = dto.username;
      user.phone = dto.phone ?? '';
      user.passwordHash = passwordHash;
      user.userType = dto.userType;
      user.status = StatusEnum.ACTIVE;
      user.createdById = caller.id;

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return {
        message: 'School user created successfully',
        user: {
          id: savedUser.id,
          name: savedUser.name,
          username: savedUser.username,
          userType: savedUser.userType,
          status: savedUser.status,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * List all users in a school (for the school owner).
   */
  async listUsers(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const users = await this.dataSource.getRepository(SchoolUser).find({
      where: { schoolId, status: StatusEnum.ACTIVE },
      select: ['id', 'name', 'username', 'phone', 'userType', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return { users };
  }

  /**
   * Assign one or more roles to a school user.
   */
  async assignRoles(caller: AuthContext, schoolId: string, userId: string, dto: AssignRoleDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: userId, schoolId },
    });
    if (!user) throw new NotFoundException('School user not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const roleId of dto.roleIds) {
        const role = await queryRunner.manager.findOne(Role, {
          where: { id: roleId, schoolId },
        });
        if (!role) throw new NotFoundException(`Role ${roleId} not found in this school`);

        // Avoid duplicate assignment
        const existing = await queryRunner.manager.findOne(UserRole, {
          where: { userId, roleId },
        });
        if (!existing) {
          const userRole = new UserRole();
          userRole.userId = userId;
          userRole.roleId = roleId;
          userRole.createdById = caller.id;
          await queryRunner.manager.save(userRole);
        }
      }

      await queryRunner.commitTransaction();
      return { message: 'Roles assigned successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
