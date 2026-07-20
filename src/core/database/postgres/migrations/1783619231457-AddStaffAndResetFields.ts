import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffAndResetFields1783619231457 implements MigrationInterface {
    name = 'AddStaffAndResetFields1783619231457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add fields to school_user_profiles
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "first_name" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "last_name" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "designation" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "joining_date" date`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "department_name" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "qualifications" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "experience" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "documents" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "assigned_classes" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" ADD "assigned_subjects" jsonb DEFAULT '[]'`);

        // 2. Add fields to school_users
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_users" ADD "reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_users" ADD "reset_token_expires" timestamp`);

        // 3. Add fields to school_owners
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_owners" ADD "reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_owners" ADD "reset_token_expires" timestamp`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop from school_owners
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_owners" DROP COLUMN "reset_token_expires"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_owners" DROP COLUMN "reset_token"`);

        // 2. Drop from school_users
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_users" DROP COLUMN "reset_token_expires"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_users" DROP COLUMN "reset_token"`);

        // 3. Drop from school_user_profiles
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "assigned_subjects"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "assigned_classes"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "documents"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "experience"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "qualifications"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "department_name"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "joining_date"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "designation"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."school_user_profiles" DROP COLUMN "first_name"`);
    }
}
