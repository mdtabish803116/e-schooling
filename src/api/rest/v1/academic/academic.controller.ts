import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CurrentAcademicSession } from '../../../../shared/decorators/current-academic-session.decorator';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { AcademicService } from '../../../../services/academic/academic.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import { CreateClassDto } from '../../../../interfaces/request/academic/create-class.dto';
import { UpdateClassDto } from '../../../../interfaces/request/academic/update-class.dto';
import { CreateSectionDto } from '../../../../interfaces/request/academic/create-section.dto';
import { UpdateSectionDto } from '../../../../interfaces/request/academic/update-section.dto';
import { UpdateSubjectDto } from '../../../../interfaces/request/academic/update-subject.dto';
import { TransferStudentsDto } from '../../../../interfaces/request/academic/transfer-students.dto';
import { CreateAcademicSessionDto } from '../../../../interfaces/request/academic/create-academic-session.dto';
import { UpdateAcademicSessionDto } from '../../../../interfaces/request/academic/update-academic-session.dto';
import { CreateRoomDto } from '../../../../interfaces/request/academic/create-room.dto';
import { UpdateRoomDto } from '../../../../interfaces/request/academic/update-room.dto';
import { AllocateRoomDto } from '../../../../interfaces/request/academic/allocate-room.dto';

@ApiTags('Academic Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ACADEMIC_MANAGEMENT')
@Controller('schools/:schoolId/academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // CLASSES
  @ApiOperation({ summary: 'Create a new class' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.CREATE)
  @Post('classes')
  async createClass(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateClassDto,
  ) {
    return this.academicService.createClass(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all classes' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.VIEW)
  @Get('classes')
  async getClasses(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.academicService.getClasses(schoolId, user, academicSessionId);
  }

  @ApiOperation({ summary: 'Get class details by ID' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.VIEW)
  @Get('classes/:id')
  async getClassDetails(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.getClassDetails(schoolId, id, user);
  }

  @ApiOperation({ summary: 'Update a class' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.UPDATE)
  @Patch('classes/:id')
  async updateClass(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateClassDto,
  ) {
    return this.academicService.updateClass(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a class' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.DELETE)
  @Delete('classes/:id')
  async deleteClass(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.deleteClass(schoolId, id, user.id);
  }

  @ApiOperation({ summary: 'Assign Class Teacher' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.UPDATE)
  @Post('classes/:id/assign-class-teacher')
  async assignClassTeacher(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() body: { teacherId: string | null },
  ) {
    return this.academicService.assignClassTeacher(schoolId, id, body.teacherId, user.id);
  }

  // SECTIONS
  @ApiOperation({ summary: 'Create a new section' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.CREATE)
  @Post('sections')
  async createSection(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateSectionDto,
  ) {
    return this.academicService.createSection(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all sections' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.VIEW)
  @Get('sections')
  async getSections(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Query('classId') classId?: string,
  ) {
    return this.academicService.getSections(schoolId, user, classId);
  }

  @ApiOperation({ summary: 'Get section details by ID' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.VIEW)
  @Get('sections/:id')
  async getSectionDetails(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.getSectionDetails(schoolId, id, user);
  }


  @ApiOperation({ summary: 'Update a section' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.UPDATE)
  @Patch('sections/:id')
  async updateSection(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.academicService.updateSection(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a section' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.DELETE)
  @Delete('sections/:id')
  async deleteSection(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.deleteSection(schoolId, id, user.id);
  }

  @ApiOperation({ summary: 'Assign Section Teacher' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.UPDATE)
  @Post('sections/:id/assign-teacher')
  async assignSectionTeacher(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() body: { classTeacherId: string | null },
  ) {
    return this.academicService.assignSectionTeacher(schoolId, id, body.classTeacherId, user.id);
  }

  @ApiOperation({ summary: 'Bulk transfer students to a section' })
  @Permission(ResourceEnum.SECTIONS, ActionEnum.UPDATE)
  @Patch('sections/transfer-students')
  async transferStudents(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: TransferStudentsDto,
  ) {
    return this.academicService.transferStudents(schoolId, dto, user.id);
  }

  // SUBJECTS
  @ApiOperation({ summary: 'Create a new subject' })
  @Permission(ResourceEnum.SUBJECTS, ActionEnum.CREATE)
  @Post('subjects')
  async createSubject(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: any,
  ) {
    return this.academicService.createSubject(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all subjects' })
  @Permission(ResourceEnum.SUBJECTS, ActionEnum.VIEW)
  @Get('subjects')
  async getSubjects(@Param('schoolId') schoolId: string) {
    return this.academicService.getSubjects(schoolId);
  }

  @ApiOperation({ summary: 'Update a subject' })
  @Permission(ResourceEnum.SUBJECTS, ActionEnum.UPDATE)
  @Patch('subjects/:id')
  async updateSubject(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.academicService.updateSubject(schoolId, id, dto, user.id);
  }

  // MAPPINGS
  @ApiOperation({ summary: 'Map subject to class and section' })
  @Permission(ResourceEnum.ACADEMIC_MAPPING, ActionEnum.UPDATE)
  @Post('mappings')
  async assignMapping(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: any,
  ) {
    return this.academicService.assignSubjectToClassSection(
      schoolId,
      dto,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Get academic mappings' })
  @Permission(ResourceEnum.ACADEMIC_MAPPING, ActionEnum.VIEW)
  @Get('mappings')
  async getMappings(
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.academicService.getMappings(schoolId, classId, sectionId);
  }

  // ACADEMIC SESSIONS
  @ApiOperation({ summary: 'Create a new academic session' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.CREATE)
  @Post('sessions')
  async createAcademicSession(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateAcademicSessionDto,
  ) {
    return this.academicService.createAcademicSession(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all academic sessions for a school' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.VIEW)
  @Get('sessions')
  async getAcademicSessions(@Param('schoolId') schoolId: string) {
    return this.academicService.getAcademicSessions(schoolId);
  }

  @ApiOperation({ summary: 'Get academic session details by ID' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.VIEW)
  @Get('sessions/:id')
  async getAcademicSessionDetails(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.academicService.getAcademicSessionDetails(schoolId, id);
  }

  @ApiOperation({ summary: 'Update an academic session' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Patch('sessions/:id')
  async updateAcademicSession(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateAcademicSessionDto,
  ) {
    return this.academicService.updateAcademicSession(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete an academic session' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.DELETE)
  @Delete('sessions/:id')
  async deleteAcademicSession(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.deleteAcademicSession(schoolId, id, user.id);
  }

  @ApiOperation({ summary: 'Set an academic session as the current active session' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Patch('sessions/:id/set-current')
  async setAsCurrentAcademicSession(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.setAsCurrentAcademicSession(schoolId, id, user.id);
  }

  // ROOMS / CLASSROOMS
  @ApiOperation({ summary: 'Create a new room' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.CREATE)
  @Post('rooms')
  async createRoom(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateRoomDto,
  ) {
    return this.academicService.createRoom(schoolId, dto, user.id);
  }

  @ApiOperation({ summary: 'Get all rooms for a school' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.VIEW)
  @Get('rooms')
  async getRooms(@Param('schoolId') schoolId: string) {
    return this.academicService.getRooms(schoolId);
  }

  @ApiOperation({ summary: 'Get room details by ID' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.VIEW)
  @Get('rooms/:id')
  async getRoomDetails(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.academicService.getRoomById(schoolId, id);
  }

  @ApiOperation({ summary: 'Update a room' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.UPDATE)
  @Patch('rooms/:id')
  async updateRoom(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.academicService.updateRoom(schoolId, id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a room' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.DELETE)
  @Delete('rooms/:id')
  async deleteRoom(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.academicService.deleteRoom(schoolId, id, user.id);
  }

  @ApiOperation({ summary: 'Allocate or unassign a room to a section' })
  @Permission(ResourceEnum.CLASSES, ActionEnum.UPDATE)
  @Post('rooms/:id/allocate')
  async allocateRoom(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: AllocateRoomDto,
  ) {
    return this.academicService.allocateRoom(schoolId, id, dto, user.id);
  }
}
