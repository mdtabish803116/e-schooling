import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { LockAttendanceDto, UnlockAttendanceDto } from '../../interfaces/request/attendance/lock-attendance.dto';
import { TakeAttendanceDto } from '../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../interfaces/request/attendance/update-attendance.dto';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { TeacherSectionAssignment } from '../../models/entities/academic/teacher-section-assignment.entity';
import { AttendanceLock } from '../../models/entities/attendance/attendance-lock.entity';
import { AttendanceRecord } from '../../models/entities/attendance/attendance-record.entity';
import { AttendanceSession } from '../../models/entities/attendance/attendance-session.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { Student } from '../../models/entities/student/student.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
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
    query: { classId: string; sectionId: string; date: string; sessionSlot?: number; academicSessionId?: string },
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
        ...(query.academicSessionId ? { academicSessionId: query.academicSessionId } : {}),
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
    filter: { classId?: string; sectionId?: string; academicSessionId?: string; date?: string; page?: number; limit?: number },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const page  = Math.max(1, Number(filter.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip  = (page - 1) * limit;

    const qb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .leftJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.student_id = student.id AND enrollment.is_delete = false AND enrollment.is_current = true',
      )
      .where('student.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('student.is_delete = false')
      .andWhere('student.is_active = true');

    if (filter.classId) {
      qb.andWhere('enrollment.class_id = :classId', { classId: String(filter.classId) });
    }
    if (filter.sectionId) {
      qb.andWhere('enrollment.section_id = :sectionId', { sectionId: String(filter.sectionId) });
    }
    if (filter.academicSessionId) {
      qb.andWhere('enrollment.academic_session_id = :academicSessionId', { academicSessionId: String(filter.academicSessionId) });
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

    const countQb = qb.clone();
    const [rawStudents, total] = await Promise.all([
      qb.orderBy('student.first_name', 'ASC').offset(skip).limit(limit).getRawMany(),
      countQb.getCount(),
    ]);

    // If date filter is provided, lookup saved session records for this date
    let savedRecordsMap = new Map<string, { attendanceMark: string; remarks?: string }>();
    if (filter.date) {
      const targetDate = this.parseDateFlexible(filter.date);
      const sessionQb = this.dataSource
        .getRepository(AttendanceSession)
        .createQueryBuilder('session')
        .where('session.schoolId = :schoolId', { schoolId: String(schoolId) })
        .andWhere('session.date = :targetDate', { targetDate })
        .andWhere('session.is_delete = false');

      if (filter.classId) {
        sessionQb.andWhere('session.classId = :classId', { classId: String(filter.classId) });
      }
      if (filter.sectionId) {
        sessionQb.andWhere('session.sectionId = :sectionId', { sectionId: String(filter.sectionId) });
      }

      const session = await sessionQb.getOne();
      if (session) {
        const records = await this.dataSource.getRepository(AttendanceRecord).find({
          where: { sessionId: session.id, isDeleted: false },
        });
        for (const r of records) {
          const markObj = { attendanceMark: String(r.attendanceMark).toUpperCase(), remarks: r.remarks || '' };
          savedRecordsMap.set(String(r.studentEnrollmentId), markObj);
        }
      }
    }

    const data = rawStudents.map((s, index) => {
      const fn = s.firstName || '';
      const ln = s.lastName || '';
      const fullName = `${fn} ${ln}`.trim() || 'Student';
      const studentId = String(s.studentId || s.id);
      const studentEnrollmentId = String(s.studentEnrollmentId || s.id);

      const savedMark = savedRecordsMap.get(studentEnrollmentId) || savedRecordsMap.get(studentId);
      const finalStatus = savedMark ? savedMark.attendanceMark : 'PRESENT';

      return {
        id: studentId,
        studentId: studentId,
        studentEnrollmentId,
        rollNumber: s.rollNumber ? String(s.rollNumber) : String(skip + index + 1),
        firstName: fn || 'Student',
        lastName: ln,
        name: fullName,
        fullName: fullName,
        admissionNumber: s.admissionNumber || s.studentCode || `ADM-${studentId}`,
        studentCode: s.studentCode || '',
        profilePicUrl: s.profilePicUrl || null,
        avatar: s.profilePicUrl || null,
        classId: s.classId ? String(s.classId) : null,
        sectionId: s.sectionId ? String(s.sectionId) : null,
        status: finalStatus,
        attendanceMark: finalStatus,
        remarks: savedMark?.remarks || '',
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

  async getAttendanceDashboard(caller: AuthContext, schoolId: string, date?: string, academicSessionId?: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const targetDate = this.parseDateFlexible(date);

    const studentQb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .innerJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.student_id = student.id AND enrollment.is_delete = false AND enrollment.is_current = true',
      )
      .where('student.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('student.is_delete = false')
      .andWhere('student.is_active = true');

    if (academicSessionId) {
      studentQb.andWhere('enrollment.academic_session_id = :academicSessionId', { academicSessionId: String(academicSessionId) });
    }

    const studentCount = await studentQb.getCount();

    const sessionsToday = await this.dataSource.getRepository(AttendanceSession).find({
      where: {
        schoolId: String(schoolId),
        date: targetDate,
        isDeleted: false,
        ...(academicSessionId ? { academicSessionId: String(academicSessionId) } : {}),
      },
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
      where: { schoolId: String(schoolId), isDeleted: false, isActive: true },
      relations: ['class'],
    });

    const teacherAssignments = await this.dataSource.getRepository(TeacherSectionAssignment).find({
      where: { schoolId: String(schoolId), isDeleted: false, isActive: true },
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

  async getDefaultersReport(caller: AuthContext, schoolId: string, threshold: number = 75, academicSessionId?: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const qb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .leftJoin(
        StudentEnrollment,
        'enrollment',
        'enrollment.student_id = student.id AND enrollment.is_delete = false AND enrollment.is_current = true',
      )
      .leftJoin(Class, 'class', 'class.id = enrollment.class_id')
      .leftJoin(Section, 'section', 'section.id = enrollment.section_id')
      .where('student.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('student.is_delete = false')
      .andWhere('student.is_active = true');

    if (academicSessionId) {
      qb.andWhere('enrollment.academic_session_id = :academicSessionId', { academicSessionId: String(academicSessionId) });
    }

    qb.select([
      'student.id AS "id"',
      'student.first_name AS "firstName"',
      'student.last_name AS "lastName"',
      'student.student_code AS "studentCode"',
      'enrollment.id AS "studentEnrollmentId"',
      'class.name AS "className"',
      'section.name AS "sectionName"',
    ]);

    const rawStudents = await qb.getRawMany();
    if (!rawStudents.length) return [];

    const sessions = await this.dataSource.getRepository(AttendanceSession).find({
      where: {
        schoolId: String(schoolId),
        isDeleted: false,
        ...(academicSessionId ? { academicSessionId: String(academicSessionId) } : {}),
      },
    });

    const sessionIds = sessions.map((s) => s.id);
    let allRecords: AttendanceRecord[] = [];
    if (sessionIds.length > 0) {
      allRecords = await this.dataSource.getRepository(AttendanceRecord).find({
        where: { sessionId: In(sessionIds), isDeleted: false },
      });
    }

    const totalSessions = sessions.length || 1;

    const defaulters = rawStudents
      .map((s) => {
        const studentId = String(s.id);
        const enrollmentId = String(s.studentEnrollmentId || s.id);

        const studentRecords = allRecords.filter(
          (r) => String(r.studentEnrollmentId) === enrollmentId || String(r.studentEnrollmentId) === studentId,
        );

        const totalClasses = studentRecords.length || totalSessions;
        const attendedClasses = studentRecords.filter(
          (r) => String(r.attendanceMark).toLowerCase() === 'present',
        ).length;

        const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

        const fn = s.firstName || '';
        const ln = s.lastName || '';
        const studentName = `${fn} ${ln}`.trim() || 'Student';

        return {
          studentId,
          studentName,
          studentCode: s.studentCode || `STU-${studentId}`,
          className: s.className || 'General',
          sectionName: s.sectionName || 'A',
          totalClasses,
          attendedClasses,
          attendancePercentage: percentage,
        };
      })
      .filter((d) => d.attendancePercentage < threshold);

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

  async getAttendanceLocks(caller: AuthContext, schoolId: string, _academicSessionId?: string) {
    await this.assertAccessToSchool(caller, schoolId);
    return this.dataSource.getRepository(AttendanceLock).find({
      where: {
        schoolId,
        isLocked: true,
      },
      order: { date: 'DESC' },
    });
  }

  async getMonthlyReport(
    caller: AuthContext,
    schoolId: string,
    query: { classId?: string; sectionId?: string; yearMonth?: string; academicSessionId?: string },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const yearMonth = query.yearMonth || new Date().toISOString().slice(0, 7);
    const startDate = `${yearMonth}-01`;
    const [yStr, mStr] = yearMonth.split('-');
    const nextM = Number(mStr) === 12 ? 1 : Number(mStr) + 1;
    const nextY = Number(mStr) === 12 ? Number(yStr) + 1 : Number(yStr);
    const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

    const sessionQb = this.dataSource
      .getRepository(AttendanceSession)
      .createQueryBuilder('session')
      .where('session.schoolId = :schoolId', { schoolId: String(schoolId) })
      .andWhere('session.is_delete = false')
      .andWhere('session.date >= :startDate AND session.date < :endDate', { startDate, endDate });

    if (query.classId) {
      sessionQb.andWhere('session.classId = :classId', { classId: String(query.classId) });
    }
    if (query.sectionId) {
      sessionQb.andWhere('session.sectionId = :sectionId', { sectionId: String(query.sectionId) });
    }
    if (query.academicSessionId) {
      sessionQb.andWhere('session.academicSessionId = :academicSessionId', { academicSessionId: String(query.academicSessionId) });
    }

    const sessions = await sessionQb.getMany();
    if (!sessions.length) return [];

    const sessionIds = sessions.map((s) => s.id);
    const sessionMap = new Map(sessions.map((s) => [s.id, String(s.date)]));

    const records = await this.dataSource.getRepository(AttendanceRecord).find({
      where: { sessionId: In(sessionIds), isDeleted: false },
    });

    if (!records.length) return [];

    // Map StudentEnrollments to link studentEnrollmentId with studentId
    const enrollmentIds = Array.from(new Set(records.map((r) => r.studentEnrollmentId).filter(Boolean)));
    let enrollmentMap = new Map<string, string>();
    if (enrollmentIds.length > 0) {
      const enrollments = await this.dataSource.getRepository(StudentEnrollment).find({
        where: { id: In(enrollmentIds) },
      });
      enrollmentMap = new Map(enrollments.map((e) => [String(e.id), String(e.studentId)]));
    }

    return records.map((r) => {
      const rawDate = sessionMap.get(r.sessionId);
      let dateStr = '';
      if (rawDate) {
        const rawDateAsAny = rawDate as any;
        if (rawDateAsAny instanceof Date) {
          const y = rawDateAsAny.getFullYear();
          const m = String(rawDateAsAny.getMonth() + 1).padStart(2, '0');
          const d = String(rawDateAsAny.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        } else {
          dateStr = String(rawDate).slice(0, 10);
        }
      }
      const actualStudentId = enrollmentMap.get(String(r.studentEnrollmentId)) || String(r.studentEnrollmentId);

      return {
        id: String(r.id),
        sessionId: String(r.sessionId),
        studentId: actualStudentId,
        studentEnrollmentId: String(r.studentEnrollmentId),
        date: dateStr,
        attendanceMark: String(r.attendanceMark).toUpperCase(),
        status: String(r.attendanceMark).toUpperCase(),
        remarks: r.remarks || '',
      };
    });
  }

  async getStudentHistory(caller: AuthContext, schoolId: string, studentId: string) {
    await this.assertAccessToSchool(caller, schoolId);

    const enrollments = await this.dataSource.getRepository(StudentEnrollment).find({
      where: [
        { studentId: String(studentId), isDeleted: false },
        { id: String(studentId), isDeleted: false },
      ],
    });

    const enrollmentIds = Array.from(
      new Set([...enrollments.map((e) => String(e.id)), String(studentId)]),
    );

    const records = await this.dataSource.getRepository(AttendanceRecord).find({
      where: { studentEnrollmentId: In(enrollmentIds), isDeleted: false },
      order: { createdAt: 'DESC' },
    });

    if (!records.length) return [];

    const sessionIds = Array.from(new Set(records.map((r) => r.sessionId).filter(Boolean)));
    const sessions = await this.dataSource.getRepository(AttendanceSession).find({
      where: { id: In(sessionIds) },
    });
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    // Collect staff / owner user IDs from records and sessions
    const creatorUserIds = Array.from(
      new Set(
        [
          ...records.map((r) => r.createdById),
          ...sessions.map((s) => s.takenBy || s.createdById),
        ].filter(Boolean),
      ),
    );

    const userNamesMap = new Map<string, string>();

    // 1. Query School Owners FIRST to get real Owner Names (e.g., "Md Dilnawaz Alam" instead of "Super Admin")
    try {
      const owners = await this.dataSource.query(
        `SELECT id, full_name, email FROM "e_schooling"."school_owners"`,
      );
      if (Array.isArray(owners)) {
        owners.forEach((o) => {
          const oName = o.full_name || o.email;
          if (oName) {
            userNamesMap.set(String(o.id), oName);
          }
        });
      }
    } catch {}

    // 2. Query School Staff
    try {
      const staffList = await this.dataSource.query(
        `SELECT id, user_id, name, full_name, first_name, last_name FROM "e_schooling"."school_staff" WHERE school_id = $1`,
        [schoolId],
      );
      if (Array.isArray(staffList)) {
        staffList.forEach((st) => {
          const stName =
            st.full_name ||
            st.name ||
            `${st.first_name || ''} ${st.last_name || ''}`.trim();
          if (stName) {
            if (st.id && !userNamesMap.has(String(st.id))) userNamesMap.set(String(st.id), stName);
            if (st.user_id && !userNamesMap.has(String(st.user_id))) userNamesMap.set(String(st.user_id), stName);
          }
        });
      }
    } catch {}

    // 3. Query Platform Users for remaining missing IDs
    if (creatorUserIds.length > 0) {
      try {
        const platformUsers = await this.dataSource.getRepository(PlatformUser).find({
          where: { id: In(creatorUserIds.map((id) => String(id))) },
        });
        platformUsers.forEach((u) => {
          if (u.name && !userNamesMap.has(String(u.id))) {
            userNamesMap.set(String(u.id), u.name);
          }
        });
      } catch {}
    }

    return records.map((r) => {
      const sessionObj = sessionMap.get(r.sessionId);
      const rawDate = sessionObj ? sessionObj.date : null;
      const createdAtDate = r.createdAt
        ? new Date(r.createdAt)
        : sessionObj?.createdAt
          ? new Date(sessionObj.createdAt)
          : new Date();

      // Format Date into DD/MM/YYYY
      const dateToDDMMYYYY = (dObj: Date) => {
        const day = String(dObj.getDate()).padStart(2, '0');
        const month = String(dObj.getMonth() + 1).padStart(2, '0');
        const year = dObj.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Format Time into HH:mm:ss AM/PM
      const dateToTimeWithSeconds = (dObj: Date) => {
        return dObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      };

      let dateObj = createdAtDate;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }

      const formattedDate = dateToDDMMYYYY(dateObj);
      const timeWithSeconds = dateToTimeWithSeconds(createdAtDate);
      const dateTimeFormatted = `${formattedDate}, ${timeWithSeconds}`;

      const markedById =
        r.createdById ||
        (sessionObj ? sessionObj.takenBy || sessionObj.createdById : null);

      const markedBy =
        (markedById && userNamesMap.get(String(markedById))) || "Faculty Coordinator";

      return {
        id: String(r.id),
        sessionId: String(r.sessionId),
        studentEnrollmentId: String(r.studentEnrollmentId),
        studentId: String(studentId),
        date: formattedDate, // DD/MM/YYYY
        rawDate: rawDate ? String(rawDate).slice(0, 10) : formattedDate,
        time: timeWithSeconds, // HH:mm:ss AM/PM
        dateTime: dateTimeFormatted, // DD/MM/YYYY, HH:mm:ss AM/PM
        attendanceMark: String(r.attendanceMark).toUpperCase(),
        status: String(r.attendanceMark).toUpperCase(),
        markedBy,
        remarks: r.remarks || '',
      };
    });
  }
}
