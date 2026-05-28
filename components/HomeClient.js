'use client';

import { useEffect, useRef, useState } from 'react';
import { initCursor }        from '@/lib/cursor';
import { initSmoke }         from '@/lib/smoke';
import { initSparkles }      from '@/lib/sparkles';
import { initTheme }         from '@/lib/theme';
import { renderGallery, closeLightbox, lightboxNav, initLightboxKeys } from '@/lib/gallery';
import { renderRoster, fetchLanyardAvatars, computeDescendants, getInitials } from '@/lib/roster';
import { renderFamilyTree }  from '@/lib/familyTree';
import { renderStats }       from '@/lib/stats';

const GALLERY_ITEMS = [
  { type: 'video', src: '/assets/gallery/vitoditakot.mp4', caption: 'Vito Scaletta di daw takot kay Godmother' },
  // { type: 'image', src: '/assets/gallery/name.jpg', caption: 'caption' },
];

const HOMEPAGE_BACKGROUND = '';

export default function HomeClient() {
  const [profiles, setProfiles] = useState({});
  const [activeTab, setActiveTab] = useState('members');
  const [searchVal, setSearchVal] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewSlug, setPreviewSlug] = useState(null);
  const debounceRef = useRef(null);
  const treeRendered = useRef(false);
  const currentFiltered = useRef(null);

  useEffect(() => {
    initCursor();
    initSmoke('smoke-canvas');
    initSparkles('sparkle-canvas');
    initTheme();
    initLightboxKeys();
    setupHomepageBg(HOMEPAGE_BACKGROUND);

    fetch('/profiles.json')
      .then(r => r.json())
      .then(data => {
        setProfiles(data);
        currentFiltered.current = data;
        renderGallery(GALLERY_ITEMS);
      })
      .catch(() => {
        const roster = document.getElementById('roster');
        if (roster) roster.innerHTML = '<p style="text-align:center;color:rgba(201,168,76,0.5);font-family:Cinzel,serif;letter-spacing:.3em;font-size:11px;margin-top:60px">NO DATA FOUND</p>';
        renderGallery(GALLERY_ITEMS);
      });
  }, []);

  useEffect(() => {
    if (!Object.keys(profiles).length) return;
    let filtered = profiles;
    if (rankFilter)   filtered = Object.fromEntries(Object.entries(filtered).filter(([,d]) => d.rank === rankFilter));
    if (statusFilter === 'verified') filtered = Object.fromEntries(Object.entries(filtered).filter(([,d]) => d.verified === true));
    if (statusFilter === 'online')   filtered = Object.fromEntries(Object.entries(filtered).filter(([,d]) => d.online === true || d.online === 'true'));
    currentFiltered.current = filtered;
    renderRoster(filtered, searchVal, setPreviewSlug);
    fetchLanyardAvatars(filtered);
    if (activeTab === 'stats') renderStats(filtered);
  }, [profiles, searchVal, rankFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'stats') renderStats(currentFiltered.current || profiles);
    if (activeTab === 'tree' && !treeRendered.current && Object.keys(profiles).length) {
      renderFamilyTree(profiles);
      fetchLanyardAvatars(profiles);
      treeRendered.current = true;
    }
  }, [activeTab]);

  function handleSearchInput(val) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchVal(val), 120);
  }

  function clearSearch() {
    setSearchVal(''); setRankFilter(''); setStatusFilter('');
    document.getElementById('search-input').value = '';
    document.getElementById('rank-filter').value  = '';
    document.getElementById('status-filter').value = '';
  }

  const previewData = previewSlug && profiles[previewSlug] ? profiles[previewSlug] : null;
  const previewChildren    = previewData?.children || [];
  const previewDescendants = previewSlug ? computeDescendants(previewSlug, profiles) : 0;
  const previewDiscordId   = previewData?.discordId || '';

  return (
    <>
      {}
      <div id="home-bg-container"></div>
      <div id="home-bg-overlay"></div>
      <canvas id="smoke-canvas"></canvas>
      <canvas id="sparkle-canvas"></canvas>
      <div id="vignette"></div>
      <div id="custom-cursor"></div>
      <div id="cursor-trail"></div>

      <div id="content">
        <header>
          <img src="/assets/logo.png" alt="SCF Logo" className="header-logo" />
          <h1 className="header-family-name">Scaletta Crime Family</h1>
          <div className="header-divider">✦</div>
          <p className="header-motto">Loyalty &nbsp;·&nbsp; Respect &nbsp;·&nbsp; Omerta</p>
          {Object.keys(profiles).length > 0 && (
            <div className="member-count-badge">
              <span className="member-count-icon">⚜</span>
              <span>{Object.keys(profiles).length}</span>
              <span className="member-count-label">Members</span>
            </div>
          )}
        </header>

        <nav id="site-nav">
          {[
            { key: 'members', icon: '◈', label: 'Members' },
            { key: 'stats',   icon: '✦', label: 'Stats' },
            { key: 'gallery', icon: '✦',  label: 'Gallery' },
            { key: 'tree',    icon: '⚜',  label: 'Family Tree' },
            { key: 'code',    icon: '📜', label: 'Code of Honor' },
          ].map(t => (
            <button key={t.key} className={`nav-tab${activeTab === t.key ? ' active' : ''}`} data-tab={t.key} onClick={() => setActiveTab(t.key)}>
              <span className="nav-tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
          <button id="theme-toggle" className="nav-tab theme-toggle" title="Toggle theme">
            <span className="nav-tab-icon">🌙</span>
          </button>
        </nav>

        {}
        <div id="tab-members" className="tab-content" style={{ display: activeTab === 'members' ? 'block' : 'none' }}>

          {}
          {previewData && (
            <div id="member-preview" className="member-preview open" aria-hidden="false" role="dialog" aria-modal="true" onClick={() => setPreviewSlug(null)}>
              <div className="member-preview-card" onClick={e => e.stopPropagation()} tabIndex="-1">
                <button className="member-preview-close" onClick={() => setPreviewSlug(null)} aria-label="Close" type="button">✕</button>
                <div className="member-preview-top">
                  <div className="member-preview-avatar">
                    <div className="member-preview-avatar-ring"></div>
                    {previewData.avatar
                      ? <img className="member-preview-avatar-img" src={previewData.avatar} alt={previewData.name} />
                      : <div className="member-preview-avatar-placeholder">{getInitials(previewData.name)}</div>
                    }
                  </div>
                  <div className="member-preview-meta">
                    <div className="member-preview-rank">{previewData.rankLabel || previewData.rank}</div>
                    <div className="member-preview-name">{previewData.name}</div>
                    {previewData.bio && <div className="member-preview-bio">{previewData.bio}</div>}
                  </div>
                </div>
                <div className="member-preview-grid">
                  <div className="member-preview-kv"><div className="member-preview-k">Children</div><div className="member-preview-v">{previewChildren.length}</div></div>
                  <div className="member-preview-kv"><div className="member-preview-k">Descendants</div><div className="member-preview-v">{previewDescendants}</div></div>
                  <div className="member-preview-kv"><div className="member-preview-k">Discord</div><div className="member-preview-v">{previewDiscordId ? `ID: ${previewDiscordId}` : '—'}</div></div>
                </div>
                <div className="member-preview-actions">
                  <a className="member-preview-enter" href={`/${previewSlug}`}>ENTER PROFILE</a>
                </div>
              </div>
            </div>
          )}

          <div id="search-wrap">
            <div className="search-inner">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="search-input" className="search-input" type="text" placeholder="Search members…" onInput={e => handleSearchInput(e.target.value)} />
              {searchVal && <button className="search-clear" id="search-clear" onClick={clearSearch}>✕</button>}
            </div>
            <div className="filter-wrap">
              <select id="rank-filter" className="filter-select" value={rankFilter} onChange={e => setRankFilter(e.target.value)}>
                <option value="">All Ranks</option>
                <option value="godfather">Godfather</option>
                <option value="godmother">Godmother</option>
                <option value="birador">Birador ni Vito</option>
                <option value="founder">Founder</option>
                <option value="boss">Boss</option>
                <option value="underboss">Underboss</option>
                <option value="consigliere">Consigliere</option>
                <option value="caporegime">Caporegime</option>
                <option value="soldier">Soldier</option>
              </select>
              <select id="status-filter" className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="verified">Verified</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          <main id="roster"></main>
          <div id="no-results" style={{ display: 'none' }}>
            <p className="no-results-text">No members found</p>
          </div>
        </div>

        {}
        <div id="tab-stats" className="tab-content" style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
          <div className="stats-container">
            <div className="stats-header">
              <h2 className="stats-title">Family Status</h2>
              <div className="stats-divider"></div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value" id="stat-total">0</div><div className="stat-label">Total Members</div></div>
              <div className="stat-card"><div className="stat-value" id="stat-online">0</div><div className="stat-label">Online Now</div></div>
              <div className="stat-card"><div className="stat-value" id="stat-verified">0</div><div className="stat-label">Verified</div></div>
              <div className="stat-card"><div className="stat-value" id="stat-leadership">0</div><div className="stat-label">Leadership</div></div>
            </div>
            <div className="rank-breakdown">
              <h3 className="breakdown-title">Members by Rank</h3>
              <div id="rank-list" className="rank-list"></div>
            </div>
          </div>
        </div>

        {}
        <div id="tab-gallery" className="tab-content" style={{ display: activeTab === 'gallery' ? 'block' : 'none' }}>
          <div id="gallery-grid"></div>
          <div id="gallery-empty" style={{ display: 'none' }}>
            <p className="gallery-empty-text">✦ &nbsp; No gallery items yet &nbsp; ✦</p>
            <p className="gallery-empty-sub">Add items to the <code>GALLERY_ITEMS</code> array in <code>components/HomeClient.js</code></p>
          </div>
        </div>

        {}
        <div id="tab-tree" className="tab-content" style={{ display: activeTab === 'tree' ? 'block' : 'none' }}>
          <div id="tree-scroll-wrap">
            <div id="tree-container"></div>
          </div>
        </div>

        {}
        <div id="tab-code" className="tab-content" style={{ display: activeTab === 'code' ? 'block' : 'none' }}>
          <div className="code-container">
            <div className="code-header">
              <h2 className="code-title">Code of Honor</h2>
              <div className="code-divider"></div>
              <p className="code-subtitle">The Laws of the Family</p>
            </div>
            <div className="code-content">
              {[
                ['I',   'Loyalty Above All',        'Your allegiance to the family supersedes all other concerns. Betray the family, and you betray yourself.'],
                ['II',  'Respect the Hierarchy',    'Honor those above you. Lead those below you. The chain of command is sacred and unbreakable.'],
                ['III', 'Omerta - The Code of Silence', 'What is spoken within the family stays within the family. Discretion is the cornerstone of trust.'],
                ['IV',  'Family First, Always',     'When you are in need, the family provides. When the family is in need, you answer without question.'],
                ['V',   'Respect is Earned',        'Show respect to all members, but understand that true respect comes through action and integrity.'],
                ['VI',  'Unity in Purpose',         'Stand together. When one member suffers, we all feel the pain. When one prospers, we all celebrate.'],
              ].map(([num, title, text]) => (
                <div key={num} className="code-rule">
                  <div className="rule-number">{num}</div>
                  <div className="rule-text"><strong>{title}</strong><p>{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div id="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          <button className="lightbox-nav prev" onClick={e => lightboxNav(-1, e)}>‹</button>
          <button className="lightbox-nav next" onClick={e => lightboxNav(1, e)}>›</button>
          <div id="lightbox-media"></div>
          <div id="lightbox-caption"></div>
        </div>

        <footer>
          <img src="/assets/logo.png" alt="" className="footer-logo" />
          <p className="footer-text">Scaletta Crime Family &nbsp;·&nbsp; Loyalty &nbsp;·&nbsp; Est. 2024</p>
        </footer>
      </div>
    </>
  );
}

function setupHomepageBg(src) {
  const container = document.getElementById('home-bg-container');
  if (!src || !container) return;
  const ext = src.split('.').pop().toLowerCase();
  if (['mp4','webm','ogg'].includes(ext)) {
    const video = document.createElement('video');
    Object.assign(video, { src, autoplay: true, loop: true, muted: true, playsInline: true });
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;filter:brightness(0.22) saturate(0.6);transform:scale(1.05)';
    container.appendChild(video);
  } else {
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;filter:brightness(0.22) saturate(0.6);transform:scale(1.05)';
    container.appendChild(img);
  }
  const overlay = document.getElementById('home-bg-overlay');
  if (overlay) overlay.style.opacity = '1';
}
