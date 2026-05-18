import { Module } from '@nestjs/common';
import { SchoolUsersController } from './school-users.controller';
import { SchoolUsersService } from '../../../../services/school-users/school-users.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [SchoolUsersController],
  providers: [SchoolUsersService],
})
export class SchoolUsersModule {}
