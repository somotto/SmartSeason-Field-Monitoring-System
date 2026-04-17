import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/fields/stats'), api.get('/fields')])
      .then(([statsRes, fieldsRes]) => {
        setStats(statsRes.data);
        setFields(fieldsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading dashboard…</div>;

  const atRiskFields = fields.filter(f => f.status === 'at_risk');
  const readyFields = fields.filter(f => f.current_stage === 'ready');

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={styles.sub}>Here's what's happening across your fields today.</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/fields/new" style={styles.newBtn}>+ New Field</Link>
        )}
      </div>

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        <StatCard label="Total Fields" value={stats?.total ?? 0} icon="🌾" color="#2d6a4f" />
        <StatCard label="Active" value={stats?.byStatus?.active ?? 0} icon="✅" color="#52b788" />
        <StatCard label="At Risk" value={stats?.byStatus?.at_risk ?? 0} icon="⚠️" color="#f4a261" />
        <StatCard label="Completed" value={stats?.byStatus?.completed ?? 0} icon="🏁" color="#74c0fc" />
        <StatCard label="Total Area (ha)" value={stats?.totalArea ?? '0'} icon="📐" color="#9b7fd4" />
      </div>

      {/* Stage breakdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Stage Overview</h2>
        <div style={styles.stageRow}>
          {['planted', 'growing', 'ready', 'harvested'].map(stage => (
            <div key={stage} style={styles.stageCard}>
              <div style={styles.stageNum}>{stats?.byStage?.[stage] ?? 0}</div>
              <StageBadge stage={stage} />
            </div>
          ))}
        </div>
      </div>

      <div style={styles.twoCol}>
        {/* At Risk */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>⚠️ At Risk Fields</h2>
          {atRiskFields.length === 0 ? (
            <p style={styles.empty}>No fields at risk — all good!</p>
          ) : atRiskFields.map(f => (
            <Link to={`/fields/${f.id}`} key={f.id} style={styles.fieldRow}>
              <div>
                <div style={styles.fieldName}>{f.name}</div>
                <div style={styles.fieldMeta}>{f.crop_type} · {f.agent_name || 'Unassigned'}</div>
              </div>
              <StageBadge stage={f.current_stage} />
            </Link>
          ))}
        </div>

        {/* Ready to Harvest */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>🌟 Ready to Harvest</h2>
          {readyFields.length === 0 ? (
            <p style={styles.empty}>No fields ready yet.</p>
          ) : readyFields.map(f => (
            <Link to={`/fields/${f.id}`} key={f.id} style={styles.fieldRow}>
              <div>
                <div style={styles.fieldName}>{f.name}</div>
                <div style={styles.fieldMeta}>{f.crop_type} · {f.agent_name || 'Unassigned'}</div>
              </div>
              <StatusBadge status={f.status} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent fields table */}
      <div style={{ ...styles.panel, marginTop: 28 }}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Recent Fields</h2>
          <Link to="/fields" style={styles.viewAll}>View all →</Link>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              {['Field', 'Crop', 'Stage', 'Status', 'Agent', 'Area (ha)'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.slice(0, 6).map(f => (
              <tr key={f.id} style={styles.tr}>
                <td style={styles.td}>
                  <Link to={`/fields/${f.id}`} style={{ color: '#2d6a4f', fontWeight: 600 }}>{f.name}</Link>
                </td>
                <td style={styles.td}>{f.crop_type}</td>
                <td style={styles.td}><StageBadge stage={f.current_stage} /></td>
                <td style={styles.td}><StatusBadge status={f.status} /></td>
                <td style={styles.td}>{f.agent_name || <span style={{ color: '#74956e' }}>—</span>}</td>
                <td style={styles.td}>{f.area_hectares || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, color: '#74956e', fontFamily: 'Syne, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 4 },
  sub: { color: '#74956e' },
  newBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700,
    fontSize: 14, textDecoration: 'none',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(13,43,26,0.08)' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 32, fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#74956e', marginTop: 4, fontWeight: 500 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontFamily: 'Syne, sans-serif', marginBottom: 14, color: '#0d2b1a' },
  stageRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  stageCard: {
    background: '#fff', borderRadius: 14, padding: '20px 18px',
    display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start',
    boxShadow: '0 1px 4px rgba(13,43,26,0.07)',
  },
  stageNum: { fontSize: 30, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0d2b1a' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  panel: { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(13,43,26,0.07)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  panelTitle: { fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 },
  viewAll: { fontSize: 13, color: '#52b788', fontWeight: 600 },
  empty: { color: '#74956e', fontSize: 14, padding: '8px 0' },
  fieldRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #edf7f0',
    textDecoration: 'none', color: 'inherit',
  },
  fieldName: { fontWeight: 600, fontSize: 14, marginBottom: 2 },
  fieldMeta: { fontSize: 12, color: '#74956e' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f0f7f2' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.4px' },
  tr: { borderBottom: '1px solid #edf7f0', transition: 'background 0.1s' },
  td: { padding: '13px 14px', fontSize: 14, verticalAlign: 'middle' },
};