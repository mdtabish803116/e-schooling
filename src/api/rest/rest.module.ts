import { Module } from '@nestjs/common';
import { StorageModule } from '../../modules/storage/storage.module';
import { AuthModule } from './v1/auth/auth.module';
import { SchoolsModule } from './v1/schools/schools.module';
import { SchoolUsersModule } from './v1/school-users/school-users.module';
import { SchoolRolesModule } from './v1/school-roles/school-roles.module';
import { EntitlementModule } from './v1/entitlement/entitlement.module';
import { SubscriptionModule } from './v1/subscription/subscription.module';
import { GeoModule } from './v1/geo/geo.module';
import { AcademicModule } from './v1/academic/academic.module';
import { StudentModule } from './v1/student/student.module';
import { SystemModule } from './v1/system/system.module';
import { PlatformModule } from './v1/platform/platform.module';
import { AttendanceModule } from './v1/attendance/attendance.module';

@Module({
  imports: [StorageModule, AuthModule, SchoolsModule, SchoolUsersModule, SchoolRolesModule, SubscriptionModule, EntitlementModule, GeoModule, AcademicModule, StudentModule, SystemModule, PlatformModule, AttendanceModule],
  controllers: [],
  providers: [],
})
export class RestModule { }
