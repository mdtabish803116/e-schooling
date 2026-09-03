import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHelpModuleAndPermissionsSeed1786500000000 implements MigrationInterface {
  name = 'AddHelpModuleAndPermissionsSeed1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed single Help & Guide Module in module_masters
    await queryRunner.query(`
      DO $$
      DECLARE
        v_next_id bigint;
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM "e_schooling"."module_masters" WHERE "code" = 'HELP_GUIDE') THEN
          SELECT COALESCE(MAX(id), 0) + 1 INTO v_next_id FROM "e_schooling"."module_masters";
          INSERT INTO "e_schooling"."module_masters"
            ("id", "name", "code", "route_path", "icon", "display_order", "is_menu_group", "show_in_sidebar", "is_visible", "is_active", "is_delete")
          VALUES
            (v_next_id, 'Help & Guide', 'HELP_GUIDE', '/help', 'book', 99, false, true, true, true, false);
        ELSE
          UPDATE "e_schooling"."module_masters"
          SET "name" = 'Help & Guide',
              "route_path" = '/help',
              "icon" = 'book',
              "display_order" = 99,
              "show_in_sidebar" = true,
              "is_visible" = true,
              "is_active" = true,
              "is_delete" = false
          WHERE "code" = 'HELP_GUIDE';
        END IF;

        -- Clean up duplicate 'HELP' if it exists
        DELETE FROM "e_schooling"."module_operation_permissions"
        WHERE "module_id" IN (
          SELECT "id" FROM "e_schooling"."module_masters" WHERE "code" = 'HELP'
        );
        DELETE FROM "e_schooling"."module_masters" WHERE "code" = 'HELP';
      END $$;
    `);

    // 2. Link VIEW operation permission for HELP_GUIDE
    await queryRunner.query(`
      DO $$
      DECLARE
        v_next_mop_id bigint;
      BEGIN
        IF EXISTS (SELECT 1 FROM "e_schooling"."operation_masters" WHERE "code" = 'VIEW') THEN
          IF NOT EXISTS (
            SELECT 1 FROM "e_schooling"."module_operation_permissions" mop
            JOIN "e_schooling"."module_masters" m ON m.id = mop.module_id
            JOIN "e_schooling"."operation_masters" o ON o.id = mop.operation_id
            WHERE m.code = 'HELP_GUIDE' AND o.code = 'VIEW'
          ) THEN
            SELECT COALESCE(MAX(id), 0) + 1 INTO v_next_mop_id FROM "e_schooling"."module_operation_permissions";
            INSERT INTO "e_schooling"."module_operation_permissions"
              ("id", "module_id", "operation_id", "description", "is_active", "is_delete")
            SELECT v_next_mop_id, m.id, o.id, 'Grants permission to View Help & Guide', true, false
            FROM "e_schooling"."module_masters" m, "e_schooling"."operation_masters" o
            WHERE m.code = 'HELP_GUIDE' AND o.code = 'VIEW';
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_operation_permissions"
      WHERE "module_id" IN (
        SELECT "id" FROM "e_schooling"."module_masters" WHERE "code" = 'HELP_GUIDE'
      );
    `);
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_masters" WHERE "code" = 'HELP_GUIDE';
    `);
  }
}
