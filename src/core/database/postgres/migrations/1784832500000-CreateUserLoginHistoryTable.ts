import { MigrationInterface, QueryRunner } from 'typeorm';

export const CREATE_USER_LOGIN_HISTORY_TABLE_SQL = `
CREATE SCHEMA IF NOT EXISTS "e_schooling";

CREATE TABLE IF NOT EXISTS "e_schooling"."user_login_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "school_id" varchar,
  "user_id" varchar,
  "role" varchar(50) NOT NULL DEFAULT 'STAFF',
  "entity_id" varchar,
  "identifier_used" varchar(150) NOT NULL,
  "auth_action" varchar(50) NOT NULL DEFAULT 'LOGIN_SUCCESS',
  "login_method" varchar(50) NOT NULL DEFAULT 'PASSWORD',
  "login_status" varchar(20) NOT NULL DEFAULT 'SUCCESS',
  "failure_reason" varchar(255),
  "login_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "logout_at" TIMESTAMP,
  "session_duration_seconds" integer,
  "session_id" varchar(255),
  "refresh_token_id" varchar(255),
  "session_status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
  "device_type" varchar(50) NOT NULL DEFAULT 'Desktop',
  "device_name" varchar(100) NOT NULL DEFAULT 'Unknown Device',
  "browser" varchar(100) NOT NULL DEFAULT 'Unknown Browser',
  "browser_version" varchar(50),
  "operating_system" varchar(100) NOT NULL DEFAULT 'Unknown OS',
  "user_agent" text,
  "ip_address" varchar(100) NOT NULL DEFAULT '127.0.0.1',
  "location" varchar(150),
  "country" varchar(100),
  "city" varchar(100),
  "mfa_used" boolean NOT NULL DEFAULT false,
  "risk_score" double precision NOT NULL DEFAULT 0,
  "is_suspicious" boolean NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "IDX_user_login_history_school_login_at" 
ON "e_schooling"."user_login_history" ("school_id", "login_at");

CREATE INDEX IF NOT EXISTS "IDX_user_login_history_user_login_at" 
ON "e_schooling"."user_login_history" ("user_id", "login_at");

CREATE INDEX IF NOT EXISTS "IDX_user_login_history_session_id" 
ON "e_schooling"."user_login_history" ("session_id");

CREATE INDEX IF NOT EXISTS "IDX_user_login_history_session_status" 
ON "e_schooling"."user_login_history" ("session_status");
`;

export class CreateUserLoginHistoryTable1784832500000 implements MigrationInterface {
  name = 'CreateUserLoginHistoryTable1784832500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(CREATE_USER_LOGIN_HISTORY_TABLE_SQL);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_user_login_history_session_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_user_login_history_session_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_user_login_history_user_login_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "e_schooling"."IDX_user_login_history_school_login_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."user_login_history";`);
  }
}
