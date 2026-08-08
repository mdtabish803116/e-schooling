import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdmissionEnquiriesAndApplicationsTables1784833100000 implements MigrationInterface {
  name = 'AddAdmissionEnquiriesAndApplicationsTables1784833100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Schema e_schooling if not exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "e_schooling";`);

    // 2. Create admission_enquiries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."admission_enquiries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "school_id" character varying NOT NULL,
        "enquiry_no" character varying NOT NULL,
        "student_name" character varying NOT NULL,
        "parent_name" character varying NOT NULL,
        "contact_number" character varying NOT NULL,
        "email" character varying,
        "target_class_id" character varying NOT NULL,
        "target_class_name" character varying,
        "gender" character varying NOT NULL DEFAULT 'MALE',
        "previous_school" character varying,
        "source" character varying NOT NULL DEFAULT 'WALK_IN',
        "stage" character varying NOT NULL DEFAULT 'ENQUIRY',
        "enquiry_status" character varying NOT NULL DEFAULT 'NEW',
        "notes" text,
        "assigned_to_staff_name" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admission_enquiries_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admission_enquiries_school_id"
      ON "e_schooling"."admission_enquiries" ("school_id");
    `);

    // 3. Create admission_applications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."admission_applications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "school_id" character varying NOT NULL,
        "application_no" character varying NOT NULL,
        "enquiry_id" character varying,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "gender" character varying NOT NULL DEFAULT 'MALE',
        "dob" character varying,
        "father_name" character varying NOT NULL,
        "father_phone" character varying NOT NULL,
        "mother_name" character varying,
        "target_class_id" character varying NOT NULL,
        "target_class_name" character varying,
        "stage" character varying NOT NULL DEFAULT 'APPLICATION',
        "verification_status" character varying NOT NULL DEFAULT 'PENDING',
        "verified_documents" jsonb,
        "rejection_reason" text,
        "approval_remarks" text,
        "approved_by" character varying,
        "converted_student_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admission_applications_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admission_applications_school_id"
      ON "e_schooling"."admission_applications" ("school_id");
    `);

    // 4. Seed Admissions Module in module_masters
    await queryRunner.query(`
      INSERT INTO "e_schooling"."module_masters"
        ("name", "code", "route_path", "icon", "display_order", "is_menu_group", "show_in_sidebar", "is_visible", "is_active", "is_delete")
      VALUES
        ('Admissions', 'ADMISSIONS', '/admissions', 'how_to_reg', 7, false, true, true, true, false)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "route_path" = EXCLUDED."route_path",
        "icon" = EXCLUDED."icon",
        "display_order" = EXCLUDED."display_order",
        "show_in_sidebar" = EXCLUDED."show_in_sidebar",
        "is_active" = true,
        "is_delete" = false;
    `);

    // 5. Link Admissions Module Operations (VIEW, CREATE, UPDATE, DELETE)
    const admPermPairs = [
      ['ADMISSIONS', 'VIEW'],
      ['ADMISSIONS', 'CREATE'],
      ['ADMISSIONS', 'UPDATE'],
      ['ADMISSIONS', 'DELETE'],
    ];

    for (const [modCode, opCode] of admPermPairs) {
      await queryRunner.query(`
        INSERT INTO "e_schooling"."module_operation_permissions" ("module_id", "operation_id", "description", "is_active", "is_delete")
        SELECT m.id, o.id, 'Grants permission to ' || o.name || ' in ' || m.name, true, false
        FROM "e_schooling"."module_masters" m
        CROSS JOIN "e_schooling"."operation_masters" o
        WHERE m.code = '${modCode}' AND o.code = '${opCode}'
        AND NOT EXISTS (
          SELECT 1 FROM "e_schooling"."module_operation_permissions" mop
          WHERE mop.module_id = m.id AND mop.operation_id = o.id
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "e_schooling"."IDX_admission_applications_school_id";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "e_schooling"."admission_applications";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "e_schooling"."IDX_admission_enquiries_school_id";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "e_schooling"."admission_enquiries";`,
    );
  }
}
