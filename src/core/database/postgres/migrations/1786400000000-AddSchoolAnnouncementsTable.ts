import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchoolAnnouncementsTable1786400000000 implements MigrationInterface {
  name = 'AddSchoolAnnouncementsTable1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."school_announcements" (
        "id" BIGSERIAL NOT NULL,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint,
        "title" character varying NOT NULL,
        "summary" text,
        "content" text NOT NULL,
        "category" character varying NOT NULL DEFAULT 'GENERAL',
        "priority" character varying NOT NULL DEFAULT 'NORMAL',
        "status" character varying NOT NULL DEFAULT 'PUBLISHED',
        "require_acknowledgement" boolean NOT NULL DEFAULT false,
        "delivery_channels" jsonb DEFAULT '["IN_APP"]',
        "publish_at" TIMESTAMP,
        "published_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "targets" jsonb DEFAULT '[]',
        "attachments" jsonb DEFAULT '[]',
        "recipient_summary" jsonb DEFAULT '{}',
        "analytics" jsonb DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_by_id" bigint,
        "created_by_name" character varying,
        "created_by_role" character varying,
        "updated_by_id" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_school_announcements_id" PRIMARY KEY ("id")
      );`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_school_announcements_school_id" ON "e_schooling"."school_announcements" ("school_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."school_announcements";`);
  }
}
