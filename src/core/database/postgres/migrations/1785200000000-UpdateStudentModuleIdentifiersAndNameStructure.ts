import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStudentModuleIdentifiersAndNameStructure1785200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add missing student columns (with lookup identity document fields)
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."students"
      ADD COLUMN IF NOT EXISTS "middle_name" VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(155) NULL,
      ADD COLUMN IF NOT EXISTS "identity_document_type_id" BIGINT NULL,
      ADD COLUMN IF NOT EXISTS "identity_document_number" VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS "religion_id" BIGINT NULL,
      ADD COLUMN IF NOT EXISTS "caste_category_id" BIGINT NULL;
    `);

    // 2. Create sequences for transaction-safe identifier generation
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "e_schooling"."student_code_seq" START WITH 1 INCREMENT BY 1;
      CREATE SEQUENCE IF NOT EXISTS "e_schooling"."admission_number_seq" START WITH 1 INCREMENT BY 1;
    `);

    // 3. Create Partial Unique Indexes to prevent race condition duplicates
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_students_school_student_code_unique"
      ON "e_schooling"."students" ("school_id", LOWER("student_code"))
      WHERE "is_delete" = false AND "student_code" IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS "idx_students_school_session_admission_no_unique"
      ON "e_schooling"."students" ("school_id", LOWER("admission_number"))
      WHERE "is_delete" = false AND "admission_number" IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS "idx_enrollments_school_session_class_section_roll_unique"
      ON "e_schooling"."student_enrollments" ("school_id", "academic_session_id", "class_id", "section_id", LOWER("roll_number"))
      WHERE "is_current" = true AND "is_delete" = false AND "roll_number" IS NOT NULL;
    `);

    // Backfill full_name for existing students
    await queryRunner.query(`
      UPDATE "e_schooling"."students"
      SET "full_name" = TRIM(CONCAT(COALESCE("first_name", ''), ' ', COALESCE("middle_name", ''), ' ', COALESCE("last_name", '')))
      WHERE "full_name" IS NULL OR "full_name" = '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "e_schooling"."idx_enrollments_school_session_class_section_roll_unique";
      DROP INDEX IF EXISTS "e_schooling"."idx_students_school_session_admission_no_unique";
      DROP INDEX IF EXISTS "e_schooling"."idx_students_school_student_code_unique";
      
      ALTER TABLE "e_schooling"."students"
      DROP COLUMN IF EXISTS "caste_category_id",
      DROP COLUMN IF EXISTS "religion_id",
      DROP COLUMN IF EXISTS "identity_document_number",
      DROP COLUMN IF EXISTS "identity_document_type_id",
      DROP COLUMN IF EXISTS "full_name",
      DROP COLUMN IF EXISTS "middle_name";
    `);
  }
}
