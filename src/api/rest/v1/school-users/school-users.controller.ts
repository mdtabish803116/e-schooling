import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SchoolUsersService } from '../../../../services/school-users/school-users.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateSchoolUserDto } from '../../../../interfaces/request/school-user/create-school-user.dto';
import { AssignRoleDto } from '../../../../interfaces/request/school-user/assign-role.dto';

@ApiTags('School Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/users')
export class SchoolUsersController {
  constructor(private readonly schoolUsersService: SchoolUsersService) {}

  @ApiOperation({ summary: 'Create a school user (teacher / accountant / admin / staff) and optionally assign a role' })
  @Post()
  async createUser(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateSchoolUserDto,
  ) {
    return this.schoolUsersService.createUser(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'List all users in a school' })
  @Get()
  async listUsers(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.schoolUsersService.listUsers(caller, schoolId);
  }

  @ApiOperation({ summary: 'Assign one or more roles to a school user' })
  @Post(':userId/assign-roles')
  async assignRoles(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: AssignRoleDto,
  ) {
    return this.schoolUsersService.assignRoles(caller, schoolId, userId, dto);
  }
}

