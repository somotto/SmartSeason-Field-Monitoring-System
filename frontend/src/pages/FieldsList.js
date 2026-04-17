import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import api from '../utils/api';

const STAGES = ['all', 'planted', 'growing', 'ready', 'harvested'];
const STATUSES = ['all', 'active', 'at_risk', 'completed'];

export default function FieldsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/fields').then(res => setFields(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = fields.filter(f => {
    if (stageFilter !== 'all' && f.current_stage !== stageFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.crop_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this field? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/fields/${id}`);
      setFields(prev => prev.filter(f => f.id !== id));
    } catch { alert('Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{user?.role === 'admin' ? 'All Fields' : 'My Fields'}</h1>
          <p style={styles.sub}>{filtered.length} of {fields.length} fields shown</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/fields/new" style={styles.newBtn}>+ New Field</Link>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          style={styles.search}
          placeholder="Search by name or crop…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={styles.filterGroup}>
          {STAGES.map(s => (
            <button
              key={s}
              style={{ ...styles.pill, ...(stageFilter === s ? styles.pillActive : {}) }}
              onClick={() => setStageFilter(s)}
            >
              {s === 'all' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          {STATUSES.map(s => (
            <button
              key={s}
              style={{ ...styles.pill, ...(statusFilter === s ? styles.pillActive : {}) }}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All Status' : s === 'at_risk' ? 'At Risk' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading fields…</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}><div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div><p>No fields match your filters.</p></div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Field Name', 'Crop', 'Planting Date', 'Stage', 'Status', 'Agent', 'Area (ha)', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={styles.tr}>
                  <td style={styles.td}>
                    <Link to={`/fields/${f.id}`} style={styles.nameLink}>{f.name}</Link>
                    {f.location && <div style={styles.location}>📍 {f.location}</div>}
                  </td>
                  <td style={styles.td}>{f.crop_type}</td>
                  <td style={styles.td}>{new Date(f.planting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={styles.td}><StageBadge stage={f.current_stage} /></td>
                  <td style={styles.td}><StatusBadge status={f.status} /></td>
                  <td style={styles.td}>{f.agent_name || <span style={{ color: '#c4dfc9' }}>—</span>}</td>
                  <td style={styles.td}>{f.area_hectares || '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.editBtn} onClick={() => navigate(`/fields/${f.id}/edit`)}>Edit</button>
                      {user?.role === 'admin' && (
                        <button
                          style={{ ...styles.deleteBtn, opacity: deleting === f.id ? 0.5 : 1 }}
                          onClick={() => handleDelete(f.id)}
                          disabled={deleting === f.id}
                        >Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 4 },
  sub: { color: '#74956e', fontSize: 14 },
  newBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700,
    fontSize: 14, textDecoration: 'none',
  },
  filters: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  search: {
    padding: '11px 16px', border: '1.5px solid #c4dfc9', borderRadius: 10,
    fontSize: 14, background: '#fff', outline: 'none', width: 320,
  },
  filterGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: {
    padding: '6px 14px', border: '1.5px solid #c4dfc9', borderRadius: 99,
    background: '#fff', color: '#3a5a40', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  pillActive: { background: '#2d6a4f', color: '#fff', borderColor: '#2d6a4f' },
  loading: { padding: 40, color: '#74956e' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#3a5a40' },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(13,43,26,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f0f7f2' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #edf7f0' },
  td: { padding: '14px 16px', fontSize: 14, verticalAlign: 'middle' },
  nameLink: { fontWeight: 600, color: '#2d6a4f', textDecoration: 'none' },
  location: { fontSize: 12, color: '#74956e', marginTop: 2 },
  actions: { display: 'flex', gap: 8 },
  editBtn: {
    padding: '5px 12px', background: '#f0f7f2', border: '1px solid #c4dfc9',
    borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#2d6a4f', cursor: 'pointer',
  },
  deleteBtn: {
    padding: '5px 12px', background: '#fff0ee', border: '1px solid #f4a261',
    borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#c44c00', cursor: 'pointer',
  },
};