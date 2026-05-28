'use client';

import { useEffect, useRef, useState } from 'react';
import { initCursor }   from '@/lib/cursor';
import { initSparkles } from '@/lib/sparkles';
import { fetchLanyard, buildProfile, setupBackground, setupMusic, formatTime } from '@/lib/profile';

export default function ProfileClient({ memberSlug }) {
  const [profileData, setProfileData]   = useState(null);
  const [allProfiles, setAllProfiles]   = useState(null);
  const [entered, setEntered]           = useState(false);
  const [playing, setPlaying]           = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const lastVolume = useRef(0.7);
  const audioRef   = useRef(null);

  useEffect(() => {
    document.body.classList.add('profile-mode');
    return () => document.body.classList.remove('profile-mode');
  }, []);

  useEffect(() => {
    if (!memberSlug) { window.location.href = '/'; return; }
    initCursor();
    initSparkles('sparkle-canvas', 40);

    fetch('/profiles.json')
      .then(r => r.json())
      .then(profiles => {
        const data = profiles[memberSlug];
        if (!data) { window.location.href = '/'; return; }
        setAllProfiles(profiles);
        setProfileData(data);
        setupBackground(data.background || data.avatar || '');
        if (data.discordId) fetchLanyard(data.discordId, data);
      });
  }, [memberSlug]);

  useEffect(() => {
    if (!profileData) return;
    document.title = `${profileData.name} | SCF`;
    if (profileData.color) document.documentElement.style.setProperty('--member-color', profileData.color);
  }, [profileData]);

  function enterProfile() {
    setEntered(true);
    setTimeout(() => {
      if (profileData && allProfiles && audioRef.current) {
        buildProfile(profileData, memberSlug, allProfiles, audioRef.current, setPlayingState);
      }
    }, 50);
    if (profileData?.music && audioRef.current) {
      setTimeout(() => {
        audioRef.current.play().catch(() => {});
        setPlayingState(true);
      }, 400);
    }
  }

  function setPlayingState(isPlaying) {
    setPlaying(isPlaying);
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio?.src) return;
    if (audio.paused) { audio.play(); setPlayingState(true); }
    else { audio.pause(); setPlayingState(false); }
  }

  function seekTrack(e) {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const bar  = document.getElementById('track-bar');
    const rect = bar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
  }

  function setVolume(val) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = parseFloat(val); audio.muted = false;
    setIsMuted(false); lastVolume.current = parseFloat(val);
    const slider = document.getElementById('volume-slider');
    if (slider) slider.style.setProperty('--vol-pct', val * 100 + '%');
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.muted || audio.volume === 0) {
      audio.muted = false; audio.volume = lastVolume.current || 0.7;
      const slider = document.getElementById('volume-slider');
      if (slider) { slider.value = audio.volume; slider.style.setProperty('--vol-pct', audio.volume * 100 + '%'); }
      setIsMuted(false);
    } else {
      lastVolume.current = audio.volume; audio.muted = true;
      const slider = document.getElementById('volume-slider');
      if (slider) { slider.value = 0; slider.style.setProperty('--vol-pct', '0%'); }
      setIsMuted(true);
    }
  }

  function sharePage() {
    navigator.clipboard.writeText(location.href).then(() => {
      const toast = document.getElementById('share-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
    });
  }

  const initials = profileData ? profileData.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '';

  return (
    <>
      <div id="bg-container"></div>
      <div id="bg-overlay"></div>
      <canvas id="sparkle-canvas"></canvas>
      <div id="custom-cursor"></div>
      <div id="cursor-trail"></div>

      {}
      {!entered && profileData && (
        <div id="enter-screen" onClick={enterProfile}>
          <div className="enter-avatar-ring">
            <div className="enter-avatar-inner">
              {profileData.avatar
                ? <img id="enter-avatar-img" src={profileData.avatar} alt={profileData.name} />
                : <div id="enter-avatar-placeholder" className="enter-avatar-placeholder">{initials}</div>
              }
            </div>
          </div>
          <div id="enter-name" className="enter-name">{profileData.name}</div>
          <div id="enter-rank" className="enter-rank">{profileData.rankLabel || profileData.rank}</div>
          <button className="enter-btn" onClick={e => { e.stopPropagation(); enterProfile(); }}>ENTER</button>
          <div className="enter-hint">Click anywhere to enter</div>
        </div>
      )}

      <a href="/" id="back-btn" aria-label="Back" className={entered ? 'visible' : ''}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </a>
      <button id="share-btn" onClick={sharePage} aria-label="Share" className={entered ? 'visible' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>
      <div id="share-toast">Link copied</div>

      {}
      <div id="main-content" style={{ display: entered ? 'flex' : 'none' }}>
        <div id="parent-breadcrumb" className="parent-breadcrumb" style={{ display: 'none' }}>
          <a id="breadcrumb-back" className="breadcrumb-back" href="/" aria-label="Back to members">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span>Back</span>
          </a>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-label">Parent</span>
          <a id="breadcrumb-parent" className="breadcrumb-parent" href="#">—</a>
        </div>

        <div className="profile-card" id="profile-card">
          <div className="card-top-line"></div>
          <div className="card-corner tl"></div><div className="card-corner tr"></div>
          <div className="card-corner bl"></div><div className="card-corner br"></div>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring" id="avatar-ring"></div>
            <img id="profile-avatar-img" className="profile-avatar" src="" alt="" style={{ display: 'none' }} />
            <div id="profile-avatar-placeholder" className="profile-avatar-placeholder"></div>
          </div>
          <div className="profile-rank" id="profile-rank"></div>
          <div className="profile-name" id="profile-name"></div>
          <div className="profile-divider"></div>
          <div className="profile-bio" id="profile-bio"></div>
          <div id="profile-oath" className="profile-oath" style={{ display: 'none' }}></div>
          <div id="status-badge" className="status-badge" style={{ display: 'none' }}>
            <span className="status-dot" id="status-dot"></span>
            <span id="status-text">Offline</span>
            <button className="discord-copy-btn" id="discord-copy-btn" title="Copy Discord ID">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <div id="copy-toast" className="copy-toast">ID copied</div>
          <div id="listening-badge" className="listening-badge" style={{ display: 'none' }}>
            <div className="listening-art-wrap">
              <img id="listening-art" className="listening-art" src="" alt="" />
              <div className="listening-eq"><span></span><span></span><span></span></div>
            </div>
            <div className="listening-info">
              <div className="listening-label">Listening on Spotify</div>
              <div className="listening-song" id="listening-song"></div>
              <div className="listening-artist" id="listening-artist"></div>
            </div>
          </div>
          <div id="socials-wrap" className="socials"></div>
          <div className="card-footer">
            <a href="/" className="footer-logo-link"><img src="/assets/logo.png" alt="SCF" /></a>
          </div>
        </div>

        <div id="inducted-box" className="inducted-box" style={{ display: 'none' }}>
          <div className="card-top-line"></div>
          <div className="card-corner tl"></div><div className="card-corner tr"></div>
          <div className="card-corner bl"></div><div className="card-corner br"></div>
          <div className="inducted-header">
            <div className="inducted-header-line"></div>
            <span className="inducted-icon">⚜</span>
            <span className="inducted-title">Inducted Members</span>
            <span id="inducted-count" className="inducted-count"></span>
            <span className="inducted-icon">⚜</span>
            <div className="inducted-header-line" style={{ background: 'linear-gradient(270deg,rgba(201,168,76,0.35),transparent)' }}></div>
          </div>
          <div id="children-list" className="children-list"></div>
        </div>
      </div>

      {}
      {profileData?.music && (
        <div className={`music-dock${entered ? ' visible' : ''}`} id="music-dock">
          <div className="music-dock-collapsed">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <div className="music-dock-expanded">
            <button className={`play-btn${playing ? ' playing' : ''}`} id="play-btn" onClick={toggleMusic}>
              {playing
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            <div className="track-info">
              <div className="track-name" id="track-name">Loading…</div>
              <div className="track-bar-bg" id="track-bar" onClick={seekTrack}>
                <div className="track-bar-fill" id="track-fill"></div>
              </div>
              <div className="track-times">
                <span id="track-cur">0:00</span>
                <span id="track-dur">0:00</span>
              </div>
            </div>
            <div className="volume-wrap">
              <button className="vol-btn" id="vol-btn" onClick={toggleMute} title="Mute/Unmute">
                {isMuted
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                }
              </button>
              <input type="range" id="volume-slider" className="vol-slider" min="0" max="1" step="0.02" defaultValue="0.7" onInput={e => setVolume(e.target.value)} title="Volume" />
            </div>
          </div>
        </div>
      )}

      <audio id="audio" ref={audioRef}></audio>
    </>
  );
}
