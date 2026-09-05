import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTakenByToAttendanceSessions1786700000000
  implements MigrationInterface
{
  name = 'AddTakenByToAttendanceSessions1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."attendance_sessions"
      ADD COLUMN IF NOT EXISTS "taken_by" bigint;
    `);

    await queryRunner.query(`
      ALTER TABLE "e_schooling"."subject_attendance_sessions"
      ADD COLUMN IF NOT EXISTS "taken_by" bigint;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_att_session_taken_by"
      ON "e_schooling"."attendance_sessions" ("taken_by");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subj_att_session_taken_by"
      ON "e_schooling"."subject_attendance_sessions" ("taken_by");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "e_schooling"."IDX_att_session_taken_by";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "e_schooling"."IDX_subj_att_session_taken_by";
    `);
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."attendance_sessions"
      DROP COLUMN IF EXISTS "taken_by";
    `);
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."subject_attendance_sessions"
      DROP COLUMN IF EXISTS "taken_by";
    `);
  }
}
