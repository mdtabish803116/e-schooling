import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../models/entities/rbac/role.entity';
import { RolePermission } from '../../models/entities/rbac/role-permission.entity';
import { Permission } from '../../models/entities/rbac/permission.entity';
import { SchoolMember } from '../../models/entities/school/school-member.entity';
import { StatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateRoleDto } from '../../interfaces/request/role/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private dataSource: DataSource) {}

  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }

  /**
   * School owner creates a custom Role for their school,
   * optionally attaching permissions (which were created by platform admins).
   */
  async createRole(caller: AuthContext, schoolId: string, dto: CreateRoleDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = new Role();
      role.schoolId = schoolId;
      role.name = dto.name;
      role.status = StatusEnum.ACTIVE;
      role.createdById = caller.id;

      const savedRole = await queryRunner.manager.save(role);

      // Attach permissions if provided
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        for (const permissionId of dto.permissionIds) {
          const permission = await queryRunner.manager.findOne(Permission, {
            where: { id: permissionId },
          });
          if (!permission) {
            throw new NotFoundException(`Permission ${permissionId} not found`);
          }

          const rp = new RolePermission();
          rp.roleId = savedRole.id;
          rp.permissionId = permissionId;
          rp.createdById = caller.id;
          await queryRunner.manager.save(rp);
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Role created successfully',
        role: {
          id: savedRole.id,
          name: savedRole.name,
          schoolId: savedRole.schoolId,
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
   * List all roles in a school.
   */
  async listRoles(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const roles = await this.dataSource.getRepository(Role).find({
      where: { schoolId, status: StatusEnum.ACTIVE },
      select: ['id', 'name', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return { roles };
  }

  /**
   * List all available permissions (created by platform admins).
   * Useful for school owners when assigning permissions to roles.
   */
  async listPermissions() {
    const permissions = await this.dataSource.getRepository(Permission).find({
      select: ['id', 'resource', 'action', 'key', 'description'],
      order: { resource: 'ASC', action: 'ASC' },
    });

    return { permissions };
  }
}
