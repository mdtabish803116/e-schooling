import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { SchoolUsersService } from '../../../../services/school-users/school-users.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateSchoolUserDto } from '../../../../interfaces/request/school-user/create-school-user.dto';
import { AssignSchoolRoleDto } from '../../../../interfaces/request/school-user/assign-school-role.dto';
import { UpdateSchoolUserProfileDto } from '../../../../interfaces/request/school-user/update-school-user-profile.dto';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('School Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('schools/:schoolId/users')
export class SchoolUsersController {
  constructor(private readonly schoolUsersService: SchoolUsersService) {}

  @ApiOperation({ summary: 'Create a school user (teacher / accountant / admin / staff) and optionally assign a role' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.CREATE)
  @Post()
  async createUser(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateSchoolUserDto,
  ) {
    return this.schoolUsersService.createUser(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'List all users in a school' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.VIEW)
  @Get()
  async listUsers(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolUsersService.listUsers(caller, schoolId);
  }

  @ApiOperation({ summary: 'Assign one or more school roles to a school user' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.UPDATE)
  @Post(':userId/assign-school-roles')
  async assignSchoolRoles(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: AssignSchoolRoleDto,
  ) {
    return this.schoolUsersService.assignSchoolRoles(caller, schoolId, userId, dto);
  }

  @ApiOperation({ summary: 'De-assign / Remove a school role from a school user (Soft Delete)' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.DELETE)
  @Delete(':userId/school-roles/:schoolRoleId')
  async deassignSchoolRole(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @Param('schoolRoleId') schoolRoleId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.schoolUsersService.deassignSchoolRole(caller, schoolId, userId, schoolRoleId);
  }

  @ApiOperation({ summary: 'Upsert extended profile for a school user' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.UPDATE)
  @Patch(':userId/profile')
  async upsertUserProfile(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UpdateSchoolUserProfileDto,
  ) {
    return this.schoolUsersService.upsertUserProfile(caller, schoolId, userId, dto);
  }

  @ApiOperation({ summary: 'Get school user profile' })
  @Permission(ResourceEnum.SCHOOL_USERS, ActionEnum.VIEW)
  @Get(':userId/profile')
  async getUserProfile(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolUsersService.getUserProfile(caller, schoolId, userId);
  }
}
