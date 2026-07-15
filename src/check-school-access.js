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

    // Describe school_feature_overrides
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'e_schooling' AND table_name = 'school_feature_overrides';
    `);
    console.log('\n--- COLUMNS IN school_feature_overrides ---');
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`));

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await client.end();
  }
}

run();
