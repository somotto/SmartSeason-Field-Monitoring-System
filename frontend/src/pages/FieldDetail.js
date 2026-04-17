import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import api from '../utils/api';

const STAGES = ['planted', 'growing', 'ready', 'harvested'];

export default function FieldDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ current_stage: '', notes: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/fields/${id}`)
      .then(res => {
        setField(res.data);
        setForm({ current_stage: res.data.current_stage, notes: '' });
      })
      .catch(() => navigate('/fields'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    try {
      const res = await api.put(`/fields/${id}`, form);
      setField(prev => ({ ...prev, ...res.data }));
      setSuccess('Field updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh to get updated history
      const fresh = await api.get(`/fields/${id}`);
      setField(fresh.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading field…</div>;
  if (!field) return null;

  const isAgent = user?.role === 'agent';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <Link to="/fields" style={styles.breadLink}>Fields</Link>
        <span style={styles.breadSep}>›</span>
        <span>{field.name}</span>
      </div>

      <div style={styles.topRow}>
        <div>
          <h1 style={styles.title}>{field.name}</h1>
          <div style={styles.badgeRow}>
            <StageBadge stage={field.current_stage} />
            <StatusBadge status={field.status} />
          </div>
        </div>
        {user?.role === 'admin' && (
          <Link to={`/fields/${id}/edit`} style={styles.editBtn}>Edit Field</Link>
        )}
      </div>

      <div style={styles.layout}>
        {/* Left: details */}
        <div style={styles.left}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Field Details</h2>
            <div style={styles.detailGrid}>
              {[
                ['Crop Type', field.crop_type],
                ['Planting Date', new Date(field.planting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Location', field.location || '—'],
                ['Area', field.area_hectares ? `${field.area_hectares} ha` : '—'],
                ['Assigned Agent', field.agent_name || 'Unassigned'],
                ['Last Updated', new Date(field.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
              ].map(([label, value]) => (
                <div key={label} style={styles.detailRow}>
                  <span style={styles.detailLabel}>{label}</span>
                  <span style={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Update history */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Update History</h2>
            {field.updates?.length === 0 ? (
              <p style={styles.empty}>No updates yet.</p>
            ) : (
              <div style={styles.timeline}>
                {field.updates?.map((u, i) => (
                  <div key={u.id} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    {i < field.updates.length - 1 && <div style={styles.timelineLine} />}
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineAgent}>{u.agent_name}</span>
                        <span style={styles.timelineDate}>
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={styles.stageChange}>
                        {u.previous_stage && <><StageBadge stage={u.previous_stage} /> <span style={{ color: '#74956e' }}>→</span></>}
                        <StageBadge stage={u.new_stage} />
                      </div>
                      {u.notes && <p style={styles.updateNotes}>{u.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: update form */}
        <div style={styles.right}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              {isAgent ? 'Update Field' : 'Quick Stage Update'}
            </h2>

            {success && <div style={styles.successMsg}>{success}</div>}
            {error && <div style={styles.errorMsg}>{error}</div>}

            <form onSubmit={handleUpdate} style={styles.form}>
              <div style={styles.formField}>
                <label style={styles.label}>Stage</label>
                <select
                  style={styles.select}
                  value={form.current_stage}
                  onChange={e => setForm(p => ({ ...p, current_stage: e.target.value }))}
                  required
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formField}>
                <label style={styles.label}>
                  {isAgent ? '💬 Notes / Message to Admin' : 'Notes / Observations'}
                </label>
                <textarea
                  style={styles.textarea}
                  rows={4}
                  placeholder={isAgent
                    ? 'Describe field conditions, flag an issue, or leave a message for the admin…'
                    : 'Describe current field conditions, observations, or issues…'}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
                {isAgent && (
                  <span style={styles.noteHint}>Your note will be saved and visible to the admin.</span>
                )}
              </div>

              <button style={{ ...styles.submitBtn, opacity: updating ? 0.7 : 1 }} type="submit" disabled={updating}>
                {updating ? 'Saving…' : isAgent ? 'Save & Notify Admin' : 'Save Update'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: 40, color: '#74956e' },
  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 14, color: '#74956e' },
  breadLink: { color: '#2d6a4f', fontWeight: 500, textDecoration: 'none' },
  breadSep: { color: '#c4dfc9' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 30, fontFamily: 'Syne, sans-serif', marginBottom: 10 },
  badgeRow: { display: 'flex', gap: 10 },
  editBtn: {
    padding: '10px 20px', background: '#fff', border: '1.5px solid #c4dfc9',
    borderRadius: 10, fontWeight: 600, fontSize: 14, color: '#2d6a4f', textDecoration: 'none',
  },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 },
  left: { display: 'flex', flexDirection: 'column', gap: 20 },
  right: {},
  card: { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(13,43,26,0.08)' },
  cardTitle: { fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 18 },
  detailGrid: { display: 'flex', flexDirection: 'column', gap: 0 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf7f0' },
  detailLabel: { fontSize: 13, color: '#74956e', fontWeight: 500 },
  detailValue: { fontSize: 14, fontWeight: 600, color: '#0d2b1a', textAlign: 'right' },
  empty: { color: '#74956e', fontSize: 14 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 14, position: 'relative', paddingBottom: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: '#52b788', flexShrink: 0, marginTop: 4 },
  timelineLine: {
    position: 'absolute', left: 4, top: 14, bottom: 0,
    width: 2, background: '#edf7f0',
  },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  timelineAgent: { fontWeight: 600, fontSize: 14, color: '#0d2b1a' },
  timelineDate: { fontSize: 12, color: '#74956e' },
  stageChange: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 },
  updateNotes: { fontSize: 13, color: '#3a5a40', marginTop: 6, lineHeight: 1.6, background: '#f0f7f2', padding: '8px 12px', borderRadius: 8 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  formField: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#3a5a40' },
  select: { padding: '11px 12px', border: '1.5px solid #c4dfc9', borderRadius: 10, fontSize: 14, background: '#fff', outline: 'none' },
  textarea: { padding: '11px 12px', border: '1.5px solid #c4dfc9', borderRadius: 10, fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif' },
  submitBtn: {
    padding: '13px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Syne, sans-serif',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
  successMsg: { background: '#d8f3dc', color: '#1b4332', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  errorMsg: { background: '#fff0ee', color: '#c44c00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  noteHint: { fontSize: 12, color: '#74956e', marginTop: 4 },
};