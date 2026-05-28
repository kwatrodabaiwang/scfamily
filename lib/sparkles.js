'use client';

export function initSparkles(canvasId = 'sparkle-canvas', count) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, sparks = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  class Spark {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.size = 0.8 + Math.random() * 2.2;
      this.speedY = -(0.3 + Math.random() * 0.7);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.life = 0;
      this.maxLife = 180 + Math.random() * 300;
      this.twinkleSpeed  = 0.04 + Math.random() * 0.06;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      this.hue = 38 + Math.random() * 16;
    }
    update() {
      this.x += this.speedX; this.y += this.speedY; this.life++;
      if (this.life >= this.maxLife || this.y < -10) this.reset(false);
    }
    draw() {
      const t      = this.life / this.maxLife;
      const fade   = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
      const twinkle = 0.5 + 0.5 * Math.sin(this.life * this.twinkleSpeed + this.twinkleOffset);
      const alpha  = fade * twinkle * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = `hsl(${this.hue},85%,72%)`;
      ctx.shadowColor = `hsl(${this.hue},90%,65%)`;
      ctx.shadowBlur  = this.size * 3;
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - s * 2.5);
      ctx.lineTo(this.x + s * 0.4, this.y - s * 0.4);
      ctx.lineTo(this.x + s * 2.5, this.y);
      ctx.lineTo(this.x + s * 0.4, this.y + s * 0.4);
      ctx.lineTo(this.x, this.y + s * 2.5);
      ctx.lineTo(this.x - s * 0.4, this.y + s * 0.4);
      ctx.lineTo(this.x - s * 2.5, this.y);
      ctx.lineTo(this.x - s * 0.4, this.y - s * 0.4);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sparkCount = count ?? (reduceMotion ? 18 : 55);
  for (let i = 0; i < sparkCount; i++) sparks.push(new Spark());

  if (reduceMotion) { ctx.clearRect(0, 0, W, H); sparks.forEach(s => s.draw()); return; }

  let sparkleActive = !document.hidden;
  document.addEventListener('visibilitychange', () => { sparkleActive = !document.hidden; });

  (function animate() {
    if (sparkleActive) { ctx.clearRect(0, 0, W, H); sparks.forEach(s => { s.update(); s.draw(); }); }
    requestAnimationFrame(animate);
  })();
}
