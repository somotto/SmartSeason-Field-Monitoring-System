import React from 'react';

const STATUS_CONFIG = {
  active:    { label: 'Active',    bg: '#d8f3dc', color: '#1b4332', dot: '#52b788' },
  at_risk:   { label: 'At Risk',   bg: '#fff3e0', color: '#7c3f00', dot: '#f4a261' },
  completed: { label: 'Completed', bg: '#e8f4fd', color: '#1a3a5c', dot: '#74c0fc' },
};

const STAGE_CONFIG = {
  planted:   { label: 'Planted',   bg: '#f0fdf4', color: '#166534', dot: '#86efac' },
  growing:   { label: 'Growing',   bg: '#d8f3dc', color: '#1b4332', dot: '#52b788' },
  ready:     { label: 'Ready',     bg: '#fef9c3', color: '#713f12', dot: '#fbbf24' },
  harvested: { label: 'Harvested', bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <span style={{ ...base, background: cfg.bg, color: cfg.color }}>
      <span style={{ ...dot, background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function StageBadge({ stage }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.planted;
  return (
    <span style={{ ...base, background: cfg.bg, color: cfg.color }}>
      <span style={{ ...dot, background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

const base = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
};
const dot = { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 };