import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateAnnouncementDto } from '../../../../interfaces/request/announcement/create-announcement.dto';
import { ActionEnum, ResourceEnum } from '../../../../models/enums/enums';
import {
  AnnouncementsService,
} from '../../../../services/announcements/announcements.service';
import { CurrentAcademicSession } from '../../../../shared/decorators/current-academic-session.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';

@ApiTags('Announcements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('schools/:schoolId')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'Get all announcements for a school' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('announcements')
  async getAnnouncements(
    @Param('schoolId') schoolId: string,
    @Query() filters: Record<string, any>,
  ) {
    return this.announcementsService.getAnnouncements(schoolId, filters);
  }

  @ApiOperation({ summary: 'Get announcement by ID' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('announcements/:id')
  async getAnnouncementById(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.announcementsService.getAnnouncementById(schoolId, id);
  }

  @ApiOperation({ summary: 'Create a new announcement' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.CREATE)
  @Post('announcements')
  async createAnnouncement(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('academicSessionId') querySessionId: string | undefined,
    @Body() dto: CreateAnnouncementDto,
  ) {
    if (!dto.academicSessionId) {
      dto.academicSessionId = querySessionId || sessionFromHeader || undefined;
    }
    return this.announcementsService.createAnnouncement(
      schoolId,
      dto,
      user.id,
      user.email || 'School Admin',
      user.actorType === 'school_owner' ? 'School Owner' : 'School Admin',
    );
  }

  @ApiOperation({ summary: 'Update an announcement' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.UPDATE)
  @Patch('announcements/:id')
  async updateAnnouncementPatch(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: Partial<CreateAnnouncementDto>,
  ) {
    return this.announcementsService.updateAnnouncement(
      schoolId,
      id,
      dto,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Update an announcement (PUT)' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.UPDATE)
  @Put('announcements/:id')
  async updateAnnouncementPut(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: Partial<CreateAnnouncementDto>,
  ) {
    return this.announcementsService.updateAnnouncement(
      schoolId,
      id,
      dto,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Delete an announcement' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.DELETE)
  @Delete('announcements/:id')
  async deleteAnnouncement(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.announcementsService.deleteAnnouncement(schoolId, id, user.id);
  }

  @ApiOperation({ summary: 'Acknowledge an announcement' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Post('announcements/:id/acknowledge')
  async acknowledgeAnnouncement(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.announcementsService.acknowledgeAnnouncement(
      schoolId,
      id,
      user.id,
    );
  }
}
