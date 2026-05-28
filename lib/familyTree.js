'use client';
import { getInitials } from './roster.js';

export function renderFamilyTree(profiles) {
  const container = document.getElementById('tree-container');
  if (!container) return;
  container.innerHTML = '';

  const NODE_W = 96, NODE_H = 108, H_GAP = 40, V_GAP = 90, PAD = 48;
  const COUPLE_INNER_GAP = 20;
  const childrenMap = {};
  Object.entries(profiles).forEach(([slug, data]) => {
    if (data.children?.length) childrenMap[slug] = [...data.children];
  });

  const allChildSlugs = new Set(Object.values(profiles).flatMap(d => d.children || []));

  const connectedSlugs = new Set([
    ...Object.keys(childrenMap),
    ...allChildSlugs,
  ]);

  const roots = [...connectedSlugs].filter(s => !allChildSlugs.has(s));

  const processedAsCouple = new Set();
  const coupleOf   = {};
  const couples    = {};
  const coupleCenters = {};

  for (let i = 0; i < roots.length; i++) {
    for (let j = i + 1; j < roots.length; j++) {
      const a = roots[i], b = roots[j];
      if (processedAsCouple.has(a) || processedAsCouple.has(b)) continue;

      const chA = profiles[a]?.children || [];
      const chB = profiles[b]?.children || [];
      if (!chA.length || !chB.length) continue;
      if (chA.length === chB.length && chA.every(c => chB.includes(c))) {
        const coupleId = `${a}+${b}`;
        couples[coupleId]    = { slugA: a, slugB: b, children: chA };
        coupleOf[a] = coupleOf[b] = coupleId;
        processedAsCouple.add(a);
        processedAsCouple.add(b);
        childrenMap[coupleId] = chA;
        delete childrenMap[a];
        delete childrenMap[b];
      }
    }
  }

  const virtualRoots = [];
  const seenCouples  = new Set();
  roots.forEach(s => {
    const cid = coupleOf[s];
    if (cid) {
      if (!seenCouples.has(cid)) { virtualRoots.push(cid); seenCouples.add(cid); }
    } else {
      virtualRoots.push(s);
    }
  });
  childrenMap['__root__'] = virtualRoots;

  function subtreeWidth(slug) {
    const kids = childrenMap[slug] || [];
    const base = kids.length ? kids.reduce((s, c) => s + subtreeWidth(c), 0) : 1;
    return couples[slug] ? Math.max(2, base) : base;
  }

  const positions = {}; 

  function layout(slug, startX, depth) {
    const kids   = childrenMap[slug] || [];
    const w      = subtreeWidth(slug);
    const spanPx = w * (NODE_W + H_GAP) - H_GAP;
    const centerX = startX + spanPx / 2;
    const y       = depth * (NODE_H + V_GAP);

    if (slug !== '__root__') {
      if (couples[slug]) {
        const { slugA, slugB } = couples[slug];
        const totalW = NODE_W * 2 + COUPLE_INNER_GAP;
        positions[slugA] = { x: centerX - totalW / 2,          y };
        positions[slugB] = { x: centerX + COUPLE_INNER_GAP / 2, y };
        coupleCenters[slug] = { cx: centerX, y };
      } else {
        positions[slug] = { x: centerX - NODE_W / 2, y };
      }
    }

    let cx = startX;
    kids.forEach(kid => {
      layout(kid, cx, slug === '__root__' ? 0 : depth + 1);
      cx += subtreeWidth(kid) * (NODE_W + H_GAP);
    });
  }

  layout('__root__', 0, 0);

  const allPos = Object.values(positions);
  if (!allPos.length) return;
  const totalW = Math.max(...allPos.map(p => p.x)) + NODE_W + PAD * 2;
  const totalH = Math.max(...allPos.map(p => p.y)) + NODE_H + PAD;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:relative;width:${totalW}px;height:${totalH}px;`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', totalW);
  svg.setAttribute('height', totalH);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';

  const drawCurve = (x1, y1, x2, y2, addDots = true) => {
    const my   = (y1 + y2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
    path.setAttribute('stroke', 'rgba(201,168,76,0.32)');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    if (addDots) {
      [[x1, y1], [x2, y2]].forEach(([cx, cy]) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', cx); c.setAttribute('cy', cy);
        c.setAttribute('r', '2.5');
        c.setAttribute('fill', 'rgba(201,168,76,0.5)');
        svg.appendChild(c);
      });
    }
  };

  const drawLine = (x1, y1, x2, y2) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(201,168,76,0.55)');
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  };

  Object.entries(positions).forEach(([slug, pos]) => {
    (childrenMap[slug] || []).forEach(kid => {
      const kpos = positions[kid];
      if (!kpos) return;
      const px = pos.x + NODE_W / 2 + PAD;
      const py = pos.y + NODE_H      + PAD;
      const kx = kpos.x + NODE_W / 2 + PAD;
      const ky = kpos.y              + PAD;
      drawCurve(px, py, kx, ky);
    });
  });

  Object.entries(couples).forEach(([coupleId, { slugA, slugB, children }]) => {
    const posA = positions[slugA];
    const posB = positions[slugB];
    const cc   = coupleCenters[coupleId];
    if (!posA || !posB || !cc) return;

    const ax   = posA.x + NODE_W + PAD;         
    const bx   = posB.x          + PAD;        
    const midY = posA.y + NODE_H / 2 + PAD;    
    const midX = cc.cx             + PAD; 

    drawLine(ax, midY, bx, midY);

    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    heart.setAttribute('x', midX); heart.setAttribute('y', midY + 5);
    heart.setAttribute('text-anchor', 'middle');
    heart.setAttribute('font-size', '12');
    heart.setAttribute('fill', 'rgba(201,168,76,0.9)');
    heart.textContent = '♥';
    svg.appendChild(heart);

    const dropY = posA.y + NODE_H + PAD + 14;
    drawLine(midX, midY, midX, dropY);

    children.forEach(kid => {
      const kpos = positions[kid];
      if (!kpos) return;
      const kx = kpos.x + NODE_W / 2 + PAD;
      const ky = kpos.y              + PAD;
      drawCurve(midX, dropY, kx, ky, false);
    });
  });

  wrapper.appendChild(svg);

  Object.entries(positions).forEach(([slug, pos]) => {
    const data = profiles[slug];
    if (!data) return;

    const initials    = getInitials(data.name);
    const memberColor = data.color || '#C9A84C';
    const node        = document.createElement('a');
    node.href         = `/${slug}`;
    node.className    = 'tree-node';
    node.dataset.slug = slug;
    node.style.cssText = `left:${pos.x + PAD}px;top:${pos.y + PAD}px;width:${NODE_W}px;`;

    const avatarHTML = data.avatar
      ? `<img class="tree-node-avatar" src="${data.avatar}" alt="${data.name}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="tree-node-placeholder" style="display:none">${initials}</div>`
      : `<div class="tree-node-placeholder">${initials}</div>`;

    node.innerHTML = `
      <div class="tree-node-avatar-wrap">
        <div class="tree-node-ring"
             style="background:conic-gradient(${memberColor} 0deg,${memberColor}55 180deg,${memberColor} 360deg)">
        </div>
        ${avatarHTML}
      </div>
      <div class="tree-node-name">${data.name}</div>
      <div class="tree-node-rank" style="color:${memberColor}">${data.rankLabel || data.rank}</div>
    `;
    wrapper.appendChild(node);
  });

  container.appendChild(wrapper);
}
