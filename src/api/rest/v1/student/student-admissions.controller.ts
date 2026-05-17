import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionDto } from '../../../../interfaces/request/student/student-admission.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { PermissionKeyEnum } from '../../../../models/enums/enums';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Student Admissions')
@ApiBearerAuth('JWT-auth')
@Controller('schools/:schoolId/students/admissions')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class StudentAdmissionsController {
  constructor(private admissionsService: StudentAdmissionsService) {}

  @ApiOperation({ summary: 'Admit a new student to the school' })
  @ApiResponse({ 
    status: 201, 
    description: 'Student admitted successfully',
    schema: {
      example: {
        id: '10',
        studentCode: 'SCH-BLUE-2024-001',
        firstName: 'Amit',
        lastName: 'Kumar',
        status: 'active'
      }
    }
  })
  @Post()
  @Permission(PermissionKeyEnum.STUDENTS_ADMISSION)
  @Feature('STUDENT_MANAGEMENT') 
  async admitStudent(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: StudentAdmissionDto
  ) {
    return this.admissionsService.admitStudent(caller, schoolId, dto);
  }
}
