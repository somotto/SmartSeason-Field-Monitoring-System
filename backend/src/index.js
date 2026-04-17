require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const routes = require('./routes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const runMigrations = async () => {
  const client = await pool.connect();
  try {
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
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fields_agent ON fields(assigned_agent_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_updates_field ON field_updates(field_id);`);
    console.log('✅ Migrations complete');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
  }
};

const start = async () => {
  await runMigrations();
  await runSeed();
  app.listen(PORT, () => {
    console.log(`🚀 SmartSeason API running on port ${PORT}`);
  });
};

const runSeed = async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT id FROM users WHERE email = 'admin@smartseason.com'`);
    if (rows.length > 0) return; // already seeded

    const adminPass = await bcrypt.hash('admin123', 10);
    const agentPass = await bcrypt.hash('agent123', 10);

    const adminResult = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin Coordinator', 'admin@smartseason.com', $1, 'admin')
      RETURNING id;
    `, [adminPass]);

    const agent1 = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('James Mwangi', 'james@smartseason.com', $1, 'agent')
      RETURNING id;
    `, [agentPass]);

    const agent2 = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Aisha Kamau', 'aisha@smartseason.com', $1, 'agent')
      RETURNING id;
    `, [agentPass]);

    const adminId = adminResult.rows[0].id;
    const agentId1 = agent1.rows[0].id;
    const agentId2 = agent2.rows[0].id;

    await client.query(`
      INSERT INTO fields (name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id, created_by)
      VALUES
        ('North Block A', 'Maize', '2024-09-01', 'growing', 'Nakuru North', 5.5, $1, $3),
        ('South Block B', 'Wheat', '2024-08-15', 'ready', 'Nakuru South', 3.2, $1, $3),
        ('East Paddock', 'Beans', '2024-10-01', 'planted', 'Eldoret East', 2.0, $2, $3),
        ('West Field C', 'Sunflower', '2024-07-20', 'harvested', 'Kisumu West', 7.8, $2, $3),
        ('Central Plot', 'Sorghum', '2024-09-15', 'growing', 'Nairobi Central', 4.1, $1, $3)
    `, [agentId1, agentId2, adminId]);

    console.log('✅ Seed complete — admin@smartseason.com / admin123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    client.release();
  }
};

start();
