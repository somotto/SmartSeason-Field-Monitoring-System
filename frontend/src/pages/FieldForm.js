import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';

const STAGES = ['planted', 'growing', 'ready', 'harvested'];

const empty = { name: '', crop_type: '', planting_date: '', current_stage: 'planted', location: '', area_hectares: '', assigned_agent_id: '' };

export default function FieldForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/agents').then(res => setAgents(res.data)).catch(() => {});
    if (isEdit) {
      api.get(`/fields/${id}`)
        .then(res => {
          const f = res.data;
          setForm({
            name: f.name || '',
            crop_type: f.crop_type || '',
            planting_date: f.planting_date?.split('T')[0] || '',
            current_stage: f.current_stage || 'planted',
            location: f.location || '',
            area_hectares: f.area_hectares || '',
            assigned_agent_id: f.assigned_agent_id || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, assigned_agent_id: form.assigned_agent_id || null, area_hectares: form.area_hectares || null };
      if (isEdit) {
        await api.put(`/fields/${id}`, payload);
      } else {
        await api.post('/fields', payload);
      }
      navigate('/fields');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading…</div>;

  return (
    <div>
      <div style={styles.breadcrumb}>
        <Link to="/fields" style={styles.breadLink}>Fields</Link>
        <span style={styles.sep}>›</span>
        <span>{isEdit ? 'Edit Field' : 'New Field'}</span>
      </div>

      <h1 style={styles.title}>{isEdit ? 'Edit Field' : 'Add New Field'}</h1>

      <div style={styles.card}>
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid2}>
            <Field label="Field Name *" required>
              <input style={styles.input} value={form.name} onChange={set('name')} placeholder="e.g. North Block A" required />
            </Field>
            <Field label="Crop Type *" required>
              <input style={styles.input} value={form.crop_type} onChange={set('crop_type')} placeholder="e.g. Maize, Wheat…" required />
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Planting Date *">
              <input style={styles.input} type="date" value={form.planting_date} onChange={set('planting_date')} required />
            </Field>
            <Field label="Current Stage">
              <select style={styles.input} value={form.current_stage} onChange={set('current_stage')}>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Location">
              <input style={styles.input} value={form.location} onChange={set('location')} placeholder="e.g. Nakuru North" />
            </Field>
            <Field label="Area (hectares)">
              <input style={styles.input} type="number" step="0.01" min="0" value={form.area_hectares} onChange={set('area_hectares')} placeholder="e.g. 5.5" />
            </Field>
          </div>

          <Field label="Assign to Agent">
            <select style={styles.input} value={form.assigned_agent_id} onChange={set('assigned_agent_id')}>
              <option value="">— Unassigned —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
            </select>
          </Field>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={() => navigate('/fields')}>Cancel</button>
            <button type="submit" style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#3a5a40' }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  loading: { padding: 40, color: '#74956e' },
  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 14, color: '#74956e' },
  breadLink: { color: '#2d6a4f', fontWeight: 500, textDecoration: 'none' },
  sep: { color: '#c4dfc9' },
  title: { fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 28 },
  card: { background: '#fff', borderRadius: 18, padding: '32px', boxShadow: '0 1px 4px rgba(13,43,26,0.08)', maxWidth: 700 },
  error: { background: '#fff0ee', color: '#c44c00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  input: {
    padding: '11px 14px', border: '1.5px solid #c4dfc9', borderRadius: 10,
    fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'DM Sans, sans-serif',
    width: '100%',
  },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: {
    padding: '11px 24px', background: '#fff', border: '1.5px solid #c4dfc9',
    borderRadius: 10, fontWeight: 600, fontSize: 14, color: '#3a5a40', cursor: 'pointer',
  },
  saveBtn: {
    padding: '11px 28px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
};