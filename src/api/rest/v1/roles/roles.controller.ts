import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { RolesService } from '../../../../services/roles/roles.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateRoleDto } from '../../../../interfaces/request/role/create-role.dto';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Create a custom role for a school and optionally attach permissions' })
  @Post()
  async createRole(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'List all roles in a school' })
  @Get()
  async listRoles(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.rolesService.listRoles(caller, schoolId);
  }

  @ApiOperation({ summary: 'Intelligently compiles pre-filtered accordion-ready permissions available specifically to this tenant tier' })
  @Get('permissions')
  async listPermissions(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.rolesService.listAccessiblePermissionsForSchool(caller, schoolId);
  }
}

