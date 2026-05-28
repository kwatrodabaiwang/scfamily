'use client';
import { getInitials } from './roster.js';

export const PLATFORM_ICONS = {
  instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
  twitter:   'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
  tiktok:    'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
  youtube:   'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
  twitch:    'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg',
  discord:   'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
  facebook:  'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
  github:    'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
  website:   null,
};

export function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export function setupBackground(src) {
  const container = document.getElementById('bg-container');
  if (!src || !container) return;
  const ext = src.split('.').pop().toLowerCase().split('?')[0];
  if (['mp4','webm','ogg','mov'].includes(ext)) {
    const vid = document.createElement('video');
    Object.assign(vid, { src, autoplay: true, loop: true, muted: true, playsInline: true, id: 'bg-media' });
    container.appendChild(vid);
  } else {
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.id = 'bg-media';
    container.appendChild(img);
  }
}

export function findParentSlug(slug, profiles) {
  if (!slug || !profiles) return null;
  for (const [cSlug, d] of Object.entries(profiles)) {
    if (Array.isArray(d?.children) && d.children.includes(slug)) return cSlug;
  }
  return null;
}

export function buildProfile(data, memberSlug, allProfiles, audio, setPlayingState) {
  try {
    const breadcrumb = document.getElementById('parent-breadcrumb');
    const parentLink = document.getElementById('breadcrumb-parent');
    if (breadcrumb && parentLink && allProfiles) {
      const parentSlug = findParentSlug(memberSlug, allProfiles);
      if (parentSlug && allProfiles[parentSlug]) {
        breadcrumb.style.display = 'flex';
        parentLink.textContent = allProfiles[parentSlug].name;
        parentLink.href = `/${parentSlug}`;
      }
    }
  } catch {}

  if (data.avatar) {
    const img = document.getElementById('profile-avatar-img');
    const ph  = document.getElementById('profile-avatar-placeholder');
    if (img) { img.src = data.avatar; img.style.display = 'block'; img.onerror = () => { img.style.display='none'; if(ph) ph.textContent=getInitials(data.name); }; }
    if (ph)  ph.style.display = 'none';
  } else {
    const ph = document.getElementById('profile-avatar-placeholder');
    if (ph) ph.textContent = getInitials(data.name);
  }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('profile-rank', data.rankLabel || data.rank);
  set('profile-name', data.name);
  set('profile-bio',  data.bio || '');
  if (!data.bio) { const el = document.getElementById('profile-bio'); if (el) el.style.display = 'none'; }

  if (data.oath) {
    const oathEl = document.getElementById('profile-oath');
    if (oathEl) { oathEl.textContent = '\u201c' + data.oath + '\u201d'; oathEl.style.display = 'block'; }
  }

  document.body.classList.add('rank-' + data.rank);

  const socialsWrap = document.getElementById('socials-wrap');
  if (socialsWrap) {
    if (data.socials?.length) {
      data.socials.forEach(s => {
        const a = document.createElement('a');
        a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.className = 'social-btn';
        const iconUrl = PLATFORM_ICONS[s.platform];
        if (iconUrl) {
          fetch(iconUrl).then(r=>r.text()).then(svg=>{
            a.innerHTML = `<span style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;opacity:0.7;filter:invert(1) sepia(1) saturate(2) hue-rotate(5deg) brightness(0.8)">${svg}</span>`;
          }).catch(()=>{ a.innerHTML = `<span style="font-size:11px;font-family:Cinzel,serif;color:var(--gold-dim)">${s.platform.slice(0,2).toUpperCase()}</span>`; });
        } else {
          a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
        }
        socialsWrap.appendChild(a);
      });
    } else {
      socialsWrap.style.display = 'none';
    }
  }

  const children = data.children || [];
  if (children.length && allProfiles) {
    const box     = document.getElementById('inducted-box');
    const list    = document.getElementById('children-list');
    const countEl = document.getElementById('inducted-count');
    if (box) box.style.display = 'block';
    if (countEl) countEl.textContent = `· ${children.length}`;
    if (list) {
      children.forEach(childSlug => {
        const child = allProfiles[childSlug]; if (!child) return;
        const card = document.createElement('a');
        card.href = `/${childSlug}`; card.className = 'child-card';
        const avatarHTML = child.avatar
          ? `<img class="child-avatar" src="${child.avatar}" alt="${child.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="child-placeholder" style="display:none">${getInitials(child.name)}</div>`
          : `<div class="child-placeholder">${getInitials(child.name)}</div>`;
        card.innerHTML = `<div class="child-avatar-wrap"><div class="child-ring"></div>${avatarHTML}</div><div class="child-name">${child.name}</div><div class="child-rank">${child.rankLabel || child.rank}</div>`;
        list.appendChild(card);
      });
    }
  }

  if (data.music && audio) setupMusic(data.music, data.name, audio, setPlayingState);

  const card = document.getElementById('profile-card');
  if (card) {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      card.style.transition = 'transform 0.08s ease';
      card.style.transform  = `perspective(900px) rotateY(${dx * 9}deg) rotateX(${-dy * 7}deg) scale(1.018)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
    });
  }
}

export function fetchLanyard(discordId, profileData) {
  fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
    .then(r => r.json())
    .then(d => {
      if (!d.data) return;
      const user = d.data.discord_user;

      if (!profileData.avatar && user?.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        profileData.avatar = avatarUrl;
        const enterImg = document.getElementById('enter-avatar-img');
        if (enterImg) { enterImg.src = avatarUrl; enterImg.style.display = 'block'; document.getElementById('enter-avatar-placeholder').style.display = 'none'; }
        const img = document.getElementById('profile-avatar-img');
        const ph  = document.getElementById('profile-avatar-placeholder');
        if (img) { img.src = avatarUrl; img.style.display = 'block'; }
        if (ph)  ph.style.display = 'none';
        if (!profileData.background) setupBackground(avatarUrl);
      }

      const badge      = document.getElementById('status-badge');
      const dot        = document.getElementById('status-dot');
      const statusText = document.getElementById('status-text');
      const copyBtn    = document.getElementById('discord-copy-btn');

      const s = d.data.discord_status || 'offline';
      if (badge) badge.style.display = 'inline-flex';
      if (dot)   dot.className = `status-dot ${s}`;
      if (statusText) statusText.textContent = s.charAt(0).toUpperCase() + s.slice(1);

      if (copyBtn) {
        copyBtn.addEventListener('click', e => {
          e.stopPropagation();
          navigator.clipboard.writeText(discordId).then(() => {
            const toast = document.getElementById('copy-toast');
            if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
          });
        });
      }

      if (d.data.spotify) {
        const sp = d.data.spotify;
        const el = document.getElementById('listening-badge');
        const art    = document.getElementById('listening-art');
        const song   = document.getElementById('listening-song');
        const artist = document.getElementById('listening-artist');
        if (el) { el.style.display = 'flex'; if (art) art.src = sp.album_art_url||''; if (song) song.textContent = sp.song||''; if (artist) artist.textContent = sp.artist||''; if (sp.track_id) { el.style.cursor='pointer'; el.onclick=()=>window.open(`https://open.spotify.com/track/${sp.track_id}`,'_blank'); } }
      }
    }).catch(() => {});
}

function renderSpeakerIcon(vol, muted) {
  if (muted || vol === 0) return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
  if (vol < 0.5) return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
}

export function setupMusic(src, memberName, audio, setPlayingState) {
  const dock      = document.getElementById('music-dock');
  const trackName = document.getElementById('track-name');
  const trackFill = document.getElementById('track-fill');
  const trackCur  = document.getElementById('track-cur');
  const trackDur  = document.getElementById('track-dur');
  const volSlider = document.getElementById('volume-slider');
  const volBtn    = document.getElementById('vol-btn');
  if (!dock || !audio) return;
  dock.style.display = 'flex';
  setTimeout(() => dock.classList.add('visible'), 500);
  audio.src = src; audio.volume = 0.7; if (volSlider) { volSlider.value = 0.7; volSlider.style.setProperty('--vol-pct','70%'); }
  if (volBtn) volBtn.innerHTML = renderSpeakerIcon(0.7, false);
  const fname = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  if (trackName) trackName.textContent = fname || memberName;
  audio.addEventListener('loadedmetadata', () => { if (trackDur) trackDur.textContent = formatTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    if (trackFill) trackFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    if (trackCur) trackCur.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('ended', () => { audio.currentTime = 0; setPlayingState(false); });
}
