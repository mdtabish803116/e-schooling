import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActionTypeEnum } from '../../../models/enums/enums';

export class BulkProgressionDto {
  @ApiProperty({
    example: ['1', '2'],
    description: 'IDs of the students to progress',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  studentIds: string[];

  @ApiProperty({
    example: '1',
    description: 'ID of the target academic session (auto-resolved if omitted)',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetSessionId?: string;

  @ApiProperty({ example: '1', description: 'ID of the target class' })
  @IsString()
  @IsNotEmpty()
  targetClassId: string;

  @ApiProperty({ example: '1', description: 'ID of the target section' })
  @IsString()
  @IsNotEmpty()
  targetSectionId: string;

  @ApiProperty({
    example: 'promotion',
    enum: ActionTypeEnum,
    description: 'Progression action type: promotion | demotion | repeat',
  })
  @IsEnum(ActionTypeEnum)
  @IsNotEmpty()
  actionType: ActionTypeEnum;

  @ApiProperty({
    example: 'Passed final exams - bulk promotion',
    description: 'Remarks',
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
