/* eslint-disable @typescript-eslint/no-explicit-any */
// ======================================================
// database/migrations/1785100000000-CreateLookupValuesTable.ts
// Generic Lookup / Master Data System — Production Migration
// Replaces prototype: 1785000000000-CreateMasterLookupsTable.ts
// ======================================================

interface QueryRunner {
  query(query: string, parameters?: any[]): Promise<any>;
}
interface MigrationInterface {
  name?: string;
  up(queryRunner: QueryRunner): Promise<any>;
  down(queryRunner: QueryRunner): Promise<any>;
}

export class CreateLookupValuesTable1785100000000 implements MigrationInterface {
  name = 'CreateLookupValuesTable1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- =============================================
        -- DETERMINE SCHEMA
        -- =============================================
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'e_schooling') THEN

          -- =============================================
          -- CREATE SEQUENCE
          -- =============================================
          CREATE SEQUENCE IF NOT EXISTS "e_schooling"."lookup_values_id_seq";

          -- =============================================
          -- CREATE TABLE
          -- =============================================
          CREATE TABLE IF NOT EXISTS "e_schooling"."lookup_values" (
            "id"                BIGINT NOT NULL DEFAULT nextval('"e_schooling"."lookup_values_id_seq"'),
            "school_id"         BIGINT NULL,
            "category"          VARCHAR(60) NOT NULL,
            "code"              VARCHAR(80) NOT NULL,
            "lookup_key"        VARCHAR(100) NOT NULL,
            "lookup_value"      VARCHAR(255) NOT NULL,
            "description"       TEXT NULL,
            "display_order"     INT NOT NULL DEFAULT 0,
            "parent_id"         BIGINT NULL,
            "is_system_default" BOOLEAN NOT NULL DEFAULT false,
            "is_active"         BOOLEAN NOT NULL DEFAULT true,
            "is_deleted"        BOOLEAN NOT NULL DEFAULT false,
            "metadata"          JSONB NULL,
            "created_by_id"     BIGINT NOT NULL DEFAULT 1,
            "updated_by_id"     BIGINT NOT NULL DEFAULT 1,
            "deleted_by_id"     BIGINT NULL,
            "created_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deleted_at"        TIMESTAMPTZ NULL,
            CONSTRAINT "PK_lookup_values_id" PRIMARY KEY ("id"),
            CONSTRAINT "chk_lookup_values_display_order" CHECK ("display_order" >= 0),
            CONSTRAINT "chk_lookup_values_no_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
          );

          ALTER SEQUENCE "e_schooling"."lookup_values_id_seq"
            OWNED BY "e_schooling"."lookup_values"."id";

          -- =============================================
          -- FOREIGN KEYS
          -- =============================================

          -- FK: school_id → schools.id
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'e_schooling' AND table_name = 'schools'
          ) THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'e_schooling'
                AND constraint_name = 'fk_lookup_values_school'
            ) THEN
              ALTER TABLE "e_schooling"."lookup_values"
              ADD CONSTRAINT "fk_lookup_values_school"
              FOREIGN KEY ("school_id")
              REFERENCES "e_schooling"."schools"("id") ON DELETE CASCADE;
            END IF;
          END IF;

          -- FK: parent_id → lookup_values.id (self-reference)
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = 'e_schooling'
              AND constraint_name = 'fk_lookup_values_parent'
          ) THEN
            ALTER TABLE "e_schooling"."lookup_values"
            ADD CONSTRAINT "fk_lookup_values_parent"
            FOREIGN KEY ("parent_id")
            REFERENCES "e_schooling"."lookup_values"("id") ON DELETE SET NULL;
          END IF;

          -- =============================================
          -- UNIQUE INDEXES (tenant-aware partial)
          -- =============================================

          -- Global lookup_key uniqueness (school_id IS NULL)
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_global_key_unique"
          ON "e_schooling"."lookup_values" ("category", LOWER("lookup_key"))
          WHERE "school_id" IS NULL AND "is_deleted" = false;

          -- Tenant lookup_key uniqueness (school_id IS NOT NULL)
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_tenant_key_unique"
          ON "e_schooling"."lookup_values" ("school_id", "category", LOWER("lookup_key"))
          WHERE "school_id" IS NOT NULL AND "is_deleted" = false;

          -- Global code uniqueness
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_global_code_unique"
          ON "e_schooling"."lookup_values" (LOWER("code"))
          WHERE "school_id" IS NULL AND "is_deleted" = false;

          -- Tenant code uniqueness
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_tenant_code_unique"
          ON "e_schooling"."lookup_values" ("school_id", LOWER("code"))
          WHERE "school_id" IS NOT NULL AND "is_deleted" = false;

          -- =============================================
          -- PERFORMANCE INDEXES
          -- =============================================
          CREATE INDEX IF NOT EXISTS "idx_lookup_values_category_active"
          ON "e_schooling"."lookup_values" ("category", "is_active", "display_order")
          WHERE "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_school_category"
          ON "e_schooling"."lookup_values" ("school_id", "category", "is_active")
          WHERE "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_parent_id"
          ON "e_schooling"."lookup_values" ("parent_id")
          WHERE "parent_id" IS NOT NULL AND "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_is_system_default"
          ON "e_schooling"."lookup_values" ("is_system_default", "category")
          WHERE "is_deleted" = false;

        ELSE
          -- =============================================
          -- PUBLIC SCHEMA FALLBACK
          -- =============================================
          CREATE SEQUENCE IF NOT EXISTS "lookup_values_id_seq";

          CREATE TABLE IF NOT EXISTS "lookup_values" (
            "id"                BIGINT NOT NULL DEFAULT nextval('"lookup_values_id_seq"'),
            "school_id"         BIGINT NULL,
            "category"          VARCHAR(60) NOT NULL,
            "code"              VARCHAR(80) NOT NULL,
            "lookup_key"        VARCHAR(100) NOT NULL,
            "lookup_value"      VARCHAR(255) NOT NULL,
            "description"       TEXT NULL,
            "display_order"     INT NOT NULL DEFAULT 0,
            "parent_id"         BIGINT NULL,
            "is_system_default" BOOLEAN NOT NULL DEFAULT false,
            "is_active"         BOOLEAN NOT NULL DEFAULT true,
            "is_deleted"        BOOLEAN NOT NULL DEFAULT false,
            "metadata"          JSONB NULL,
            "created_by_id"     BIGINT NOT NULL DEFAULT 1,
            "updated_by_id"     BIGINT NOT NULL DEFAULT 1,
            "deleted_by_id"     BIGINT NULL,
            "created_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deleted_at"        TIMESTAMPTZ NULL,
            CONSTRAINT "PK_lookup_values_id" PRIMARY KEY ("id"),
            CONSTRAINT "chk_lookup_values_display_order" CHECK ("display_order" >= 0),
            CONSTRAINT "chk_lookup_values_no_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
          );

          ALTER SEQUENCE "lookup_values_id_seq" OWNED BY "lookup_values"."id";

          ALTER TABLE "lookup_values"
          ADD CONSTRAINT "fk_lookup_values_parent"
          FOREIGN KEY ("parent_id")
          REFERENCES "lookup_values"("id") ON DELETE SET NULL;

          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_global_key_unique"
          ON "lookup_values" ("category", LOWER("lookup_key"))
          WHERE "school_id" IS NULL AND "is_deleted" = false;

          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_tenant_key_unique"
          ON "lookup_values" ("school_id", "category", LOWER("lookup_key"))
          WHERE "school_id" IS NOT NULL AND "is_deleted" = false;

          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_global_code_unique"
          ON "lookup_values" (LOWER("code"))
          WHERE "school_id" IS NULL AND "is_deleted" = false;

          CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_tenant_code_unique"
          ON "lookup_values" ("school_id", LOWER("code"))
          WHERE "school_id" IS NOT NULL AND "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_category_active"
          ON "lookup_values" ("category", "is_active", "display_order")
          WHERE "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_school_category"
          ON "lookup_values" ("school_id", "category", "is_active")
          WHERE "is_deleted" = false;

          CREATE INDEX IF NOT EXISTS "idx_lookup_values_parent_id"
          ON "lookup_values" ("parent_id")
          WHERE "parent_id" IS NOT NULL AND "is_deleted" = false;

        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'e_schooling' AND table_name = 'lookup_values'
        ) THEN
          DROP TABLE IF EXISTS "e_schooling"."lookup_values" CASCADE;
          DROP SEQUENCE IF EXISTS "e_schooling"."lookup_values_id_seq";
        ELSE
          DROP TABLE IF EXISTS "lookup_values" CASCADE;
          DROP SEQUENCE IF EXISTS "lookup_values_id_seq";
        END IF;
      END $$;
    `);
  }
}
