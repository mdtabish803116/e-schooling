import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { TakeAttendanceDto } from '../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../interfaces/request/attendance/update-attendance.dto';
import { AttendanceSession } from '../../models/entities/attendance/attendance-session.entity';
import { AttendanceRecord } from '../../models/entities/attendance/attendance-record.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';

@Injectable()
export class AttendanceService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Helper to verify access permissions for school owners and users.
   */
  private async assertAccessToSchool(caller: AuthContext, schoolId: string): Promise<void> {
    if (caller.actorType === 'school_owner') {
      const membership = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
      if (!membership) {
        throw new ForbiddenException('You do not have access to this school');
      }
    } else if (caller.actorType === 'school_user') {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException('You do not belong to this school');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Take bulk attendance inside a secure, atomic transaction.
   */
  async takeAttendance(caller: AuthContext, schoolId: string, dto: TakeAttendanceDto) {
    await this.assertAccessToSchool(caller, schoolId);

    // 1. Verify Class exists and check Daily Attendance Sessions limit
    const parentClass = await this.dataSource.getRepository(Class).findOne({
      where: { id: dto.classId, schoolId, isDeleted: false },
    });
    if (!parentClass) {
      throw new NotFoundException('Class not found');
    }

    if (dto.sessionSlot > parentClass.dailyAttendanceLimit) {
      throw new BadRequestException(
        `Requested session slot ${dto.sessionSlot} exceeds the class daily attendance limit of ${parentClass.dailyAttendanceLimit}`,
      );
    }

    // 2. Prevent duplicate submissions for the same date/slot/class/section
    const existingSession = await this.dataSource.getRepository(AttendanceSession).findOne({
      where: {
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: dto.date,
        sessionSlot: dto.sessionSlot,
        isDeleted: false,
      },
    });
    if (existingSession) {
      throw new BadRequestException(
        `Attendance has already been taken for this class, section, date, and slot (${dto.sessionSlot}). Use update attendance to modify it.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Create & save the Attendance Session
      const session = queryRunner.manager.create(AttendanceSession, {
        schoolId,
        academicSessionId: dto.academicSessionId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: dto.date,
        sessionSlot: dto.sessionSlot,
        takenBy: caller.id,
        createdById: caller.id,
        updatedById: caller.id,
        isActive: true,
        isDeleted: false,
      });

      const savedSession = await queryRunner.manager.save(AttendanceSession, session);

      // 4. Create & save granular student records
      const recordsToInsert = dto.records.map((rec) => {
        return queryRunner.manager.create(AttendanceRecord, {
          sessionId: savedSession.id,
          studentEnrollmentId: rec.studentEnrollmentId,
          attendanceMark: rec.attendanceMark,
          remarks: rec.remarks || '',
          createdById: caller.id,
          updatedById: caller.id,
          isActive: true,
          isDeleted: false,
        });
      });

      const savedRecords = await queryRunner.manager.save(AttendanceRecord, recordsToInsert);

      await queryRunner.commitTransaction();

      return {
        message: 'Attendance submitted successfully',
        sessionId: savedSession.id,
        recordsSaved: savedRecords.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Bulk update student attendance selectively inside a transaction.
   */
  async updateAttendance(caller: AuthContext, schoolId: string, sessionId: string, dto: UpdateAttendanceDto) {
    await this.assertAccessToSchool(caller, schoolId);

    // 1. Confirm session exists
    const session = await this.dataSource.getRepository(AttendanceSession).findOne({
      where: { id: sessionId, schoolId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recordRepo = queryRunner.manager.getRepository(AttendanceRecord);
      const updatedCount = dto.records.length;

      // 2. Selectively update specific records
      for (const rec of dto.records) {
        const existingRecord = await recordRepo.findOne({
          where: { id: rec.id, sessionId, isDeleted: false },
        });

        if (!existingRecord) {
          throw new NotFoundException(`Attendance record with ID ${rec.id} not found in this session`);
        }

        if (rec.attendanceMark !== undefined) {
          existingRecord.attendanceMark = rec.attendanceMark;
        }
        if (rec.remarks !== undefined) {
          existingRecord.remarks = rec.remarks;
        }
        if (rec.isActive !== undefined) {
          existingRecord.isActive = rec.isActive;
        }

        existingRecord.updatedById = caller.id;
        await recordRepo.save(existingRecord);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Attendance updated successfully',
        sessionId,
        recordsUpdatedCount: updatedCount,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAttendanceSession(
    caller: AuthContext,
    schoolId: string,
    query: { classId: string; sectionId: string; date: string; sessionSlot: number }
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const session = await this.dataSource.getRepository(AttendanceSession).findOne({
      where: {
        schoolId,
        classId: query.classId,
        sectionId: query.sectionId,
        date: query.date,
        sessionSlot: Number(query.sessionSlot),
        isDeleted: false,
      },
    });

    if (!session) {
      return null;
    }

    const records = await this.dataSource.getRepository(AttendanceRecord).find({
      where: {
        sessionId: session.id,
        isDeleted: false,
      },
    });

    return {
      session,
      records,
    };
  }
}
