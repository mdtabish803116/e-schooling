import { Module } from '@nestjs/common';
import { SchoolUsersController } from './school-users.controller';
import { SchoolUsersService } from '../../../../services/school-users/school-users.service';
import { RBACModule } from '../school-roles/rbac.module';
import { StaffController } from './staff.controller';
import { StaffCredentialsController } from './staff-credentials.controller';

@Module({
  imports: [RBACModule],
  controllers: [SchoolUsersController, StaffController, StaffCredentialsController],
  providers: [SchoolUsersService],
})
export class SchoolUsersModule {}
