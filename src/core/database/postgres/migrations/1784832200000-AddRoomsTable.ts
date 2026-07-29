import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomsTable1784832200000 implements MigrationInterface {
  name = 'AddRoomsTable1784832200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."rooms" (
        "id" BIGSERIAL NOT NULL,
        "school_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "block" character varying DEFAULT 'Main Block',
        "floor" integer DEFAULT 1,
        "capacity" integer DEFAULT 40,
        "equipment" jsonb DEFAULT '[]',
        "assigned_section_id" bigint,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_by_id" bigint,
        "updated_by_id" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id")
      );`,
    );

    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."id" IS 'Primary key';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."school_id" IS 'Reference to School';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."name" IS 'Room name or number';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."block" IS 'Building block';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."floor" IS 'Floor number';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."capacity" IS 'Max seating capacity';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."equipment" IS 'List of equipment/amenities';`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."rooms"."assigned_section_id" IS 'Currently assigned section ID';`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rooms_school_id" ON "e_schooling"."rooms" ("school_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rooms_assigned_section_id" ON "e_schooling"."rooms" ("assigned_section_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rooms_created_by_id" ON "e_schooling"."rooms" ("created_by_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rooms_updated_by_id" ON "e_schooling"."rooms" ("updated_by_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."rooms";`);
  }
}
