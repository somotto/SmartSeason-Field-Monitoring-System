const pool = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    const adminPass = await bcrypt.hash('admin123', 10);
    const agentPass = await bcrypt.hash('agent123', 10);

    // Insert admin
    const adminResult = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin Coordinator', 'admin@smartseason.com', $1, 'admin')
      ON CONFLICT (email) DO UPDATE SET password = $1
      RETURNING id;
    `, [adminPass]);

    // Insert agents
    const agent1 = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('James Mwangi', 'james@smartseason.com', $1, 'agent')
      ON CONFLICT (email) DO UPDATE SET password = $1
      RETURNING id;
    `, [agentPass]);

    const agent2 = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Aisha Kamau', 'aisha@smartseason.com', $1, 'agent')
      ON CONFLICT (email) DO UPDATE SET password = $1
      RETURNING id;
    `, [agentPass]);

    const adminId = adminResult.rows[0].id;
    const agentId1 = agent1.rows[0].id;
    const agentId2 = agent2.rows[0].id;

    // Insert fields
    await client.query(`
      INSERT INTO fields (name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id, created_by)
      VALUES
        ('North Block A', 'Maize', '2024-09-01', 'growing', 'Nakuru North', 5.5, $1, $3),
        ('South Block B', 'Wheat', '2024-08-15', 'ready', 'Nakuru South', 3.2, $1, $3),
        ('East Paddock', 'Beans', '2024-10-01', 'planted', 'Eldoret East', 2.0, $2, $3),
        ('West Field C', 'Sunflower', '2024-07-20', 'harvested', 'Kisumu West', 7.8, $2, $3),
        ('Central Plot', 'Sorghum', '2024-09-15', 'growing', 'Nairobi Central', 4.1, $1, $3)
      ON CONFLICT DO NOTHING;
    `, [agentId1, agentId2, adminId]);

    console.log('✅ Seed complete!');
    console.log('');
    console.log('📋 Demo Credentials:');
    console.log('  Admin  → admin@smartseason.com / admin123');
    console.log('  Agent1 → james@smartseason.com / agent123');
    console.log('  Agent2 → aisha@smartseason.com / agent123');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

seed();