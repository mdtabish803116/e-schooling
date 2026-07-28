import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAcademicSessionIdToTables1784832500000 implements MigrationInterface {
  name = 'AddAcademicSessionIdToTables1784832500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'classes',
      'sections',
      'class_section_subjects',
      'subjects',
      'teacher_section_assignments',
      'rooms',
      'student_subjects',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "e_schooling"."${table}" ADD COLUMN IF NOT EXISTS "academic_session_id" bigint;`,
      );
      await queryRunner.query(
        `UPDATE "e_schooling"."${table}" SET "academic_session_id" = 1 WHERE "academic_session_id" IS NULL;`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_academic_session_id" ON "e_schooling"."${table}" ("academic_session_id");`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'classes',
      'sections',
      'class_section_subjects',
      'subjects',
      'teacher_section_assignments',
      'rooms',
      'student_subjects',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "e_schooling"."IDX_${table}_academic_session_id";`,
      );
      await queryRunner.query(
        `ALTER TABLE "e_schooling"."${table}" DROP COLUMN IF EXISTS "academic_session_id";`,
      );
    }
  }
}
