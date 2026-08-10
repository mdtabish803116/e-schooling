import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateClassAndSectionModuleSchema1784900000000 implements MigrationInterface {
  name = 'UpdateClassAndSectionModuleSchema1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. CONVERT ADMISSION_ENQUIRIES AND ADMISSION_APPLICATIONS ID FROM UUID TO BIGINT IF CREATED AS UUID
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'e_schooling' AND table_name = 'admission_enquiries' AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "e_schooling"."admission_enquiries" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "e_schooling"."admission_enquiries" DROP CONSTRAINT IF EXISTS "admission_enquiries_pkey";
          ALTER TABLE "e_schooling"."admission_enquiries" DROP CONSTRAINT IF EXISTS "PK_admission_enquiries_id";
          CREATE SEQUENCE IF NOT EXISTS "e_schooling"."admission_enquiries_id_seq";
          ALTER TABLE "e_schooling"."admission_enquiries" 
            ALTER COLUMN "id" TYPE bigint USING nextval('"e_schooling"."admission_enquiries_id_seq"');
          ALTER TABLE "e_schooling"."admission_enquiries" 
            ALTER COLUMN "id" SET DEFAULT nextval('"e_schooling"."admission_enquiries_id_seq"');
          ALTER SEQUENCE "e_schooling"."admission_enquiries_id_seq" OWNED BY "e_schooling"."admission_enquiries"."id";
          ALTER TABLE "e_schooling"."admission_enquiries" 
            ADD CONSTRAINT "PK_admission_enquiries_id" PRIMARY KEY ("id");
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'e_schooling' AND table_name = 'admission_applications' AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "e_schooling"."admission_applications" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "e_schooling"."admission_applications" DROP CONSTRAINT IF EXISTS "admission_applications_pkey";
          ALTER TABLE "e_schooling"."admission_applications" DROP CONSTRAINT IF EXISTS "PK_admission_applications_id";
          CREATE SEQUENCE IF NOT EXISTS "e_schooling"."admission_applications_id_seq";
          ALTER TABLE "e_schooling"."admission_applications" 
            ALTER COLUMN "id" TYPE bigint USING nextval('"e_schooling"."admission_applications_id_seq"');
          ALTER TABLE "e_schooling"."admission_applications" 
            ALTER COLUMN "id" SET DEFAULT nextval('"e_schooling"."admission_applications_id_seq"');
          ALTER SEQUENCE "e_schooling"."admission_applications_id_seq" OWNED BY "e_schooling"."admission_applications"."id";
          ALTER TABLE "e_schooling"."admission_applications" 
            ADD CONSTRAINT "PK_admission_applications_id" PRIMARY KEY ("id");
        END IF;
      END $$;
    `);

    // 1. EXTEND CLASSES TABLE (or ACADEMIC_CLASSES if present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'classes') THEN
          ALTER TABLE "e_schooling"."classes"
          ADD COLUMN IF NOT EXISTS "co_class_teacher_id" BIGINT NULL,
          ADD COLUMN IF NOT EXISTS "room_number" VARCHAR(30) NULL,
          ADD COLUMN IF NOT EXISTS "shift" VARCHAR(20) NULL DEFAULT 'MORNING',
          ADD COLUMN IF NOT EXISTS "passing_percentage" NUMERIC(5,2) NULL DEFAULT 33.00,
          ADD COLUMN IF NOT EXISTS "roll_number_strategy" VARCHAR(50) NULL DEFAULT 'ALPHABETICAL_FIRST_NAME';

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'school_users') THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'e_schooling' AND constraint_name = 'fk_classes_co_teacher'
            ) THEN
              ALTER TABLE "e_schooling"."classes"
              ADD CONSTRAINT "fk_classes_co_teacher"
              FOREIGN KEY ("co_class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE SET NULL;
            END IF;
          END IF;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'academic_classes') THEN
          ALTER TABLE "e_schooling"."academic_classes"
          ADD COLUMN IF NOT EXISTS "co_class_teacher_id" BIGINT NULL,
          ADD COLUMN IF NOT EXISTS "room_number" VARCHAR(30) NULL,
          ADD COLUMN IF NOT EXISTS "shift" VARCHAR(20) NULL DEFAULT 'MORNING',
          ADD COLUMN IF NOT EXISTS "passing_percentage" NUMERIC(5,2) NULL DEFAULT 33.00,
          ADD COLUMN IF NOT EXISTS "roll_number_strategy" VARCHAR(50) NULL DEFAULT 'ALPHABETICAL_FIRST_NAME';

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'school_users') THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'e_schooling' AND constraint_name = 'fk_academic_classes_co_teacher'
            ) THEN
              ALTER TABLE "e_schooling"."academic_classes"
              ADD CONSTRAINT "fk_academic_classes_co_teacher"
              FOREIGN KEY ("co_class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE SET NULL;
            END IF;
          END IF;
        END IF;
      END $$;
    `);

    // 2. EXTEND SECTIONS TABLE (or ACADEMIC_SECTIONS if present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'sections') THEN
          ALTER TABLE "e_schooling"."sections"
          ADD COLUMN IF NOT EXISTS "co_class_teacher_id" BIGINT NULL,
          ADD COLUMN IF NOT EXISTS "medium_of_instruction" VARCHAR(50) NULL DEFAULT 'English',
          ADD COLUMN IF NOT EXISTS "stream" VARCHAR(50) NULL,
          ADD COLUMN IF NOT EXISTS "passing_percentage" NUMERIC(5,2) NULL DEFAULT 33.00,
          ADD COLUMN IF NOT EXISTS "roll_number_prefix" VARCHAR(20) NULL;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'school_users') THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'e_schooling' AND constraint_name = 'fk_sections_co_teacher'
            ) THEN
              ALTER TABLE "e_schooling"."sections"
              ADD CONSTRAINT "fk_sections_co_teacher"
              FOREIGN KEY ("co_class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE SET NULL;
            END IF;
          END IF;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'academic_sections') THEN
          ALTER TABLE "e_schooling"."academic_sections"
          ADD COLUMN IF NOT EXISTS "co_class_teacher_id" BIGINT NULL,
          ADD COLUMN IF NOT EXISTS "medium_of_instruction" VARCHAR(50) NULL DEFAULT 'English',
          ADD COLUMN IF NOT EXISTS "stream" VARCHAR(50) NULL,
          ADD COLUMN IF NOT EXISTS "passing_percentage" NUMERIC(5,2) NULL DEFAULT 33.00,
          ADD COLUMN IF NOT EXISTS "roll_number_prefix" VARCHAR(20) NULL;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'school_users') THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'e_schooling' AND constraint_name = 'fk_academic_sections_co_teacher'
            ) THEN
              ALTER TABLE "e_schooling"."academic_sections"
              ADD CONSTRAINT "fk_academic_sections_co_teacher"
              FOREIGN KEY ("co_class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE SET NULL;
            END IF;
          END IF;
        END IF;
      END $$;
    `);

    // 3. ENFORCE UNIQUE CONSTRAINTS
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'sections') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'sections' AND column_name = 'is_delete') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."sections" ("class_id", LOWER("name"))
            WHERE "is_delete" = false;
          ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'sections' AND column_name = 'is_deleted') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."sections" ("class_id", LOWER("name"))
            WHERE "is_deleted" = false;
          ELSE
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."sections" ("class_id", LOWER("name"));
          END IF;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'academic_sections') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'academic_sections' AND column_name = 'is_delete') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."academic_sections" ("class_id", LOWER("name"))
            WHERE "is_delete" = false;
          ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'academic_sections' AND column_name = 'is_deleted') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."academic_sections" ("class_id", LOWER("name"))
            WHERE "is_deleted" = false;
          ELSE
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_section_name_per_class"
            ON "e_schooling"."academic_sections" ("class_id", LOWER("name"));
          END IF;
        END IF;
      END $$;
    `);

    // Unique Student Roll Number per Section for Academic Session
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'student_enrollments') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'student_enrollments' AND column_name = 'is_delete') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_roll_no_per_section_session"
            ON "e_schooling"."student_enrollments" ("section_id", "academic_session_id", LOWER("roll_number"))
            WHERE "is_active" = true AND "is_delete" = false;
          ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'e_schooling' AND table_name = 'student_enrollments' AND column_name = 'is_deleted') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_roll_no_per_section_session"
            ON "e_schooling"."student_enrollments" ("section_id", "academic_session_id", LOWER("roll_number"))
            WHERE "is_active" = true AND "is_deleted" = false;
          ELSE
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_roll_no_per_section_session"
            ON "e_schooling"."student_enrollments" ("section_id", "academic_session_id", LOWER("roll_number"))
            WHERE "is_active" = true;
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "e_schooling"."idx_unique_roll_no_per_section_session";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "e_schooling"."idx_unique_section_name_per_class";`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'sections') THEN
          ALTER TABLE "e_schooling"."sections"
          DROP CONSTRAINT IF EXISTS "fk_sections_co_teacher",
          DROP COLUMN IF EXISTS "roll_number_prefix",
          DROP COLUMN IF EXISTS "passing_percentage",
          DROP COLUMN IF EXISTS "stream",
          DROP COLUMN IF EXISTS "medium_of_instruction",
          DROP COLUMN IF EXISTS "co_class_teacher_id";
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'e_schooling' AND table_name = 'classes') THEN
          ALTER TABLE "e_schooling"."classes"
          DROP CONSTRAINT IF EXISTS "fk_classes_co_teacher",
          DROP COLUMN IF EXISTS "roll_number_strategy",
          DROP COLUMN IF EXISTS "passing_percentage",
          DROP COLUMN IF EXISTS "shift",
          DROP COLUMN IF EXISTS "room_number",
          DROP COLUMN IF EXISTS "co_class_teacher_id";
        END IF;
      END $$;
    `);
  }
}
