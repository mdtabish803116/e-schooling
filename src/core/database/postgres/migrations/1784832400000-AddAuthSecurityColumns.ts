import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSecurityColumns1784832400000 implements MigrationInterface {
  name = 'AddAuthSecurityColumns1784832400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ['school_owners', 'school_users', 'students', 'platform_users'];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE "e_schooling"."${table}"
        ADD COLUMN IF NOT EXISTS "current_session_token" varchar,
        ADD COLUMN IF NOT EXISTS "is_logged_in" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "is_locked" boolean NOT NULL DEFAULT false;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['school_owners', 'school_users', 'students', 'platform_users'];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE "e_schooling"."${table}"
        DROP COLUMN IF EXISTS "current_session_token",
        DROP COLUMN IF EXISTS "is_logged_in",
        DROP COLUMN IF EXISTS "failed_login_attempts",
        DROP COLUMN IF EXISTS "lockout_until",
        DROP COLUMN IF EXISTS "is_locked";
      `);
    }
  }
}
