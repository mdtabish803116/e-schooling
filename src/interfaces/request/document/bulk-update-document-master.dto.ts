import { IsArray, IsString, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateDocumentMasterDto {
  @ApiProperty({ description: 'Array of Document Master IDs', example: ['1', '2'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ description: 'Patch payload', example: { isActive: false } })
  @IsObject()
  @IsNotEmpty()
  patch: Record<string, any>;
}
