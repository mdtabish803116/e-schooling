import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveVehicleDto {
  @ApiProperty({
    example: 'Bus #01',
    description: 'Vehicle number or bus identifier',
  })
  @IsNotEmpty()
  @IsString()
  vehicleNumber: string;

  @ApiProperty({ example: 'KA-01-AB-1234', description: 'Registration number' })
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  @ApiProperty({
    example: 'Tata Starbus 40-Seater',
    description: 'Vehicle model',
  })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({ example: 40, description: 'Seating capacity' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: '1', description: 'Assigned Driver ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Driver Name' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Driver Phone',
  })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({
    example: 'Suresh P.',
    description: 'Helper / Attendant Name',
  })
  @IsOptional()
  @IsString()
  helperName?: string;

  @ApiPropertyOptional({
    example: '+919845099887',
    description: 'Helper Phone',
  })
  @IsOptional()
  @IsString()
  helperPhone?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Vehicle status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: '2027-12-31',
    description: 'Insurance expiration date',
  })
  @IsOptional()
  @IsString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({
    example: '2027-12-31',
    description: 'Fitness certificate expiration date',
  })
  @IsOptional()
  @IsString()
  fitnessExpiry?: string;

  @ApiPropertyOptional({ example: true, description: 'GPS tracking toggle' })
  @IsOptional()
  @IsBoolean()
  gpsEnabled?: boolean;
}

export class SaveRouteDto {
  @ApiProperty({ example: 'R-01', description: 'Route code' })
  @IsNotEmpty()
  @IsString()
  routeCode: string;

  @ApiProperty({
    example: 'Route 1 - North Zone',
    description: 'Route display name',
  })
  @IsNotEmpty()
  @IsString()
  routeName: string;

  @ApiProperty({
    example: 'Central Bus Stand',
    description: 'Starting location',
  })
  @IsNotEmpty()
  @IsString()
  startLocation: string;

  @ApiProperty({ example: 'School Main Gate', description: 'Ending location' })
  @IsNotEmpty()
  @IsString()
  endLocation: string;

  @ApiPropertyOptional({ example: 15.5, description: 'Distance in kilometers' })
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({ example: 2000, description: 'Base monthly fee' })
  @IsOptional()
  @IsNumber()
  baseMonthlyFee?: number;

  @ApiPropertyOptional({ example: '1', description: 'Assigned Vehicle ID' })
  @IsOptional()
  @IsString()
  assignedVehicleId?: string;

  @ApiPropertyOptional({
    example: 'KA-01-AB-1234',
    description: 'Assigned Vehicle Number',
  })
  @IsOptional()
  @IsString()
  assignedVehicleNumber?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Route status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SaveStopDto {
  @ApiProperty({
    example: 'Market Circle',
    description: 'Pickup point / stop name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '07:30 AM', description: 'Pickup time' })
  @IsOptional()
  @IsString()
  pickupTime?: string;

  @ApiPropertyOptional({ example: '03:30 PM', description: 'Drop time' })
  @IsOptional()
  @IsString()
  dropTime?: string;

  @ApiPropertyOptional({ example: 1, description: 'Sequence order of stop' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceOrder?: number;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Monthly transport fee for this stop',
  })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;
}

export class SaveDriverDto {
  @ApiProperty({ example: 'Robert Smith', description: 'Driver full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Driver phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'DL-1420110012345',
    description: 'Driving license number',
  })
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    example: '2028-12-31',
    description: 'Driving license expiry date',
  })
  @IsNotEmpty()
  @IsString()
  licenseExpiry: string;

  @ApiPropertyOptional({ example: 'Sector 7, Rohini', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '+919845098765',
    description: 'Emergency contact',
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '10', description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2', description: 'Role ID' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ example: 'Driver', description: 'Role Name' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ example: '1', description: 'Assigned Vehicle ID' })
  @IsOptional()
  @IsString()
  assignedVehicleId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Driver status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AllocateStudentDto {
  @ApiProperty({ example: '10', description: 'Student ID' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ example: '1', description: 'Transport Route ID' })
  @IsNotEmpty()
  @IsString()
  routeId: string;

  @ApiProperty({ example: '2', description: 'Pickup Point ID' })
  @IsNotEmpty()
  @IsString()
  pickupPointId: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: 2000, description: 'Monthly fee' })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @ApiPropertyOptional({
    example: 'Alice Johnson',
    description: 'Student Name',
  })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional({ example: '101', description: 'Roll Number' })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({ example: 'Grade 10', description: 'Class Name' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ example: 'Section A', description: 'Section Name' })
  @IsOptional()
  @IsString()
  sectionName?: string;

  @ApiPropertyOptional({
    example: 'Karan Singh',
    description: 'Student Name alias',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '1', description: 'Class ID' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: '2', description: 'Section ID' })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
