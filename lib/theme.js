'use client';

const THEMES = {
  dark:    { name: 'Dark',    css: 'dark' },
  crimson: { name: 'Crimson', css: 'crimson' },
};

const ICONS = { dark: '🌙', crimson: '🔴' };

let currentTheme = 'dark';

export function initTheme() {
  try { currentTheme = localStorage.getItem('scf-theme') || 'dark'; } catch {}
  if (!THEMES[currentTheme]) currentTheme = 'dark';
  applyTheme(currentTheme);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  try { localStorage.setItem('scf-theme', theme); } catch {}
  const icon = document.querySelector('#theme-toggle .nav-tab-icon');
  if (icon) icon.textContent = ICONS[theme];
}

function toggleTheme() {
  const keys = Object.keys(THEMES);
  applyTheme(keys[(keys.indexOf(currentTheme) + 1) % keys.length]);
}
