import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.constants';
import { Config } from '../../config/index';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    return cloudinary.config(Config.getCloudinaryConfig());
  },
};
