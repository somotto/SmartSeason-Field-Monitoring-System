const pool = require('../config/db');
const { computeStatus } = require('../models/fieldStatus');

const enrichField = (field) => ({
  ...field,
  status: computeStatus(field),
});

// GET /fields — admin gets all, agent gets assigned
const getFields = async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `
        SELECT f.*, u.name AS agent_name, u.email AS agent_email
        FROM fields f
        LEFT JOIN users u ON f.assigned_agent_id = u.id
        ORDER BY f.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT f.*, u.name AS agent_name, u.email AS agent_email
        FROM fields f
        LEFT JOIN users u ON f.assigned_agent_id = u.id
        WHERE f.assigned_agent_id = $1
        ORDER BY f.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows.map(enrichField));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /fields/:id
const getField = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, u.name AS agent_name, u.email AS agent_email
      FROM fields f
      LEFT JOIN users u ON f.assigned_agent_id = u.id
      WHERE f.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Field not found' });

    const field = result.rows[0];
    // Agents can only see their own fields
    if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get recent updates
    const updates = await pool.query(`
      SELECT fu.*, u.name AS agent_name
      FROM field_updates fu
      JOIN users u ON fu.agent_id = u.id
      WHERE fu.field_id = $1
      ORDER BY fu.created_at DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({ ...enrichField(field), updates: updates.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /fields — admin only
const createField = async (req, res) => {
  const { name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id } = req.body;
  if (!name || !crop_type || !planting_date) {
    return res.status(400).json({ error: 'Name, crop type, and planting date are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO fields (name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, crop_type, planting_date, current_stage || 'planted', location, area_hectares, assigned_agent_id || null, req.user.id]);

    res.status(201).json(enrichField(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /fields/:id — admin updates any, agent updates own
const updateField = async (req, res) => {
  const { id } = req.params;
  const { name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id, notes } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM fields WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Field not found' });

    const field = existing.rows[0];

    // Agents can only update their assigned fields (stage + notes only)
    if (req.user.role === 'agent') {
      if (field.assigned_agent_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!current_stage) return res.status(400).json({ error: 'Stage is required' });

      // Record the update
      await pool.query(`
        INSERT INTO field_updates (field_id, agent_id, previous_stage, new_stage, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, req.user.id, field.current_stage, current_stage, notes || null]);

      const updated = await pool.query(`
        UPDATE fields SET current_stage = $1, updated_at = NOW()
        WHERE id = $2 RETURNING *
      `, [current_stage, id]);

      return res.json(enrichField(updated.rows[0]));
    }

    // Admin full update
    const updated = await pool.query(`
      UPDATE fields SET
        name = COALESCE($1, name),
        crop_type = COALESCE($2, crop_type),
        planting_date = COALESCE($3, planting_date),
        current_stage = COALESCE($4, current_stage),
        location = COALESCE($5, location),
        area_hectares = COALESCE($6, area_hectares),
        assigned_agent_id = COALESCE($7, assigned_agent_id),
        updated_at = NOW()
      WHERE id = $8 RETURNING *
    `, [name, crop_type, planting_date, current_stage, location, area_hectares, assigned_agent_id, id]);

    if (current_stage && current_stage !== field.current_stage) {
      await pool.query(`
        INSERT INTO field_updates (field_id, agent_id, previous_stage, new_stage, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, req.user.id, field.current_stage, current_stage, notes || 'Stage updated by admin']);
    }

    res.json(enrichField(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /fields/:id — admin only
const deleteField = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fields WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Field not found' });
    res.json({ message: 'Field deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /fields/stats — dashboard summary
const getStats = async (req, res) => {
  try {
    let whereClause = '';
    let params = [];

    if (req.user.role === 'agent') {
      whereClause = 'WHERE f.assigned_agent_id = $1';
      params = [req.user.id];
    }

    const result = await pool.query(`
      SELECT f.*, u.name AS agent_name
      FROM fields f
      LEFT JOIN users u ON f.assigned_agent_id = u.id
      ${whereClause}
    `, params);

    const fields = result.rows.map(enrichField);

    const stats = {
      total: fields.length,
      byStage: {
        planted: fields.filter(f => f.current_stage === 'planted').length,
        growing: fields.filter(f => f.current_stage === 'growing').length,
        ready: fields.filter(f => f.current_stage === 'ready').length,
        harvested: fields.filter(f => f.current_stage === 'harvested').length,
      },
      byStatus: {
        active: fields.filter(f => f.status === 'active').length,
        at_risk: fields.filter(f => f.status === 'at_risk').length,
        completed: fields.filter(f => f.status === 'completed').length,
      },
      totalArea: fields.reduce((sum, f) => sum + parseFloat(f.area_hectares || 0), 0).toFixed(2),
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getFields, getField, createField, updateField, deleteField, getStats };