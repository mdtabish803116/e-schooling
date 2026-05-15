import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { AcademicService } from '../../../../services/academic/academic.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { PermissionKeyEnum } from '../../../../models/enums/enums';

@ApiTags('Academic Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ACADEMIC_MANAGEMENT')
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // CLASSES
  @ApiOperation({ summary: 'Create a new class' })
  @Permission(PermissionKeyEnum.CLASSES_CREATE)
  @Post('classes')
  async createClass(@CurrentUser() user: AuthContext, @Body() dto: any) {
    return this.academicService.createClass(user.schoolId!, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all classes' })
  @Permission(PermissionKeyEnum.CLASSES_VIEW)
  @Get('classes')
  async getClasses(@CurrentUser() user: AuthContext) {
    return this.academicService.getClasses(user.schoolId!);
  }

  @ApiOperation({ summary: 'Update a class' })
  @Permission(PermissionKeyEnum.CLASSES_UPDATE)
  @Patch('classes/:id')
  async updateClass(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: any) {
    return this.academicService.updateClass(user.schoolId!, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a class' })
  @Permission(PermissionKeyEnum.CLASSES_DELETE)
  @Delete('classes/:id')
  async deleteClass(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.academicService.deleteClass(user.schoolId!, id, user.id);
  }

  // SECTIONS
  @ApiOperation({ summary: 'Create a new section' })
  @Permission(PermissionKeyEnum.SECTIONS_CREATE)
  @Post('sections')
  async createSection(@CurrentUser() user: AuthContext, @Body() dto: any) {
    return this.academicService.createSection(user.schoolId!, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all sections' })
  @Permission(PermissionKeyEnum.SECTIONS_VIEW)
  @Get('sections')
  async getSections(@CurrentUser() user: AuthContext, @Query('classId') classId?: string) {
    return this.academicService.getSections(user.schoolId!, classId);
  }

  // SUBJECTS
  @ApiOperation({ summary: 'Create a new subject' })
  @Permission(PermissionKeyEnum.SUBJECTS_CREATE)
  @Post('subjects')
  async createSubject(@CurrentUser() user: AuthContext, @Body() dto: any) {
    return this.academicService.createSubject(user.schoolId!, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all subjects' })
  @Permission(PermissionKeyEnum.SUBJECTS_VIEW)
  @Get('subjects')
  async getSubjects(@CurrentUser() user: AuthContext) {
    return this.academicService.getSubjects(user.schoolId!);
  }

  // MAPPINGS
  @ApiOperation({ summary: 'Map subject to class and section' })
  @Permission(PermissionKeyEnum.ACADEMIC_MAPPING_MANAGE)
  @Post('mappings')
  async assignMapping(@CurrentUser() user: AuthContext, @Body() dto: any) {
    return this.academicService.assignSubjectToClassSection(user.schoolId!, dto, user.id);
  }

  @ApiOperation({ summary: 'Get academic mappings' })
  @Permission(PermissionKeyEnum.ACADEMIC_MAPPING_VIEW)
  @Get('mappings')
  async getMappings(
    @CurrentUser() user: AuthContext,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.academicService.getMappings(user.schoolId!, classId, sectionId);
  }
}
