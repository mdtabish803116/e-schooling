import { Controller, Post, Get, Patch, Delete, Body, Query, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformService } from '../../../../services/platform/platform.service';
import { PlatformUserService } from '../../../../services/platform/platform-user.service';
import { PaginationDto } from '../../../../interfaces/request/common/pagination.dto';
import { CreatePlatformFeatureDto, CreateModuleMasterDto, CreateOperationMasterDto, AssignPermissionDto } from '../../../../interfaces/request/platform/platform-management.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PlatformGuard } from '../../../../shared/guards/platform.guard';
import { PlatformPermissionGuard } from '../../../../shared/guards/platform-permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { PermissionKeyEnum } from '../../../../models/enums/enums';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Platform — Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PlatformGuard, PlatformPermissionGuard)
@Controller('platform/users')
export class PlatformUserController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly userService: PlatformUserService
  ) {}

  // --- Features & Modules ---

  @ApiOperation({ summary: 'Create a new platform feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  @Post('features')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_MANAGE)
  async createFeature(@Body() dto: CreatePlatformFeatureDto, @CurrentUser() caller: AuthContext) {
    return this.platformService.createFeature(dto, caller);
  }

  @ApiOperation({ summary: 'List all platform features' })
  @Get('features')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_VIEW)
  async listFeatures() {
    return this.platformService.listFeatures();
  }

  @ApiOperation({ summary: 'Create a new module' })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @Post('modules')
  @Permission(PermissionKeyEnum.PLATFORM_MODULES_MANAGE)
  async createModule(@Body() dto: CreateModuleMasterDto, @CurrentUser() caller: AuthContext) {
    return this.platformService.createModule(dto, caller);
  }

  @ApiOperation({ summary: 'List all modules' })
  @Get('modules')
  @Permission(PermissionKeyEnum.PLATFORM_MODULES_VIEW)
  async listModules() {
    return this.platformService.listModules();
  }

  @ApiOperation({ summary: 'Create a new operation' })
  @Post('operations')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_MANAGE)
  async createOperation(@Body() dto: CreateOperationMasterDto, @CurrentUser() caller: AuthContext) {
    return this.platformService.createOperation(dto, caller);
  }

  @ApiOperation({ summary: 'List all operations' })
  @Get('operations')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_VIEW)
  async listOperations() {
    return this.platformService.listOperations();
  }

  @ApiOperation({ summary: 'Assign permission (Module + Operation)' })
  @Post('permissions')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_MANAGE)
  async assignPermission(@Body() dto: AssignPermissionDto) {
    return this.platformService.assignPermission(dto);
  }

  @ApiOperation({ summary: 'Soft delete / Deactivate permission mapping' })
  @Delete('permissions/:id')
  @Permission(PermissionKeyEnum.PLATFORM_FEATURES_MANAGE)
  async removePermission(@Param('id') id: string) {
    return this.platformService.removePermission(id);
  }

  // --- Schools & Owners ---

  @ApiOperation({ summary: 'List all schools' })
  @Get('schools')
  @Permission(PermissionKeyEnum.PLATFORM_SCHOOLS_VIEW)
  async listSchools(@Query() query: PaginationDto) {
    return this.userService.listAllSchools(query);
  }

  @ApiOperation({ summary: 'List all school owners' })
  @Get('owners')
  @Permission(PermissionKeyEnum.PLATFORM_OWNERS_VIEW)
  async listOwners(@Query() query: PaginationDto) {
    return this.userService.listAllOwners(query);
  }

  @ApiOperation({ summary: 'Toggle school activation status' })
  @Patch('schools/:schoolId/status')
  @Permission(PermissionKeyEnum.PLATFORM_SCHOOLS_UPDATE)
  async toggleSchool(@Param('schoolId') schoolId: string, @Body('isActive') isActive: boolean) {
    return this.userService.toggleSchoolStatus(schoolId, isActive);
  }

  @ApiOperation({ summary: 'Soft delete a school' })
  @Delete('schools/:schoolId')
  @Permission(PermissionKeyEnum.PLATFORM_SCHOOLS_DELETE)
  async deleteSchool(@Param('schoolId') schoolId: string) {
    return this.userService.deleteSchool(schoolId);
  }

  @ApiOperation({ summary: 'Toggle owner activation status' })
  @Patch('owners/:ownerId/status')
  @Permission(PermissionKeyEnum.PLATFORM_OWNERS_UPDATE)
  async toggleOwner(@Param('ownerId') ownerId: string, @Body('isActive') isActive: boolean) {
    return this.userService.toggleOwnerStatus(ownerId, isActive);
  }

  @ApiOperation({ summary: 'Soft delete a school owner' })
  @Delete('owners/:ownerId')
  @Permission(PermissionKeyEnum.PLATFORM_OWNERS_DELETE)
  async deleteOwner(@Param('ownerId') ownerId: string) {
    return this.userService.deleteOwner(ownerId);
  }

  // --- Global Visibility ---

  @ApiOperation({ summary: 'List all students across schools' })
  @ApiQuery({ name: 'schoolId', required: false })
  @Get('students')
  @Permission(PermissionKeyEnum.PLATFORM_STUDENTS_VIEW)
  async listStudents(@Query() query: PaginationDto, @Query('schoolId') schoolId?: string) {
    return this.userService.listAllStudents({ ...query, schoolId });
  }

  @ApiOperation({ summary: 'List all staff across schools' })
  @ApiQuery({ name: 'schoolId', required: false })
  @Get('staff')
  @Permission(PermissionKeyEnum.PLATFORM_STAFF_VIEW)
  async listStaff(@Query() query: PaginationDto, @Query('schoolId') schoolId?: string) {
    return this.userService.listAllStaff({ ...query, schoolId });
  }

  @ApiOperation({ summary: 'Seed initial platform metadata (internal)' })
  @Post('seed')
  async platformSeed(@Headers('x-api-key') apiKey: string) {
    return this.platformService.seedPlatformData(apiKey);
  }
}
