import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolUserProfileAndAvatarFields1786200000000 implements MigrationInterface {
  name = 'AddSchoolUserProfileAndAvatarFields1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure school_users and school_owners have profile_pic_url columns if not present
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."school_users"
      ADD COLUMN IF NOT EXISTS "avatar" character varying,
      ADD COLUMN IF NOT EXISTS "profile_pic_url" character varying;

      ALTER TABLE "e_schooling"."school_owners"
      ADD COLUMN IF NOT EXISTS "profile_pic_url" character varying;
    `);

    // 2. Ensure school_user_profiles table exists and has all extended fields
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."school_user_profiles" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_user_id" bigint NOT NULL UNIQUE,
        "first_name" character varying,
        "last_name" character varying,
        "father_name" character varying,
        "mother_name" character varying,
        "profile_pic_url" character varying,
        "avatar_url" character varying,
        "dob" date,
        "gender" character varying DEFAULT 'Male',
        "emergency_contact" character varying,
        "address" text,
        "designation" character varying DEFAULT 'Staff',
        "department_name" character varying DEFAULT 'General',
        "joining_date" date,
        "employment_status" character varying DEFAULT 'Full-time',
        "salary_type" character varying DEFAULT 'Monthly',
        "base_salary" numeric(12,2) DEFAULT 0,
        "allowances" numeric(12,2) DEFAULT 0,
        "bank_name" character varying,
        "account_number" character varying,
        "ifsc_code" character varying,
        "pan_number" character varying,
        "aadhaar_number" character varying,
        "years_of_experience" integer DEFAULT 0,
        "previous_organization" character varying,
        "expertise" character varying,
        "subjects" character varying,
        "qualifications" jsonb DEFAULT '[]'::jsonb,
        "experience" jsonb DEFAULT '[]'::jsonb,
        "documents" jsonb DEFAULT '[]'::jsonb,
        "assigned_classes" jsonb DEFAULT '[]'::jsonb,
        "assigned_subjects" jsonb DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        CONSTRAINT "fk_school_user_profiles_user" FOREIGN KEY ("school_user_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE CASCADE
      );
    `);

    // 3. Ensure individual columns exist if table was previously created with fewer columns
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."school_user_profiles"
      ADD COLUMN IF NOT EXISTS "first_name" character varying,
      ADD COLUMN IF NOT EXISTS "last_name" character varying,
      ADD COLUMN IF NOT EXISTS "father_name" character varying,
      ADD COLUMN IF NOT EXISTS "mother_name" character varying,
      ADD COLUMN IF NOT EXISTS "profile_pic_url" character varying,
      ADD COLUMN IF NOT EXISTS "avatar_url" character varying,
      ADD COLUMN IF NOT EXISTS "dob" date,
      ADD COLUMN IF NOT EXISTS "gender" character varying DEFAULT 'Male',
      ADD COLUMN IF NOT EXISTS "emergency_contact" character varying,
      ADD COLUMN IF NOT EXISTS "address" text,
      ADD COLUMN IF NOT EXISTS "designation" character varying DEFAULT 'Staff',
      ADD COLUMN IF NOT EXISTS "department_name" character varying DEFAULT 'General',
      ADD COLUMN IF NOT EXISTS "joining_date" date,
      ADD COLUMN IF NOT EXISTS "employment_status" character varying DEFAULT 'Full-time',
      ADD COLUMN IF NOT EXISTS "salary_type" character varying DEFAULT 'Monthly',
      ADD COLUMN IF NOT EXISTS "base_salary" numeric(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "allowances" numeric(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bank_name" character varying,
      ADD COLUMN IF NOT EXISTS "account_number" character varying,
      ADD COLUMN IF NOT EXISTS "ifsc_code" character varying,
      ADD COLUMN IF NOT EXISTS "pan_number" character varying,
      ADD COLUMN IF NOT EXISTS "aadhaar_number" character varying,
      ADD COLUMN IF NOT EXISTS "years_of_experience" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "previous_organization" character varying,
      ADD COLUMN IF NOT EXISTS "expertise" character varying,
      ADD COLUMN IF NOT EXISTS "subjects" character varying,
      ADD COLUMN IF NOT EXISTS "qualifications" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "experience" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "assigned_classes" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "assigned_subjects" jsonb DEFAULT '[]'::jsonb;
    `);

    // 4. Backfill default profiles for any school users missing a profile record
    await queryRunner.query(`
      INSERT INTO "e_schooling"."school_user_profiles" (
        "school_user_id",
        "first_name",
        "last_name",
        "designation",
        "department_name",
        "created_at",
        "updated_at"
      )
      SELECT 
        u."id",
        SPLIT_PART(u."name", ' ', 1),
        NULLIF(SUBSTRING(u."name" FROM POSITION(' ' IN u."name") + 1), ''),
        CASE 
          WHEN u."user_type" = 'academic' THEN 'Teacher'
          WHEN u."user_type" = 'accountant' THEN 'Accountant'
          WHEN u."user_type" = 'administration' THEN 'Administrator'
          ELSE 'Staff Member'
        END,
        'General',
        now(),
        now()
      FROM "e_schooling"."school_users" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "e_schooling"."school_user_profiles" p WHERE p."school_user_id" = u."id"
      )
      ON CONFLICT ("school_user_id") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "e_schooling"."school_user_profiles"
      DROP COLUMN IF EXISTS "assigned_subjects",
      DROP COLUMN IF EXISTS "assigned_classes",
      DROP COLUMN IF EXISTS "documents",
      DROP COLUMN IF EXISTS "experience",
      DROP COLUMN IF EXISTS "qualifications",
      DROP COLUMN IF EXISTS "avatar_url";
    `);
  }
}
