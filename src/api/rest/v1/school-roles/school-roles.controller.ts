import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SchoolRolesService } from '../../../../services/school-roles/school-roles.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateSchoolRoleDto } from '../../../../interfaces/request/school-role/create-school-role.dto';
import { AssignSchoolPermissionsDto } from '../../../../interfaces/request/school-role/assign-school-permissions.dto';

@ApiTags('School Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/school-roles')
export class SchoolRolesController {
  constructor(private readonly schoolRolesService: SchoolRolesService) {}

  @ApiOperation({ summary: 'Step 1: Create a basic custom school role' })
  @Post()
  async createSchoolRole(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateSchoolRoleDto,
  ) {
    return this.schoolRolesService.createSchoolRole(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Update school role metadata (name/description)' })
  @Patch(':schoolRoleId')
  async updateSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: { name?: string, description?: string }
  ) {
    return this.schoolRolesService.updateSchoolRole(caller, schoolId, schoolRoleId, dto);
  }

  @ApiOperation({ summary: 'Deactivate / Soft Delete a school role' })
  @Delete(':schoolRoleId')
  async deactivateSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.schoolRolesService.deactivateSchoolRole(caller, schoolId, schoolRoleId);
  }

  @ApiOperation({ summary: 'Step 2: Assign granular permissions to a school role' })
  @Post(':schoolRoleId/permissions')
  async assignPermissionsToSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: AssignSchoolPermissionsDto
  ) {
    return this.schoolRolesService.assignPermissionsToSchoolRole(caller, schoolId, schoolRoleId, dto.permissionIds);
  }

  @ApiOperation({ summary: 'Remove a specific permission from a school role (Soft Delete)' })
  @Delete(':schoolRoleId/permissions/:permissionId')
  async removePermissionFromSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.schoolRolesService.removePermissionFromSchoolRole(caller, schoolId, schoolRoleId, permissionId);
  }

  @ApiOperation({ summary: 'List all active school roles in a school' })
  @Get()
  async listSchoolRoles(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.listSchoolRoles(caller, schoolId);
  }

  @ApiOperation({ summary: 'List all accordion-ready permissions available to this school tier' })
  @Get('permissions')
  async listSchoolPermissions(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.listAccessiblePermissionsForSchool(caller, schoolId);
  }
}
