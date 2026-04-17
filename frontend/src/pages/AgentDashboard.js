import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import api from '../utils/api';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/fields/stats'), api.get('/fields')])
      .then(([s, f]) => { setStats(s.data); setFields(f.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading…</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>My Fields</h1>
        <p style={styles.sub}>Welcome back, {user?.name}. You have {stats?.total ?? 0} assigned fields.</p>
      </div>

      <div style={styles.statsRow}>
        {[
          { label: 'My Fields', val: stats?.total ?? 0, icon: '🌾' },
          { label: 'Active', val: stats?.byStatus?.active ?? 0, icon: '✅' },
          { label: 'At Risk', val: stats?.byStatus?.at_risk ?? 0, icon: '⚠️' },
          { label: 'Harvested', val: stats?.byStage?.harvested ?? 0, icon: '🏁' },
        ].map(({ label, val, icon }) => (
          <div key={label} style={styles.chip}>
            <span style={styles.chipIcon}>{icon}</span>
            <span style={styles.chipVal}>{val}</span>
            <span style={styles.chipLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {fields.map(f => (
          <Link to={`/fields/${f.id}`} key={f.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.cropIcon}>🌱</div>
              <StatusBadge status={f.status} />
            </div>
            <h3 style={styles.cardName}>{f.name}</h3>
            <p style={styles.cardCrop}>{f.crop_type}</p>
            <div style={styles.cardMeta}>
              <StageBadge stage={f.current_stage} />
              {f.area_hectares && <span style={styles.area}>{f.area_hectares} ha</span>}
            </div>
            <div style={styles.cardFooter}>
              <span style={styles.plantDate}>Planted: {new Date(f.planting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span style={styles.updateLink}>Update →</span>
            </div>
          </Link>
        ))}
      </div>

      {fields.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🌾</div>
          <p>No fields assigned to you yet.</p>
          <p style={{ color: '#74956e', fontSize: 13 }}>Contact your admin to get fields assigned.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: { padding: 40, color: '#74956e' },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontFamily: 'Syne, sans-serif', marginBottom: 4 },
  sub: { color: '#74956e' },
  statsRow: { display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
    background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(13,43,26,0.08)',
    minWidth: 140,
  },
  chipIcon: { fontSize: 22 },
  chipVal: { fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0d2b1a' },
  chipLabel: { fontSize: 12, color: '#74956e', fontWeight: 500 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  card: {
    background: '#fff', borderRadius: 16, padding: '22px', textDecoration: 'none', color: 'inherit',
    boxShadow: '0 1px 4px rgba(13,43,26,0.08)', display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'transform 0.15s, box-shadow 0.15s', border: '1.5px solid transparent',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cropIcon: { fontSize: 28 },
  cardName: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 },
  cardCrop: { color: '#74956e', fontSize: 13 },
  cardMeta: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 },
  area: { fontSize: 12, color: '#74956e', background: '#f0f7f2', padding: '3px 8px', borderRadius: 6 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTop: '1px solid #edf7f0' },
  plantDate: { fontSize: 12, color: '#74956e' },
  updateLink: { fontSize: 13, color: '#2d6a4f', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#3a5a40' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
};