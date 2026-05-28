'use client';

export const RANK_ORDER = [
  { key: 'godfather-godmother', label: 'Godfather & Godmother', icon: '♛', ranks: ['godfather','godmother'] },
  { key: 'founder',             label: 'Founders',              icon: '⚜',  ranks: ['founder'] },
  { key: 'boss',                label: 'Boss',                  icon: '◈',  ranks: ['boss'] },
  { key: 'underboss',           label: 'Underboss',             icon: '◇',  ranks: ['underboss'] },
  { key: 'consigliere',         label: 'Consigliere',           icon: '✦',  ranks: ['consigliere'] },
  { key: 'caporegime',          label: 'Caporegime',            icon: '❖',  ranks: ['caporegime'] },
  { key: 'soldier',             label: 'Soldiers',              icon: '⬥',  ranks: ['soldier'] },
  { key: 'birador',             label: 'Birador ni Vito',       icon: '◆',  ranks: ['birador'] },
];

export function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function renderRoster(profiles, filter, openMemberPreview) {
  const roster = document.getElementById('roster');
  if (!roster) return;
  roster.innerHTML = '';
  let totalVisible = 0;
  const q = (filter || '').toLowerCase().trim();

  RANK_ORDER.forEach(({ key, label, icon, ranks }) => {
    let members = Object.entries(profiles).filter(([, d]) => ranks.includes(d.rank));
    if (q) members = members.filter(([, d]) => d.name.toLowerCase().includes(q) || (d.rankLabel || d.rank).toLowerCase().includes(q));
    if (!members.length) return;
    totalVisible += members.length;

    const section = document.createElement('section');
    section.className = 'rank-section visible';
    section.dataset.rank = key;
    section.innerHTML = `
      <div class="rank-header">
        <div class="rank-header-line left"></div>
        <span class="rank-icon">${icon}</span>
        <span class="rank-title">${label}</span>
        <span class="rank-icon">${icon}</span>
        <div class="rank-header-line"></div>
      </div>
      <div class="members-grid"></div>
    `;

    const grid = section.querySelector('.members-grid');
    members.forEach(([slug, data]) => {
      const card = document.createElement('a');
      card.href = `/${slug}`;
      card.className = 'member-card';
      card.dataset.slug = slug;

      const avatarHTML = data.avatar
        ? `<img class="card-avatar" src="${data.avatar}" alt="${data.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-avatar-placeholder" style="display:none">${getInitials(data.name)}</div>`
        : `<div class="card-avatar-placeholder">${getInitials(data.name)}</div>`;

      card.innerHTML = `
        <button class="member-preview-btn" aria-label="Preview ${data.name}" type="button">◈</button>
        <div class="card-avatar-wrap">
          <div class="card-avatar-ring"></div>
          ${avatarHTML}
        </div>
        <div class="card-name">${data.name}</div>
        <div class="card-rank-badge">${data.rankLabel || data.rank}</div>
        ${data.bio ? `<div class="card-bio">${data.bio}</div>` : ''}
      `;

      const previewBtn = card.querySelector('.member-preview-btn');
      previewBtn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        openMemberPreview(slug);
      });

      grid.appendChild(card);
    });
    roster.appendChild(section);
  });

  const noResults = document.getElementById('no-results');
  if (noResults) noResults.style.display = (q && totalVisible === 0) ? 'block' : 'none';
}

export function fetchLanyardAvatars(profiles) {
  Object.entries(profiles).forEach(([slug, data]) => {
    if (!data.discordId || data.avatar) return;
    fetch(`https://api.lanyard.rest/v1/users/${data.discordId}`)
      .then(r => r.json())
      .then(json => {
        const u = json.data?.discord_user;
        if (!u?.avatar) return;
        const avatarUrl = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`;
        data.avatar = avatarUrl;

        document.querySelectorAll(`[data-slug="${slug}"]`).forEach(el => {
          const ph = el.querySelector('.card-avatar-placeholder');
          if (ph) {
            const img = document.createElement('img');
            img.className = 'card-avatar'; img.src = avatarUrl; img.alt = data.name; img.loading = 'lazy';
            img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex'; };
            ph.parentNode.insertBefore(img, ph); ph.style.display = 'none';
          }
          const tph = el.querySelector('.tree-node-placeholder');
          if (tph) {
            const img = document.createElement('img');
            img.className = 'tree-node-avatar'; img.src = avatarUrl; img.alt = data.name;
            img.onerror = () => { img.style.display = 'none'; tph.style.display = 'flex'; };
            tph.parentNode.insertBefore(img, tph); tph.style.display = 'none';
          }
        });
      }).catch(() => {});
  });
}

export function computeDescendants(slug, profiles) {
  const seen = new Set();
  function walk(s) {
    const d = profiles[s];
    if (!d || !Array.isArray(d.children)) return;
    d.children.forEach(k => { if (!seen.has(k)) { seen.add(k); walk(k); } });
  }
  walk(slug);
  return seen.size;
}
