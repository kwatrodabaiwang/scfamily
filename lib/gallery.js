'use client';

let lightboxIndex = 0;
let galleryItems  = [];

export function renderGallery(items) {
  galleryItems = items || [];
  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  if (!galleryItems.length) { if (empty) empty.style.display = 'block'; return; }

  galleryItems.forEach((item, i) => {
    const cell = document.createElement('div');
    cell.className = 'gallery-cell';
    cell.onclick = () => openLightbox(i);

    if (item.type === 'image') {
      cell.innerHTML = `<img src="${item.src}" alt="${item.caption||''}" loading="lazy" />${item.caption ? `<div class="gallery-caption">${item.caption}</div>` : ''}`;
    } else if (item.type === 'video') {
      cell.innerHTML = `<video src="${item.src}" muted loop preload="metadata"></video><div class="gallery-play-icon">▶</div>${item.caption ? `<div class="gallery-caption">${item.caption}</div>` : ''}`;
      const vid = cell.querySelector('video');
      cell.addEventListener('mouseenter', () => vid.play());
      cell.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
    } else if (item.type === 'youtube') {
      cell.innerHTML = `<div class="gallery-yt-thumb"><img src="https://img.youtube.com/vi/${item.id}/hqdefault.jpg" alt="${item.caption||''}" /><div class="gallery-yt-play"><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg></div></div>${item.caption ? `<div class="gallery-caption">${item.caption}</div>` : ''}`;
    }
    grid.appendChild(cell);
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  showLightboxItem(index);
}

function showLightboxItem(index) {
  lightboxIndex = index;
  const item    = galleryItems[index];
  const media   = document.getElementById('lightbox-media');
  const caption = document.getElementById('lightbox-caption');
  if (!media) return;
  media.innerHTML = '';

  if (item.type === 'image') {
    const img = document.createElement('img'); img.src = item.src; media.appendChild(img);
  } else if (item.type === 'video') {
    const vid = document.createElement('video');
    vid.src = item.src; vid.controls = true; vid.autoplay = true; vid.loop = true; media.appendChild(vid);
  } else if (item.type === 'youtube') {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${item.id}?autoplay=1`;
    iframe.allow = 'autoplay; fullscreen'; iframe.allowFullscreen = true; media.appendChild(iframe);
  }
  if (caption) caption.textContent = item.caption || '';

  const prev = document.querySelector('.lightbox-nav.prev');
  const next = document.querySelector('.lightbox-nav.next');
  if (prev) prev.style.opacity = index > 0 ? '1' : '0.2';
  if (next) next.style.opacity = index < galleryItems.length - 1 ? '1' : '0.2';
}

export function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
  const media = document.getElementById('lightbox-media');
  if (media) media.innerHTML = '';
}

export function lightboxNav(dir, e) {
  if (e) e.stopPropagation();
  const next = lightboxIndex + dir;
  if (next >= 0 && next < galleryItems.length) showLightboxItem(next);
}

export function initLightboxKeys() {
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  lightboxNav(-1, e);
    if (e.key === 'ArrowRight') lightboxNav(1, e);
  });
}
