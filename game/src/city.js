// city.js — builds the open world of Tanjung Arun: streets, blocks,
// buildings, parks, the port, the flood zone and every point of interest.
// One job: the city itself.

import { WORLD, DISTRICTS } from './config.js';

// Deterministic pseudo-random so the city is identical every load.
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const POIS = [
  { type: 'safehouse', name: 'SAFEHOUSE', x: 940, y: 1080, icon: 'H' },
  { type: 'garage', name: 'BENGKEL BIMO', x: 880, y: 980, icon: 'G' },
  { type: 'respray', name: 'CAT ULANG', x: 700, y: 900, icon: 'R' },
  { type: 'weapon', name: 'TOKO SENJATA', x: 1420, y: 560, icon: 'W' },
  { type: 'race', name: 'ARENA BALAP', x: 320, y: 1120, icon: 'F' },
  { type: 'hospital', name: 'RS ARUNIKA', x: 1560, y: 980, icon: '+' },
  { type: 'police', name: 'MARKAS POLISI', x: 940, y: 560, icon: 'P' },
  { type: 'shop', name: 'PASAR SENJA', x: 300, y: 560, icon: 'S' },
  { type: 'collect', name: 'KOIN ARUNIKA', x: 2050, y: 300, icon: 'C' },
  { type: 'mission', name: 'MISI: BADAI MENDEKAT', x: 1560, y: 1560, icon: '!' },
  { type: 'port', name: 'DERMAGA', x: 300, y: 200, icon: 'A' },
  { type: 'airport', name: 'BANDARA SENJA', x: 2250, y: 1120, icon: 'T' },
];

export function buildCity() {
  const rng = makeRng(20261119);
  const buildings = [];
  const roads = [];
  // Road grid every 200px.
  for (let x = 200; x < WORLD.w; x += 200) roads.push({ x1: x, y1: 0, x2: x, y2: WORLD.h, vertical: true });
  for (let y = 200; y < WORLD.h; y += 200) roads.push({ x1: 0, y1: y, x2: WORLD.w, y2: y, vertical: false });
  // Buildings inside each 200x200 block, skipping road lines.
  for (let bx = 40; bx < WORLD.w - 80; bx += 200) {
    for (let by = 40; by < WORLD.h - 80; by += 200) {
      const n = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const w = 40 + rng() * 70;
        const h = 40 + rng() * 70;
        const x = bx + rng() * (200 - w - 40);
        const y = by + rng() * (200 - h - 40);
        const tall = rng() > 0.72;
        buildings.push({
          x, y, w, h, tall,
          color: tall ? pick(rng, ['#3a4a63', '#4a3a5a', '#2f4a5a', '#5a4a3a']) : pick(rng, ['#6b5a4a', '#5a6b4a', '#7a5a5a', '#4a5a6b', '#6b6b4a']),
          roof: pick(rng, ['#8a2f2f', '#2f5a3a', '#3a5a7a', '#7a6a2f']),
        });
      }
    }
  }
  // Flood zone: the swamp district is under water.
  const flood = { x: 0, y: 1300, w: 1300, h: 600 };
  return { buildings, roads, flood };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[0];
}

export function drawCity(ctx, city, cam, timeOfDay, storm) {
  const { x: cx, y: cy, w: vw, h: vh } = cam;
  // Ground.
  ctx.fillStyle = timeOfDay === 'night' ? '#141a24' : '#2a2f28';
  ctx.fillRect(cx - 40, cy - 40, vw + 80, vh + 80);
  // District tint.
  for (const d of DISTRICTS) {
    if (d.x + d.w < cx || d.x > cx + vw || d.y + d.h < cy || d.y > cy + vh) continue;
    ctx.fillStyle = d.color;
    ctx.globalAlpha = timeOfDay === 'night' ? 0.35 : 0.55;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
  }
  // Flood zone water (storm hook, visible on the map and in the world).
  ctx.fillStyle = 'rgba(40,110,140,0.55)';
  ctx.fillRect(city.flood.x, city.flood.y, city.flood.w, city.flood.h);
  ctx.strokeStyle = '#7fd4ff';
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.strokeRect(city.flood.x + 4, city.flood.y + 4, city.flood.w - 8, city.flood.h - 8);
  ctx.setLineDash([]);
  ctx.fillStyle = '#bfeaff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('ZONA BANJIR — EVAKUASI', city.flood.x + 40, city.flood.y + 60);
  // Roads.
  ctx.strokeStyle = timeOfDay === 'night' ? '#232a36' : '#3d3d3d';
  ctx.lineWidth = 26;
  for (const r of city.roads) {
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,220,120,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 22]);
  for (const r of city.roads) {
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
  }
  ctx.setLineDash([]);
  // Buildings.
  for (const b of city.buildings) {
    if (b.x + b.w < cx || b.x > cx + vw || b.y + b.h < cy || b.y > cy + vh) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
    if (b.tall) {
      ctx.fillStyle = timeOfDay === 'night' ? '#ffd76a' : 'rgba(255,255,255,0.35)';
      for (let wy = b.y + 12; wy < b.y + b.h - 10; wy += 18) {
        for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 20) ctx.fillRect(wx, wy, 8, 10);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
  // POI markers in the world.
  for (const p of POIS) {
    if (p.x < cx || p.x > cx + vw || p.y < cy || p.y > cy + vh) continue;
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.icon, p.x, p.y + 5);
    ctx.textAlign = 'left';
  }
  // Storm cone on the sea (north edge).
  ctx.fillStyle = 'rgba(255,80,80,0.25)';
  ctx.beginPath();
  ctx.moveTo(1500, -20); ctx.lineTo(2300, -20); ctx.lineTo(2050, 420); ctx.lineTo(1750, 420);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff8a8a';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('STORM CONE — ' + storm.name + ' ' + storm.category, 1620, 40);
}
