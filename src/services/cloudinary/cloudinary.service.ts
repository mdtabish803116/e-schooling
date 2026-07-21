import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageService } from '../../shared/storage/storage.service';

@Injectable()
export class CloudinaryService extends StorageService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = { folder: 'e-school', resource_type: 'auto' };

      if (file.path) {
        cloudinary.uploader.upload(file.path, uploadOptions, (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload returned undefined result'));
          resolve(result.secure_url);
        });
      } else if (file.buffer) {
        cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload returned undefined result'));
          resolve(result.secure_url);
        }).end(file.buffer);
      } else {
        reject(new Error('No file path or buffer found for upload'));
      }
    });
  }
}
