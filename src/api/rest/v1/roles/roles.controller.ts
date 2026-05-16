import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { RolesService } from '../../../../services/roles/roles.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateRoleDto } from '../../../../interfaces/request/role/create-role.dto';
import { AssignPermissionsDto } from '../../../../interfaces/request/role/assign-permissions.dto';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Step 1: Create a basic custom role name' })
  @Post()
  async createRole(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Update role metadata (name/description)' })
  @Patch(':roleId')
  async updateRole(
    @Param('schoolId') schoolId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: { name?: string, description?: string }
  ) {
    return this.rolesService.updateRole(caller, schoolId, roleId, dto);
  }

  @ApiOperation({ summary: 'Deactivate / Soft Delete a role' })
  @Delete(':roleId')
  async deactivateRole(
    @Param('schoolId') schoolId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.rolesService.deactivateRole(caller, schoolId, roleId);
  }

  @ApiOperation({ summary: 'Step 2: Assign granular permissions to a role' })
  @Post(':roleId/permissions')
  async assignPermissions(
    @Param('schoolId') schoolId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: AssignPermissionsDto
  ) {
    return this.rolesService.assignPermissionsToRole(caller, schoolId, roleId, dto.permissionIds);
  }

  @ApiOperation({ summary: 'Remove a specific permission from a role (Soft Delete)' })
  @Delete(':roleId/permissions/:permissionId')
  async removePermission(
    @Param('schoolId') schoolId: string,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.rolesService.removePermissionFromRole(caller, schoolId, roleId, permissionId);
  }

  @ApiOperation({ summary: 'List all active roles in a school' })
  @Get()
  async listRoles(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.rolesService.listRoles(caller, schoolId);
  }

  @ApiOperation({ summary: 'List all accordion-ready permissions available to this school tier' })
  @Get('permissions')
  async listPermissions(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.rolesService.listAccessiblePermissionsForSchool(caller, schoolId);
  }
}

