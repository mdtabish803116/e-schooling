import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class StorageService {
  abstract uploadFile(file: Express.Multer.File): Promise<string>;
}
