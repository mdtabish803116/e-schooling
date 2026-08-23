import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSubjectAttendanceTimetableFK1786300000001
  implements MigrationInterface
{
  name = 'FixSubjectAttendanceTimetableFK1786300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."subject_attendance_sessions"
        DROP CONSTRAINT IF EXISTS "fk_sas_timetable_slot";
    `);

    await queryRunner.query(`
      ALTER TABLE "e_schooling"."subject_attendance_sessions"
        ADD CONSTRAINT "fk_sas_timetable_slot"
        FOREIGN KEY ("timetable_slot_id")
        REFERENCES "e_schooling"."academic_timetable_slots"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."subject_attendance_sessions"
        DROP CONSTRAINT IF EXISTS "fk_sas_timetable_slot";
    `);
  }
}
