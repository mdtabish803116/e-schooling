import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../modules/cloudinary/cloudinary.module';
import { AuthModule } from './v1/auth/auth.module';
import { SchoolsModule } from './v1/schools/schools.module';
import { SchoolUsersModule } from './v1/school-users/school-users.module';
import { RolesModule } from './v1/roles/roles.module';
import { SubscriptionsModule } from './v1/subscriptions/subscriptions.module';
import { EntitlementModule } from './v1/entitlement/entitlement.module';
import { GeoModule } from './v1/geo/geo.module';
import { AcademicModule } from './v1/academic/academic.module';
import { StudentModule } from './v1/student/student.module';
import { SystemModule } from './v1/system/system.module';

@Module({
  imports: [CloudinaryModule, AuthModule, SchoolsModule, SchoolUsersModule, RolesModule, SubscriptionsModule, EntitlementModule, GeoModule, AcademicModule, StudentModule, SystemModule],
  controllers: [],
  providers: [],
})
export class RestModule { }
