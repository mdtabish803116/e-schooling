import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentMasterTables1784832300000 implements MigrationInterface {
  name = 'AddDocumentMasterTables1784832300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."document_masters" (
        "id" BIGSERIAL NOT NULL,
        "school_id" bigint NOT NULL,
        "name" character varying(100) NOT NULL,
        "code" character varying(100) NOT NULL,
        "description" character varying(500),
        "category" character varying(50) NOT NULL DEFAULT 'other',
        "accepted_file_types" text[] NOT NULL DEFAULT '{"pdf","jpg","png"}',
        "max_file_size_mb" smallint NOT NULL DEFAULT 5,
        "is_mandatory" boolean NOT NULL DEFAULT false,
        "applicable_modules" text[] NOT NULL DEFAULT '{}',
        "expiry_tracking_enabled" boolean NOT NULL DEFAULT false,
        "verification_required" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_by_id" bigint,
        "updated_by_id" bigint,
        "deleted_by_id" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_masters_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_masters_school_code" UNIQUE ("school_id", "code")
      );`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_document_masters_school_id" ON "e_schooling"."document_masters" ("school_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_document_masters_category" ON "e_schooling"."document_masters" ("category");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_document_masters_is_active" ON "e_schooling"."document_masters" ("is_active");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_document_masters_is_deleted" ON "e_schooling"."document_masters" ("is_deleted");`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."entity_documents" (
        "id" BIGSERIAL NOT NULL,
        "school_id" bigint NOT NULL,
        "document_master_id" bigint NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" bigint NOT NULL,
        "file_url" text NOT NULL,
        "file_name" character varying(255),
        "file_size_bytes" integer,
        "mime_type" character varying(100),
        "expiry_date" date,
        "verification_status" character varying(30) NOT NULL DEFAULT 'pending',
        "verified_by_id" bigint,
        "verified_at" TIMESTAMP,
        "rejection_reason" text,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "uploaded_by_id" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entity_documents_id" PRIMARY KEY ("id")
      );`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entity_documents_school_id" ON "e_schooling"."entity_documents" ("school_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entity_documents_master_id" ON "e_schooling"."entity_documents" ("document_master_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entity_documents_entity" ON "e_schooling"."entity_documents" ("entity_type", "entity_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entity_documents_verification" ON "e_schooling"."entity_documents" ("verification_status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."entity_documents";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."document_masters";`);
  }
}
