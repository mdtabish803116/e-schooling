import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveClassTeacherIdFromClasses1783619231455 implements MigrationInterface {
  name = 'RemoveClassTeacherIdFromClasses1783619231455';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" DROP CONSTRAINT "FK_9c888a9cd3efc25a72a0be264b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9c888a9cd3efc25a72a0be264b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" DROP COLUMN "class_teacher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."teacher_section_assignments" ADD CONSTRAINT "FK_ddd2f99a03a6ec49066f91bc31b" FOREIGN KEY ("teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."teacher_section_assignments" DROP CONSTRAINT "FK_ddd2f99a03a6ec49066f91bc31b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" ADD "class_teacher_id" bigint`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c888a9cd3efc25a72a0be264b" ON "e_schooling"."classes" ("class_teacher_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."classes" ADD CONSTRAINT "FK_9c888a9cd3efc25a72a0be264b0" FOREIGN KEY ("class_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
