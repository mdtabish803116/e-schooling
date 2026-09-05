import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from '../../../../services/announcements/announcements.service';
import { RBACModule } from '../school-roles/rbac.module';

import { NotificationsController } from './notifications.controller';

@Module({
  imports: [RBACModule],
  controllers: [AnnouncementsController, NotificationsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
