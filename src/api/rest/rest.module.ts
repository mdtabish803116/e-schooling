import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../modules/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [],
  providers: [],
})
export class RestModule {}
