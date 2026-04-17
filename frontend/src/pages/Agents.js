import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/users/agents').then(res => setAgents(res.data)).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await api.post('/users', { ...form, role: 'agent' });
      setAgents(prev => [...prev, res.data]);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      setSuccess('Agent created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Field Agents</h1>
          <p style={styles.sub}>{agents.length} agents registered</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Add Agent'}
        </button>
      </div>

      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>New Field Agent</h2>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleCreate} style={styles.form}>
            <div style={styles.grid3}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} value={form.name} onChange={set('name')} placeholder="James Mwangi" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={form.email} onChange={set('email')} placeholder="james@farm.com" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} />
              </div>
            </div>
            <button type="submit" style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? 'Creating…' : 'Create Agent'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading…</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Agent', 'Email', 'Role', 'Member Since'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.agentCell}>
                      <div style={styles.avatar}>{a.name[0].toUpperCase()}</div>
                      <span style={styles.agentName}>{a.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{a.role}</span>
                  </td>
                  <td style={styles.td}>
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && (
            <div style={styles.empty}>No agents yet. Add your first agent above.</div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 4 },
  sub: { color: '#74956e', fontSize: 14 },
  addBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
  },
  success: { background: '#d8f3dc', color: '#1b4332', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 },
  formCard: { background: '#fff', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(13,43,26,0.08)' },
  formTitle: { fontSize: 16, fontFamily: 'Syne, sans-serif', marginBottom: 16 },
  error: { background: '#fff0ee', color: '#c44c00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#3a5a40' },
  input: { padding: '11px 14px', border: '1.5px solid #c4dfc9', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' },
  saveBtn: {
    alignSelf: 'flex-start', padding: '11px 24px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  },
  loading: { padding: 40, color: '#74956e' },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(13,43,26,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f0f7f2' },
  th: { padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #edf7f0' },
  td: { padding: '16px 18px', fontSize: 14, verticalAlign: 'middle' },
  agentCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#d8f3dc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#1b4332', fontSize: 15,
  },
  agentName: { fontWeight: 600 },
  roleBadge: { background: '#f0f7f2', color: '#2d6a4f', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#74956e' },
};