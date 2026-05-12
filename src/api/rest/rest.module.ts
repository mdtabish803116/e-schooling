import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../modules/cloudinary/cloudinary.module';
import { AuthModule } from './v1/auth/auth.module';
import { SchoolsModule } from './v1/schools/schools.module';
import { SchoolUsersModule } from './v1/school-users/school-users.module';
import { RolesModule } from './v1/roles/roles.module';

@Module({
  imports: [CloudinaryModule, AuthModule, SchoolsModule, SchoolUsersModule, RolesModule],
  controllers: [],
  providers: [],
})
export class RestModule {}
