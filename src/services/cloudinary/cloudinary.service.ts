import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageService } from '../../shared/storage/storage.service';

@Injectable()
export class CloudinaryService extends StorageService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const toDataUrl = () => {
      const mime = file.mimetype || 'image/png';
      const base64 = file.buffer
        ? file.buffer.toString('base64')
        : '';
      return `data:${mime};base64,${base64}`;
    };

    return new Promise((resolve) => {
      const uploadOptions: any = { folder: 'e-school', resource_type: 'auto' };

      if (file.path) {
        cloudinary.uploader.upload(
          file.path,
          uploadOptions,
          (error, result) => {
            if (error || !result?.secure_url) {
              return resolve(toDataUrl());
            }
            resolve(result.secure_url);
          },
        );
      } else if (file.buffer) {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error || !result?.secure_url) {
              return resolve(toDataUrl());
            }
            resolve(result.secure_url);
          })
          .end(file.buffer);
      } else {
        resolve(toDataUrl());
      }
    });
  }
}
