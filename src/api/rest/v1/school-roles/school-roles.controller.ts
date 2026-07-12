import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { SchoolRolesService } from '../../../../services/school-roles/school-roles.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateSchoolRoleDto } from '../../../../interfaces/request/school-role/create-school-role.dto';
import { UpdateSchoolRoleDto } from '../../../../interfaces/request/school-role/update-school-role.dto';
import { UpdateSchoolRoleStatusDto } from '../../../../interfaces/request/school-role/update-school-role-status.dto';
import { UpdateRolePermissionStatusDto } from '../../../../interfaces/request/school-role/update-role-permission-status.dto';
import { AssignSchoolPermissionsDto } from '../../../../interfaces/request/school-role/assign-school-permissions.dto';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('School Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('schools/:schoolId/school-roles')
export class SchoolRolesController {
  constructor(private readonly schoolRolesService: SchoolRolesService) {}

  @ApiOperation({ summary: 'Step 1: Create a basic custom school role' })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.CREATE)
  @Post()
  async createSchoolRole(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateSchoolRoleDto,
  ) {
    return this.schoolRolesService.createSchoolRole(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Update school role metadata (name/description)' })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.UPDATE)
  @Patch(':schoolRoleId')
  async updateSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UpdateSchoolRoleDto,
  ) {
    return this.schoolRolesService.updateSchoolRole(
      caller,
      schoolId,
      schoolRoleId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Activate / Deactivate a school role active status',
  })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.UPDATE)
  @Patch(':schoolRoleId/status')
  async updateSchoolRoleStatus(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UpdateSchoolRoleStatusDto,
  ) {
    return this.schoolRolesService.updateSchoolRoleStatus(
      caller,
      schoolId,
      schoolRoleId,
      dto.isActive,
    );
  }

  @ApiOperation({
    summary: 'Get all active permissions currently assigned to a school role',
  })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.VIEW)
  @Get(':schoolRoleId/permissions')
  async getPermissionsForSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.getPermissionsForSchoolRole(
      caller,
      schoolId,
      schoolRoleId,
    );
  }

  @ApiOperation({
    summary: 'Step 2: Assign granular permissions to a school role',
  })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.UPDATE)
  @Post(':schoolRoleId/permissions')
  async assignPermissionsToSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: AssignSchoolPermissionsDto,
  ) {
    return this.schoolRolesService.assignPermissionsToSchoolRole(
      caller,
      schoolId,
      schoolRoleId,
      dto.permissionIds,
    );
  }

  @ApiOperation({
    summary: 'Activate / Deactivate a specific permission from a school role',
  })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.UPDATE)
  @Patch(':schoolRoleId/permissions/:permissionId/status')
  async updatePermissionStatusForSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UpdateRolePermissionStatusDto,
  ) {
    return this.schoolRolesService.updatePermissionStatusForSchoolRole(
      caller,
      schoolId,
      schoolRoleId,
      permissionId,
      dto.isActive,
    );
  }

  @ApiOperation({ summary: 'List all active school roles in a school' })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.VIEW)
  @Get()
  async listSchoolRoles(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.listSchoolRoles(caller, schoolId);
  }

  @ApiOperation({
    summary:
      'List all accordion-ready permissions available to this school tier',
  })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.VIEW)
  @Get('permissions')
  async listSchoolPermissions(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.listAccessiblePermissionsForSchool(
      caller,
      schoolId,
    );
  }

  @ApiOperation({ summary: 'Get details of a school role by its ID' })
  @Permission(ResourceEnum.SCHOOL_ROLES, ActionEnum.VIEW)
  @Get(':schoolRoleId')
  async getSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolRolesService.getSchoolRole(
      caller,
      schoolId,
      schoolRoleId,
    );
  }
}
