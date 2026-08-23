import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

export async function seedAttendanceAndTimetables(
  dataSource: DataSource,
  schoolId: string = '2',
) {
  console.log(
    `🚀 Starting Attendance and Timetables Seeder for School ID: ${schoolId}...`,
  );

  // 1. Fetch Active Enrollments
  const enrollments: {
    id: string;
    student_id: string;
    class_id: string;
    section_id: string;
    academic_session_id: string;
  }[] = await dataSource.query(
    `SELECT e.id, e.student_id, e.class_id, e.section_id, e.academic_session_id
       FROM "e_schooling"."student_enrollments" e
       JOIN "e_schooling"."students" s ON s.id = e.student_id
       WHERE s.school_id = $1 AND (s.is_delete IS FALSE OR s.is_delete IS NULL)`,
    [schoolId],
  );

  if (!enrollments.length) {
    console.log(
      '⚠️ No active student enrollments found. Please run npm run seed:students first.',
    );
    return;
  }

  console.log(`Found ${enrollments.length} student enrollments.`);

  // 2. Fetch School Owner User ID & School Users (Teachers)
  const owners = await dataSource.query(
    `SELECT id, full_name FROM "e_schooling"."school_owners" LIMIT 1`,
  );
  const ownerId = owners.length ? String(owners[0].id) : '1';

  const teachers = await dataSource.query(
    `SELECT id, name FROM "e_schooling"."school_users" WHERE school_id = $1 AND is_delete = false LIMIT 10`,
    [schoolId],
  );
  const defaultTeacherId = teachers.length ? String(teachers[0].id) : null;

  // 3. Fetch Subjects
  const subjects = await dataSource.query(
    `SELECT id, name, subject_code FROM "e_schooling"."subjects" WHERE school_id = $1 AND is_delete = false`,
    [schoolId],
  );

  // 4. Ensure Academic Timetable Periods Exist
  const periodsData = [
    { name: 'Period 1', startTime: '08:30 AM', endTime: '09:15 AM', order: 1 },
    { name: 'Period 2', startTime: '09:15 AM', endTime: '10:00 AM', order: 2 },
    { name: 'Period 3', startTime: '10:00 AM', endTime: '10:45 AM', order: 3 },
    { name: 'Period 4', startTime: '11:00 AM', endTime: '11:45 AM', order: 4 },
    { name: 'Period 5', startTime: '11:45 AM', endTime: '12:30 PM', order: 5 },
    { name: 'Period 6', startTime: '12:30 PM', endTime: '01:15 PM', order: 6 },
  ];

  const periodIds: string[] = [];
  for (const p of periodsData) {
    const existing = await dataSource.query(
      `SELECT id FROM "e_schooling"."academic_timetable_periods" WHERE school_id = $1 AND display_order = $2 LIMIT 1`,
      [schoolId, p.order],
    );
    if (existing.length > 0) {
      periodIds.push(String(existing[0].id));
    } else {
      const inserted = await dataSource.query(
        `INSERT INTO "e_schooling"."academic_timetable_periods" 
         (school_id, name, start_time, end_time, type, display_order, is_active, is_delete, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'teaching', $5, true, false, NOW(), NOW())
         RETURNING id`,
        [schoolId, p.name, p.startTime, p.endTime, p.order],
      );
      periodIds.push(String(inserted[0].id));
    }
  }

  // 5. Ensure Timetable Header Exists
  let timetableId: string;
  const existingTimetable = await dataSource.query(
    `SELECT id FROM "e_schooling"."academic_timetables" WHERE school_id = $1 LIMIT 1`,
    [schoolId],
  );
  if (existingTimetable.length > 0) {
    timetableId = String(existingTimetable[0].id);
  } else {
    const insertedTimetable = await dataSource.query(
      `INSERT INTO "e_schooling"."academic_timetables" 
       (school_id, name, academic_year_id, status, is_active, is_delete, created_at, updated_at)
       VALUES ($1, 'Master Timetable 2026-2027', '1', 'published', true, false, NOW(), NOW())
       RETURNING id`,
      [schoolId],
    );
    timetableId = String(insertedTimetable[0].id);
  }

  // Group enrollments by class & section
  const classSecMap = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const key = `${e.class_id}_${e.section_id}_${e.academic_session_id}`;
    if (!classSecMap.has(key)) classSecMap.set(key, []);
    classSecMap.get(key)!.push(e);
  }

  // 6. Ensure Timetable Slots for Monday–Saturday
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let slotsCreated = 0;

  for (const key of classSecMap.keys()) {
    const [classId, sectionId] = key.split('_');

    for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
      const dayName = daysOfWeek[dayIdx];
      for (let pIdx = 0; pIdx < Math.min(periodIds.length, 3); pIdx++) {
        const periodId = periodIds[pIdx];
        const subject = subjects.length ? subjects[(pIdx + dayIdx) % subjects.length] : null;
        const teacher = teachers.length ? teachers[(pIdx + dayIdx) % teachers.length] : null;
        const subjectId = subject ? String(subject.id) : null;
        const teacherId = teacher ? String(teacher.id) : defaultTeacherId;

        if (!subjectId) continue;

        const existingSlot = await dataSource.query(
          `SELECT id FROM "e_schooling"."academic_timetable_slots"
           WHERE school_id = $1 AND class_id = $2 AND section_id = $3 AND LOWER(day) = LOWER($4) AND period_id = $5 LIMIT 1`,
          [schoolId, classId, sectionId, dayName, periodId],
        );

        if (existingSlot.length === 0) {
          await dataSource.query(
            `INSERT INTO "e_schooling"."academic_timetable_slots"
             (school_id, timetable_id, day, period_id, class_id, section_id, subject_id, teacher_id, is_active, is_delete, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, NOW(), NOW())`,
            [schoolId, timetableId, dayName, periodId, classId, sectionId, subjectId, teacherId],
          );
          slotsCreated++;
        }
      }
    }
  }
  console.log(`✅ Ensured ${slotsCreated} academic timetable slots.`);

  // 7. Seed Past 1-Week Daily Attendance (2026-08-11 to 2026-08-17)
  const pastWeekDates = [
    '2026-08-11',
    '2026-08-12',
    '2026-08-13',
    '2026-08-14',
    '2026-08-15',
    '2026-08-16',
    '2026-08-17', // Today
  ];

  let totalSessionsCreated = 0;
  let totalRecordsCreated = 0;

  const classSecEntries = Array.from(classSecMap.entries());

  for (let secIdx = 0; secIdx < classSecEntries.length; secIdx++) {
    const [key, group] = classSecEntries[secIdx];
    const [classId, sectionId, academicSessionId] = key.split('_');

    for (const dateStr of pastWeekDates) {
      // On today (2026-08-17), mark half of the sections completed and leave half pending
      const isToday = dateStr === '2026-08-17';
      if (isToday && secIdx % 2 !== 0) {
        // Leave pending for UI demonstration
        continue;
      }

      // Check if session exists
      const existingSession = await dataSource.query(
        `SELECT id FROM "e_schooling"."attendance_sessions" 
         WHERE school_id = $1 AND class_id = $2 AND section_id = $3 AND date = $4 LIMIT 1`,
        [schoolId, classId, sectionId, dateStr],
      );

      let sessionId: string;
      if (existingSession.length > 0) {
        sessionId = existingSession[0].id;
      } else {
        const insertSessionResult = await dataSource.query(
          `INSERT INTO "e_schooling"."attendance_sessions" 
           (school_id, academic_session_id, class_id, section_id, date, taken_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id`,
          [schoolId, academicSessionId, classId, sectionId, dateStr, ownerId],
        );
        sessionId = insertSessionResult[0].id;
        totalSessionsCreated++;
      }

      // Generate attendance marks for students in this section
      for (const studentEnv of group) {
        const existingRecord = await dataSource.query(
          `SELECT id FROM "e_schooling"."attendance_records"
           WHERE session_id = $1 AND student_enrollment_id = $2 LIMIT 1`,
          [sessionId, studentEnv.id],
        );

        if (existingRecord.length === 0) {
          const rand = Math.random();
          let mark = 'PRESENT';
          let remarks = 'Regular Attendance';

          if (rand > 0.95) {
            mark = 'LEAVE';
            remarks = 'Approved Medical Leave';
          } else if (rand > 0.9) {
            mark = 'HALF_DAY';
            remarks = 'Left early at 01:00 PM';
          } else if (rand > 0.85) {
            mark = 'LATE';
            remarks = 'Arrived 15 mins late';
          } else if (rand > 0.8) {
            mark = 'ABSENT';
            remarks = 'Uninformed Absence';
          }

          await dataSource.query(
            `INSERT INTO "e_schooling"."attendance_records"
             (session_id, student_enrollment_id, attendance_mark, remarks, created_by_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [sessionId, studentEnv.id, mark, remarks, ownerId],
          );
          totalRecordsCreated++;
        }
      }
    }
  }

  // 8. Seed Subject Attendance Sessions for 2026-08-17 (Today)
  const mondaySlots = await dataSource.query(
    `SELECT ts.id as slot_id, ts.class_id, ts.section_id, ts.subject_id, ts.teacher_id,
            COALESCE(tp.display_order, 1) as period_number
     FROM "e_schooling"."academic_timetable_slots" ts
     LEFT JOIN "e_schooling"."academic_timetable_periods" tp ON tp.id = ts.period_id
     WHERE ts.school_id = $1 AND LOWER(ts.day) = 'monday' AND ts.is_delete = false LIMIT 6`,
    [schoolId],
  );

  let subjectSessionsCreated = 0;
  let subjectRecordsCreated = 0;

  // Complete half the slots for today
  for (let i = 0; i < mondaySlots.length; i++) {
    if (i % 2 !== 0) continue; // leave other half pending

    const slot = mondaySlots[i];
    const key = `${slot.class_id}_${slot.section_id}_1`;
    const enrolledStudents = classSecMap.get(key) || [];

    const existingSubjSession = await dataSource.query(
      `SELECT id FROM "e_schooling"."subject_attendance_sessions"
       WHERE school_id = $1 AND class_id = $2 AND section_id = $3 AND subject_id = $4 AND date = '2026-08-17' LIMIT 1`,
      [schoolId, slot.class_id, slot.section_id, slot.subject_id],
    );

    let subjSessionId: string;
    if (existingSubjSession.length > 0) {
      subjSessionId = existingSubjSession[0].id;
    } else {
      const insRes = await dataSource.query(
        `INSERT INTO "e_schooling"."subject_attendance_sessions"
         (school_id, academic_session_id, class_id, section_id, subject_id, teacher_id, timetable_slot_id, date, period_number, session_title, is_locked, is_active, is_delete, created_by_id, created_at, updated_at)
         VALUES ($1, '1', $2, $3, $4, $5, $6, '2026-08-17', $7, 'Regular Subject Lecture', false, true, false, $8, NOW(), NOW())
         RETURNING id`,
        [
          schoolId,
          slot.class_id,
          slot.section_id,
          slot.subject_id,
          slot.teacher_id || defaultTeacherId,
          slot.slot_id,
          slot.period_number,
          ownerId,
        ],
      );
      subjSessionId = insRes[0].id;
      subjectSessionsCreated++;
    }

    for (const st of enrolledStudents) {
      const exRec = await dataSource.query(
        `SELECT id FROM "e_schooling"."subject_attendance_records"
         WHERE session_id = $1 AND student_enrollment_id = $2 LIMIT 1`,
        [subjSessionId, st.id],
      );

      if (exRec.length === 0) {
        const rand = Math.random();
        const mark = rand > 0.9 ? 'absent' : rand > 0.8 ? 'late' : 'present';
        await dataSource.query(
          `INSERT INTO "e_schooling"."subject_attendance_records"
           (session_id, student_enrollment_id, student_id, attendance_mark, remarks, created_by_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'Subject Attendance Checked', $5, NOW(), NOW())`,
          [subjSessionId, st.id, st.student_id, mark, ownerId],
        );
        subjectRecordsCreated++;
      }
    }
  }

  console.log(
    `✅ Seeded ${totalSessionsCreated} Daily Attendance Sessions and ${totalRecordsCreated} Daily Records.`,
  );
  console.log(
    `✅ Seeded ${subjectSessionsCreated} Subject Attendance Sessions and ${subjectRecordsCreated} Subject Records.`,
  );
  console.log(`🎉 1-Week Attendance and Timetables Seeding completed successfully.`);
}

async function run() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await seedAttendanceAndTimetables(dataSource, '2');
  await dataSource.destroy();
}

if (require.main === module) {
  run().catch((err) => {
    console.error('❌ Error during Attendance & Timetables Seeding:', err);
    process.exit(1);
  });
}
