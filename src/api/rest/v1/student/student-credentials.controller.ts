import { Controller, Get, Post, Patch, Param, Body, UseGuards, NotFoundException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { DataSource, In } from 'typeorm';
import { Student } from '../../../../models/entities/student/student.entity';
import * as bcrypt from 'bcrypt';

@ApiTags('Student Credentials')
@ApiBearerAuth('JWT-auth')
@Controller('student-credentials')
@UseGuards(JwtAuthGuard)
export class StudentCredentialsController {
  constructor(private dataSource: DataSource) {}

  private async generateStudentCode(schoolCode: string): Promise<string> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${schoolCode}-${randomSuffix}`;
    const existing = await this.dataSource.getRepository(Student).findOne({ where: { studentCode: code } });
    if (existing) {
      return this.generateStudentCode(schoolCode);
    }
    return code;
  }

  @ApiOperation({ summary: 'Get student credentials' })
  @Get(':studentId')
  async getCredential(@Param('studentId') studentId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student || !student.studentCode) {
      throw new NotFoundException('Credentials not generated or student not found');
    }
    return {
      id: student.id,
      studentId: student.id,
      username: student.studentCode,
      status: student.isActive ? 'ACTIVE' : 'LOCKED',
      mustChangePassword: false,
      lastLogin: null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  @ApiOperation({ summary: 'Generate credentials' })
  @Post('generate')
  async generateCredential(@Body() body: { studentId: string }) {
    const { studentId } = body;
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId }, relations: ['school'] });
    if (!student) throw new NotFoundException('Student not found');
    if (student.studentCode) {
      return {
        studentId: student.id,
        username: student.studentCode,
        status: student.isActive ? 'ACTIVE' : 'LOCKED',
        temporaryPassword: student.dob || '2010-01-01',
        mustChangePassword: true,
      };
    }

    const schoolCode = student.school?.internalSchoolCode || 'SCH';
    const studentCode = await this.generateStudentCode(schoolCode);
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(student.dob || '2010-01-01', salt);

    student.studentCode = studentCode;
    student.passwordHash = passwordHash;
    await this.dataSource.getRepository(Student).save(student);

    return {
      studentId: student.id,
      username: studentCode,
      status: 'ACTIVE',
      temporaryPassword: student.dob || '2010-01-01',
      mustChangePassword: true,
    };
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post(':studentId/reset-password')
  @HttpCode(200)
  async resetPassword(@Param('studentId') studentId: string, @Body() body?: { password?: string }) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const salt = await bcrypt.genSalt(10);
    const rawPass = body?.password || student.dob || '2010-01-01';
    const passwordHash = await bcrypt.hash(rawPass, salt);

    student.passwordHash = passwordHash;
    await this.dataSource.getRepository(Student).save(student);

    return {
      message: 'Password reset successfully',
      username: student.studentCode,
      temporaryPassword: rawPass,
    };
  }

  @ApiOperation({ summary: 'Lock account' })
  @Patch(':studentId/lock')
  async lockAccount(@Param('studentId') studentId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    student.isActive = false;
    await this.dataSource.getRepository(Student).save(student);
    return {
      studentId: student.id,
      username: student.studentCode,
      status: 'LOCKED',
    };
  }

  @ApiOperation({ summary: 'Unlock account' })
  @Patch(':studentId/unlock')
  async unlockAccount(@Param('studentId') studentId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    student.isActive = true;
    await this.dataSource.getRepository(Student).save(student);
    return {
      studentId: student.id,
      username: student.studentCode,
      status: 'ACTIVE',
    };
  }

  @ApiOperation({ summary: 'Activate account' })
  @Patch(':studentId/activate')
  async activateAccount(@Param('studentId') studentId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    student.isActive = true;
    await this.dataSource.getRepository(Student).save(student);
    return {
      studentId: student.id,
      username: student.studentCode,
      status: 'ACTIVE',
    };
  }

  @ApiOperation({ summary: 'Deactivate account' })
  @Patch(':studentId/deactivate')
  async deactivateAccount(@Param('studentId') studentId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    student.isActive = false;
    await this.dataSource.getRepository(Student).save(student);
    return {
      studentId: student.id,
      username: student.studentCode,
      status: 'LOCKED',
    };
  }

  @ApiOperation({ summary: 'Bulk generate credentials' })
  @Post('bulk-generate')
  @HttpCode(200)
  async bulkGenerate(@Body() body: { studentIds: string[] }) {
    const { studentIds } = body;
    const studentRepo = this.dataSource.getRepository(Student);
    const students = await studentRepo.find({ where: { id: In(studentIds) }, relations: ['school'] });
    
    const results: any[] = [];
    const salt = await bcrypt.genSalt(10);

    for (const student of students) {
      if (!student.studentCode) {
        const schoolCode = student.school?.internalSchoolCode || 'SCH';
        student.studentCode = await this.generateStudentCode(schoolCode);
        student.passwordHash = await bcrypt.hash(student.dob || '2010-01-01', salt);
        await studentRepo.save(student);
      }
      results.push({
        studentId: student.id,
        username: student.studentCode,
        status: student.isActive ? 'ACTIVE' : 'LOCKED',
        temporaryPassword: student.dob || '2010-01-01',
        mustChangePassword: true,
      });
    }

    return results;
  }

  @ApiOperation({ summary: 'Bulk reset passwords' })
  @Post('bulk-reset-password')
  @HttpCode(200)
  async bulkReset(@Body() body: { studentIds: string[] }) {
    const { studentIds } = body;
    const studentRepo = this.dataSource.getRepository(Student);
    const students = await studentRepo.find({ where: { id: In(studentIds) } });

    const salt = await bcrypt.genSalt(10);
    let count = 0;

    for (const student of students) {
      const passwordHash = await bcrypt.hash(student.dob || '2010-01-01', salt);
      student.passwordHash = passwordHash;
      await studentRepo.save(student);
      count++;
    }

    return { count };
  }
}
