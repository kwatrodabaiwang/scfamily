'use client';

export function initSmoke(canvasId = 'smoke-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = H + 60;
      this.size = 80 + Math.random() * 160;
      this.speedY = -(0.15 + Math.random() * 0.35);
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.alpha = 0; this.maxAlpha = 0.04 + Math.random() * 0.06;
      this.life = 0; this.maxLife = 300 + Math.random() * 400;
      this.hue = 30 + Math.random() * 20;
    }
    update() {
      this.x += this.speedX; this.y += this.speedY; this.life++;
      const t = this.life / this.maxLife;
      this.alpha = t < 0.2 ? (t / 0.2) * this.maxAlpha
        : t > 0.7 ? ((1 - t) / 0.3) * this.maxAlpha
        : this.maxAlpha;
      this.size += 0.15;
      if (this.life >= this.maxLife) this.reset();
    }
    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      g.addColorStop(0, `hsla(${this.hue},30%,20%,${this.alpha})`);
      g.addColorStop(1, `hsla(${this.hue},10%,5%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
  }

  for (let i = 0; i < 18; i++) {
    const p = new Particle(); p.y = Math.random() * H; p.life = Math.floor(Math.random() * p.maxLife);
    particles.push(p);
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) { ctx.clearRect(0, 0, W, H); particles.forEach(p => p.draw()); return; }

  let smokeActive = !document.hidden;
  document.addEventListener('visibilitychange', () => { smokeActive = !document.hidden; });

  (function animate() {
    if (smokeActive) { ctx.clearRect(0, 0, W, H); particles.forEach(p => { p.update(); p.draw(); }); }
    requestAnimationFrame(animate);
  })();
}
