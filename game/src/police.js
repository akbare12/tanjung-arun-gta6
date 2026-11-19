// police.js — the wanted system: named response units with distance and
// tactics, police cars, the helicopter with its searchlight, roadblocks and
// the IN SIGHT / SEARCHING / HIDDEN chase state. One job: the police.

import { dist } from './config.js';

export const UNIT_NAMES = ['IBIS-43', 'GULL-1', 'HAWK-1', 'MERPATI-7', 'ELANG-22', 'KUNTUL-9'];
export const TACTICS = ['Pursuit', 'Ramming', 'Roadblock', 'Searchlight', 'Boxing In', 'On Foot'];

export function createWanted() {
  return {
    stars: 4,
    state: 'IN SIGHT', // IN SIGHT | SEARCHING | HIDDEN
    heat: 78, // 0-100
    units: UNIT_NAMES.map((name, i) => ({
      name,
      distance: 42 + i * 38 + Math.floor(Math.random() * 30),
      tactic: TACTICS[i % TACTICS.length],
      air: i === 2,
    })),
    heli: { x: 0, y: 0, grounded: false, groundReason: '' },
    roadblocks: [],
    loseTimer: 0,
  };
}

export function createPoliceCars(count, player) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    cars.push({
      x: player.x + Math.cos(a) * (180 + i * 60),
      y: player.y + Math.sin(a) * (180 + i * 60),
      angle: a, speed: 0, color: '#1a1a2e', label: 'POLISI',
    });
  }
  return cars;
}

export function updatePolice(police, cars, player, dt, storm) {
  // Helicopter grounded by storm wind above CAT 3.
  const wind = storm.windKmh;
  police.heli.grounded = wind >= 200;
  police.heli.groundReason = police.heli.grounded ? 'GROUNDED: WIND ' + wind + ' KM/H' : 'AIRBORNE';
  // Police cars chase the player.
  for (const c of cars) {
    const d = dist(c.x, c.y, player.x, player.y);
    const target = Math.atan2(player.y - c.y, player.x - c.x);
    let diff = target - c.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
    const want = d > 60 ? 420 : 200;
    c.speed += (want - c.speed) * dt * 1.5;
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
  }
  // Helicopter hovers above the player unless grounded.
  if (!police.heli.grounded) {
    police.heli.x = player.x + 40;
    police.heli.y = player.y - 90;
  }
  // Unit distances tick down as they close in.
  for (const u of police.units) {
    u.distance = Math.max(12, Math.round(u.distance - dt * (6 + Math.random() * 8)));
    if (u.distance < 20) u.distance = 120 + Math.floor(Math.random() * 200);
  }
  // Chase state: seen while close, searching while far.
  const nearest = Math.min(...cars.map((c) => dist(c.x, c.y, player.x, player.y)));
  if (nearest < 260) police.state = 'IN SIGHT';
  else if (nearest < 520) police.state = 'SEARCHING';
  else police.state = 'HIDDEN';
  if (police.state === 'HIDDEN') {
    police.loseTimer += dt;
    if (police.loseTimer > 8) {
      police.stars = Math.max(0, police.stars - 1);
      police.loseTimer = 0;
    }
  } else police.loseTimer = 0;
}

export function addWanted(wanted, stars) {
  wanted.stars = Math.min(5, wanted.stars + stars);
  wanted.heat = Math.min(100, wanted.heat + stars * 18);
}

export function clearWanted(wanted, stars) {
  wanted.stars = Math.max(0, wanted.stars - stars);
  wanted.heat = Math.max(0, wanted.heat - stars * 20);
  if (wanted.stars === 0) wanted.state = 'HIDDEN';
}

export function drawPoliceCar(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-20, -10, 44, 24);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(-20, -11, 42, 22);
  ctx.fillStyle = '#1a2a8a';
  ctx.fillRect(-20, -11, 42, 7);
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(-6, -9, 14, 18);
  ctx.fillStyle = '#ff3a3a';
  ctx.fillRect(0, -13, 6, 4);
  ctx.fillStyle = '#3a7ad4';
  ctx.fillRect(7, -13, 6, 4);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(c.label, c.x, c.y - 20);
  ctx.textAlign = 'left';
}

export function drawHelicopter(ctx, heli, night) {
  if (!heli || heli.grounded) return;
  ctx.save();
  ctx.translate(heli.x, heli.y);
  ctx.fillStyle = 'rgba(255,240,150,0.10)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-160, 190);
  ctx.lineTo(160, 190);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d43a3a';
  ctx.fillRect(-26, -4, 52, 8);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HELI HAWK-1', 0, -22);
  ctx.textAlign = 'left';
  ctx.restore();
}
