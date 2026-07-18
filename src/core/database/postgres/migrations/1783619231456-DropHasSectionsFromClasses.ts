import { MigrationInterface, QueryRunner } from "typeorm";

export class DropHasSectionsFromClasses1783619231456 implements MigrationInterface {
    name = 'DropHasSectionsFromClasses1783619231456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" DROP COLUMN "has_sections"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" ADD "has_sections" boolean`);
    }
}
