import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffExtraProfileFields1784715600001 implements MigrationInterface {
    name = 'AddStaffExtraProfileFields1784715600001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "timetable_assignments" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "gender" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "emergency_contact" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "address" text`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "employment_status" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "salary_type" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "base_salary" numeric`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "allowances" numeric`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "bank_name" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "account_number" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "ifsc_code" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD COLUMN IF NOT EXISTS "pan_number" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "pan_number"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "ifsc_code"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "account_number"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "bank_name"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "allowances"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "base_salary"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "salary_type"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "employment_status"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "address"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "emergency_contact"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "gender"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN IF EXISTS "timetable_assignments"`);
    }
}
