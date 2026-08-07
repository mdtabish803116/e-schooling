import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentAttendanceAndTimetableSeedData1784832700000 implements MigrationInterface {
  name = 'AddStudentAttendanceAndTimetableSeedData1784832700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Attendance Records Indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_records_enrollment" 
      ON "e_schooling"."attendance_records" ("student_enrollment_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_sessions_school_session" 
      ON "e_schooling"."attendance_sessions" ("school_id", "academic_session_id", "date");
    `);

    // 2. Academic Timetables Indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_academic_timetables_school_year" 
      ON "e_schooling"."academic_timetables" ("school_id", "academic_year_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_academic_timetables_school_year";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_attendance_sessions_school_session";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_attendance_records_enrollment";`);
  }
}
