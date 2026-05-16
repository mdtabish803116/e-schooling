import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentAdmissionDto {
  @ApiProperty({ example: 'Amit', description: 'First name of the student' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Kumar', description: 'Last name of the student', required: false })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({ example: 'Male', description: 'Gender of the student' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '2010-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty({ example: '+919876543210', description: 'Contact phone', required: false })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({ example: 'amit@gmail.com', description: 'Email address', required: false })
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({ example: 'Sanjay Kumar', description: 'Father or Mother name' })
  @IsString()
  @IsNotEmpty()
  parentName: string;

  @ApiProperty({ example: '+919988776655', description: 'Parent contact phone', required: false })
  @IsString()
  @IsOptional()
  parentPhone: string;

  @ApiProperty({ example: 'Sector 5, Noida', description: 'Residential address', required: false })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({ example: '1', description: 'ID of the class' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: '1', description: 'ID of the section' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: '2024', description: 'ID of the academic session' })
  @IsString()
  @IsNotEmpty()
  academicSessionId: string;

  @ApiProperty({ example: 'ADM-101', description: 'Custom admission number', required: false })
  @IsString()
  @IsOptional()
  admissionNumber: string;

  @ApiProperty({ example: '10', description: 'Role ID to assign to the student' })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
