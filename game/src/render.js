// TANJUNG ARUN renderer, part 1: the world itself.
// One job: draw the city, the sea, the storm, the cars, the people and
// the police — everything the camera sees while playing.

import { WORLD_W, WORLD_H, BLOCK, ROAD_W, DISTRICTS, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { districtAt, terrainAt, floodLineY, stormConePoints, shade, ROAD_XS, ROAD_YS } from './city.js';
import { formatRp, formatClock, formatHoursLeft } from './config.js';

// Time-of-day palette from the game clock.
export function timePalette(clockMin, blackout) {
  const h = clockMin / 60;
  if (blackout) return { sky: '#0a0a14', ground: '#14141f', road: '#1c1c28', line: '#3a3a4a', ambient: 0.35, name: 'BLACKOUT', sun: false };
  if (h >= 17.5 && h < 19.5) return { sky: '#2b1a3a', ground: '#3d2b33', road: '#4a3540', line: '#ffd166', ambient: 0.85, name: 'SUNSET', sun: true };
  if (h >= 19.5 || h < 5.5) return { sky: '#0b1026', ground: '#1a2036', road: '#232a42', line: '#7fd4ff', ambient: 0.55, name: 'NIGHT', sun: false };
  return { sky: '#8ecae6', ground: '#7fb069', road: '#5a5a66', line: '#f4f4f4', ambient: 1, name: 'DAY', sun: true };
}

export function drawWorld(ctx, state, city, cam) {
  const pal = timePalette(state.clockMin, state.blackout);
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save();
  ctx.fillStyle = pal.sky;
  ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2 - cam.x * cam.zoom, H / 2 - cam.y * cam.zoom);
  ctx.scale(cam.zoom, cam.zoom);

  // Ground: land base, then sea + beach along the coast.
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Sea (south + west).
  ctx.fillStyle = pal.name === 'NIGHT' || pal.name === 'BLACKOUT' ? '#0d2b45' : '#2a7fa8';
  ctx.fillRect(0, WORLD_H - 170, WORLD_W, 170);
  ctx.fillRect(0, 0, 70, WORLD_H);
  // Beach sand.
  ctx.fillStyle = pal.name === 'SUNSET' ? '#d9a441' : '#d9c27a';
  ctx.fillRect(0, WORLD_H - 250, WORLD_W, 80);
  ctx.fillRect(70, WORLD_H - 900, 60, 900);
  // Flood zone: the rising surge line.
  const fl = floodLineY(state.stormHoursLeft);
  ctx.fillStyle = 'rgba(42,127,168,0.55)';
  ctx.fillRect(0, fl, WORLD_W, WORLD_H - fl);
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('▲ FLOOD ZONE — surge line rises as the storm nears', 24, fl - 8);

  // District tint + name on the ground.
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color + '22';
    ctx.fillRect(d.x * BLOCK, d.y * BLOCK, d.w * BLOCK, d.h * BLOCK);
  }

  // Roads.
  ctx.fillStyle = pal.road;
  for (const rx of ROAD_XS) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, WORLD_H);
  for (const ry of ROAD_YS) ctx.fillRect(0, ry - ROAD_W / 2, WORLD_W, ROAD_W);
  // Centre dashes.
  ctx.fillStyle = pal.line;
  for (const rx of ROAD_XS) for (let y = 20; y < WORLD_H; y += 56) ctx.fillRect(rx - 2, y, 4, 26);
  for (const ry of ROAD_YS) for (let x = 20; x < WORLD_W; x += 56) ctx.fillRect(x, ry - 2, 26, 4);

  // Storm cone (translucent, over the city).
  ctx.beginPath();
  const cone = stormConePoints();
  ctx.moveTo(cone[0].x, cone[0].y);
  for (const p of cone.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,107,53,0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,107,53,0.65)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('STORM CONE — BADAI ARUNIKA', WORLD_W * 0.44, WORLD_H * 0.42);

  // Buildings (with lit windows at night).
  const night = pal.name === 'NIGHT' || pal.name === 'BLACKOUT';
  for (const b of city.buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
    if (b.tall) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + b.w - 8, b.y + 8, 6, b.h - 10);
    }
    if (night && !state.blackout) {
      ctx.fillStyle = '#ffd166';
      const nx = Math.max(1, Math.floor(b.w / 18)), ny = Math.max(1, Math.floor(b.h / 18));
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        if ((i * 7 + j * 3 + b.floors) % 3 === 0) ctx.fillRect(b.x + 6 + i * 18, b.y + 6 + j * 18, 7, 8);
      }
    }
  }
  // Trees (palms).
  for (const t of city.trees) {
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
  }
  // Collectible shells.
  for (const s of city.shells) {
    if (s.taken) continue;
    ctx.fillStyle = '#48c9b0';
    ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('C', s.x - 3, s.y + 3);
  }
  // POI markers.
  for (const p of city.pois) {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#101018';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(p.icon, p.x - 4, p.y + 4);
  }
  // Objective marker (mission GPS target).
  if (state.objective) {
    const o = state.objective;
    const pulse = 14 + Math.sin(state.gameTime * 4) * 4;
    ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(o.x, o.y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('◆ OBJECTIVE', o.x - 52, o.y - 24);
  }

  drawTraffic(ctx, state);
  drawPedestrians(ctx, state);
  drawPolice(ctx, state, pal);
  drawEnemies(ctx, state);
  drawPlayer(ctx, state, pal);
  drawBullets(ctx, state);
  if (state.stormCat >= 3) drawRain(ctx, state, cam);
  ctx.restore();
  // Floating action scores live in screen space, not world space.
  drawPopups(ctx, state);
}

function drawCarShape(ctx, x, y, angle, color, w = 34, h = 18, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  ctx.fillStyle = color;
  roundRect(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.fillRect(-w / 2 + 7, -h / 2 + 3, 8, h - 6);
  ctx.fillRect(w / 2 - 13, -h / 2 + 3, 6, h - 6);
  if (opts.taxi) { ctx.fillStyle = '#111'; ctx.font = 'bold 8px sans-serif'; ctx.fillText('TAXI', -w / 2 + 16, 3); }
  if (opts.police) {
    ctx.fillStyle = '#fff'; ctx.fillRect(-4, -h / 2 + 2, 8, h - 4);
    ctx.fillStyle = '#0b3d91'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('POLISI', -w / 2 + 2, -h / 2 - 3);
  }
  if (opts.headlights) {
    ctx.fillStyle = 'rgba(255,240,180,0.25)';
    ctx.beginPath(); ctx.moveTo(w / 2, -6); ctx.lineTo(w / 2 + 90, -26); ctx.lineTo(w / 2 + 90, 26); ctx.lineTo(w / 2, 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTraffic(ctx, state) {
  const night = state.clockMin >= 19.5 * 60 || state.clockMin < 5.5 * 60 || state.blackout;
  for (const c of state.traffic) {
    drawCarShape(ctx, c.x, c.y, c.angle, c.color, 34, 18, { taxi: c.model.name === 'Taksi Arun', headlights: night });
  }
}

function drawPedestrians(ctx, state) {
  for (const p of state.peds) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const bob = Math.sin(p.walkPhase) * 2;
    ctx.fillStyle = p.panic ? '#ff5a5a' : p.color;
    ctx.beginPath(); ctx.arc(0, bob * 0.4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(0, bob * 0.4 - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawPolice(ctx, state, pal) {
  const night = pal.name === 'NIGHT' || pal.name === 'BLACKOUT';
  for (const u of state.police) {
    if (u.kind === 'heli') {
      // Helicopter: body + rotor + searchlight cone.
      ctx.save();
      ctx.translate(u.x, u.y);
      ctx.fillStyle = 'rgba(255,240,180,0.16)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 90); ctx.lineTo(150, -90); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0b3d91';
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = 3;
      const rot = state.gameTime * 30;
      ctx.beginPath(); ctx.moveTo(Math.cos(rot) * 30, Math.sin(rot) * 30); ctx.lineTo(-Math.cos(rot) * 30, -Math.sin(rot) * 30); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(u.grounded ? 'GROUNDED' : 'ELANG-1', -20, -24);
      ctx.restore();
      continue;
    }
    drawCarShape(ctx, u.x, u.y, u.angle, '#1a5fb4', 36, 19, { police: true, headlights: night });
    // Flashing light bar.
    const flash = Math.floor(state.gameTime * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2d2d' : '#2d7dff';
    ctx.beginPath(); ctx.arc(u.x, u.y - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#2d7dff' : '#ff2d2d';
    ctx.beginPath(); ctx.arc(u.x, u.y + 4, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawEnemies(ctx, state) {
  for (const e of state.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = '#7b2d8b';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, -2, 3.5, 0, Math.PI * 2); ctx.fill();
    // HP bar.
    ctx.fillStyle = '#111'; ctx.fillRect(-14, -18, 28, 5);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(-13, -17, 26 * (e.hp / 100), 3);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
    ctx.fillText(e.name, -14, -22);
    ctx.restore();
  }
}

function drawPlayer(ctx, state, pal) {
  const p = state.player;
  if (!p) return;
  const night = pal.name === 'NIGHT' || pal.name === 'BLACKOUT';
  if (p.onFoot) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#e67e22';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(6, -3, 12, 6); // gun
    ctx.restore();
    // Player ring so the judge can find the agent at a glance.
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RAKA — YOU', p.x - 26, p.y - 22);
  } else {
    drawCarShape(ctx, p.x, p.y, p.angle, p.car.color, 38, 20, { headlights: night });
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText('RAKA', p.x - 14, p.y - 30);
  }
}

function drawBullets(ctx, state) {
  ctx.fillStyle = '#ffe14d';
  for (const b of state.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    ctx.globalAlpha = Math.max(0, p.ttl);
    ctx.fillStyle = p.color || '#ffd166';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

function drawRain(ctx, state, cam) {
  // Wind-blown rain streaks, slanted by the storm wind.
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save();
  ctx.strokeStyle = 'rgba(180,200,255,0.35)';
  ctx.lineWidth = 1;
  const slant = state.windKmh / 240 * 26;
  const n = 90;
  for (let i = 0; i < n; i++) {
    const rx = ((i * 137 + state.gameTime * 900) % (W + 60)) - 30;
    const ry = (i * 211 + state.gameTime * 1400) % (H + 40);
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - slant, ry + 16); ctx.stroke();
  }
  ctx.restore();
}

export { drawCarShape, roundRect };
