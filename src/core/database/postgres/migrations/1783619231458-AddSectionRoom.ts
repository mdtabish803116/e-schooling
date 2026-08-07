import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSectionRoom1783619231458 implements MigrationInterface {
  name = 'AddSectionRoom1783619231458';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."sections" ADD "room" character varying`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."sections"."room" IS 'Assigned classroom'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."sections" DROP COLUMN "room"`,
    );
  }
}
