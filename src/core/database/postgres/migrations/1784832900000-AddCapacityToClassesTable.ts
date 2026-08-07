import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCapacityToClassesTable1784832900000 implements MigrationInterface {
  name = 'AddCapacityToClassesTable1784832900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" ADD COLUMN IF NOT EXISTS "capacity" integer DEFAULT 40;`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."classes"."capacity" IS 'Maximum student capacity in this class';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" DROP COLUMN IF EXISTS "capacity";`,
    );
  }
}
