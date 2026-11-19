// TANJUNG ARUN city generator: roads, blocks, buildings, coast, POIs.
// One job: turn a seed into a deterministic open-world map the game,
// the minimap and the full city map all draw from.

import { WORLD_W, WORLD_H, BLOCK, ROAD_W, DISTRICTS, POI_KINDS, makeRng, pick } from './config.js';

// Road centrelines: verticals at x = i*BLOCK, horizontals at y = j*BLOCK.
export const ROAD_XS = [];
export const ROAD_YS = [];
for (let x = BLOCK; x < WORLD_W; x += BLOCK) ROAD_XS.push(x);
for (let y = BLOCK; y < WORLD_H; y += BLOCK) ROAD_YS.push(y);

export function districtAt(x, y) {
  const bx = Math.floor(x / BLOCK);
  const by = Math.floor(y / BLOCK);
  for (const d of DISTRICTS) {
    if (bx >= d.x && bx < d.x + d.w && by >= d.y && by < d.y + d.h) return d;
  }
  return DISTRICTS[1];
}

export function isOnRoad(x, y, margin = ROAD_W / 2 + 6) {
  for (const rx of ROAD_XS) if (Math.abs(x - rx) < margin) return true;
  for (const ry of ROAD_YS) if (Math.abs(y - ry) < margin) return true;
  return false;
}

// The coast: the south strip (y > WORLD_H - 170) is beach + sea, and the
// west strip (x < 130) is the fishing kampung shoreline.
export function terrainAt(x, y) {
  if (y > WORLD_H - 170) return 'sea';
  if (y > WORLD_H - 250) return 'beach';
  if (x < 130 && y > WORLD_H - 900) return 'beach';
  if (x < 70) return 'sea';
  return 'land';
}

export function buildCity(seed) {
  const rng = makeRng(seed);
  const buildings = [];
  const trees = [];
  const pois = [];
  const shells = []; // collectible Kerang Badai positions

  // Buildings: 1-4 per block, inset from the roads, never on the coast.
  const cols = Math.floor(WORLD_W / BLOCK);
  const rows = Math.floor(WORLD_H / BLOCK);
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      const x0 = bx * BLOCK + ROAD_W / 2 + 14;
      const y0 = by * BLOCK + ROAD_W / 2 + 14;
      const w = BLOCK - ROAD_W - 28;
      const h = BLOCK - ROAD_W - 28;
      const cx = x0 + w / 2, cy = y0 + h / 2;
      if (terrainAt(cx, cy) !== 'land') continue;
      const d = districtAt(cx, cy);
      const n = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const bw = 46 + rng() * 90;
        const bh = 40 + rng() * 80;
        const px = x0 + rng() * Math.max(1, w - bw);
        const py = y0 + rng() * Math.max(1, h - bh);
        const tall = rng() < (d.id === 'pusat' || d.id === 'bandara' ? 0.55 : 0.16);
        buildings.push({
          x: px, y: py, w: bw, h: bh,
          color: shade(d.color, 0.55 + rng() * 0.5),
          roof: shade(d.color, 0.35 + rng() * 0.3),
          tall, floors: tall ? 4 + Math.floor(rng() * 9) : 1 + Math.floor(rng() * 2),
          district: d.id,
        });
      }
      // Palm / street trees on block corners.
      const nt = Math.floor(rng() * 4);
      for (let t = 0; t < nt; t++) {
        trees.push({ x: x0 + rng() * w, y: y0 + rng() * h, r: 5 + rng() * 4 });
      }
    }
  }

  // POIs: one of each kind, placed on roads inside sensible districts.
  const poiSpots = [
    ['H', 'kotatua', 2, 2], ['G', 'dermaga', 4, 4], ['W', 'industri', 8, 1],
    ['R', 'pasar', 4, 3], ['P', 'pusat', 5, 1], ['$', 'dermaga', 5, 5],
    ['S', 'pantai', 8, 5], ['C', 'pantai', 9, 5], ['T', 'pusat', 6, 1],
    ['F', 'dermaga', 3, 5], ['M', 'pasar', 5, 2], ['A', 'bandara', 11, 1],
    ['B', 'pantai', 7, 5], ['!', 'kotatua', 1, 3],
  ];
  for (const [icon, distId, bx, by] of poiSpots) {
    const kind = POI_KINDS.find((k) => k.icon === icon);
    const px = bx * BLOCK + BLOCK / 2 + (rng() - 0.5) * 60;
    const py = by * BLOCK + BLOCK / 2 + (rng() - 0.5) * 60;
    pois.push({ icon, label: kind.label, color: kind.color, x: px, y: py, district: distId });
  }
  // Extra $ job markers + extra collectibles near the beach.
  for (let i = 0; i < 5; i++) {
    pois.push({ icon: '$', label: 'Job / Misi', color: '#f1c40f',
      x: (2 + Math.floor(rng() * 10)) * BLOCK + 120, y: (1 + Math.floor(rng() * 8)) * BLOCK + 120, district: 'pusat' });
  }
  for (let i = 0; i < 24; i++) {
    const beach = i < 10;
    shells.push({
      x: beach ? 300 + rng() * 2800 : 200 + rng() * (WORLD_W - 400),
      y: beach ? WORLD_H - 240 + rng() * 60 : 200 + rng() * (WORLD_H - 500),
      taken: i < 7, // save starts with 7/24 collected
    });
  }
  return { buildings, trees, pois, shells, seed };
}

// AABB test against every building (cheap: early-out by block).
export function hitsBuilding(city, x, y, r = 12) {
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
export function pointInWater(x, y) { return terrainAt(x, y) === 'sea'; }

export function nearestRoadPoint(x, y) {
  let best = null, bd = 1e9;
  for (const rx of ROAD_XS) {
    const d = Math.abs(x - rx);
    if (d < bd) { bd = d; best = { x: rx, y }; }
  }
  for (const ry of ROAD_YS) {
    const d = Math.abs(y - ry);
    if (d < bd) { bd = d; best = { x, y: ry }; }
  }
  return best;
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

// Flood zone: the storm surge line that rises with the countdown.
// Everything south of floodLineY is under water when the storm lands.
export function floodLineY(stormHoursLeft) {
  // 66h left -> line at the sea edge; 0h -> line 520px inland.
  const p = 1 - Math.min(1, Math.max(0, stormHoursLeft / 66));
  return WORLD_H - 170 - p * 520;
}
// Storm cone: the hurricane track polygon over the city (for the map).
export function stormConePoints() {
  return [
    { x: WORLD_W * 0.42, y: WORLD_H + 40 },
    { x: WORLD_W * 0.30, y: WORLD_H * 0.62 },
    { x: WORLD_W * 0.52, y: WORLD_H * 0.30 },
    { x: WORLD_W * 0.72, y: -40 },
    { x: WORLD_W * 0.86, y: -40 },
    { x: WORLD_W * 0.70, y: WORLD_H * 0.34 },
    { x: WORLD_W * 0.58, y: WORLD_H * 0.66 },
    { x: WORLD_W * 0.58, y: WORLD_H + 40 },
  ];
}
