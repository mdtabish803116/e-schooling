import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SchoolsService } from '../../../../services/schools/schools.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { CreateSchoolDto } from '../../../../interfaces/request/school/create-school.dto';
import { UpdateSchoolDto } from '../../../../interfaces/request/school/update-school.dto';

@ApiTags('Schools Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

  @ApiOperation({ summary: 'Create a new school (post-login)' })
  @ApiResponse({ 
    status: 201, 
    description: 'School created successfully',
    schema: {
      example: {
        id: '1',
        schoolName: 'Vidya Jyoti Public School',
        internalSchoolCode: 'SCH-VIDYA-5542',
        email: 'school@vidyajyoti.com',
        isActive: true
      }
    }
  })
  @Post()
  async createSchool(
    @CurrentUser() caller: AuthContext,
    @Body() dto: CreateSchoolDto,
  ) {
    return this.schoolsService.createSchool(caller, dto);
  }

  @ApiOperation({ summary: 'List all schools associated with the logged-in owner account' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of schools retrieved',
    schema: {
      example: [
        { id: '1', schoolName: 'Vidya Jyoti Public School', internalSchoolCode: 'SCH-VIDYA-5542', isActive: true },
        { id: '2', schoolName: 'St. Xavier High', internalSchoolCode: 'SCH-XAVIER-1123', isActive: false }
      ]
    }
  })
  @Get()
  async listSchools(@CurrentUser() caller: AuthContext) {
    return this.schoolsService.listSchools(caller);
  }

  @ApiOperation({ summary: 'Get a full snapshot of all schools, plans, and permissions (Owner Dashboard)' })
  @Get('context/master')
  async getMasterContext(@CurrentUser() caller: AuthContext) {
    return this.schoolsService.getOwnerMasterContext(caller);
  }

  @ApiOperation({ summary: 'Get a full snapshot specifically for a single school under the owner context' })
  @Get(':schoolId/context/master')
  async getSingleSchoolMasterContext(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext
  ) {
    return this.schoolsService.getSingleSchoolMasterContext(caller, schoolId);
  }

  @ApiOperation({ summary: 'Get details of a specific school' })
  @ApiResponse({ 
    status: 200, 
    description: 'School details retrieved',
    schema: {
      example: {
        id: '1',
        schoolName: 'Vidya Jyoti Public School',
        internalSchoolCode: 'SCH-VIDYA-5542',
        addressCity: 'New Delhi',
        totalTeachers: 45,
        isActive: true
      }
    }
  })
  @Get(':schoolId')
  async getSchool(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
  ) {
    return this.schoolsService.getSchool(caller, schoolId);
  }

  @ApiOperation({ summary: 'Update details of a specific school' })
  @ApiResponse({ 
    status: 200, 
    description: 'School updated successfully',
    schema: {
      example: {
        id: '1',
        schoolName: 'Vidya Jyoti Global School',
        updatedAt: '2024-05-15T10:00:00Z'
      }
    }
  })
  @Patch(':schoolId')
  async updateSchool(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.schoolsService.updateSchool(caller, schoolId, dto);
  }
}

