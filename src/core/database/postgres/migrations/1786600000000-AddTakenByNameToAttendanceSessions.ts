import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTakenByNameToAttendanceSessions1786600000000
  implements MigrationInterface
{
  name = 'AddTakenByNameToAttendanceSessions1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."attendance_sessions" 
      ADD COLUMN IF NOT EXISTS "taken_by_name" character varying(255);

      ALTER TABLE "e_schooling"."subject_attendance_sessions" 
      ADD COLUMN IF NOT EXISTS "taken_by_name" character varying(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."attendance_sessions" 
      DROP COLUMN IF EXISTS "taken_by_name";

      ALTER TABLE "e_schooling"."subject_attendance_sessions" 
      DROP COLUMN IF EXISTS "taken_by_name";
    `);
  }
}
