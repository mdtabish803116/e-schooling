import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubjectCode1786176027691 implements MigrationInterface {
    name = 'AddSubjectCode1786176027691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."subjects" ADD "subject_code" character varying`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."subjects"."subject_code" IS 'Unique subject code'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."subjects"."subject_code" IS 'Unique subject code'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."subjects" DROP COLUMN "subject_code"`);
    }
}
