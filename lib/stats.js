'use client';
import { RANK_ORDER } from './roster.js';

export function renderStats(profiles) {
  const total       = Object.keys(profiles).length;
  const verified    = Object.values(profiles).filter(d => d.verified).length;
  const online      = Object.values(profiles).filter(d => d.online === true || d.online === 'true').length;
  const leadership  = Object.values(profiles).filter(d =>
    ['godfather','godmother','birador','boss','underboss','consigliere'].includes(d.rank)
  ).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total',      total);
  set('stat-online',     online);
  set('stat-verified',   verified);
  set('stat-leadership', leadership);

  const rankList = document.getElementById('rank-list');
  if (!rankList) return;
  rankList.innerHTML = '';
  RANK_ORDER.forEach(({ label, ranks, icon }) => {
    const count = Object.values(profiles).filter(d => ranks.includes(d.rank)).length;
    if (!count) return;
    const item = document.createElement('div');
    item.className = 'rank-item';
    item.innerHTML = `<span class="rank-item-icon">${icon}</span><span class="rank-item-label">${label}</span><span class="rank-item-count">${count}</span>`;
    rankList.appendChild(item);
  });
}
