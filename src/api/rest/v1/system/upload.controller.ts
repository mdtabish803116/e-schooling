import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { StorageService } from '../../../../shared/storage/storage.service';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file/image to upload',
  })
  file: any;
}

@ApiTags('Storage & File Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({
    summary: 'Upload an image or file to storage (Cloudinary/GCS)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload payload',
    type: FileUploadDto,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const url = await this.storageService.uploadFile(file);
    return {
      message: 'File uploaded successfully',
      url,
    };
  }
}
