import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ADMIN = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/fields', icon: '🌾', label: 'All Fields' },
  { to: '/agents', icon: '👥', label: 'Agents' },
];

const NAV_AGENT = [
  { to: '/my-fields', icon: '⊞', label: 'My Dashboard' },
  { to: '/fields', icon: '🌾', label: 'My Fields' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_AGENT;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 72 : 240 }}>
        <div style={styles.sideTop}>
          <div style={styles.logo} onClick={() => setCollapsed(c => !c)}>
            <span style={styles.logoIcon}>🌿</span>
            {!collapsed && <span style={styles.logoText}>SmartSeason</span>}
          </div>

          <nav style={styles.nav}>
            {nav.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navActive : {}),
                })}
              >
                <span style={styles.navIcon}>{icon}</span>
                {!collapsed && <span style={styles.navLabel}>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={styles.sideBottom}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user?.name}</div>
                <div style={styles.userRole}>{user?.role}</div>
              </div>
            )}
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <span>↩</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh', background: '#f0f7f2' },
  sidebar: {
    background: '#0d2b1a',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '28px 0', transition: 'width 0.25s ease', overflow: 'hidden',
    flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
  },
  sideTop: { display: 'flex', flexDirection: 'column' },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 32px',
    cursor: 'pointer',
  },
  logoIcon: { fontSize: 26, flexShrink: 0 },
  logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', whiteSpace: 'nowrap' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
    borderRadius: 10, color: '#74956e', fontWeight: 500, fontSize: 14,
    transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  navActive: { background: '#1a4a2e', color: '#52b788' },
  navIcon: { fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' },
  navLabel: {},
  sideBottom: { padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#1a4a2e', borderRadius: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#52b788',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#0d2b1a', flexShrink: 0,
  },
  userInfo: { overflow: 'hidden' },
  userName: { color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { color: '#52b788', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
    background: 'transparent', border: 'none', color: '#74956e', fontSize: 14,
    borderRadius: 10, cursor: 'pointer', width: '100%',
    transition: 'background 0.15s, color 0.15s',
  },
  main: { flex: 1, padding: '36px 40px', overflowY: 'auto', minWidth: 0 },
};