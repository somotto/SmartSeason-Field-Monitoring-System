const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        crop_type VARCHAR(100) NOT NULL,
        planting_date DATE NOT NULL,
        current_stage VARCHAR(20) NOT NULL DEFAULT 'planted'
          CHECK (current_stage IN ('planted', 'growing', 'ready', 'harvested')),
        location VARCHAR(255),
        area_hectares DECIMAL(10, 2),
        assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS field_updates (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        previous_stage VARCHAR(20),
        new_stage VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add index for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fields_agent ON fields(assigned_agent_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_updates_field ON field_updates(field_id);`);

    console.log('✅ Migrations complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

migrate();