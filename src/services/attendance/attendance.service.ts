import { Injectable, OnModuleInit, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { TakeAttendanceDto } from '../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../interfaces/request/attendance/update-attendance.dto';
import { LockAttendanceDto, UnlockAttendanceDto } from '../../interfaces/request/attendance/lock-attendance.dto';
import { AttendanceSession } from '../../models/entities/attendance/attendance-session.entity';
import { AttendanceRecord } from '../../models/entities/attendance/attendance-record.entity';
import { AttendanceLock } from '../../models/entities/attendance/attendance-lock.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';

@Injectable()
export class AttendanceService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."attendance_locks" (
          "id" BIGSERIAL PRIMARY KEY,
          "school_id" bigint NOT NULL,
          "date" date NOT NULL,
          "is_locked" boolean NOT NULL DEFAULT true,
          "locked_by" varchar,
          "created_by_id" bigint,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_attendance_locks_school_date" ON "e_schooling"."attendance_locks" ("school_id", "date");
      `);
    } catch (e) {
      console.warn('Auto-creating attendance_locks table:', e);
    }
  }

  async assertDateNotLocked(schoolId: string, date: string): Promise<void> {
    const lock = await this.dataSource.getRepository(AttendanceLock).findOne({
      where: { schoolId, date, isLocked: true },
    });
    if (lock) {
      const lockedBy = lock.lockedBy || 'Admin';
      throw new BadRequestException(
        `Attendance for ${date} is locked by ${lockedBy}. Please ask an administrator to unlock this attendance date before taking or updating attendance.`,
      );
    }
  }

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
    await this.assertDateNotLocked(schoolId, dto.date);

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

    await this.assertDateNotLocked(schoolId, session.date);

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

  async getAttendanceStudents(
    caller: AuthContext,
    schoolId: string,
    query: { classId?: string; sectionId?: string },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const studentRepo = this.dataSource.getRepository(Student);

    const qb = studentRepo.createQueryBuilder('student')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isDeleted = :isDeleted', { isDeleted: false });

    if (query.classId || query.sectionId) {
      qb.innerJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.studentId = student.id AND enrollment.isCurrent = :isCurrent AND enrollment.isDeleted = :enrollmentDeleted',
        { isCurrent: true, enrollmentDeleted: false },
      );
      if (query.classId) qb.andWhere('enrollment.classId = :classId', { classId: query.classId });
      if (query.sectionId) qb.andWhere('enrollment.sectionId = :sectionId', { sectionId: query.sectionId });
    } else {
      qb.leftJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.studentId = student.id AND enrollment.isCurrent = :isCurrent AND enrollment.isDeleted = :enrollmentDeleted',
        { isCurrent: true, enrollmentDeleted: false },
      );
    }

    qb.select([
      'student.id AS "id"',
      'student.id AS "studentId"',
      'student.firstName AS "firstName"',
      'student.lastName AS "lastName"',
      'student.admissionNumber AS "admissionNumber"',
      'student.studentCode AS "studentCode"',
      'student.profilePicUrl AS "profilePicUrl"',
      'enrollment.id AS "studentEnrollmentId"',
      'enrollment.rollNumber AS "rollNumber"',
      'enrollment.classId AS "classId"',
      'enrollment.sectionId AS "sectionId"',
    ]);

    const rawStudents = await qb.orderBy('student.firstName', 'ASC').getRawMany();

    return rawStudents.map((s, index) => {
      const fn = s.firstName || '';
      const ln = s.lastName || '';
      const fullName = `${fn} ${ln}`.trim() || 'Student';

      return {
        id: String(s.id),
        studentId: String(s.studentId || s.id),
        studentEnrollmentId: String(s.studentEnrollmentId || s.id),
        rollNumber: s.rollNumber ? String(s.rollNumber) : String(index + 1),
        firstName: fn || 'Student',
        lastName: ln,
        name: fullName,
        fullName: fullName,
        admissionNumber: s.admissionNumber || s.studentCode || `ADM-${s.id}`,
        studentCode: s.studentCode || '',
        profilePicUrl: s.profilePicUrl || null,
        avatar: s.profilePicUrl || null,
        classId: s.classId ? String(s.classId) : null,
        sectionId: s.sectionId ? String(s.sectionId) : null,
        status: 'PRESENT',
        attendanceMark: 'present',
      };
    });
  }

  async getAttendanceDashboard(caller: AuthContext, schoolId: string, date?: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const targetDate = date || new Date().toISOString().split('T')[0];

    const studentCount = await this.dataSource.getRepository(Student).count({
      where: { schoolId, isDeleted: false, isActive: true },
    });

    const sessionsToday = await this.dataSource.getRepository(AttendanceSession).find({
      where: { schoolId, date: targetDate, isDeleted: false },
    });

    const sessionIds = sessionsToday.map((s) => s.id);
    let recordsToday: AttendanceRecord[] = [];
    if (sessionIds.length > 0) {
      recordsToday = await this.dataSource.getRepository(AttendanceRecord).find({
        where: { sessionId: In(sessionIds), isDeleted: false },
      });
    }

    const presentCount = recordsToday.filter((r) => String(r.attendanceMark).toLowerCase() === 'present').length;
    const absentCount = recordsToday.filter((r) => String(r.attendanceMark).toLowerCase() === 'absent').length;
    const lateCount = recordsToday.filter((r) => String(r.attendanceMark).toLowerCase() === 'late').length;
    const leaveCount = recordsToday.filter((r) => String(r.attendanceMark).toLowerCase() === 'leave' || String(r.attendanceMark).toLowerCase() === 'half_day').length;

    const totalMarked = recordsToday.length || 0;
    const rate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

    return {
      date: targetDate,
      totalStudents: studentCount,
      presentStudents: presentCount,
      absentStudents: absentCount,
      lateStudents: lateCount,
      leaveStudents: leaveCount,
      attendanceRate: rate,
      summary: {
        date: targetDate,
        totalStudents: studentCount,
        presentStudents: presentCount,
        absentStudents: absentCount,
        lateStudents: lateCount,
        leaveStudents: leaveCount,
        attendanceRate: rate,
      },
    };
  }

  async getDefaultersReport(caller: AuthContext, schoolId: string, threshold: number = 75) {
    await this.assertAccessToSchool(caller, schoolId);

    const studentRepo = this.dataSource.getRepository(Student);
    const students = await studentRepo.find({
      where: { schoolId, isDeleted: false, isActive: true },
    });

    const sessions = await this.dataSource.getRepository(AttendanceSession).find({
      where: { schoolId, isDeleted: false },
    });

    const sessionIds = sessions.map((s) => s.id);
    let allRecords: AttendanceRecord[] = [];
    if (sessionIds.length > 0) {
      allRecords = await this.dataSource.getRepository(AttendanceRecord).find({
        where: { sessionId: In(sessionIds), isDeleted: false },
      });
    }

    const totalSessions = sessions.length || 1;

    const defaulters = students.map((student) => {
      const studentRecords = allRecords.filter(
        (r) => String(r.studentEnrollmentId) === String(student.id),
      );
      const totalClasses = studentRecords.length || totalSessions;
      const attendedClasses = studentRecords.filter(
        (r) => String(r.attendanceMark).toLowerCase() === 'present',
      ).length;

      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

      return {
        studentId: String(student.id),
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
        studentCode: student.studentCode || `STU-${student.id}`,
        className: 'Class 10',
        sectionName: 'A',
        totalClasses,
        attendedClasses,
        attendancePercentage: percentage,
      };
    }).filter((d) => d.attendancePercentage < threshold);

    return defaulters;
  }

  async lockAttendance(caller: AuthContext, schoolId: string, dto: LockAttendanceDto) {
    await this.assertAccessToSchool(caller, schoolId);
    const lockRepo = this.dataSource.getRepository(AttendanceLock);

    let lock = await lockRepo.findOne({
      where: { schoolId, date: dto.date },
    });

    if (!lock) {
      lock = lockRepo.create({
        schoolId,
        date: dto.date,
        isLocked: true,
        lockedBy: dto.lockedBy || 'Principal Admin',
        createdById: caller.id,
      });
    } else {
      lock.isLocked = true;
      if (dto.lockedBy) lock.lockedBy = dto.lockedBy;
    }

    await lockRepo.save(lock);
    return {
      message: `Attendance for ${dto.date} successfully locked`,
      date: dto.date,
      isLocked: true,
      lockedBy: lock.lockedBy,
    };
  }

  async unlockAttendance(caller: AuthContext, schoolId: string, dto: UnlockAttendanceDto) {
    await this.assertAccessToSchool(caller, schoolId);
    const lockRepo = this.dataSource.getRepository(AttendanceLock);

    const lock = await lockRepo.findOne({
      where: { schoolId, date: dto.date },
    });

    if (lock) {
      lock.isLocked = false;
      await lockRepo.save(lock);
    }

    return {
      message: `Attendance for ${dto.date} successfully unlocked`,
      date: dto.date,
      isLocked: false,
    };
  }

  async getAttendanceLocks(caller: AuthContext, schoolId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    const lockRepo = this.dataSource.getRepository(AttendanceLock);
    const locks = await lockRepo.find({
      where: { schoolId, isLocked: true },
      order: { date: 'DESC' },
    });
    return locks.map((l) => ({
      id: String(l.id),
      date: l.date,
      isLocked: l.isLocked,
      lockedBy: l.lockedBy || 'Admin',
      lockedAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
    }));
  }
}
