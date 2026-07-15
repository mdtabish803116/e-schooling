const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: 'Demo1234',
    database: 'e_schooling'
  });

  try {
    await client.connect();
    console.log('CONNECTED TO POSTGRES DB');

    // 1. Insert Announcements Module
    const checkAnn = await client.query("SELECT id FROM e_schooling.module_masters WHERE code = 'ANNOUNCEMENTS';");
    if (checkAnn.rows.length === 0) {
      await client.query(`
        INSERT INTO e_schooling.module_masters 
        (id, name, code, description, platform_feature_id, parent_module_id, route_path, icon, display_order, show_in_sidebar, is_menu_group, is_visible, is_active, created_by_id, updated_by_id, is_delete, created_at, updated_at) 
        VALUES 
        (28, 'Announcements', 'ANNOUNCEMENTS', 'Create, publish, and view school announcements and notices', null, null, '/announcements', 'bell', 16, true, false, true, true, null, null, false, NOW(), NOW());
      `);
      console.log('Inserted Announcements module.');
    } else {
      console.log('Announcements module already exists.');
    }

    // 2. Insert Tasks Module
    const checkTasks = await client.query("SELECT id FROM e_schooling.module_masters WHERE code = 'TASKS';");
    if (checkTasks.rows.length === 0) {
      await client.query(`
        INSERT INTO e_schooling.module_masters 
        (id, name, code, description, platform_feature_id, parent_module_id, route_path, icon, display_order, show_in_sidebar, is_menu_group, is_visible, is_active, created_by_id, updated_by_id, is_delete, created_at, updated_at) 
        VALUES 
        (29, 'Tasks', 'TASKS', 'Assign, track, and complete operational tasks and checklists', null, null, '/tasks', 'check_square', 17, true, false, true, true, null, null, false, NOW(), NOW());
      `);
      console.log('Inserted Tasks module.');
    } else {
      console.log('Tasks module already exists.');
    }

    // 3. Insert Operation Permissions
    // Get max ID in module_operation_permissions
    const maxPermIdRes = await client.query("SELECT MAX(id::int) as max_id FROM e_schooling.module_operation_permissions;");
    let currentId = parseInt(maxPermIdRes.rows[0].max_id || '150');
    console.log('Max ID in module_operation_permissions:', currentId);

    const modulesToMap = [
      { id: 28, code: 'ANNOUNCEMENTS', name: 'Announcements' },
      { id: 29, code: 'TASKS', name: 'Tasks' }
    ];

    const operations = [
      { id: 1, name: 'view' },
      { id: 2, name: 'create' },
      { id: 3, name: 'update' },
      { id: 4, name: 'delete' }
    ];

    for (const mod of modulesToMap) {
      for (const op of operations) {
        const checkOp = await client.query(
          "SELECT id FROM e_schooling.module_operation_permissions WHERE module_id = $1 AND operation_id = $2;",
          [mod.id, op.id]
        );
        if (checkOp.rows.length === 0) {
          currentId++;
          await client.query(`
            INSERT INTO e_schooling.module_operation_permissions 
            (id, module_id, operation_id, description, is_active, is_delete, created_at, updated_at) 
            VALUES 
            ($1, $2, $3, $4, true, false, NOW(), NOW());
          `, [currentId, mod.id, op.id, `Grants permission to ${op.name} in ${mod.name}`]);
          console.log(`Inserted permission: ${op.name} for ${mod.name} with ID ${currentId}`);
        } else {
          console.log(`Permission ${op.name} for ${mod.name} already exists.`);
        }
      }
    }

    console.log('\n--- VERIFICATION ---');
    const verifyModules = await client.query("SELECT id, name, code FROM e_schooling.module_masters WHERE id::int >= 28;");
    console.log('New modules:', verifyModules.rows);

  } catch (err) {
    console.error('Database migration error:', err);
  } finally {
    await client.end();
  }
}

run();
