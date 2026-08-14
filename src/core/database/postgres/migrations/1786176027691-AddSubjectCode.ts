import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubjectCode1786176027691 implements MigrationInterface {
  name = 'AddSubjectCode1786176027691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'e_schooling'
            AND table_name = 'subjects'
            AND column_name = 'subject_code'
        ) THEN
          ALTER TABLE "e_schooling"."subjects" ADD "subject_code" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."subjects"."subject_code" IS 'Unique subject code'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."subjects"."subject_code" IS 'Unique subject code'`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subjects" DROP COLUMN "subject_code"`,
    );
  }
}
