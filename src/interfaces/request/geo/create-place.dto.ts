import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaceDto {
  @ApiProperty({
    example: '1',
    description: 'Target District ID reference',
  })
  @IsNotEmpty()
  @IsString()
  districtId: string;

  @ApiProperty({
    example: 'Koregaon Park / Rampur Village',
    description: 'Name of the customized village, city, or block locality',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: '411001',
    description: 'Postal pin code',
  })
  @IsOptional()
  @IsString()
  pincode?: string;
}
