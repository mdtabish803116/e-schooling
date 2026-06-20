import { Module, Global } from '@nestjs/common';
import { CloudinaryProvider } from '../../utils/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../services/cloudinary/cloudinary.service';
import { StorageService } from '../../shared/storage/storage.service';

@Global()
@Module({
  providers: [
    CloudinaryProvider,
    {
      provide: StorageService,
      useClass: CloudinaryService,
    },
  ],
  exports: [CloudinaryProvider, StorageService],
})
export class CloudinaryModule {}
