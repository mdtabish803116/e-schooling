import { Module } from '@nestjs/common';
import { SchoolUsersController } from './school-users.controller';
import { SchoolUsersService } from '../../../../services/school-users/school-users.service';

@Module({
  controllers: [SchoolUsersController],
  providers: [SchoolUsersService],
})
export class SchoolUsersModule {}
