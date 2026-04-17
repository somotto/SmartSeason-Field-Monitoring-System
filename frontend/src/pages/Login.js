import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/dashboard' : '/my-fields');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@smartseason.com'); setPassword('admin123'); }
    else { setEmail('james@smartseason.com'); setPassword('agent123'); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.leaf}>🌿</span>
          <span style={styles.brandName}>SmartSeason</span>
        </div>
        <h1 style={styles.hero}>Field Intelligence<br />for Modern Farms</h1>
        <p style={styles.sub}>Track crop progress. Monitor field health.<br />Coordinate your team — all in one place.</p>
        <div style={styles.stats}>
          {[['Active Fields', '24'], ['Agents', '8'], ['Harvests This Season', '12']].map(([label, val]) => (
            <div key={label} style={styles.stat}>
              <div style={styles.statVal}>{val}</div>
              <div style={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSub}>Sign in to your SmartSeason account</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={styles.demoSection}>
            <div style={styles.demoLabel}>Quick demo access</div>
            <div style={styles.demoRow}>
              <button style={styles.demoBtn} onClick={() => fillDemo('admin')}>Admin Login</button>
              <button style={styles.demoBtn} onClick={() => fillDemo('agent')}>Agent Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: 1, background: 'linear-gradient(160deg, #0d2b1a 0%, #1a4a2e 60%, #2d6a4f 100%)',
    padding: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: '#fff', position: 'relative', overflow: 'hidden',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64, fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700 },
  leaf: { fontSize: 28 },
  brandName: { letterSpacing: '-0.5px' },
  hero: { fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, marginBottom: 20, fontFamily: 'Syne, sans-serif' },
  sub: { fontSize: 17, color: '#b7e4c7', lineHeight: 1.7, marginBottom: 56 },
  stats: { display: 'flex', gap: 40 },
  stat: {},
  statVal: { fontSize: 36, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#52b788' },
  statLabel: { fontSize: 13, color: '#74956e', marginTop: 2 },
  right: {
    width: 480, background: '#f8fef9', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px 48px',
  },
  card: { width: '100%', maxWidth: 380 },
  cardTitle: { fontSize: 28, marginBottom: 6, fontFamily: 'Syne, sans-serif' },
  cardSub: { color: '#74956e', marginBottom: 32 },
  error: { background: '#fff0ee', border: '1px solid #f4a261', color: '#c44c00', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#3a5a40' },
  input: {
    padding: '12px 14px', border: '1.5px solid #c4dfc9', borderRadius: 10,
    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
    fontSize: 15,
  },
  btn: {
    marginTop: 8, padding: '14px', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Syne, sans-serif',
    fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
  },
  demoSection: { marginTop: 36, paddingTop: 24, borderTop: '1px solid #c4dfc9' },
  demoLabel: { fontSize: 12, color: '#74956e', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' },
  demoRow: { display: 'flex', gap: 10 },
  demoBtn: {
    flex: 1, padding: '10px', border: '1.5px solid #c4dfc9', borderRadius: 10,
    background: '#fff', color: '#3a5a40', fontWeight: 500, fontSize: 13,
    cursor: 'pointer', transition: 'background 0.15s',
  },
};