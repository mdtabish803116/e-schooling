import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
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

@Controller('schools/:schoolId/students/admissions')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class StudentAdmissionsController {
  constructor(private admissionsService: StudentAdmissionsService) {}

  @Post()
  @Permission(PermissionKeyEnum.STUDENTS_ADMISSION)
  @Feature('STUDENTS') 
  async admitStudent(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: StudentAdmissionDto
  ) {
    return this.admissionsService.admitStudent(caller, schoolId, dto);
  }
}
