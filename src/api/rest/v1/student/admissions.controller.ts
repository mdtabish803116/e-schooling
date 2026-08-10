import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('Student Admissions Pipeline & Enquiries')
@ApiBearerAuth('JWT-auth')
@Controller('schools/:schoolId/admissions')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class AdmissionsController {
  constructor(private admissionsService: StudentAdmissionsService) {}

  @ApiOperation({ summary: 'Get all admission enquiries for a school' })
  @Get('enquiries')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async getEnquiries(@Param('schoolId') schoolId: string) {
    return this.admissionsService.getEnquiries(schoolId);
  }

  @ApiOperation({ summary: 'Create a new admission enquiry lead' })
  @Post('enquiries')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  @Feature('STUDENT_MANAGEMENT')
  async createEnquiry(@Param('schoolId') schoolId: string, @Body() dto: any) {
    return this.admissionsService.createEnquiry(schoolId, dto);
  }

  @ApiOperation({ summary: 'Update admission enquiry status' })
  @Patch('enquiries/:enquiryId/status')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async updateEnquiryStatus(
    @Param('schoolId') schoolId: string,
    @Param('enquiryId') enquiryId: string,
    @Body() body: { enquiryStatus: string },
  ) {
    return this.admissionsService.updateEnquiryStatus(
      schoolId,
      enquiryId,
      body.enquiryStatus,
    );
  }

  @ApiOperation({ summary: 'Get all admission applications' })
  @Get('applications')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async getApplications(@Param('schoolId') schoolId: string) {
    return this.admissionsService.getApplications(schoolId);
  }

  @ApiOperation({ summary: 'Update admission application stage' })
  @Patch('applications/:applicationId/stage')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async updateStage(
    @Param('schoolId') schoolId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: { stage: string; remarks?: string },
  ) {
    return this.admissionsService.updateApplicationStage(
      schoolId,
      applicationId,
      body.stage,
      body.remarks,
    );
  }

  @ApiOperation({
    summary: 'Convert admission application candidate to enrolled student',
  })
  @Post('applications/:applicationId/convert')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  @Feature('STUDENT_MANAGEMENT')
  async convertApplicationToStudent(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('applicationId') applicationId: string,
    @Query('academicSessionId') queryAcademicSessionId: string,
    @Body() body: any,
  ) {
    return this.admissionsService.convertApplicationToStudent(
      caller,
      schoolId,
      applicationId,
      body,
      queryAcademicSessionId,
    );
  }
}
