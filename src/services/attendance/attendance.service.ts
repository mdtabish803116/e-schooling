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
import { Section } from '../../models/entities/academic/section.entity';
import { TeacherSectionAssignment } from '../../models/entities/academic/teacher-section-assignment.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { AttendanceStatusEnum } from '../../models/enums/enums';

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

  private parseDateFlexible(input?: string): string {
    if (!input || input.trim() === '') {
      return new Date().toISOString().split('T')[0];
    }
    const clean = input.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('-');
      return `${y}-${m}-${d}`;
    }

    // YYYYMMDD (8 digits)
    if (/^\d{8}$/.test(clean) && Number(clean.substring(0, 4)) > 1900) {
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      const d = clean.substring(6, 8);
      return `${y}-${m}-${d}`;
    }

    // DDMMYYYY (8 digits)
    if (/^\d{8}$/.test(clean)) {
      const d = clean.substring(0, 2);
      const m = clean.substring(2, 4);
      const y = clean.substring(4, 8);
      return `${y}-${m}-${d}`;
    }

    return clean;
  }

  async assertDateNotLocked(schoolId: string, date: string): Promise<void> {
    const lock = await this.dataSource.getRepository(AttendanceLock).findOne({
      where: { schoolId, date, isLocked: true },
    });
    if (lock) {
      throw {
        statusCode: 423,
        error: 'Locked Date',
        message: `Attendance for date ${date} is locked by ${lock.lockedBy || 'admin'}. Modifications disabled.`,
      };
    }
  }

  private async assertAccessToSchool(caller: AuthContext, schoolId: string): Promise<void> {
    if (caller.roles?.includes('PLATFORM_OWNER') || caller.roles?.includes('SUPER_ADMIN')) {
      return;
    }

    if (caller.actorType === 'school_owner' || caller.roles?.includes('SCHOOL_OWNER') || caller.roles?.includes('owner')) {
      const isMember = await this.dataSource.getRepository(SchoolOwnerMember).exist({
        where: { schoolOwnerId: caller.id, schoolId, isDeleted: false },
      });
      if (!isMember) {
        throw new ForbiddenException('Forbidden: You do not own or manage this school.');
      }
      return;
    }

    if (caller.schoolId && String(caller.schoolId) === String(schoolId)) {
      return;
    }

    throw new ForbiddenException('Forbidden: You do not have access to this school domain.');
  }

  async getAttendanceSession(
    caller: AuthContext,
    schoolId: string,
    query: { classId: string; sectionId: string; date: string; sessionSlot?: number },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const session = await this.dataSource.getRepository(AttendanceSession).findOne({
      where: {
        schoolId,
        classId: query.classId,
        sectionId: query.sectionId,
        date: query.date,
        sessionSlot: query.sessionSlot || 1,
        isDeleted: false,
      },
    });

    if (!session) {
      return null;
    }

    const records = await this.dataSource.getRepository(AttendanceRecord).find({
      where: { sessionId: session.id, isDeleted: false },
    });

    return {
      session,
      records: records.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        studentEnrollmentId: r.studentEnrollmentId,
        studentId: r.studentEnrollmentId,
        attendanceMark: r.attendanceMark,
        status: String(r.attendanceMark).toUpperCase(),
        remarks: r.remarks,
      })),
    };
  }

  async takeAttendance(caller: AuthContext, schoolId: string, dto: TakeAttendanceDto) {
    await this.assertAccessToSchool(caller, schoolId);
    await this.assertDateNotLocked(schoolId, dto.date);

    const sessionRepo = this.dataSource.getRepository(AttendanceSession);
    const recordRepo = this.dataSource.getRepository(AttendanceRecord);

    let session = await sessionRepo.findOne({
      where: {
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: dto.date,
        sessionSlot: dto.sessionSlot || 1,
        isDeleted: false,
      },
    });

    if (!session) {
      session = sessionRepo.create({
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        academicSessionId: dto.academicSessionId || undefined,
        date: dto.date,
        sessionSlot: dto.sessionSlot || 1,
        takenBy: caller.id,
        createdById: caller.id,
      });
      session = await sessionRepo.save(session);
    } else {
      session.takenBy = caller.id;
      session.updatedById = caller.id;
      session = await sessionRepo.save(session);
    }

    for (const item of dto.records) {
      let rec = await recordRepo.findOne({
        where: { sessionId: session.id, studentEnrollmentId: item.studentEnrollmentId, isDeleted: false },
      });

      if (!rec) {
        rec = recordRepo.create({
          sessionId: session.id,
          studentEnrollmentId: item.studentEnrollmentId,
          attendanceMark: item.attendanceMark,
          remarks: item.remarks || undefined,
          createdById: caller.id,
        });
      } else {
        rec.attendanceMark = item.attendanceMark;
        if (item.remarks !== undefined) rec.remarks = item.remarks;
        rec.updatedById = caller.id;
      }
      await recordRepo.save(rec);
    }

    return {
      message: 'Attendance recorded successfully',
      sessionId: session.id,
      date: dto.date,
      recordsCount: dto.records.length,
    };
  }

  async updateAttendance(
    caller: AuthContext,
    schoolId: string,
    sessionId: string,
    dto: UpdateAttendanceDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const session = await this.dataSource.getRepository(AttendanceSession).findOne({
      where: { id: sessionId, schoolId, isDeleted: false },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session with ID ${sessionId} not found.`);
    }

    await this.assertDateNotLocked(schoolId, session.date);

    const recordRepo = this.dataSource.getRepository(AttendanceRecord);

    for (const item of dto.records) {
      const rec = await recordRepo.findOne({
        where: { id: item.id, sessionId: session.id, isDeleted: false },
      });

      if (rec) {
        if (item.attendanceMark) {
          rec.attendanceMark = item.attendanceMark;
        }
        if (item.remarks !== undefined) {
          rec.remarks = item.remarks;
        }
        rec.updatedById = caller.id;
        await recordRepo.save(rec);
      }
    }

    return {
      message: 'Attendance records updated successfully',
      sessionId: session.id,
    };
  }

  async getAttendanceStudents(
    caller: AuthContext,
    schoolId: string,
    filter: { classId?: string; sectionId?: string; date?: string; page?: number; limit?: number },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const page  = Math.max(1, Number(filter.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip  = (page - 1) * limit;

    const qb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .innerJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.studentId = student.id AND enrollment.isDeleted = false AND enrollment.isCurrent = true',
      )
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isDeleted = false')
      .andWhere('student.isActive = true');

    if (filter.classId) {
      qb.andWhere('enrollment.classId = :classId', { classId: filter.classId });
    }
    if (filter.sectionId) {
      qb.andWhere('enrollment.sectionId = :sectionId', { sectionId: filter.sectionId });
    }

    qb.select([
      'student.id AS "id"',
      'student.id AS "studentId"',
      'student.first_name AS "firstName"',
      'student.last_name AS "lastName"',
      'student.student_code AS "studentCode"',
      'student.admission_number AS "admissionNumber"',
      'student.profile_pic_url AS "profilePicUrl"',
      'enrollment.id AS "studentEnrollmentId"',
      'enrollment.roll_number AS "rollNumber"',
      'enrollment.class_id AS "classId"',
      'enrollment.section_id AS "sectionId"',
    ]);

    // Run count query (same filters, no pagination) and paginated data query in parallel
    const countQb = qb.clone();
    const [rawStudents, total] = await Promise.all([
      qb.orderBy('student.first_name', 'ASC').offset(skip).limit(limit).getRawMany(),
      countQb.getCount(),
    ]);

    const data = rawStudents.map((s, index) => {
      const fn = s.firstName || '';
      const ln = s.lastName || '';
      const fullName = `${fn} ${ln}`.trim() || 'Student';

      return {
        id: String(s.id),
        studentId: String(s.studentId || s.id),
        studentEnrollmentId: String(s.studentEnrollmentId || s.id),
        rollNumber: s.rollNumber ? String(s.rollNumber) : String(skip + index + 1),
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
        attendanceMark: AttendanceStatusEnum.PRESENT,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    };
  }

  async getAttendanceDashboard(caller: AuthContext, schoolId: string, date?: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const targetDate = this.parseDateFlexible(date);

    const studentCount = await this.dataSource.getRepository(Student).count({
      where: { schoolId, isDeleted: false, isActive: true },
    });

    const sessionsToday = await this.dataSource.getRepository(AttendanceSession).find({
      where: { schoolId, date: targetDate, isDeleted: false },
    });

    const markedSectionIds = new Set(sessionsToday.map((s) => String(s.sectionId)));

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

    // Pending Sections Calculation
    const sections = await this.dataSource.getRepository(Section).find({
      where: { schoolId, isDeleted: false, isActive: true },
      relations: ['class'],
    });

    const teacherAssignments = await this.dataSource.getRepository(TeacherSectionAssignment).find({
      where: { schoolId, isDeleted: false, isActive: true },
      relations: ['teacher'],
    });

    const pendingSections = sections
      .filter((sec) => !markedSectionIds.has(String(sec.id)))
      .map((sec) => {
        const assignment = teacherAssignments.find(
          (ta) => String(ta.sectionId) === String(sec.id) || String(ta.classId) === String(sec.classId),
        );

        const teacherName = assignment?.teacher?.name || 'Unassigned Teacher';
        const teacherPhone = assignment?.teacher?.phone || 'N/A';

        return {
          sectionId: String(sec.id),
          sectionName: sec.name || 'A',
          classId: String(sec.classId || ''),
          className: sec.class?.name || `Class ${sec.classId}`,
          classTeacherId: assignment?.teacherId ? String(assignment.teacherId) : null,
          classTeacherName: teacherName,
          classTeacherPhone: teacherPhone,
          status: 'PENDING',
        };
      });

    return {
      date: targetDate,
      totalStudents: studentCount,
      presentStudents: presentCount,
      absentStudents: absentCount,
      lateStudents: lateCount,
      leaveStudents: leaveCount,
      attendanceRate: rate,
      pendingSectionsCount: pendingSections.length,
      pendingSections,
      summary: {
        date: targetDate,
        totalStudents: studentCount,
        presentStudents: presentCount,
        absentStudents: absentCount,
        lateStudents: lateCount,
        leaveCount: leaveCount,
        attendanceRate: rate,
        pendingSectionsCount: pendingSections.length,
        pendingSections,
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
      message: `Attendance locked successfully for ${dto.date}`,
      lock,
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
      message: `Attendance unlocked successfully for ${dto.date}`,
      date: dto.date,
    };
  }

  async getAttendanceLocks(caller: AuthContext, schoolId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    return this.dataSource.getRepository(AttendanceLock).find({
      where: { schoolId, isLocked: true },
      order: { date: 'DESC' },
    });
  }
}
