import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  UseGuards,
  NotFoundException,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataSource, In } from 'typeorm';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SchoolUser } from '../../../../models/entities/school/school-user.entity';
import { SchoolUserProfile } from '../../../../models/entities/school/school-user-profile.entity';
import { School } from '../../../../models/entities/school/school.entity';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Staff Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller(['staff', 'schools/:schoolId/staff'])
export class StaffController {
  constructor(private dataSource: DataSource) {}

  private getSchoolId(
    headers: any,
    caller: AuthContext,
    paramSchoolId?: string,
  ): string {
    const schoolId =
      paramSchoolId || headers?.['x-school-id'] || caller?.schoolId;
    if (!schoolId) {
      throw new BadRequestException(
        'schoolId must be specified in route parameters, headers or token',
      );
    }
    return String(schoolId);
  }

  @ApiOperation({ summary: 'List all staff in the school context' })
  @Get()
  async listStaff(
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const users = await this.dataSource.getRepository(SchoolUser).find({
      where: { schoolId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });

    const userIds = users.map((u) => u.id).filter(Boolean);
    const profiles =
      userIds.length > 0
        ? await this.dataSource.getRepository(SchoolUserProfile).find({
            where: {
              schoolUserId: In(userIds),
            },
          })
        : [];

    const profilesMap = new Map(profiles.map((p) => [p.schoolUserId, p]));

    return users.map((user) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        schoolId: user.schoolId,
        employeeCode: `EMP-STF-${user.id}`,
        firstName: profile?.firstName || user.name?.split(' ')[0] || '',
        lastName:
          profile?.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: profile?.email || '',
        mobile: user.phone || '',
        photoUrl: profile?.profilePicUrl || undefined,
        designation: profile?.designation || '',
        joiningDate: profile?.joiningDate || '',
        departmentName: profile?.departmentName || '',
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        qualifications: profile?.qualifications || [],
        experience: profile?.experience || [],
        documents: profile?.documents || [],
        assignedClasses: profile?.assignedClasses || [],
        assignedSubjects: profile?.assignedSubjects || [],
        credentials: user.username
          ? {
              username: user.username,
              status: user.isActive ? 'ACTIVE' : 'LOCKED',
            }
          : undefined,
      };
    });
  }

  @ApiOperation({ summary: 'Get staff by ID' })
  @Get(':staffId')
  async getStaffById(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    let profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({
        where: { schoolUserId: staffId },
      });

    if (!profile) {
      profile = new SchoolUserProfile();
      profile.schoolUserId = user.id;
      profile.qualifications = [];
      profile.experience = [];
      profile.documents = [];
      profile.assignedClasses = [];
      profile.assignedSubjects = [];
      await this.dataSource.getRepository(SchoolUserProfile).save(profile);
    }

    return {
      id: user.id,
      schoolId: user.schoolId,
      employeeCode: `EMP-STF-${user.id}`,
      firstName: profile?.firstName || user.name?.split(' ')[0] || '',
      lastName:
        profile?.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      email: profile?.email || '',
      mobile: user.phone || '',
      photoUrl: profile?.profilePicUrl || undefined,
      designation: profile?.designation || '',
      joiningDate: profile?.joiningDate || '',
      departmentName: profile?.departmentName || '',
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      qualifications: profile?.qualifications || [],
      experience: profile?.experience || [],
      documents: profile?.documents || [],
      assignedClasses: profile?.assignedClasses || [],
      assignedSubjects: profile?.assignedSubjects || [],
      credentials: user.username
        ? {
            username: user.username,
            status: user.isActive ? 'ACTIVE' : 'LOCKED',
          }
        : undefined,
    };
  }

  @ApiOperation({ summary: 'Create a new staff member (Onboarding)' })
  @Post()
  async createStaff(
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);

    const user = new SchoolUser();
    user.schoolId = schoolId;
    user.schoolOwnerId =
      caller.actorType === 'school_owner' ? caller.id : (null as any);
    user.name = `${body.firstName} ${body.lastName}`;
    user.phone = body.mobile;

    const isAcademic = ['teacher', 'instructor', 'principal', 'hod'].some(
      (keyword) => body.designation?.toLowerCase().includes(keyword),
    );
    user.userType = isAcademic ? ('academic' as any) : ('non_academic' as any);
    user.isActive = true;
    user.createdById = caller.id;

    const savedUser = await this.dataSource
      .getRepository(SchoolUser)
      .save(user);

    const profile = new SchoolUserProfile();
    profile.schoolUserId = savedUser.id;
    profile.firstName = body.firstName;
    profile.lastName = body.lastName;
    profile.email = body.email;
    profile.designation = body.designation;
    profile.joiningDate = body.joiningDate;
    profile.departmentName = body.departmentName || '';
    profile.qualifications = [];
    profile.experience = [];
    profile.documents = [];
    profile.assignedClasses = [];
    profile.assignedSubjects = [];

    const savedProfile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .save(profile);

    return {
      id: savedUser.id,
      schoolId: savedUser.schoolId,
      employeeCode: `EMP-STF-${savedUser.id}`,
      firstName: savedProfile.firstName,
      lastName: savedProfile.lastName,
      email: savedProfile.email,
      mobile: savedUser.phone,
      designation: savedProfile.designation,
      joiningDate: savedProfile.joiningDate,
      departmentName: savedProfile.departmentName,
      status: 'ACTIVE',
      qualifications: savedProfile.qualifications,
      experience: savedProfile.experience,
      documents: savedProfile.documents,
      assignedClasses: savedProfile.assignedClasses,
      assignedSubjects: savedProfile.assignedSubjects,
    };
  }

  @ApiOperation({ summary: 'Update staff member details' })
  @Put(':staffId')
  async updateStaff(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const profile = await this.dataSource
        .getRepository(SchoolUserProfile)
        .findOne({ where: { schoolUserId: staffId } });
      const first =
        body.firstName !== undefined
          ? body.firstName
          : profile?.firstName || '';
      const last =
        body.lastName !== undefined ? body.lastName : profile?.lastName || '';
      user.name = `${first} ${last}`.trim();
    }
    if (body.mobile !== undefined) user.phone = body.mobile;
    if (body.status !== undefined) user.isActive = body.status === 'ACTIVE';

    await this.dataSource.getRepository(SchoolUser).save(user);

    let profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({
        where: { schoolUserId: staffId },
      });

    if (!profile) {
      profile = new SchoolUserProfile();
      profile.schoolUserId = user.id;
    }

    const fields = [
      'firstName',
      'lastName',
      'email',
      'designation',
      'joiningDate',
      'departmentName',
      'qualifications',
      'experience',
      'documents',
      'assignedClasses',
      'assignedSubjects',
      'profilePicUrl',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        profile[f] = body[f];
      }
    }

    const savedProfile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .save(profile);

    return {
      id: user.id,
      schoolId: user.schoolId,
      employeeCode: `EMP-STF-${user.id}`,
      firstName: savedProfile.firstName,
      lastName: savedProfile.lastName,
      email: savedProfile.email,
      mobile: user.phone,
      photoUrl: savedProfile.profilePicUrl || undefined,
      designation: savedProfile.designation,
      joiningDate: savedProfile.joiningDate,
      departmentName: savedProfile.departmentName,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      qualifications: savedProfile.qualifications || [],
      experience: savedProfile.experience || [],
      documents: savedProfile.documents || [],
      assignedClasses: savedProfile.assignedClasses || [],
      assignedSubjects: savedProfile.assignedSubjects || [],
    };
  }

  @ApiOperation({ summary: 'Archive/Soft-delete staff member' })
  @Delete(':staffId')
  @HttpCode(204)
  async deleteStaff(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    user.isDeleted = true;
    await this.dataSource.getRepository(SchoolUser).save(user);
  }

  @ApiOperation({ summary: 'Add qualification to staff profile' })
  @Post(':staffId/qualifications')
  async addQualification(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const qualifications = profile.qualifications || [];
    qualifications.push(body);
    profile.qualifications = qualifications;
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);

    return this.getStaffById(staffId, headers, caller, paramSchoolId);
  }

  @ApiOperation({ summary: 'Add experience record to staff profile' })
  @Post(':staffId/experience')
  async addExperience(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const experience = profile.experience || [];
    experience.push(body);
    profile.experience = experience;
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);

    return this.getStaffById(staffId, headers, caller, paramSchoolId);
  }

  @ApiOperation({ summary: 'Assign class to staff' })
  @Post(':staffId/assign-class')
  async assignClass(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const assignedClasses = profile.assignedClasses || [];
    assignedClasses.push(body);
    profile.assignedClasses = assignedClasses;
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);

    return this.getStaffById(staffId, headers, caller, paramSchoolId);
  }

  @ApiOperation({ summary: 'Assign subject to staff' })
  @Post(':staffId/assign-subject')
  async assignSubject(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const assignedSubjects = profile.assignedSubjects || [];
    assignedSubjects.push(body);
    profile.assignedSubjects = assignedSubjects;
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);

    return this.getStaffById(staffId, headers, caller, paramSchoolId);
  }

  @ApiOperation({ summary: 'Upload document for staff' })
  @Post(':staffId/documents')
  async uploadDocument(
    @Param('staffId') staffId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Body() body: { file: string; type: string },
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const documents = profile.documents || [];
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: body.file.split('/').pop() || 'document',
      originalName: body.file.split('/').pop() || 'document',
      type: body.type,
      fileUrl: body.file,
      uploadedAt: new Date().toISOString(),
    };
    documents.push(newDoc);
    profile.documents = documents;
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);

    return newDoc;
  }

  @ApiOperation({ summary: 'Delete document for staff' })
  @Delete(':staffId/documents/:documentId')
  @HttpCode(204)
  async deleteDocument(
    @Param('staffId') staffId: string,
    @Param('documentId') documentId: string,
    @Headers() headers: any,
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') paramSchoolId?: string,
  ) {
    const schoolId = this.getSchoolId(headers, caller, paramSchoolId);
    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { id: staffId, schoolId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = await this.dataSource
      .getRepository(SchoolUserProfile)
      .findOne({ where: { schoolUserId: staffId } });
    if (!profile) throw new NotFoundException('Profile details not found');

    const documents = profile.documents || [];
    profile.documents = documents.filter((doc: any) => doc.id !== documentId);
    await this.dataSource.getRepository(SchoolUserProfile).save(profile);
  }
}
