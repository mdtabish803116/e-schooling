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
import { CreateClassDto } from '../../../../interfaces/request/academic/create-class.dto';
import { UpdateClassDto } from '../../../../interfaces/request/academic/update-class.dto';
import { CreateSectionDto } from '../../../../interfaces/request/academic/create-section.dto';
import { UpdateSectionDto } from '../../../../interfaces/request/academic/update-section.dto';
import { UpdateSubjectDto } from '../../../../interfaces/request/academic/update-subject.dto';
import { TransferStudentsDto } from '../../../../interfaces/request/academic/transfer-students.dto';

@ApiTags('Academic Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ACADEMIC_MANAGEMENT')
@Controller('schools/:schoolId/academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // CLASSES
  @ApiOperation({ summary: 'Create a new class' })
  @Permission(PermissionKeyEnum.CLASSES_CREATE)
  @Post('classes')
  async createClass(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateClassDto
  ) {
    return this.academicService.createClass(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all classes' })
  @Permission(PermissionKeyEnum.CLASSES_VIEW)
  @Get('classes')
  async getClasses(@Param('schoolId') schoolId: string) {
    return this.academicService.getClasses(schoolId);
  }

  @ApiOperation({ summary: 'Update a class' })
  @Permission(PermissionKeyEnum.CLASSES_UPDATE)
  @Patch('classes/:id')
  async updateClass(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateClassDto
  ) {
    return this.academicService.updateClass(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a class' })
  @Permission(PermissionKeyEnum.CLASSES_DELETE)
  @Delete('classes/:id')
  async deleteClass(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext
  ) {
    return this.academicService.deleteClass(schoolId, id, user.id);
  }

  // SECTIONS
  @ApiOperation({ summary: 'Create a new section' })
  @Permission(PermissionKeyEnum.SECTIONS_CREATE)
  @Post('sections')
  async createSection(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateSectionDto
  ) {
    return this.academicService.createSection(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all sections' })
  @Permission(PermissionKeyEnum.SECTIONS_VIEW)
  @Get('sections')
  async getSections(
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string
  ) {
    return this.academicService.getSections(schoolId, classId);
  }

  @ApiOperation({ summary: 'Update a section' })
  @Permission(PermissionKeyEnum.SECTIONS_UPDATE)
  @Patch('sections/:id')
  async updateSection(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateSectionDto
  ) {
    return this.academicService.updateSection(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Bulk transfer students to a section' })
  @Permission(PermissionKeyEnum.SECTIONS_UPDATE)
  @Patch('sections/transfer-students')
  async transferStudents(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: TransferStudentsDto
  ) {
    return this.academicService.transferStudents(schoolId, dto, user.id);
  }

  // SUBJECTS
  @ApiOperation({ summary: 'Create a new subject' })
  @Permission(PermissionKeyEnum.SUBJECTS_CREATE)
  @Post('subjects')
  async createSubject(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: any
  ) {
    return this.academicService.createSubject(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all subjects' })
  @Permission(PermissionKeyEnum.SUBJECTS_VIEW)
  @Get('subjects')
  async getSubjects(@Param('schoolId') schoolId: string) {
    return this.academicService.getSubjects(schoolId);
  }

  @ApiOperation({ summary: 'Update a subject' })
  @Permission(PermissionKeyEnum.SUBJECTS_UPDATE)
  @Patch('subjects/:id')
  async updateSubject(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateSubjectDto
  ) {
    return this.academicService.updateSubject(schoolId, id, dto, user.id);
  }

  // MAPPINGS
  @ApiOperation({ summary: 'Map subject to class and section' })
  @Permission(PermissionKeyEnum.ACADEMIC_MAPPING_MANAGE)
  @Post('mappings')
  async assignMapping(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: any
  ) {
    return this.academicService.assignSubjectToClassSection(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get academic mappings' })
  @Permission(PermissionKeyEnum.ACADEMIC_MAPPING_VIEW)
  @Get('mappings')
  async getMappings(
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.academicService.getMappings(schoolId, classId, sectionId);
  }
}
