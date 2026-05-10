import { Module, Global } from '@nestjs/common';
import { CloudinaryProvider } from '../../utils/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../services/cloudinary/cloudinary.service';

@Global()
@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
