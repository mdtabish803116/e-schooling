import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClassFieldsAndSectionCapacity1783617607909 implements MigrationInterface {
    name = 'AddClassFieldsAndSectionCapacity1783617607909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" ADD "class_code" character varying`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."class_code" IS 'Class code (unique identifier)'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" ADD "description" text`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."description" IS 'Optional description of the class'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" ADD "class_teacher_id" bigint`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."class_teacher_id" IS 'Reference to SchoolUser (Class Teacher)'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."sections" ADD "capacity" integer`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."sections"."capacity" IS 'Maximum student capacity in this section'`);
        await queryRunner.query(`CREATE INDEX "IDX_9c888a9cd3efc25a72a0be264b" ON "e_schooling"."classes" ("class_teacher_id") `);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" ADD CONSTRAINT "FK_9c888a9cd3efc25a72a0be264b0" FOREIGN KEY ("class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" DROP CONSTRAINT "FK_9c888a9cd3efc25a72a0be264b0"`);
        await queryRunner.query(`DROP INDEX "e_schooling"."IDX_9c888a9cd3efc25a72a0be264b"`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."sections"."capacity" IS 'Maximum student capacity in this section'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."sections" DROP COLUMN "capacity"`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."class_teacher_id" IS 'Reference to SchoolUser (Class Teacher)'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" DROP COLUMN "class_teacher_id"`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."description" IS 'Optional description of the class'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" DROP COLUMN "description"`);
        await queryRunner.query(`COMMENT ON COLUMN "e_schooling"."classes"."class_code" IS 'Class code (unique identifier)'`);
        await queryRunner.query(`ALTER TABLE "e_schooling"."classes" DROP COLUMN "class_code"`);
    }

}
