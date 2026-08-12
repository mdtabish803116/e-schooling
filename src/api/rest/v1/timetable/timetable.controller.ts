import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  TimetableService,
  type AssignSlotPayload,
  type CreatePeriodPayload,
  type SubstituteTeacherPayload,
  type TimetableEventPayload,
} from '../../../../services/timetable/timetable.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('Timetable Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @ApiOperation({ summary: 'Get all timetables' })
  @Get('timetables')
  async getTimetables(@Param('schoolId') schoolId: string) {
    return this.timetableService.getTimetables(schoolId);
  }

  @ApiOperation({ summary: 'Create a draft timetable' })
  @Post('timetables')
  async createTimetable(
    @Param('schoolId') schoolId: string,
    @Body('name') name: string,
  ) {
    return this.timetableService.createTimetable(schoolId, name);
  }

  @ApiOperation({ summary: 'Publish a timetable' })
  @Post('timetables/:id/publish')
  async publishTimetable(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.timetableService.publishTimetable(schoolId, id);
  }

  @ApiOperation({ summary: 'Clone a timetable' })
  @Post('timetables/:id/clone')
  async cloneTimetable(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.timetableService.cloneTimetable(schoolId, id);
  }

  @ApiOperation({ summary: 'Get all periods' })
  @Get('periods')
  async getPeriods(@Param('schoolId') schoolId: string) {
    return this.timetableService.getPeriods(schoolId);
  }

  @ApiOperation({ summary: 'Create a period' })
  @Post('periods')
  async createPeriod(
    @Param('schoolId') schoolId: string,
    @Body() payload: CreatePeriodPayload,
  ) {
    return this.timetableService.createPeriod(schoolId, payload);
  }

  @ApiOperation({ summary: 'Get all timetable slots' })
  @Get('timetable-slots')
  async getTimetableSlots(@Param('schoolId') schoolId: string) {
    return this.timetableService.getTimetableSlots(schoolId);
  }

  @ApiOperation({ summary: 'Assign timetable slot' })
  @Post('timetable-slots')
  async assignSlot(
    @Param('schoolId') schoolId: string,
    @Body() payload: AssignSlotPayload,
  ) {
    return this.timetableService.assignSlot(schoolId, payload);
  }

  @ApiOperation({ summary: 'Update timetable slot' })
  @Put('timetable-slots/:id')
  async updateSlot(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: AssignSlotPayload,
  ) {
    return this.timetableService.updateSlot(schoolId, id, payload);
  }

  @ApiOperation({ summary: 'Delete timetable slot' })
  @Delete('timetable-slots/:id')
  async deleteSlot(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteSlot(schoolId, id);
  }

  @ApiOperation({ summary: 'Get teacher specific timetable' })
  @Get('teachers/:teacherId/timetable')
  async getTeacherTimetable(
    @Param('schoolId') schoolId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.timetableService.getTeacherTimetable(schoolId, teacherId);
  }

  @ApiOperation({ summary: 'Get class specific timetable' })
  @Get('classes/:classId/timetable')
  async getClassTimetable(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
  ) {
    return this.timetableService.getClassTimetable(schoolId, classId);
  }

  @ApiOperation({ summary: 'Get student specific timetable' })
  @Get('students/:studentId/timetable')
  async getStudentTimetable(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.timetableService.getStudentTimetable(schoolId, studentId);
  }

  @ApiOperation({ summary: 'Get timetable conflicts' })
  @Get('timetable/conflicts')
  async getConflicts(@Param('schoolId') schoolId: string) {
    return this.timetableService.validateConflicts(schoolId);
  }

  @ApiOperation({ summary: 'Get timetable dashboard summary' })
  @Get('timetable/dashboard')
  async getDashboardSummary(@Param('schoolId') schoolId: string) {
    return this.timetableService.getDashboardSummary(schoolId);
  }

  @ApiOperation({ summary: 'Assign substitute teacher' })
  @Post('substitute-teachers')
  async assignSubstituteTeacher(
    @Param('schoolId') schoolId: string,
    @Body() payload: SubstituteTeacherPayload,
  ) {
    return this.timetableService.assignSubstituteTeacher(schoolId, payload);
  }

  @ApiOperation({ summary: 'Get all calendar events' })
  @Get('timetable/events')
  async getEvents(@Param('schoolId') schoolId: string) {
    return this.timetableService.getEvents(schoolId);
  }

  @ApiOperation({ summary: 'Create a calendar event' })
  @Post('timetable/events')
  async addEvent(
    @Param('schoolId') schoolId: string,
    @Body() payload: TimetableEventPayload,
  ) {
    return this.timetableService.addEvent(schoolId, payload);
  }

  @ApiOperation({ summary: 'Update a calendar event' })
  @Put('timetable/events/:id')
  async updateEvent(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: Partial<TimetableEventPayload>,
  ) {
    return this.timetableService.updateEvent(schoolId, id, payload);
  }

  @ApiOperation({ summary: 'Delete a calendar event' })
  @Delete('timetable/events/:id')
  async deleteEvent(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteEvent(schoolId, id);
  }

  @ApiOperation({ summary: 'Get timetable settings' })
  @Get('timetable/settings')
  async getSettings(
    @Param('schoolId') schoolId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.timetableService.getTimetableSettings(schoolId, sessionId);
  }

  @ApiOperation({ summary: 'Update timetable settings' })
  @Put('timetable/settings')
  async updateSettings(
    @Param('schoolId') schoolId: string,
    @Body() payload: any,
  ) {
    return this.timetableService.upsertTimetableSettings(schoolId, payload);
  }
}
