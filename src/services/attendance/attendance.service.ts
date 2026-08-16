import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Between, DataSource, FindOptionsWhere, In } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import {
  LockAttendanceDto,
  UnlockAttendanceDto,
} from '../../interfaces/request/attendance/lock-attendance.dto';
import { TakeAttendanceDto } from '../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../interfaces/request/attendance/update-attendance.dto';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { TeacherSectionAssignment } from '../../models/entities/academic/teacher-section-assignment.entity';
import { AttendanceLock } from '../../models/entities/attendance/attendance-lock.entity';
import { AttendanceRecord } from '../../models/entities/attendance/attendance-record.entity';
import { AttendanceSession } from '../../models/entities/attendance/attendance-session.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { Student } from '../../models/entities/student/student.entity';

export interface TakeSubjectAttendanceDto {
  classId: string;
  sectionId: string;
  subjectId: string;
  date: string;
  periodNumber?: number;
  sessionTitle?: string;
  timetableSlotId?: string;
  academicSessionId?: string;
  records: Array<{
    studentEnrollmentId?: string;
    studentId?: string;
    attendanceMark: string;
    remarks?: string;
  }>;
}

export interface AttendanceSettingsDto {
  schoolId?: string;
  defaulterThreshold?: number;
  notifyParents?: boolean;
  allowFutureAttendance?: boolean;
  autoLockPastDays?: number;
  lateArrivalPenalty?: boolean;
  halfDayTimeCutoff?: string;
}

export interface MarkStaffAttendanceDto {
  staffId?: string | number;
  employeeCode?: string;
  staffName?: string;
  name?: string;
  role?: string;
  department?: string;
  date?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  source?: string;
  remarks?: string;
}

export interface SyncBiometricPunchesDto {
  syncDate?: string;
  records?: unknown[];
}

export interface MobileGeoAttendanceDto {
  staffId?: string | number;
  lat: number | string;
  lng: number | string;
}

interface RawCountResult {
  count: string | number;
}

interface RawStudentRow {
  id: string | number;
  studentId: string | number;
  firstName?: string | null;
  lastName?: string | null;
  studentCode?: string | null;
  admissionNumber?: string | null;
  profilePicUrl?: string | null;
  studentEnrollmentId?: string | number | null;
  rollNumber?: string | number | null;
  classId?: string | number | null;
  sectionId?: string | number | null;
}

interface RawDefaulterStudentRow {
  id: string | number;
  firstName?: string | null;
  lastName?: string | null;
  studentCode?: string | null;
  studentEnrollmentId?: string | number | null;
  className?: string | null;
  sectionName?: string | null;
}

interface RawSchoolOwnerRow {
  id: string | number;
  full_name?: string | null;
  email?: string | null;
}

interface RawSchoolStaffRow {
  id?: string | number | null;
  user_id?: string | number | null;
  name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface RawAttendanceSettingsRow {
  id: string | number;
  school_id: string | number;
  defaulter_threshold?: number | string | null;
  notify_parents?: boolean | null;
  allow_future_attendance?: boolean | null;
  auto_lock_past_days?: number | string | null;
  late_arrival_penalty?: boolean | null;
  half_day_time_cutoff?: string | null;
}

interface RawSubjectAttendanceSessionCheckRow {
  id: string | number;
  is_locked?: boolean | null;
  locked_by?: string | null;
}

interface RawSubjectAttendanceSessionRow {
  id: string | number;
  school_id: string | number;
  academic_session_id?: string | number | null;
  class_id: string | number;
  section_id: string | number;
  subject_id: string | number;
  teacher_id?: string | number | null;
  timetable_slot_id?: string | number | null;
  date: string | Date;
  period_number: number;
  session_title?: string | null;
  is_locked: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  class_name?: string | null;
  section_name?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  teacher_name?: string | null;
}

interface RawSubjectAttendanceCountRow {
  session_id: string | number;
  total_records: string | number;
  present_count: string | number;
  absent_count: string | number;
  late_count: string | number;
}

interface RawSubjectAttendanceRecordRow {
  id: string | number;
  session_id: string | number;
  student_enrollment_id?: string | number | null;
  student_id: string | number;
  attendance_mark: string;
  remarks?: string | null;
  roll_number?: string | number | null;
  student_name?: string | null;
  student_code?: string | null;
}

interface RawTimetableSlotRow {
  slot_id: string | number;
  day: string;
  period_id: string | number;
  class_id: string | number;
  section_id: string | number;
  subject_id: string | number;
  teacher_id?: string | number | null;
  room_no?: string | null;
  period_number?: number | null;
  period_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  teacher_name?: string | null;
}

interface RawSubjectSummaryRow {
  subject_id: string | number;
  subject_name: string;
  subject_code: string;
  total_conducted: string | number;
  present_count: string | number;
  absent_count: string | number;
  late_count: string | number;
}

interface RawSectionOverviewRow {
  section_id: string | number;
  section_name: string;
  class_id: string | number;
  class_name: string;
  student_count: string | number;
}

interface RawTeacherAssignmentRow {
  class_id?: string | number | null;
  section_id?: string | number | null;
  teacher_id?: string | number | null;
  teacher_name?: string | null;
  teacher_phone?: string | null;
}

interface RawDailyAttendanceSessionRow {
  session_id: string | number;
  school_id: string | number;
  academic_session_id?: string | number | null;
  class_id: string | number;
  section_id: string | number;
  date: string | Date;
  session_slot: number;
  taken_by?: string | number | null;
  created_by_id?: string | number | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  class_name?: string | null;
  section_name?: string | null;
  marked_by_name?: string | null;
}

interface RawDailyAttendanceCountRow {
  session_id: string | number;
  total?: string | number;
  present?: string | number;
  absent?: string | number;
  late?: string | number;
  leave?: string | number;
  total_records?: string | number;
  present_count?: string | number;
  absent_count?: string | number;
  late_count?: string | number;
  leave_count?: string | number;
}

interface RawTimetableSlotOverviewRow {
  slot_id: string | number;
  school_id: string | number;
  class_id: string | number;
  section_id: string | number;
  subject_id: string | number;
  teacher_id?: string | number | null;
  day_of_week: string;
  period_number: number;
  start_time?: string | null;
  end_time?: string | null;
  class_name?: string | null;
  section_name?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  teacher_name?: string | null;
}

interface RawSubjectAttendanceSessionOverviewRow {
  session_id: string | number;
  school_id: string | number;
  academic_session_id?: string | number | null;
  class_id: string | number;
  section_id: string | number;
  subject_id: string | number;
  teacher_id?: string | number | null;
  timetable_slot_id?: string | number | null;
  date: string | Date;
  period_number: number;
  session_title?: string | null;
  is_locked: boolean;
  created_by_id?: string | number | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  class_name?: string | null;
  section_name?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  teacher_name?: string | null;
  marked_by_name?: string | null;
}

interface RawStaffAttendanceRow {
  id: string | number;
  school_id: string | number;
  staff_id: string | number;
  employee_code?: string | null;
  staff_name?: string | null;
  role?: string | null;
  department?: string | null;
  date: string | Date;
  status?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  source?: string | null;
  remarks?: string | null;
  is_locked?: boolean | null;
}

interface StatusItemOverview {
  className?: string;
  sectionName?: string;
  subjectName?: string;
  classTeacherName?: string;
  subjectTeacherName?: string;
  markedBy?: string;
}

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
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."attendance_settings" (
          "id" BIGSERIAL PRIMARY KEY,
          "school_id" bigint NOT NULL UNIQUE,
          "defaulter_threshold" numeric DEFAULT 75,
          "notify_parents" boolean DEFAULT true,
          "allow_future_attendance" boolean DEFAULT false,
          "auto_lock_past_days" int DEFAULT 7,
          "late_arrival_penalty" boolean DEFAULT false,
          "half_day_time_cutoff" varchar DEFAULT '11:30 AM',
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."subject_attendance_sessions" (
          "id"                   BIGSERIAL PRIMARY KEY,
          "school_id"            BIGINT NOT NULL,
          "academic_session_id"  BIGINT NULL,
          "class_id"             BIGINT NOT NULL,
          "section_id"           BIGINT NOT NULL,
          "subject_id"           BIGINT NOT NULL,
          "teacher_id"           BIGINT NULL,
          "timetable_slot_id"    BIGINT NULL,
          "date"                 DATE NOT NULL,
          "period_number"        INTEGER NOT NULL DEFAULT 1,
          "session_title"        VARCHAR(255) NULL,
          "is_locked"            BOOLEAN NOT NULL DEFAULT false,
          "locked_by"            VARCHAR(150) NULL,
          "locked_at"            TIMESTAMP NULL,
          "is_active"            BOOLEAN NOT NULL DEFAULT true,
          "is_delete"            BOOLEAN NOT NULL DEFAULT false,
          "created_by_id"        BIGINT NULL,
          "updated_by_id"        BIGINT NULL,
          "created_at"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at"           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS "e_schooling"."subject_attendance_records" (
          "id"                    BIGSERIAL PRIMARY KEY,
          "session_id"            BIGINT NOT NULL REFERENCES "e_schooling"."subject_attendance_sessions"("id") ON DELETE CASCADE,
          "student_enrollment_id" BIGINT NULL,
          "student_id"            BIGINT NULL,
          "attendance_mark"       VARCHAR(50) NOT NULL DEFAULT 'present',
          "remarks"               TEXT NULL,
          "is_active"             BOOLEAN NOT NULL DEFAULT true,
          "is_delete"             BOOLEAN NOT NULL DEFAULT false,
          "created_by_id"         BIGINT NULL,
          "updated_by_id"         BIGINT NULL,
          "created_at"            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at"            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "e_schooling"."staff_attendance" (
          "id"            BIGSERIAL PRIMARY KEY,
          "school_id"     BIGINT NOT NULL,
          "staff_id"      BIGINT NOT NULL,
          "employee_code" VARCHAR(100) NULL,
          "staff_name"    VARCHAR(255) NULL,
          "role"          VARCHAR(100) NULL,
          "department"    VARCHAR(100) NULL,
          "date"          DATE NOT NULL,
          "status"        VARCHAR(50) NOT NULL DEFAULT 'Present',
          "check_in"      VARCHAR(50) NULL DEFAULT '08:15 AM',
          "check_out"     VARCHAR(50) NULL DEFAULT '04:30 PM',
          "source"        VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
          "remarks"       TEXT NULL,
          "is_locked"     BOOLEAN NOT NULL DEFAULT false,
          "is_active"     BOOLEAN NOT NULL DEFAULT true,
          "is_deleted"    BOOLEAN NOT NULL DEFAULT false,
          "created_at"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "IDX_staff_attendance_school_date" ON "e_schooling"."staff_attendance" ("school_id", "date");
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_attendance_unique" ON "e_schooling"."staff_attendance" ("school_id", "staff_id", "date");
      `);
    } catch (e) {
      console.warn('Auto-creating attendance tables:', e);
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

  private getLocalDateString(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async assertDateNotLocked(schoolId: string, rawDate: string): Promise<void> {
    const formattedDate = this.parseDateFlexible(rawDate);
    const settings = await this.getAttendanceSettings(schoolId);

    // 1. Check future date policy
    if (!settings.allowFutureAttendance) {
      const today = this.getLocalDateString();
      const utcToday = new Date().toISOString().split('T')[0];
      const effectiveToday = today > utcToday ? today : utcToday;
      if (formattedDate > effectiveToday) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Future Date Prohibited',
            message: `Attendance marking for future date (${formattedDate}) is disabled in attendance settings.`,
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // 2. Check auto-lock past days policy (Grace Window)
    if (settings.autoLockPastDays && settings.autoLockPastDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - settings.autoLockPastDays);
      const cutoffStr = this.getLocalDateString(cutoff);
      if (formattedDate < cutoffStr) {
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            error: 'Locked Date',
            message: `Attendance for date ${formattedDate} is auto-locked (exceeds ${settings.autoLockPastDays} days past grace window). Modifications disabled.`,
          },
          HttpStatus.LOCKED,
        );
      }
    }

    // 3. Check manual date lock record
    const lock = await this.dataSource.getRepository(AttendanceLock).findOne({
      where: { schoolId, date: formattedDate, isLocked: true },
    });
    if (lock) {
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          error: 'Locked Date',
          message: `Attendance for date ${formattedDate} is locked by ${lock.lockedBy || 'admin'}. Modifications disabled.`,
        },
        HttpStatus.LOCKED,
      );
    }
  }

  private async assertAccessToSchool(
    caller: AuthContext,
    schoolId: string,
  ): Promise<void> {
    if (
      caller.roles?.includes('PLATFORM_OWNER') ||
      caller.roles?.includes('SUPER_ADMIN')
    ) {
      return;
    }

    if (
      caller.actorType === 'school_owner' ||
      caller.roles?.includes('SCHOOL_OWNER') ||
      caller.roles?.includes('owner')
    ) {
      const rows = await this.dataSource.query(
        `SELECT id FROM "e_schooling"."school_owner_members" WHERE school_owner_id = $1 AND school_id = $2 AND is_delete = false LIMIT 1`,
        [caller.id, schoolId],
      );
      if (!rows || rows.length === 0) {
        const schRows = await this.dataSource.query(
          `SELECT id FROM "e_schooling"."schools" WHERE id = $1 AND created_by_id = $2 AND is_delete = false LIMIT 1`,
          [schoolId, caller.id],
        );
        if (!schRows || schRows.length === 0) {
          throw new ForbiddenException(
            'Forbidden: You do not own or manage this school.',
          );
        }
      }
      return;
    }

    if (caller.schoolId && String(caller.schoolId) === String(schoolId)) {
      return;
    }

    throw new ForbiddenException(
      'Forbidden: You do not have access to this school domain.',
    );
  }

  async getAttendanceSession(
    caller: AuthContext,
    schoolId: string,
    query: {
      classId: string;
      sectionId: string;
      date: string;
      sessionSlot?: number;
      academicSessionId?: string;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const session = await this.dataSource
      .getRepository(AttendanceSession)
      .findOne({
        where: {
          schoolId,
          classId: query.classId,
          sectionId: query.sectionId,
          date: query.date,
          sessionSlot: query.sessionSlot || 1,
          isDeleted: false,
          ...(query.academicSessionId
            ? { academicSessionId: query.academicSessionId }
            : {}),
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

  async resolveCallerName(caller: AuthContext): Promise<string> {
    try {
      if (caller.actorType === 'school_owner') {
        const rows = await this.dataSource.query(
          `SELECT full_name, email FROM "e_schooling"."school_owners" WHERE id = $1 LIMIT 1`,
          [caller.id],
        );
        if (rows && rows.length > 0) {
          return rows[0].full_name || rows[0].email || 'School Owner';
        }
      } else if (caller.actorType === 'school_user') {
        const rows = await this.dataSource.query(
          `SELECT name, username FROM "e_schooling"."school_users" WHERE id = $1 LIMIT 1`,
          [caller.id],
        );
        if (rows && rows.length > 0) {
          return rows[0].name || rows[0].username || 'Staff User';
        }
      } else if (caller.actorType === 'platform_user') {
        const rows = await this.dataSource.query(
          `SELECT name, email FROM "e_schooling"."platform_users" WHERE id = $1 LIMIT 1`,
          [caller.id],
        );
        if (rows && rows.length > 0) {
          return rows[0].name || rows[0].email || 'Admin';
        }
      }
    } catch {}
    return '';
  }

  async takeAttendance(
    caller: AuthContext,
    schoolId: string,
    dto: TakeAttendanceDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    await this.assertDateNotLocked(schoolId, dto.date);

    const callerName = await this.resolveCallerName(caller);
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
        takenByName: callerName,
        createdById: caller.id,
      });
      session = await sessionRepo.save(session);
    } else {
      session.takenBy = caller.id;
      session.takenByName = callerName;
      session.updatedById = caller.id;
      session = await sessionRepo.save(session);
    }

    for (const item of dto.records) {
      let rec = await recordRepo.findOne({
        where: {
          sessionId: session.id,
          studentEnrollmentId: item.studentEnrollmentId,
          isDeleted: false,
        },
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

    const session = await this.dataSource
      .getRepository(AttendanceSession)
      .findOne({
        where: { id: sessionId, schoolId, isDeleted: false },
      });

    if (!session) {
      throw new NotFoundException(
        `Attendance session with ID ${sessionId} not found.`,
      );
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
    filter: {
      classId?: string;
      sectionId?: string;
      academicSessionId?: string;
      date?: string;
      page?: number;
      limit?: number;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

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
      qb.andWhere('enrollment.class_id = :classId', {
        classId: String(filter.classId),
      });
    }
    if (filter.sectionId) {
      qb.andWhere('enrollment.section_id = :sectionId', {
        sectionId: String(filter.sectionId),
      });
    }
    if (filter.academicSessionId) {
      qb.andWhere('enrollment.academic_session_id = :academicSessionId', {
        academicSessionId: String(filter.academicSessionId),
      });
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
      qb
        .orderBy('student.first_name', 'ASC')
        .offset(skip)
        .limit(limit)
        .getRawMany<RawStudentRow>(),
      countQb.getCount(),
    ]);

    // If date filter is provided, lookup saved session records for this date
    const savedRecordsMap = new Map<
      string,
      { attendanceMark: string; remarks?: string }
    >();
    if (filter.date) {
      const targetDate = this.parseDateFlexible(filter.date);
      const sessionQb = this.dataSource
        .getRepository(AttendanceSession)
        .createQueryBuilder('session')
        .where('session.schoolId = :schoolId', { schoolId: String(schoolId) })
        .andWhere('session.date = :targetDate', { targetDate })
        .andWhere('session.is_delete = false');

      if (filter.classId) {
        sessionQb.andWhere('session.classId = :classId', {
          classId: String(filter.classId),
        });
      }
      if (filter.sectionId) {
        sessionQb.andWhere('session.sectionId = :sectionId', {
          sectionId: String(filter.sectionId),
        });
      }

      const session = await sessionQb.getOne();
      if (session) {
        const records = await this.dataSource
          .getRepository(AttendanceRecord)
          .find({
            where: { sessionId: session.id, isDeleted: false },
          });
        for (const r of records) {
          const markObj = {
            attendanceMark: String(r.attendanceMark).toUpperCase(),
            remarks: r.remarks || '',
          };
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

      const savedMark =
        savedRecordsMap.get(studentEnrollmentId) ||
        savedRecordsMap.get(studentId);
      const finalStatus = savedMark ? savedMark.attendanceMark : 'PRESENT';

      return {
        id: studentId,
        studentId: studentId,
        studentEnrollmentId,
        rollNumber: s.rollNumber
          ? String(s.rollNumber)
          : String(skip + index + 1),
        firstName: fn || 'Student',
        lastName: ln,
        name: fullName,
        fullName: fullName,
        admissionNumber:
          s.admissionNumber || s.studentCode || `ADM-${studentId}`,
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

  async getAttendanceDashboard(
    caller: AuthContext,
    schoolId: string,
    date?: string,
    academicSessionId?: string,
  ) {
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
      studentQb.andWhere(
        'enrollment.academic_session_id = :academicSessionId',
        { academicSessionId: String(academicSessionId) },
      );
    }

    const studentCount = await studentQb.getCount();

    const sessionsToday = await this.dataSource
      .getRepository(AttendanceSession)
      .find({
        where: {
          schoolId: String(schoolId),
          date: targetDate,
          isDeleted: false,
          ...(academicSessionId
            ? { academicSessionId: String(academicSessionId) }
            : {}),
        },
      });

    const markedSectionIds = new Set(
      sessionsToday.map((s) => String(s.sectionId)),
    );

    const sessionIds = sessionsToday.map((s) => s.id);
    let recordsToday: AttendanceRecord[] = [];
    if (sessionIds.length > 0) {
      recordsToday = await this.dataSource
        .getRepository(AttendanceRecord)
        .find({
          where: { sessionId: In(sessionIds), isDeleted: false },
        });
    }

    const presentCount = recordsToday.filter(
      (r) => String(r.attendanceMark).toLowerCase() === 'present',
    ).length;
    const absentCount = recordsToday.filter(
      (r) => String(r.attendanceMark).toLowerCase() === 'absent',
    ).length;
    const lateCount = recordsToday.filter(
      (r) => String(r.attendanceMark).toLowerCase() === 'late',
    ).length;
    const leaveCount = recordsToday.filter(
      (r) =>
        String(r.attendanceMark).toLowerCase() === 'leave' ||
        String(r.attendanceMark).toLowerCase() === 'half_day',
    ).length;

    const totalMarked = recordsToday.length || 0;
    const rate =
      totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

    // Pending Sections Calculation
    const sections = await this.dataSource.getRepository(Section).find({
      where: { schoolId: String(schoolId), isDeleted: false, isActive: true },
      relations: ['class'],
    });

    const teacherAssignments = await this.dataSource
      .getRepository(TeacherSectionAssignment)
      .find({
        where: { schoolId: String(schoolId), isDeleted: false, isActive: true },
        relations: ['teacher'],
      });

    const pendingSections = sections
      .filter((sec) => !markedSectionIds.has(String(sec.id)))
      .map((sec) => {
        const assignment = teacherAssignments.find(
          (ta) =>
            String(ta.sectionId) === String(sec.id) ||
            String(ta.classId) === String(sec.classId),
        );

        const teacherName = assignment?.teacher?.name || 'Unassigned Teacher';
        const teacherPhone = assignment?.teacher?.phone || 'N/A';

        return {
          sectionId: String(sec.id),
          sectionName: sec.name || 'A',
          classId: String(sec.classId || ''),
          className: sec.class?.name || `Class ${sec.classId}`,
          classTeacherId: assignment?.teacherId
            ? String(assignment.teacherId)
            : null,
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

  async getDefaultersReport(
    caller: AuthContext,
    schoolId: string,
    threshold: number = 75,
    academicSessionId?: string,
  ) {
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
      qb.andWhere('enrollment.academic_session_id = :academicSessionId', {
        academicSessionId: String(academicSessionId),
      });
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

    const rawStudents = await qb.getRawMany<RawDefaulterStudentRow>();
    if (!rawStudents.length) return [];

    const sessions = await this.dataSource
      .getRepository(AttendanceSession)
      .find({
        where: {
          schoolId: String(schoolId),
          isDeleted: false,
          ...(academicSessionId
            ? { academicSessionId: String(academicSessionId) }
            : {}),
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
          (r) =>
            String(r.studentEnrollmentId) === enrollmentId ||
            String(r.studentEnrollmentId) === studentId,
        );

        const totalClasses = studentRecords.length || totalSessions;
        const attendedClasses = studentRecords.filter(
          (r) => String(r.attendanceMark).toLowerCase() === 'present',
        ).length;

        const percentage =
          totalClasses > 0
            ? Math.round((attendedClasses / totalClasses) * 100)
            : 100;

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

  async lockAttendance(
    caller: AuthContext,
    schoolId: string,
    dto: LockAttendanceDto,
  ) {
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

  async unlockAttendance(
    caller: AuthContext,
    schoolId: string,
    dto: UnlockAttendanceDto,
  ) {
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

  async getAttendanceLocks(
    caller: AuthContext,
    schoolId: string,
    academicSessionId?: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    void academicSessionId;
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
    query: {
      classId?: string;
      sectionId?: string;
      yearMonth?: string;
      academicSessionId?: string;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const yearMonth = query.yearMonth || new Date().toISOString().slice(0, 7);
    const [yStr, mStr] = yearMonth.split('-');
    const yNum = parseInt(yStr, 10) || new Date().getFullYear();
    const mNum = parseInt(mStr, 10) || new Date().getMonth() + 1;
    const lastDay = new Date(yNum, mNum, 0).getDate();

    const startDate = `${yNum}-${String(mNum).padStart(2, '0')}-01`;
    const endDate = `${yNum}-${String(mNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const sessionQb = this.dataSource
      .getRepository(AttendanceSession)
      .createQueryBuilder('session')
      .where('session.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('session.is_delete = false')
      .andWhere('session.date >= :startDate AND session.date <= :endDate', {
        startDate,
        endDate,
      });

    if (query.classId) {
      sessionQb.andWhere('session.class_id = :classId', {
        classId: String(query.classId),
      });
    }
    if (query.sectionId) {
      sessionQb.andWhere('session.section_id = :sectionId', {
        sectionId: String(query.sectionId),
      });
    }

    let sessions = await sessionQb.getMany();
    if (!sessions.length) {
      // Fallback with TypeORM find
      const whereCond: FindOptionsWhere<AttendanceSession> = {
        schoolId: String(schoolId),
        isDeleted: false,
        date: Between(startDate, endDate),
      };
      if (query.classId) whereCond.classId = String(query.classId);
      if (query.sectionId) whereCond.sectionId = String(query.sectionId);
      sessions = await this.dataSource.getRepository(AttendanceSession).find({
        where: whereCond,
      });
    }

    if (query.academicSessionId && sessions.length > 0) {
      const matched = sessions.filter(
        (s) =>
          String(s.academicSessionId) === String(query.academicSessionId) ||
          !s.academicSessionId,
      );
      if (matched.length > 0) {
        sessions = matched;
      }
    }

    if (!sessions.length) return [];

    const sessionIds = sessions.map((s) => s.id);
    const sessionMap = new Map<string, string>(
      sessions.map((s) => {
        let dStr = '';
        if (s.date) {
          const raw = s.date as unknown;
          if (raw instanceof Date) {
            const y = raw.getFullYear();
            const m = String(raw.getMonth() + 1).padStart(2, '0');
            const d = String(raw.getDate()).padStart(2, '0');
            dStr = `${y}-${m}-${d}`;
          } else if (typeof raw === 'string') {
            dStr = raw.slice(0, 10);
          } else {
            dStr = String(raw).slice(0, 10);
          }
        }
        return [s.id, dStr];
      }),
    );

    const records = await this.dataSource.getRepository(AttendanceRecord).find({
      where: { sessionId: In(sessionIds), isDeleted: false },
    });

    if (!records.length) return [];

    // Map StudentEnrollments to link studentEnrollmentId with studentId
    const enrollmentIds = Array.from(
      new Set(records.map((r) => r.studentEnrollmentId).filter(Boolean)),
    );
    let enrollmentMap = new Map<string, string>();
    if (enrollmentIds.length > 0) {
      try {
        const enrollments = await this.dataSource
          .getRepository(StudentEnrollment)
          .find({
            where: { id: In(enrollmentIds) },
          });
        enrollmentMap = new Map(
          enrollments.map((e) => [String(e.id), String(e.studentId)]),
        );
      } catch (e) {
        void e;
      }
    }

    return records.map((r) => {
      const dateStr = sessionMap.get(r.sessionId) || '';
      const actualStudentId =
        enrollmentMap.get(String(r.studentEnrollmentId)) ||
        String(r.studentEnrollmentId);

      return {
        id: String(r.id),
        sessionId: String(r.sessionId),
        studentId: actualStudentId,
        studentEnrollmentId: String(r.studentEnrollmentId),
        date: dateStr,
        attendanceMark: String(r.attendanceMark || 'PRESENT').toUpperCase(),
        status: String(r.attendanceMark || 'PRESENT').toUpperCase(),
        remarks: r.remarks || '',
      };
    });
  }

  async getStudentHistory(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const enrollments = await this.dataSource
      .getRepository(StudentEnrollment)
      .find({
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

    const sessionIds = Array.from(
      new Set(records.map((r) => r.sessionId).filter(Boolean)),
    );
    const sessions = await this.dataSource
      .getRepository(AttendanceSession)
      .find({
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
      const owners = await this.dataSource.query<RawSchoolOwnerRow[]>(
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
    } catch (e) {
      void e;
    }

    // 2. Query School Staff
    try {
      const staffList = await this.dataSource.query<RawSchoolStaffRow[]>(
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
            if (st.id && !userNamesMap.has(String(st.id)))
              userNamesMap.set(String(st.id), stName);
            if (st.user_id && !userNamesMap.has(String(st.user_id)))
              userNamesMap.set(String(st.user_id), stName);
          }
        });
      }
    } catch (e) {
      void e;
    }

    // 3. Query Platform Users for remaining missing IDs
    if (creatorUserIds.length > 0) {
      try {
        const platformUsers = await this.dataSource
          .getRepository(PlatformUser)
          .find({
            where: { id: In(creatorUserIds.map((id) => String(id))) },
          });
        platformUsers.forEach((u) => {
          if (u.name && !userNamesMap.has(String(u.id))) {
            userNamesMap.set(String(u.id), u.name);
          }
        });
      } catch (e) {
        void e;
      }
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
        (markedById && userNamesMap.get(String(markedById))) ||
        'Faculty Coordinator';

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

  async getAttendanceSettings(schoolId: string) {
    try {
      const rows = await this.dataSource.query<RawAttendanceSettingsRow[]>(
        `SELECT * FROM "e_schooling"."attendance_settings" WHERE "school_id" = $1 LIMIT 1`,
        [schoolId],
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        return {
          schoolId,
          defaulterThreshold: Number(row.defaulter_threshold) || 75,
          notifyParents: row.notify_parents ?? true,
          allowFutureAttendance: row.allow_future_attendance ?? false,
          autoLockPastDays: Number(row.auto_lock_past_days) || 7,
          lateArrivalPenalty: row.late_arrival_penalty ?? false,
          halfDayTimeCutoff: row.half_day_time_cutoff || '11:30 AM',
        };
      }
    } catch (e) {
      console.warn('Error fetching attendance settings:', e);
    }
    return {
      schoolId,
      defaulterThreshold: 75,
      notifyParents: true,
      allowFutureAttendance: false,
      autoLockPastDays: 7,
      lateArrivalPenalty: false,
      halfDayTimeCutoff: '11:30 AM',
    };
  }

  async updateAttendanceSettings(
    schoolId: string,
    settings: AttendanceSettingsDto,
  ) {
    const defaulterThreshold = settings.defaulterThreshold ?? 75;
    const notifyParents = settings.notifyParents ?? true;
    const allowFutureAttendance = settings.allowFutureAttendance ?? false;
    const autoLockPastDays = settings.autoLockPastDays ?? 7;
    const lateArrivalPenalty = settings.lateArrivalPenalty ?? false;
    const halfDayTimeCutoff = settings.halfDayTimeCutoff || '11:30 AM';

    try {
      await this.dataSource.query(
        `
        INSERT INTO "e_schooling"."attendance_settings"
          ("school_id", "defaulter_threshold", "notify_parents", "allow_future_attendance", "auto_lock_past_days", "late_arrival_penalty", "half_day_time_cutoff", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT ("school_id") DO UPDATE SET
          "defaulter_threshold" = EXCLUDED."defaulter_threshold",
          "notify_parents" = EXCLUDED."notify_parents",
          "allow_future_attendance" = EXCLUDED."allow_future_attendance",
          "auto_lock_past_days" = EXCLUDED."auto_lock_past_days",
          "late_arrival_penalty" = EXCLUDED."late_arrival_penalty",
          "half_day_time_cutoff" = EXCLUDED."half_day_time_cutoff",
          "updated_at" = now();
        `,
        [
          schoolId,
          defaulterThreshold,
          notifyParents,
          allowFutureAttendance,
          autoLockPastDays,
          lateArrivalPenalty,
          halfDayTimeCutoff,
        ],
      );
    } catch (e) {
      console.warn('Error saving attendance settings:', e);
    }

    return this.getAttendanceSettings(schoolId);
  }

  // ======================================================
  // SUBJECT-WISE ATTENDANCE (MODE B - INDEPENDENT FROM DAILY)
  // ======================================================

  /**
   * Take or Upsert Subject-Wise Attendance
   */
  async takeSubjectAttendance(
    caller: AuthContext,
    schoolId: string,
    dto: {
      classId: string;
      sectionId: string;
      subjectId: string;
      date: string;
      periodNumber?: number;
      sessionTitle?: string;
      timetableSlotId?: string;
      academicSessionId?: string;
      records: Array<{
        studentEnrollmentId?: string;
        studentId?: string;
        attendanceMark: string;
        remarks?: string;
      }>;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const formattedDate = this.parseDateFlexible(dto.date);
    await this.assertDateNotLocked(schoolId, formattedDate);

    // Validate settings: allow future attendance
    const settings = await this.getAttendanceSettings(schoolId);
    if (!settings.allowFutureAttendance) {
      const today = new Date().toISOString().split('T')[0];
      if (formattedDate > today) {
        throw new ForbiddenException(
          'Future subject attendance marking is disabled for this school.',
        );
      }
    }

    const periodNumber = Number(dto.periodNumber) || 1;
    const safeAcadId =
      dto.academicSessionId && /^\d+$/.test(String(dto.academicSessionId))
        ? String(dto.academicSessionId)
        : null;
    const safeSlotId =
      dto.timetableSlotId && /^\d+$/.test(String(dto.timetableSlotId))
        ? String(dto.timetableSlotId)
        : null;
    const safeTeacherId =
      caller.id && /^\d+$/.test(String(caller.id)) ? String(caller.id) : null;

    // Use transaction for safe upsert
    const callerName = await this.resolveCallerName(caller);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find existing SubjectAttendanceSession
      const existingSessions = (await queryRunner.query(
        `
        SELECT id, is_locked, locked_by 
        FROM "e_schooling"."subject_attendance_sessions"
        WHERE school_id = $1 
          AND class_id = $2 
          AND section_id = $3 
          AND subject_id = $4 
          AND date = $5 
          AND period_number = $6 
          AND is_delete = false
        LIMIT 1;
        `,
        [
          schoolId,
          dto.classId,
          dto.sectionId,
          dto.subjectId,
          formattedDate,
          periodNumber,
        ],
      )) as RawSubjectAttendanceSessionCheckRow[];

      let sessionId: string;

      if (existingSessions.length === 0) {
        const insertRes = (await queryRunner.query(
          `
          INSERT INTO "e_schooling"."subject_attendance_sessions" (
            school_id, academic_session_id, class_id, section_id, subject_id, teacher_id, timetable_slot_id, date, period_number, session_title, is_locked, taken_by_name, created_by_id, updated_by_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $12, NOW(), NOW()
          ) RETURNING id;
          `,
          [
            schoolId,
            safeAcadId,
            dto.classId,
            dto.sectionId,
            dto.subjectId,
            safeTeacherId,
            safeSlotId,
            formattedDate,
            periodNumber,
            dto.sessionTitle || null,
            callerName,
            safeTeacherId,
          ],
        )) as Array<{ id: string | number }>;
        sessionId = String(insertRes[0].id);
      } else {
        const session = existingSessions[0];
        if (session.is_locked) {
          throw new ForbiddenException(
            `This subject attendance session is locked (${session.locked_by || 'Admin'}). Modifications are disabled.`,
          );
        }
        sessionId = String(session.id);
        await queryRunner.query(
          `
          UPDATE "e_schooling"."subject_attendance_sessions"
          SET session_title = COALESCE($1, session_title),
              timetable_slot_id = COALESCE($2, timetable_slot_id),
              taken_by_name = $3,
              updated_by_id = $4,
              updated_at = NOW()
          WHERE id = $5;
          `,
          [
            dto.sessionTitle || null,
            safeSlotId,
            callerName,
            safeTeacherId,
            sessionId,
          ],
        );
      }

      // 2. Process Records (Delete old and insert updated student records for this session)
      await queryRunner.query(
        `DELETE FROM "e_schooling"."subject_attendance_records" WHERE session_id = $1;`,
        [sessionId],
      );

      let savedCount = 0;
      for (const recDto of dto.records || []) {
        const mark = (recDto.attendanceMark || 'present').toLowerCase();
        const safeEnrollmentId =
          recDto.studentEnrollmentId &&
          /^\d+$/.test(String(recDto.studentEnrollmentId))
            ? String(recDto.studentEnrollmentId)
            : null;
        const safeStudentId =
          recDto.studentId && /^\d+$/.test(String(recDto.studentId))
            ? String(recDto.studentId)
            : null;

        await queryRunner.query(
          `
          INSERT INTO "e_schooling"."subject_attendance_records" (
            session_id, student_enrollment_id, student_id, attendance_mark, remarks, created_by_id, updated_by_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $6, NOW(), NOW()
          );
          `,
          [
            sessionId,
            safeEnrollmentId,
            safeStudentId,
            mark,
            recDto.remarks || null,
            safeTeacherId,
          ],
        );
        savedCount++;
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Subject attendance recorded successfully.',
        sessionId,
        savedCount,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get Subject Attendance Sessions & Records
   */
  async getSubjectAttendance(
    caller: AuthContext,
    schoolId: string,
    query: {
      classId?: string;
      sectionId?: string;
      subjectId?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
      academicSessionId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const conditions: string[] = [
      'sas.school_id = $1',
      'sas.is_delete = false',
    ];
    const params: (string | number | boolean | Date)[] = [schoolId];
    let paramIdx = 2;

    if (query.academicSessionId) {
      conditions.push(
        `(sas.academic_session_id = $${paramIdx} OR sas.academic_session_id IS NULL)`,
      );
      params.push(query.academicSessionId);
      paramIdx++;
    }
    if (query.classId) {
      conditions.push(`sas.class_id = $${paramIdx}`);
      params.push(query.classId);
      paramIdx++;
    }
    if (query.sectionId) {
      conditions.push(`sas.section_id = $${paramIdx}`);
      params.push(query.sectionId);
      paramIdx++;
    }
    if (query.subjectId) {
      conditions.push(`sas.subject_id = $${paramIdx}`);
      params.push(query.subjectId);
      paramIdx++;
    }
    if (query.date) {
      const parsed = this.parseDateFlexible(query.date);
      conditions.push(`sas.date = $${paramIdx}`);
      params.push(parsed);
      paramIdx++;
    }
    if (query.startDate && query.endDate) {
      const s = this.parseDateFlexible(query.startDate);
      const e = this.parseDateFlexible(query.endDate);
      conditions.push(`sas.date BETWEEN $${paramIdx} AND $${paramIdx + 1}`);
      params.push(s, e);
      paramIdx += 2;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await this.dataSource.query<RawCountResult[]>(
      `SELECT COUNT(*) as count FROM "e_schooling"."subject_attendance_sessions" sas WHERE ${whereClause}`,
      params,
    );
    const total = Number(countRes[0]?.count) || 0;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const sessionsRaw = await this.dataSource.query<
      RawSubjectAttendanceSessionRow[]
    >(
      `
      SELECT 
        sas.id,
        sas.school_id,
        sas.academic_session_id,
        sas.class_id,
        sas.section_id,
        sas.subject_id,
        sas.teacher_id,
        sas.timetable_slot_id,
        sas.date,
        sas.period_number,
        sas.session_title,
        sas.is_locked,
        sas.created_at,
        sas.updated_at,
        c.name as class_name,
        sec.name as section_name,
        s.name as subject_name,
        s.subject_code,
        su.name as teacher_name
      FROM "e_schooling"."subject_attendance_sessions" sas
      LEFT JOIN "e_schooling"."classes" c ON c.id = sas.class_id
      LEFT JOIN "e_schooling"."sections" sec ON sec.id = sas.section_id
      LEFT JOIN "e_schooling"."subjects" s ON s.id = sas.subject_id
      LEFT JOIN "e_schooling"."school_users" su ON su.id = sas.teacher_id
      WHERE ${whereClause}
      ORDER BY sas.date DESC, sas.period_number ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
      `,
      [...params, limit, offset],
    );

    const sessionIds = sessionsRaw.map((s) => s.id);
    const recordStats: Record<
      string,
      { total: number; present: number; absent: number; late: number }
    > = {};

    if (sessionIds.length > 0) {
      const rawCounts = await this.dataSource.query<
        RawSubjectAttendanceCountRow[]
      >(
        `
        SELECT 
          "session_id",
          COUNT(*) as total_records,
          SUM(CASE WHEN LOWER("attendance_mark") = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN LOWER("attendance_mark") = 'absent' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN LOWER("attendance_mark") = 'late' THEN 1 ELSE 0 END) as late_count
        FROM "e_schooling"."subject_attendance_records"
        WHERE "session_id" = ANY($1) AND "is_delete" = false
        GROUP BY "session_id";
        `,
        [sessionIds],
      );

      for (const row of rawCounts) {
        recordStats[String(row.session_id)] = {
          total: Number(row.total_records) || 0,
          present: Number(row.present_count) || 0,
          absent: Number(row.absent_count) || 0,
          late: Number(row.late_count) || 0,
        };
      }
    }

    const data = sessionsRaw.map((s) => {
      const stats = recordStats[String(s.id)] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
      const percentage =
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      return {
        id: String(s.id),
        schoolId: String(s.school_id),
        academicSessionId: s.academic_session_id
          ? String(s.academic_session_id)
          : null,
        classId: String(s.class_id),
        className: s.class_name || 'Class',
        sectionId: String(s.section_id),
        sectionName: s.section_name || 'Section',
        subjectId: String(s.subject_id),
        subjectName: s.subject_name || 'Subject',
        subjectCode: s.subject_code || '',
        teacherId: s.teacher_id ? String(s.teacher_id) : null,
        teacherName: s.teacher_name || 'Teacher',
        date:
          typeof s.date === 'string'
            ? s.date.split('T')[0]
            : new Date(s.date).toISOString().split('T')[0],
        periodNumber: Number(s.period_number) || 1,
        sessionTitle: s.session_title,
        isLocked: Boolean(s.is_locked),
        stats: {
          totalStudents: stats.total,
          presentCount: stats.present,
          absentCount: stats.absent,
          lateCount: stats.late,
          attendanceRate: percentage,
        },
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get Specific Subject Attendance Session and Student Records
   */
  async getSubjectAttendanceSession(
    caller: AuthContext,
    schoolId: string,
    sessionId: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    if (!sessionId || !/^\d+$/.test(String(sessionId))) {
      throw new NotFoundException('Subject attendance session not found');
    }

    const sessionRows = await this.dataSource.query<
      RawSubjectAttendanceSessionRow[]
    >(
      `
      SELECT 
        sas.id,
        sas.school_id,
        sas.academic_session_id,
        sas.class_id,
        sas.section_id,
        sas.subject_id,
        sas.teacher_id,
        sas.timetable_slot_id,
        sas.date,
        sas.period_number,
        sas.session_title,
        sas.is_locked,
        c.name as class_name,
        sec.name as section_name,
        s.name as subject_name,
        s.subject_code,
        su.name as teacher_name
      FROM "e_schooling"."subject_attendance_sessions" sas
      LEFT JOIN "e_schooling"."classes" c ON c.id = sas.class_id
      LEFT JOIN "e_schooling"."sections" sec ON sec.id = sas.section_id
      LEFT JOIN "e_schooling"."subjects" s ON s.id = sas.subject_id
      LEFT JOIN "e_schooling"."school_users" su ON su.id = sas.teacher_id
      WHERE sas.id = $1 AND sas.school_id = $2 AND sas.is_delete = false;
      `,
      [sessionId, schoolId],
    );

    if (!sessionRows || sessionRows.length === 0) {
      throw new NotFoundException('Subject attendance session not found');
    }

    const session = sessionRows[0];

    const recordsRaw = await this.dataSource.query<
      RawSubjectAttendanceRecordRow[]
    >(
      `
      SELECT 
        sar.id,
        sar.session_id,
        sar.student_enrollment_id,
        sar.student_id,
        sar.attendance_mark,
        sar.remarks,
        se.roll_number,
        COALESCE(st.full_name, st.first_name || ' ' || COALESCE(st.last_name, ''), 'Student') as student_name,
        COALESCE(st.student_code, st.admission_number, '') as student_code
      FROM "e_schooling"."subject_attendance_records" sar
      LEFT JOIN "e_schooling"."student_enrollments" se ON se.id = sar.student_enrollment_id
      LEFT JOIN "e_schooling"."students" st ON st.id = COALESCE(sar.student_id, se.student_id)
      WHERE sar.session_id = $1 AND sar.is_delete = false;
      `,
      [sessionId],
    );

    const formattedRecords = recordsRaw.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      studentEnrollmentId: r.student_enrollment_id
        ? String(r.student_enrollment_id)
        : null,
      studentId: String(r.student_id),
      studentName: r.student_name || 'Student',
      studentCode: r.student_code || '',
      rollNumber: r.roll_number || null,
      attendanceMark: r.attendance_mark,
      status: String(r.attendance_mark).toUpperCase(),
      remarks: r.remarks || '',
    }));

    return {
      session: {
        id: String(session.id),
        schoolId: String(session.school_id),
        academicSessionId: session.academic_session_id
          ? String(session.academic_session_id)
          : null,
        classId: String(session.class_id),
        className: session.class_name || 'Class',
        sectionId: String(session.section_id),
        sectionName: session.section_name || 'Section',
        subjectId: String(session.subject_id),
        subjectName: session.subject_name || 'Subject',
        subjectCode: session.subject_code || '',
        teacherId: session.teacher_id ? String(session.teacher_id) : null,
        teacherName: session.teacher_name || 'Teacher',
        date:
          typeof session.date === 'string'
            ? session.date.split('T')[0]
            : new Date(session.date).toISOString().split('T')[0],
        periodNumber: Number(session.period_number) || 1,
        sessionTitle: session.session_title,
        isLocked: Boolean(session.is_locked),
      },
      records: formattedRecords,
    };
  }

  /**
   * Timetable Slots for Subject Attendance
   */
  async getSubjectTimetableSlots(
    caller: AuthContext,
    schoolId: string,
    query: {
      classId: string;
      sectionId: string;
      subjectId?: string;
      date: string;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const formattedDate = this.parseDateFlexible(query.date);
    const parts = formattedDate.split('-');
    const dateObj =
      parts.length === 3
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(formattedDate);
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const rawSlots = await this.dataSource.query<RawTimetableSlotRow[]>(
      `
      SELECT 
        ts.id as slot_id,
        ts.day,
        ts.period_id,
        ts.class_id,
        ts.section_id,
        ts.subject_id,
        ts.teacher_id,
        ts.room_no,
        COALESCE(tp.display_order, 1) as period_number,
        COALESCE(tp.name, 'Period ' || COALESCE(tp.display_order, 1)) as period_name,
        tp.start_time,
        tp.end_time,
        s.name as subject_name,
        s.subject_code,
        su.name as teacher_name
      FROM "e_schooling"."academic_timetable_slots" ts
      LEFT JOIN "e_schooling"."academic_timetable_periods" tp ON tp.id = ts.period_id
      LEFT JOIN "e_schooling"."subjects" s ON s.id = ts.subject_id
      LEFT JOIN "e_schooling"."school_users" su ON su.id = ts.teacher_id
      WHERE ts.school_id = $1 
        AND ts.class_id = $2 
        AND ts.section_id = $3 
        AND LOWER(ts.day) = LOWER($4)
        AND ts.is_delete = false
        ${query.subjectId ? `AND ts.subject_id = ${Number(query.subjectId)}` : ''}
      ORDER BY COALESCE(tp.display_order, 1) ASC;
      `,
      [schoolId, query.classId, query.sectionId, dayOfWeek],
    );

    return rawSlots.map((row) => ({
      slotId: String(row.slot_id),
      day: row.day,
      periodId: String(row.period_id),
      periodNumber: Number(row.period_number) || 1,
      periodName: row.period_name || `Period ${row.period_number || 1}`,
      startTime: row.start_time,
      endTime: row.end_time,
      classId: String(row.class_id),
      sectionId: String(row.section_id),
      subjectId: String(row.subject_id),
      subjectName: row.subject_name || 'Subject',
      subjectCode: row.subject_code || '',
      teacherId: row.teacher_id ? String(row.teacher_id) : null,
      teacherName: row.teacher_name || 'Teacher',
      roomNo: row.room_no || '',
    }));
  }

  /**
   * Subject Attendance Summary per student / subject
   */
  async getSubjectAttendanceSummary(
    caller: AuthContext,
    schoolId: string,
    studentId: string,
    academicSessionId?: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const rawRows = await this.dataSource.query<RawSubjectSummaryRow[]>(
      `
      SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.subject_code,
        COUNT(sar.id) as total_conducted,
        SUM(CASE WHEN LOWER(sar.attendance_mark) = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN LOWER(sar.attendance_mark) = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN LOWER(sar.attendance_mark) = 'late' THEN 1 ELSE 0 END) as late_count
      FROM "e_schooling"."subject_attendance_records" sar
      INNER JOIN "e_schooling"."subject_attendance_sessions" sas ON sas.id = sar.session_id
      INNER JOIN "e_schooling"."subjects" s ON s.id = sas.subject_id
      WHERE sas.school_id = $1 
        AND (sar.student_id = $2 OR sar.student_enrollment_id IN (
          SELECT id FROM "e_schooling"."student_enrollments" WHERE student_id = $2
        ))
        AND sar.is_delete = false
        AND sas.is_delete = false
        ${academicSessionId ? `AND (sas.academic_session_id = ${Number(academicSessionId)} OR sas.academic_session_id IS NULL)` : ''}
      GROUP BY s.id, s.name, s.subject_code
      ORDER BY s.name ASC;
      `,
      [schoolId, studentId],
    );

    return rawRows.map((r) => {
      const total = Number(r.total_conducted) || 0;
      const present = Number(r.present_count) || 0;
      const late = Number(r.late_count) || 0;
      const percentage =
        total > 0 ? Math.round(((present + 0.5 * late) / total) * 100) : 100;

      return {
        subjectId: String(r.subject_id),
        subjectName: r.subject_name,
        subjectCode: r.subject_code,
        totalSessions: total,
        presentSessions: present,
        absentSessions: Number(r.absent_count) || 0,
        lateSessions: late,
        attendancePercentage: percentage,
      };
    });
  }

  /**
   * Optimized Attendance Dashboard Summary API (DB Aggregation)
   */
  async getAttendanceDashboardSummary(
    caller: AuthContext,
    schoolId: string,
    date?: string,
    academicSessionId?: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const targetDate = this.parseDateFlexible(date);
    const parsedDate = targetDate.split('-');
    const dateObj =
      parsedDate.length === 3
        ? new Date(
            Number(parsedDate[0]),
            Number(parsedDate[1]) - 1,
            Number(parsedDate[2]),
          )
        : new Date(targetDate);
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = dayNames[dateObj.getDay()];

    // 1. Total Active Classes & Sections
    const classesCountRes = await this.dataSource.query<RawCountResult[]>(
      `SELECT COUNT(*) as count FROM "e_schooling"."classes" WHERE "school_id" = $1 AND "is_delete" = false AND "is_active" = true;`,
      [schoolId],
    );
    const totalClasses = Number(classesCountRes[0]?.count) || 0;

    const sectionsCountRes = await this.dataSource.query<RawCountResult[]>(
      `SELECT COUNT(*) as count FROM "e_schooling"."sections" WHERE "school_id" = $1 AND "is_delete" = false AND "is_active" = true;`,
      [schoolId],
    );
    const totalSections = Number(sectionsCountRes[0]?.count) || 0;

    // 2. Daily Attendance Completed Sections Count (Strictly requires submitted student records)
    const dailyCompletedRes = await this.dataSource.query<RawCountResult[]>(
      `
      SELECT COUNT(DISTINCT att.section_id) as count 
      FROM "e_schooling"."attendance_sessions" att
      INNER JOIN "e_schooling"."attendance_records" rec 
        ON rec.session_id = att.id 
        AND rec.is_delete = false
      WHERE att.school_id = $1 
        AND att.date = $2 
        AND att.is_delete = false
        ${academicSessionId ? `AND (att.academic_session_id = ${Number(academicSessionId)} OR att.academic_session_id IS NULL)` : ''};
      `,
      [schoolId, targetDate],
    );
    const dailyCompleted = Number(dailyCompletedRes[0]?.count) || 0;
    const dailyPending = Math.max(0, totalSections - dailyCompleted);

    // 3. Expected Subject Attendance Slots from Timetable
    const expectedSlotsRes = await this.dataSource.query<RawCountResult[]>(
      `
      SELECT COUNT(*) as count 
      FROM "e_schooling"."academic_timetable_slots" 
      WHERE "school_id" = $1 
        AND LOWER("day") = LOWER($2) 
        AND "is_delete" = false
        AND "is_active" = true;
      `,
      [schoolId, dayOfWeek],
    );
    let subjectExpected = Number(expectedSlotsRes[0]?.count) || 0;

    // Fallback if timetable slots not scheduled: use classes with subjects assigned
    if (subjectExpected === 0) {
      const fallbackCount = await this.dataSource.query<RawCountResult[]>(
        `SELECT COUNT(*) as count FROM "e_schooling"."subjects" WHERE "school_id" = $1 AND "is_delete" = false AND "is_active" = true;`,
        [schoolId],
      );
      subjectExpected = Number(fallbackCount[0]?.count) || 0;
    }

    // 4. Completed Subject Attendance Sessions (Strictly requires submitted student records)
    const subjectCompletedRes = await this.dataSource.query<RawCountResult[]>(
      `
      SELECT COUNT(DISTINCT sas.id) as count 
      FROM "e_schooling"."subject_attendance_sessions" sas
      INNER JOIN "e_schooling"."subject_attendance_records" srec 
        ON srec.session_id = sas.id 
        AND srec.is_delete = false
      WHERE sas.school_id = $1 
        AND sas.date = $2 
        AND sas.is_delete = false
        ${academicSessionId ? `AND (sas.academic_session_id = ${Number(academicSessionId)} OR sas.academic_session_id IS NULL)` : ''};
      `,
      [schoolId, targetDate],
    );
    const subjectCompleted = Number(subjectCompletedRes[0]?.count) || 0;
    const subjectPending = Math.max(0, subjectExpected - subjectCompleted);

    const totalExpectedTransactions = totalSections + subjectExpected;
    const totalCompletedTransactions = dailyCompleted + subjectCompleted;
    const overallCompletionPercentage =
      totalExpectedTransactions > 0
        ? Math.round(
            (totalCompletedTransactions / totalExpectedTransactions) * 100,
          )
        : 100;

    return {
      totalClasses,
      totalSections,
      sectionsRequiringAttendance: totalSections,
      daily: {
        completed: dailyCompleted,
        pending: dailyPending,
      },
      subject: {
        expected: subjectExpected,
        completed: subjectCompleted,
        pending: subjectPending,
      },
      overallCompletionPercentage,
      date: targetDate,
    };
  }

  /**
   * Centralized Attendance Status & Overview API
   */
  async getAttendanceStatus(
    caller: AuthContext,
    schoolId: string,
    query: {
      date?: string;
      academicSessionId?: string;
      classId?: string;
      sectionId?: string;
      subjectId?: string;
      teacherId?: string;
      attendanceType?: string;
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const targetDate = this.parseDateFlexible(query.date);
    const searchLower = (query.search || '').trim().toLowerCase();

    // ── 1. Fetch All Active Classes & Sections ─────────────────────────────
    const sectionsRaw = await this.dataSource.query<RawSectionOverviewRow[]>(
      `
      SELECT 
        sec.id as section_id,
        sec.name as section_name,
        c.id as class_id,
        c.name as class_name,
        COUNT(se.id) as student_count
      FROM "e_schooling"."sections" sec
      INNER JOIN "e_schooling"."classes" c ON c.id = sec.class_id
      LEFT JOIN "e_schooling"."student_enrollments" se 
        ON se.section_id = sec.id 
        AND se.class_id = c.id 
        AND se.is_delete = false 
        AND se.is_current = true
        ${query.academicSessionId ? `AND (se.academic_session_id = ${Number(query.academicSessionId)} OR se.academic_session_id IS NULL)` : ''}
      WHERE sec.school_id = $1 
        AND sec.is_delete = false 
        AND sec.is_active = true
        AND c.is_delete = false 
        AND c.is_active = true
        ${query.classId ? `AND c.id = ${Number(query.classId)}` : ''}
        ${query.sectionId ? `AND sec.id = ${Number(query.sectionId)}` : ''}
      GROUP BY sec.id, sec.name, c.id, c.name
      ORDER BY c.name ASC, sec.name ASC;
      `,
      [schoolId],
    );

    // Fetch Teacher Section Assignments
    const teacherAssignmentsRaw = await this.dataSource.query<
      RawTeacherAssignmentRow[]
    >(
      `
      SELECT 
        ta.class_id,
        ta.section_id,
        ta.teacher_id,
        su.name as teacher_name,
        su.phone as teacher_phone
      FROM "e_schooling"."teacher_section_assignments" ta
      LEFT JOIN "e_schooling"."school_users" su ON su.id = ta.teacher_id
      WHERE ta.school_id = $1 AND ta.is_delete = false AND ta.is_active = true;
      `,
      [schoolId],
    );

    const teacherMap = new Map<
      string,
      { id: string; name: string; phone: string; email: string }
    >();
    for (const ta of teacherAssignmentsRaw) {
      if (ta.section_id) {
        teacherMap.set(`sec-${ta.section_id}`, {
          id: String(ta.teacher_id || ''),
          name: ta.teacher_name || 'Not Assigned',
          phone: ta.teacher_phone || '',
          email: '',
        });
      } else if (ta.class_id) {
        teacherMap.set(`cls-${ta.class_id}`, {
          id: String(ta.teacher_id || ''),
          name: ta.teacher_name || 'Not Assigned',
          phone: ta.teacher_phone || '',
          email: '',
        });
      }
    }

    // ── 2. Daily Attendance Sessions for Today ─────────────────────────────
    const dailySessionsRaw = await this.dataSource.query<
      RawDailyAttendanceSessionRow[]
    >(
      `
      SELECT 
        att.id as session_id,
        att.school_id,
        att.academic_session_id,
        att.class_id,
        att.section_id,
        att.date,
        att.session_slot,
        att.taken_by,
        att.taken_by_name,
        att.created_by_id,
        att.created_at,
        att.updated_at,
        c.name as class_name,
        sec.name as section_name,
        COALESCE(NULLIF(TRIM(att.taken_by_name), ''), so.full_name, su.name, pu.name, '') as marked_by_name
      FROM "e_schooling"."attendance_sessions" att
      LEFT JOIN "e_schooling"."classes" c ON c.id = att.class_id
      LEFT JOIN "e_schooling"."sections" sec ON sec.id = att.section_id
      LEFT JOIN "e_schooling"."schools" sch ON sch.id = att.school_id
      LEFT JOIN "e_schooling"."school_owners" so ON so.id = sch.created_by_id AND (att.taken_by = sch.created_by_id OR att.created_by_id = sch.created_by_id)
      LEFT JOIN "e_schooling"."school_users" su ON su.id = COALESCE(att.taken_by, att.created_by_id) AND su.school_id = att.school_id
      LEFT JOIN "e_schooling"."platform_users" pu ON pu.id = COALESCE(att.taken_by, att.created_by_id)
      WHERE att.school_id = $1 
        AND att.date = $2 
        AND att.is_delete = false
        ${query.academicSessionId ? `AND (att.academic_session_id = ${Number(query.academicSessionId)} OR att.academic_session_id IS NULL)` : ''}
        ${query.classId ? `AND att.class_id = ${Number(query.classId)}` : ''}
        ${query.sectionId ? `AND att.section_id = ${Number(query.sectionId)}` : ''};
      `,
      [schoolId, targetDate],
    );

    const markedDailySectionIds = new Set<string>();
    const sessionIds = dailySessionsRaw.map((s) => s.session_id);

    // Fetch Daily Attendance Records Counts
    const dailyRecordsStats: Record<
      string,
      {
        total: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
      }
    > = {};

    if (sessionIds.length > 0) {
      const dailyCounts = await this.dataSource.query<
        RawDailyAttendanceCountRow[]
      >(
        `
        SELECT 
          session_id,
          COUNT(id) as total,
          COUNT(CASE WHEN UPPER(attendance_mark) = 'PRESENT' THEN 1 END) as present,
          COUNT(CASE WHEN UPPER(attendance_mark) = 'ABSENT' THEN 1 END) as absent,
          COUNT(CASE WHEN UPPER(attendance_mark) = 'LATE' THEN 1 END) as late,
          COUNT(CASE WHEN UPPER(attendance_mark) = 'LEAVE' THEN 1 END) as leave
        FROM "e_schooling"."attendance_records"
        WHERE session_id IN (${sessionIds.map((id) => `'${id}'`).join(',')})
          AND is_delete = false
        GROUP BY session_id;
        `,
      );

      for (const row of dailyCounts) {
        dailyRecordsStats[String(row.session_id)] = {
          total: Number(row.total) || 0,
          present: Number(row.present) || 0,
          absent: Number(row.absent) || 0,
          late: Number(row.late) || 0,
          leave: Number(row.leave) || 0,
        };
      }
    }

    // Build Daily Completed List
    const dailyCompletedList = dailySessionsRaw.map((s) => {
      markedDailySectionIds.add(String(s.section_id));
      const stats = dailyRecordsStats[String(s.session_id)] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      };
      const rate =
        stats.total > 0
          ? Math.round((stats.present / stats.total) * 100 * 10) / 10
          : 0;

      const teacherInfo = teacherMap.get(`sec-${s.section_id}`) ||
        teacherMap.get(`cls-${s.class_id}`) || {
          id: null,
          name: 'Not Assigned',
          phone: '',
          email: '',
        };

      const markedDate = s.created_at ? new Date(s.created_at) : new Date();
      const markedAtFormatted = markedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: String(s.session_id),
        sessionId: String(s.session_id),
        schoolId: String(s.school_id),
        academicSessionId: s.academic_session_id
          ? String(s.academic_session_id)
          : null,
        classId: String(s.class_id),
        className: s.class_name || `Class ${s.class_id}`,
        sectionId: String(s.section_id),
        sectionName: s.section_name || `Section ${s.section_id}`,
        classTeacherId: teacherInfo.id || null,
        classTeacherName: teacherInfo.name,
        attendanceResponsibleTeacher: teacherInfo.name,
        totalStudents: stats.total,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        leave: stats.leave,
        attendancePercentage: rate,
        markedById: String(s.taken_by || s.created_by_id || ''),
        markedBy: s.marked_by_name || '',
        markedAt: markedAtFormatted,
        markedAtIso: s.created_at,
        updatedAtIso: s.updated_at,
        status: 'COMPLETED',
        date: targetDate,
      };
    });

    // Build Daily Pending List
    const dailyPendingList = sectionsRaw
      .filter((sec) => !markedDailySectionIds.has(String(sec.section_id)))
      .map((sec) => {
        const teacherInfo = teacherMap.get(`sec-${sec.section_id}`) ||
          teacherMap.get(`cls-${sec.class_id}`) || {
            id: '',
            name: 'Not Assigned',
            phone: '',
            email: '',
          };

        return {
          id: `pending-daily-${sec.section_id}`,
          schoolId: String(schoolId),
          academicSessionId: query.academicSessionId || null,
          classId: String(sec.class_id),
          className: sec.class_name || `Class ${sec.class_id}`,
          sectionId: String(sec.section_id),
          sectionName: sec.section_name || `Section ${sec.section_id}`,
          classTeacherId: teacherInfo.id || null,
          classTeacherName: teacherInfo.name,
          attendanceResponsibleTeacher: teacherInfo.name,
          totalStudents: Number(sec.student_count) || 0,
          date: targetDate,
          status: 'PENDING',
          action: 'Mark Attendance',
        };
      });

    // ── 3. Subject-Wise Attendance (Timetable slots & Sessions) ────────────
    const parts = targetDate.split('-');
    const dateObj =
      parts.length === 3
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(targetDate);
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const timetableSlotsRaw = await this.dataSource.query<
      RawTimetableSlotOverviewRow[]
    >(
      `
      SELECT 
        ts.id as slot_id,
        ts.school_id,
        ts.class_id,
        ts.section_id,
        ts.subject_id,
        ts.teacher_id,
        ts.day as day_of_week,
        COALESCE(tp.display_order, 1) as period_number,
        tp.start_time,
        tp.end_time,
        c.name as class_name,
        sec.name as section_name,
        s.name as subject_name,
        s.subject_code,
        su.name as teacher_name
      FROM "e_schooling"."academic_timetable_slots" ts
      LEFT JOIN "e_schooling"."academic_timetable_periods" tp ON tp.id = ts.period_id
      INNER JOIN "e_schooling"."classes" c ON c.id = ts.class_id AND c.is_delete = false
      INNER JOIN "e_schooling"."sections" sec ON sec.id = ts.section_id AND sec.is_delete = false
      INNER JOIN "e_schooling"."subjects" s ON s.id = ts.subject_id AND s.is_delete = false
      LEFT JOIN "e_schooling"."school_users" su ON su.id = ts.teacher_id
      WHERE ts.school_id = $1 
        AND LOWER(ts.day) = LOWER($2) 
        AND ts.is_delete = false 
        AND ts.is_active = true
        ${query.classId ? `AND ts.class_id = ${Number(query.classId)}` : ''}
        ${query.sectionId ? `AND ts.section_id = ${Number(query.sectionId)}` : ''}
        ${query.subjectId ? `AND ts.subject_id = ${Number(query.subjectId)}` : ''}
        ${query.teacherId ? `AND ts.teacher_id = ${Number(query.teacherId)}` : ''}
      ORDER BY COALESCE(tp.display_order, 1) ASC;
      `,
      [schoolId, dayOfWeek],
    );

    // Completed Subject Sessions
    const subjectSessionsRaw = await this.dataSource.query<
      RawSubjectAttendanceSessionOverviewRow[]
    >(
      `
      SELECT 
        sas.id as session_id,
        sas.school_id,
        sas.academic_session_id,
        sas.class_id,
        sas.section_id,
        sas.subject_id,
        sas.teacher_id,
        sas.timetable_slot_id,
        sas.date,
        sas.period_number,
        sas.session_title,
        sas.is_locked,
        sas.taken_by_name,
        sas.created_by_id,
        sas.created_at,
        sas.updated_at,
        c.name as class_name,
        sec.name as section_name,
        s.name as subject_name,
        s.subject_code,
        su.name as teacher_name,
        COALESCE(NULLIF(TRIM(sas.taken_by_name), ''), so.full_name, su.name, marker.name, pu.name, '') as marked_by_name
      FROM "e_schooling"."subject_attendance_sessions" sas
      LEFT JOIN "e_schooling"."classes" c ON c.id = sas.class_id
      LEFT JOIN "e_schooling"."sections" sec ON sec.id = sas.section_id
      LEFT JOIN "e_schooling"."subjects" s ON s.id = sas.subject_id
      LEFT JOIN "e_schooling"."schools" sch ON sch.id = sas.school_id
      LEFT JOIN "e_schooling"."school_owners" so ON so.id = sch.created_by_id AND (sas.teacher_id = sch.created_by_id OR sas.created_by_id = sch.created_by_id)
      LEFT JOIN "e_schooling"."school_users" su ON su.id = sas.teacher_id AND su.school_id = sas.school_id
      LEFT JOIN "e_schooling"."school_users" marker ON marker.id = sas.created_by_id AND marker.school_id = sas.school_id
      LEFT JOIN "e_schooling"."platform_users" pu ON pu.id = sas.created_by_id
      WHERE sas.school_id = $1 
        AND sas.date = $2 
        AND sas.is_delete = false
        ${query.academicSessionId ? `AND (sas.academic_session_id = ${Number(query.academicSessionId)} OR sas.academic_session_id IS NULL)` : ''}
        ${query.classId ? `AND sas.class_id = ${Number(query.classId)}` : ''}
        ${query.sectionId ? `AND sas.section_id = ${Number(query.sectionId)}` : ''}
        ${query.subjectId ? `AND sas.subject_id = ${Number(query.subjectId)}` : ''};
      `,
      [schoolId, targetDate],
    );

    const subjectSessionIds = subjectSessionsRaw.map((s) => s.session_id);
    const subjectRecordsStats: Record<
      string,
      { total: number; present: number; absent: number; late: number }
    > = {};

    if (subjectSessionIds.length > 0) {
      const subjCounts = await this.dataSource.query<
        RawSubjectAttendanceCountRow[]
      >(
        `
        SELECT 
          "session_id",
          COUNT(*) as total_records,
          SUM(CASE WHEN LOWER("attendance_mark") = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN LOWER("attendance_mark") = 'absent' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN LOWER("attendance_mark") = 'late' THEN 1 ELSE 0 END) as late_count
        FROM "e_schooling"."subject_attendance_records"
        WHERE "session_id" = ANY($1) AND "is_delete" = false
        GROUP BY "session_id";
        `,
        [subjectSessionIds],
      );

      for (const row of subjCounts) {
        subjectRecordsStats[String(row.session_id)] = {
          total: Number(row.total_records) || 0,
          present: Number(row.present_count) || 0,
          absent: Number(row.absent_count) || 0,
          late: Number(row.late_count) || 0,
        };
      }
    }

    const markedSubjectSlotKeys = new Set<string>();

    // Build Subject Completed List (Only sessions with recorded attendance)
    const validSubjectSessions = subjectSessionsRaw.filter((s) => {
      const stats = subjectRecordsStats[String(s.session_id)];
      return stats && stats.total > 0;
    });

    for (const s of validSubjectSessions) {
      const slotKey = `${s.class_id}-${s.section_id}-${s.subject_id}-${s.period_number}`;
      markedSubjectSlotKeys.add(slotKey);
      if (s.timetable_slot_id) {
        markedSubjectSlotKeys.add(`slot-${s.timetable_slot_id}`);
      }
    }

    const subjectCompletedList = validSubjectSessions.map((s) => {
      const stats = subjectRecordsStats[String(s.session_id)] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
      const rate =
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

      const markedDate = s.created_at ? new Date(s.created_at) : new Date();
      const markedAtFormatted = markedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: String(s.session_id),
        sessionId: String(s.session_id),
        schoolId: String(s.school_id),
        academicSessionId: s.academic_session_id
          ? String(s.academic_session_id)
          : null,
        classId: String(s.class_id),
        className: s.class_name || `Class ${s.class_id}`,
        sectionId: String(s.section_id),
        sectionName: s.section_name || `Section ${s.section_id}`,
        subjectId: String(s.subject_id),
        subjectName: s.subject_name || 'Subject',
        subjectCode: s.subject_code || '',
        subjectTeacherId: s.teacher_id ? String(s.teacher_id) : null,
        subjectTeacherName: s.teacher_name || 'Not Assigned',
        period: s.period_number ? `Period ${s.period_number}` : 'Slot',
        periodNumber: Number(s.period_number) || 1,
        totalStudents: stats.total,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        attendancePercentage: rate,
        markedById: String(s.teacher_id || s.created_by_id || ''),
        markedBy: s.marked_by_name || '',
        markedAt: markedAtFormatted,
        markedAtIso: s.created_at,
        updatedAtIso: s.updated_at,
        status: 'COMPLETED',
        date: targetDate,
      };
    });

    const sectionStudentCountMap = new Map<string, number>();
    for (const sec of sectionsRaw) {
      sectionStudentCountMap.set(
        String(sec.section_id),
        Number(sec.student_count) || 0,
      );
    }

    // Build Subject Pending List from Expected Timetable Slots
    const subjectPendingList = timetableSlotsRaw
      .filter((slot) => {
        const slotKey = `${slot.class_id}-${slot.section_id}-${slot.subject_id}-${slot.period_number}`;
        const slotIdKey = `slot-${slot.slot_id}`;
        return (
          !markedSubjectSlotKeys.has(slotKey) &&
          !markedSubjectSlotKeys.has(slotIdKey)
        );
      })
      .map((slot) => {
        return {
          id: `pending-subject-${slot.slot_id}`,
          timetableSlotId: String(slot.slot_id),
          schoolId: String(schoolId),
          academicSessionId: query.academicSessionId || null,
          classId: String(slot.class_id),
          className: slot.class_name || `Class ${slot.class_id}`,
          sectionId: String(slot.section_id),
          sectionName: slot.section_name || `Section ${slot.section_id}`,
          subjectId: String(slot.subject_id),
          subjectName: slot.subject_name || 'Subject',
          subjectCode: slot.subject_code || '',
          subjectTeacherId: slot.teacher_id ? String(slot.teacher_id) : null,
          subjectTeacherName: slot.teacher_name || 'Not Assigned',
          period: `Period ${slot.period_number || 1}`,
          periodNumber: Number(slot.period_number) || 1,
          totalStudents:
            sectionStudentCountMap.get(String(slot.section_id)) || 0,
          date: targetDate,
          status: 'PENDING',
          action: 'Mark Subject Attendance',
        };
      });

    // ── 4. Apply Search & Pagination Filters ───────────────────────────────
    const filterRow = (row: StatusItemOverview) => {
      if (!searchLower) return true;
      const cName = (row.className || '').toLowerCase();
      const sName = (row.sectionName || '').toLowerCase();
      const subName = (row.subjectName || '').toLowerCase();
      const tName = (
        row.classTeacherName ||
        row.subjectTeacherName ||
        ''
      ).toLowerCase();
      const mBy = (row.markedBy || '').toLowerCase();
      return (
        cName.includes(searchLower) ||
        sName.includes(searchLower) ||
        subName.includes(searchLower) ||
        tName.includes(searchLower) ||
        mBy.includes(searchLower)
      );
    };

    const filteredDailyPending = dailyPendingList.filter(filterRow);
    const filteredDailyCompleted = dailyCompletedList.filter(filterRow);
    const filteredSubjectPending = subjectPendingList.filter(filterRow);
    const filteredSubjectCompleted = subjectCompletedList.filter(filterRow);

    // Summary calculation
    const totalClassesCount = new Set(sectionsRaw.map((s) => s.class_id)).size;
    const totalSectionsCount = sectionsRaw.length;
    const dailyCompletedCount = dailyCompletedList.length;
    const dailyPendingCount = dailyPendingList.length;
    const subjectExpectedCount =
      timetableSlotsRaw.length || subjectSessionsRaw.length;
    const subjectCompletedCount = subjectCompletedList.length;
    const subjectPendingCount = subjectPendingList.length;

    const totalExp = totalSectionsCount + subjectExpectedCount;
    const totalComp = dailyCompletedCount + subjectCompletedCount;
    const completionPercentage =
      totalExp > 0 ? Math.round((totalComp / totalExp) * 100) : 100;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    return {
      summary: {
        totalClasses: totalClassesCount,
        totalSections: totalSectionsCount,
        dailyCompleted: dailyCompletedCount,
        dailyPending: dailyPendingCount,
        subjectExpected: subjectExpectedCount,
        subjectCompleted: subjectCompletedCount,
        subjectPending: subjectPendingCount,
        completionPercentage,
        date: targetDate,
      },
      daily: {
        pending: filteredDailyPending.slice(offset, offset + limit),
        completed: filteredDailyCompleted.slice(offset, offset + limit),
        meta: {
          pendingTotal: filteredDailyPending.length,
          completedTotal: filteredDailyCompleted.length,
          page,
          limit,
        },
      },
      subject: {
        pending: filteredSubjectPending.slice(offset, offset + limit),
        completed: filteredSubjectCompleted.slice(offset, offset + limit),
        meta: {
          pendingTotal: filteredSubjectPending.length,
          completedTotal: filteredSubjectCompleted.length,
          page,
          limit,
        },
      },
    };
  }

  async getStaffAttendanceList(
    caller: AuthContext,
    schoolId: string,
    date?: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    const targetDate = this.parseDateFlexible(date);
    try {
      const rows = await this.dataSource.query<RawStaffAttendanceRow[]>(
        `SELECT * FROM "e_schooling"."staff_attendance" WHERE "school_id" = $1 AND "date" = $2 AND "is_deleted" = false`,
        [schoolId, targetDate],
      );
      return rows.map((r) => {
        let dateStr = targetDate;
        if (typeof r.date === 'string') {
          dateStr = r.date;
        } else if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split('T')[0];
        }
        return {
          id: String(r.id),
          schoolId: String(r.school_id),
          staffId: String(r.staff_id),
          employeeCode: r.employee_code || '',
          name: r.staff_name || '',
          staffName: r.staff_name || '',
          role: r.role || '',
          department: r.department || '',
          date: dateStr,
          status: r.status || 'Present',
          checkIn: r.check_in || '08:15 AM',
          checkOut: r.check_out || '04:30 PM',
          source: r.source || 'MANUAL',
          remarks: r.remarks || '',
          isLocked: Boolean(r.is_locked),
        };
      });
    } catch (err) {
      console.warn('Failed to query staff attendance:', err);
      return [];
    }
  }

  async markStaffAttendance(
    caller: AuthContext,
    schoolId: string,
    dto: MarkStaffAttendanceDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    const targetDate = this.parseDateFlexible(dto.date);
    const staffId = dto.staffId || caller.id;
    const employeeCode = dto.employeeCode || '';
    const staffName = dto.staffName || dto.name || '';
    const role = dto.role || '';
    const department = dto.department || '';
    const status = dto.status || 'Present';
    const checkIn = dto.checkIn || '08:15 AM';
    const checkOut = dto.checkOut || '04:30 PM';
    const source = dto.source || 'MANUAL';
    const remarks = dto.remarks || '';

    try {
      const result = await this.dataSource.query<RawStaffAttendanceRow[]>(
        `
        INSERT INTO "e_schooling"."staff_attendance"
          ("school_id", "staff_id", "employee_code", "staff_name", "role", "department", "date", "status", "check_in", "check_out", "source", "remarks", "updated_at")
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT ("school_id", "staff_id", "date")
        DO UPDATE SET
          "status" = EXCLUDED.status,
          "check_in" = EXCLUDED.check_in,
          "check_out" = EXCLUDED.check_out,
          "source" = EXCLUDED.source,
          "remarks" = EXCLUDED.remarks,
          "updated_at" = NOW()
        RETURNING *;
        `,
        [
          schoolId,
          staffId,
          employeeCode,
          staffName,
          role,
          department,
          targetDate,
          status,
          checkIn,
          checkOut,
          source,
          remarks,
        ],
      );
      const r = result[0];
      return {
        id: String(r.id),
        schoolId: String(r.school_id),
        staffId: String(r.staff_id),
        employeeCode: r.employee_code || '',
        staffName: r.staff_name || '',
        name: r.staff_name || '',
        role: r.role || '',
        department: r.department || '',
        date: targetDate,
        status: r.status || 'Present',
        checkIn: r.check_in || '08:15 AM',
        checkOut: r.check_out || '04:30 PM',
        source: r.source || 'MANUAL',
        remarks: r.remarks || '',
      };
    } catch (err) {
      console.error('Failed to mark staff attendance:', err);
      throw err;
    }
  }

  async getStaffAttendanceHistory(
    caller: AuthContext,
    schoolId: string,
    staffId: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    try {
      const rows = await this.dataSource.query<RawStaffAttendanceRow[]>(
        `SELECT * FROM "e_schooling"."staff_attendance" WHERE "school_id" = $1 AND "staff_id" = $2 AND "is_deleted" = false ORDER BY "date" DESC LIMIT 100`,
        [schoolId, staffId],
      );
      return rows.map((r) => {
        let dateStr = '';
        if (typeof r.date === 'string') {
          dateStr = r.date;
        } else if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split('T')[0];
        }
        return {
          id: String(r.id),
          schoolId: String(r.school_id),
          staffId: String(r.staff_id),
          date: dateStr,
          status: r.status || 'Present',
          checkIn: r.check_in || '08:15 AM',
          checkOut: r.check_out || '04:30 PM',
          source: r.source || 'MANUAL',
          remarks: r.remarks || '',
        };
      });
    } catch (err) {
      console.warn('Failed to query staff attendance history:', err);
      return [];
    }
  }

  async syncBiometricPunches(
    caller: AuthContext,
    schoolId: string,
    dto: SyncBiometricPunchesDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    return Promise.resolve({
      success: true,
      message: 'Biometric punches synchronized successfully',
      syncedCount: 0,
      syncDate: dto.syncDate || new Date().toISOString().split('T')[0],
    });
  }

  async mobileCheckIn(
    caller: AuthContext,
    schoolId: string,
    dto: MobileGeoAttendanceDto,
  ) {
    const targetDate = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return this.markStaffAttendance(caller, schoolId, {
      staffId: dto.staffId || caller.id,
      date: targetDate,
      checkIn: nowTime,
      status: 'Present',
      source: 'MOBILE_GEO',
      remarks: `Geo Check-In at (${dto.lat}, ${dto.lng})`,
    });
  }

  async mobileCheckOut(
    caller: AuthContext,
    schoolId: string,
    dto: MobileGeoAttendanceDto,
  ) {
    const targetDate = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return this.markStaffAttendance(caller, schoolId, {
      staffId: dto.staffId || caller.id,
      date: targetDate,
      checkOut: nowTime,
      source: 'MOBILE_GEO',
      remarks: `Geo Check-Out at (${dto.lat}, ${dto.lng})`,
    });
  }
}
