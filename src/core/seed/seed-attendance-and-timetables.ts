import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

export async function seedAttendanceAndTimetables(dataSource: DataSource, schoolId: string = '2') {
  console.log(`🚀 Starting Attendance and Timetables Seeder for School ID: ${schoolId}...`);

  // 1. Fetch Active Enrollments
  const enrollments: { id: string; student_id: string; class_id: string; section_id: string; academic_session_id: string }[] =
    await dataSource.query(
      `SELECT e.id, e.student_id, e.class_id, e.section_id, e.academic_session_id
       FROM "e_schooling"."student_enrollments" e
       JOIN "e_schooling"."students" s ON s.id = e.student_id
       WHERE s.school_id = $1 AND (s.is_delete IS FALSE OR s.is_delete IS NULL)`,
      [schoolId],
    );

  if (!enrollments.length) {
    console.log('⚠️ No active student enrollments found. Please run npm run seed:students first.');
    return;
  }

  console.log(`Found ${enrollments.length} student enrollments.`);

  // 2. Fetch School Owner User ID for marked_by attribution
  const owners = await dataSource.query(`SELECT id, full_name FROM "e_schooling"."school_owners" LIMIT 1`);
  const ownerId = owners.length ? String(owners[0].id) : '1';

  // Group enrollments by class & section
  const classSecMap = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const key = `${e.class_id}_${e.section_id}_${e.academic_session_id}`;
    if (!classSecMap.has(key)) classSecMap.set(key, []);
    classSecMap.get(key)!.push(e);
  }

  // Generate attendance dates for past months (e.g. 15 working days per month for May, June, July 2026)
  const sampleDates = [
    '2026-05-10', '2026-05-12', '2026-05-15', '2026-05-20', '2026-05-25',
    '2026-06-02', '2026-06-08', '2026-06-14', '2026-06-20', '2026-06-28',
    '2026-07-05', '2026-07-11', '2026-07-18', '2026-07-25', '2026-07-27', '2026-07-28',
  ];

  let totalSessionsCreated = 0;
  let totalRecordsCreated = 0;

  for (const [key, group] of classSecMap.entries()) {
    const [classId, sectionId, academicSessionId] = key.split('_');

    for (const dateStr of sampleDates) {
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
          } else if (rand > 0.90) {
            mark = 'HALF_DAY';
            remarks = 'Left early at 01:00 PM';
          } else if (rand > 0.85) {
            mark = 'LATE';
            remarks = 'Arrived 15 mins late';
          } else if (rand > 0.80) {
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

  console.log(`✅ Seeded ${totalSessionsCreated} Attendance Sessions and ${totalRecordsCreated} Attendance Records.`);
  console.log(`🎉 Attendance and Timetables Seeding completed successfully.`);
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
