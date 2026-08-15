import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { AcademicService } from '../../../../services/academic/academic.service';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Academic Years')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class AcademicYearsController {
  constructor(private readonly academicService: AcademicService) {}

  private resolveSchoolId(
    req: any,
    user: AuthContext,
    paramSchoolId?: string,
  ): string {
    if (
      paramSchoolId &&
      paramSchoolId !== 'undefined' &&
      paramSchoolId !== 'null'
    ) {
      return paramSchoolId;
    }
    const headerSchoolId = req?.headers?.['x-school-id'];
    if (
      headerSchoolId &&
      headerSchoolId !== 'undefined' &&
      headerSchoolId !== 'null'
    ) {
      return String(headerSchoolId);
    }
    if (user?.schoolId) {
      return String(user.schoolId);
    }
    return '1';
  }

  private mapSession(session: any) {
    if (!session) return null;
    const status = session.isCurrent
      ? 'ACTIVE'
      : session.isActive !== false
        ? 'INACTIVE'
        : 'CLOSED';

    return {
      ...session,
      id: session.id,
      schoolId: session.schoolId,
      yearName: session.name || session.yearName || '',
      name: session.name || session.yearName || '',
      startDate: session.startDate,
      endDate: session.endDate,
      isCurrent: Boolean(session.isCurrent),
      status: session.status || status,
    };
  }

  @ApiOperation({ summary: 'Get all academic years' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.VIEW)
  @Get([
    'academic-years',
    'schools/:schoolId/academic-years',
    'schools/:schoolId/academic/sessions',
  ])
  async getAcademicYears(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const list = await this.academicService.getAcademicSessions(schoolId);
    return list.map((item) => this.mapSession(item));
  }

  @ApiOperation({ summary: 'Get current active academic year' })
  @Get([
    'academic-years/current',
    'schools/:schoolId/academic-years/current',
    'schools/:schoolId/academic/sessions/current',
  ])
  async getCurrentAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const current =
      await this.academicService.getCurrentAcademicSession(schoolId);
    return this.mapSession(current);
  }

  @ApiOperation({ summary: 'Get academic year by ID' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.VIEW)
  @Get([
    'academic-years/:id',
    'schools/:schoolId/academic-years/:id',
    'schools/:schoolId/academic/sessions/:id',
  ])
  async getAcademicYearById(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const session = await this.academicService.getAcademicSessionDetails(
      schoolId,
      id,
    );
    return this.mapSession(session);
  }

  @ApiOperation({ summary: 'Create a new academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.CREATE)
  @Post([
    'academic-years',
    'schools/:schoolId/academic-years',
    'schools/:schoolId/academic/sessions',
  ])
  async createAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const sessionName = body.yearName || body.name || '2026 - 2027';

    const created = await this.academicService.createAcademicSession(
      schoolId,
      {
        name: sessionName,
        startDate: body.startDate,
        endDate: body.endDate,
        isCurrent: Boolean(body.isCurrent),
        isActive: body.isActive !== false,
      },
      user?.id || '1',
    );

    return this.mapSession(created);
  }

  @ApiOperation({ summary: 'Update an academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Put([
    'academic-years/:id',
    'schools/:schoolId/academic-years/:id',
    'schools/:schoolId/academic/sessions/:id',
  ])
  async updateAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const sessionName = body.yearName || body.name;

    const updated = await this.academicService.updateAcademicSession(
      schoolId,
      id,
      {
        ...(sessionName ? { name: sessionName } : {}),
        ...(body.startDate ? { startDate: body.startDate } : {}),
        ...(body.endDate ? { endDate: body.endDate } : {}),
        ...(body.isCurrent !== undefined
          ? { isCurrent: Boolean(body.isCurrent) }
          : {}),
        ...(body.isActive !== undefined
          ? { isActive: Boolean(body.isActive) }
          : {}),
      },
      user?.id || '1',
    );

    return this.mapSession(updated);
  }

  @ApiOperation({ summary: 'Patch update an academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Patch([
    'academic-years/:id',
    'schools/:schoolId/academic-years/:id',
    'schools/:schoolId/academic/sessions/:id',
  ])
  async patchAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    return this.updateAcademicYear(req, user, id, body, paramSchoolId);
  }

  @ApiOperation({ summary: 'Delete an academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.DELETE)
  @Delete([
    'academic-years/:id',
    'schools/:schoolId/academic-years/:id',
    'schools/:schoolId/academic/sessions/:id',
  ])
  async deleteAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    return await this.academicService.deleteAcademicSession(
      schoolId,
      id,
      user?.id || '1',
    );
  }

  @ApiOperation({ summary: 'Activate / set as current active academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Patch([
    'academic-years/:id/activate',
    'academic-years/:id/set-current',
    'schools/:schoolId/academic-years/:id/activate',
    'schools/:schoolId/academic/sessions/:id/activate',
    'schools/:schoolId/academic/sessions/:id/set-current',
  ])
  async activateAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const active = await this.academicService.setAsCurrentAcademicSession(
      schoolId,
      id,
      user?.id || '1',
    );
    return this.mapSession(active);
  }

  @ApiOperation({ summary: 'Close an academic year' })
  @Permission(ResourceEnum.ACADEMIC_SESSIONS, ActionEnum.UPDATE)
  @Patch([
    'academic-years/:id/close',
    'schools/:schoolId/academic-years/:id/close',
    'schools/:schoolId/academic/sessions/:id/close',
  ])
  async closeAcademicYear(
    @Req() req: any,
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, user, paramSchoolId);
    const closed = await this.academicService.updateAcademicSession(
      schoolId,
      id,
      { isCurrent: false, isActive: false },
      user?.id || '1',
    );
    return this.mapSession(closed);
  }
}
