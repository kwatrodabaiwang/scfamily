'use client';

export function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  const trail  = document.getElementById('cursor-trail');
  if (!cursor || !trail) return;

  let mx = -100, my = -100, tx = -100, ty = -100;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99997;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = [];

  class Powder {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2.5;
      this.vy = (Math.random() - 0.5) * 2.5 - 0.8;
      this.size = 1 + Math.random() * 2.2;
      this.alpha = 0.65 + Math.random() * 0.35;
      this.decay = 0.018 + Math.random() * 0.022;
      this.hue   = 36 + Math.random() * 18;
    }
    update() {
      this.x  += this.vx;
      this.y  += this.vy;
      this.vy += 0.04;
      this.vx *= 0.97;
      this.alpha -= this.decay;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle   = `hsl(${this.hue},85%,68%)`;
      ctx.shadowColor = `hsl(${this.hue},90%,62%)`;
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    dead() { return this.alpha <= 0; }
  }

  let lastPX = -999, lastPY = -999;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';

    const dist = Math.hypot(mx - lastPX, my - lastPY);
    if (dist > 4) {
      const count = Math.min(4, Math.ceil(dist / 5));
      for (let i = 0; i < count; i++) particles.push(new Powder(mx, my));
      lastPX = mx; lastPY = my;
    }
  });

  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; trail.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; trail.style.opacity = '0'; });
  document.addEventListener('mousedown',  () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',    () => cursor.classList.remove('clicking'));

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let active = !document.hidden && !reduceMotion;
  document.addEventListener('visibilitychange', () => { active = !document.hidden && !reduceMotion; });

  (function animate() {
    if (active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].dead()) particles.splice(i, 1);
      }
      tx += (mx - tx) * 0.18;
      ty += (my - ty) * 0.18;
      trail.style.left = tx + 'px';
      trail.style.top  = ty + 'px';
    }
    requestAnimationFrame(animate);
  })();
}
