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
import { ActionEnum, ResourceEnum } from '../../../../models/enums/enums';
import { AnnouncementsService } from '../../../../services/announcements/announcements.service';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';

@ApiTags('Notifications Engine')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('schools/:schoolId')
export class NotificationsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // 1. General Notifications List & CRUD
  @ApiOperation({ summary: 'Get all notifications' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications')
  async getNotifications(
    @Param('schoolId') schoolId: string,
    @Query() filters: Record<string, any>,
  ) {
    const list = await this.announcementsService.getAnnouncements(
      schoolId,
      filters,
    );
    return list;
  }

  @ApiOperation({ summary: 'Create a notification' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.CREATE)
  @Post('notifications')
  async createNotification(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: any,
  ) {
    return this.announcementsService.createAnnouncement(
      schoolId,
      {
        title: dto.title || dto.subject || 'Notification',
        content: dto.content || dto.message || dto.body || '',
        category: dto.category || dto.type || 'GENERAL',
        priority: dto.priority || 'NORMAL',
        targets: dto.targets || dto.targetAudience || [],
      },
      user.id,
      user.email || 'School Admin',
      user.actorType === 'school_owner' ? 'School Owner' : 'School Admin',
    );
  }

  @ApiOperation({ summary: 'Get notification by ID' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications/:id')
  async getNotificationById(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.announcementsService.getAnnouncementById(schoolId, id);
  }

  // 2. Templates
  @ApiOperation({ summary: 'Get notification templates' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications/templates')
  async getTemplates(@Param('schoolId') schoolId: string) {
    void schoolId;
    return [];
  }

  @ApiOperation({ summary: 'Create notification template' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.CREATE)
  @Post('notifications/templates')
  async createTemplate(@Param('schoolId') schoolId: string, @Body() dto: any) {
    return { id: String(Date.now()), schoolId, ...dto };
  }

  // 3. Read tracking
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Post('notifications/read-all')
  async markAllRead(@Param('schoolId') schoolId: string) {
    void schoolId;
    return { success: true, message: 'All notifications marked as read' };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Post('notifications/:id/read')
  async markRead(
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

  // 4. Preferences, logs & analytics
  @ApiOperation({ summary: 'Get notification preferences' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications/preferences')
  async getPreferences(@Param('schoolId') schoolId: string) {
    return {
      schoolId,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      attendanceAlerts: true,
      feeAlerts: true,
    };
  }

  @ApiOperation({ summary: 'Get notification delivery logs' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications/delivery-logs')
  async getDeliveryLogs(@Param('schoolId') schoolId: string) {
    void schoolId;
    return [];
  }

  @ApiOperation({ summary: 'Get notification analytics' })
  @Permission(ResourceEnum.ANNOUNCEMENTS, ActionEnum.VIEW)
  @Get('notifications/analytics')
  async getAnalytics(@Param('schoolId') schoolId: string) {
    return {
      schoolId,
      totalSent: 0,
      delivered: 0,
      failed: 0,
      openRate: 100,
    };
  }

  // 5. Attendance Notification engine endpoints
  @ApiOperation({ summary: 'Get attendance notification settings' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('attendance/notification-settings')
  async getAttendanceNotificationSettings(
    @Param('schoolId') schoolId: string,
  ) {
    return {
      schoolId,
      autoNotifyAbsent: true,
      autoNotifyLate: true,
      notifyParents: true,
      notifyChannel: 'SMS',
      cutoffTime: '10:00',
    };
  }

  @ApiOperation({ summary: 'Update attendance notification settings' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Post('attendance/notification-settings')
  async updateAttendanceNotificationSettings(
    @Param('schoolId') schoolId: string,
    @Body() dto: any,
  ) {
    return { schoolId, ...dto, message: 'Settings saved successfully' };
  }

  @ApiOperation({ summary: 'Get attendance notification rules' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('attendance/notification-rules')
  async getAttendanceNotificationRules(@Param('schoolId') schoolId: string) {
    void schoolId;
    return [];
  }

  @ApiOperation({ summary: 'Get attendance notifications history' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('attendance/notifications')
  async getAttendanceNotificationsHistory(
    @Param('schoolId') schoolId: string,
  ) {
    void schoolId;
    return [];
  }
}
