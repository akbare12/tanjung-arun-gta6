// entities.js — the living city: the player on foot and in a car, traffic
// cars, pedestrians and carjacking. One job: actors and their movement.

import { makeRng, districtAt } from './city.js';
import { clamp, dist } from './config.js';

export const CAR_COLORS = ['#d43a3a', '#3a7ad4', '#e8b23a', '#e8e8e8', '#3ad47a', '#8a3ad4', '#222222', '#d47a3a'];

export function createPlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, speed: 0, onFoot: true, car: null,
    health: 100, armor: 50, cash: 38420, rep: 640, repMax: 900, level: 7,
    carsStolen: 38, copsLost: 13, playSeconds: 2 * 3600 + 3 * 60 + 40,
    completion: 46, driftScore: 0, nearMiss: 0,
  };
}

export function createTraffic(count) {
  const rng = makeRng(777);
  const cars = [];
  for (let i = 0; i < count; i++) {
    const vertical = rng() > 0.5;
    const road = 200 + Math.floor(rng() * 12) * 200;
    cars.push({
      x: vertical ? road + (rng() > 0.5 ? 8 : -8) : 100 + rng() * 2400,
      y: vertical ? 100 + rng() * 1700 : road + (rng() > 0.5 ? 8 : -8),
      angle: vertical ? (rng() > 0.5 ? Math.PI / 2 : -Math.PI / 2) : (rng() > 0.5 ? 0 : Math.PI),
      speed: 60 + rng() * 60,
      color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
      vertical,
    });
  }
  return cars;
}

export function createPedestrians(count) {
  const rng = makeRng(4242);
  const peds = [];
  const shirts = ['#e86a8a', '#6ab8e8', '#8ae86a', '#e8b23a', '#c9a0e8', '#e8e8e8'];
  for (let i = 0; i < count; i++) {
    peds.push({
      x: 60 + rng() * 2480, y: 60 + rng() * 1780,
      angle: rng() * Math.PI * 2, speed: 18 + rng() * 22,
      shirt: shirts[Math.floor(rng() * shirts.length)],
      panic: false,
    });
  }
  return peds;
}

export function updateTraffic(cars, dt, world) {
  for (const c of cars) {
    const dx = Math.cos(c.angle) * c.speed * dt;
    const dy = Math.sin(c.angle) * c.speed * dt;
    c.x += dx; c.y += dy;
    if (c.x < 20) { c.x = 20; c.angle = 0; }
    if (c.x > world.w - 20) { c.x = world.w - 20; c.angle = Math.PI; }
    if (c.y < 20) { c.y = 20; c.angle = Math.PI / 2; }
    if (c.y > world.h - 20) { c.y = world.h - 20; c.angle = -Math.PI / 2; }
  }
}

export function updatePedestrians(peds, dt, player, world) {
  for (const p of peds) {
    if (dist(p.x, p.y, player.x, player.y) < 120) p.panic = true;
    const sp = p.panic ? p.speed * 3 : p.speed;
    p.x += Math.cos(p.angle) * sp * dt;
    p.y += Math.sin(p.angle) * sp * dt;
    if (Math.random() < dt * 0.2) p.angle += (Math.random() - 0.5) * 2;
    p.x = clamp(p.x, 20, world.w - 20);
    p.y = clamp(p.y, 20, world.h - 20);
  }
}

// Driving: arcade handling with drift. Returns drift points earned this frame.
export function updatePlayer(player, keys, dt, world) {
  let driftEarned = 0;
  if (player.onFoot) {
    const sp = 170;
    let mx = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) my += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    if (mx || my) {
      const len = Math.hypot(mx, my);
      player.x += (mx / len) * sp * dt;
      player.y += (my / len) * sp * dt;
      player.angle = Math.atan2(my, mx);
    }
  } else {
    const accel = 340, maxSpeed = 520, reverse = 180;
    if (keys['KeyW'] || keys['ArrowUp']) player.speed += accel * dt;
    if (keys['KeyS'] || keys['ArrowDown']) player.speed -= accel * 0.8 * dt;
    if (keys['Space']) player.speed *= Math.pow(0.4, dt); // handbrake
    player.speed = clamp(player.speed, -reverse, maxSpeed);
    player.speed *= Math.pow(0.35, dt * 0.4); // drag
    const steer = (keys['KeyA'] || keys['ArrowLeft'] ? -1 : 0) + (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0);
    const turnRate = 2.4 * clamp(Math.abs(player.speed) / 200, 0.25, 1);
    player.angle += steer * turnRate * dt * Math.sign(player.speed || 1);
    player.x += Math.cos(player.angle) * player.speed * dt;
    player.y += Math.sin(player.angle) * player.speed * dt;
    // Drift: hard steering at speed pays cash.
    if (Math.abs(steer) === 1 && Math.abs(player.speed) > 320 && keys['Space']) {
      driftEarned = Math.floor(Math.abs(player.speed) * dt * 0.6);
      player.driftScore += driftEarned;
    }
    // Near miss: passing traffic fast and close.
    if (Math.abs(player.speed) > 300 && player.nearMissCooldown > 0) player.nearMissCooldown -= dt;
  }
  player.x = clamp(player.x, 20, world.w - 20);
  player.y = clamp(player.y, 20, world.h - 20);
  return driftEarned;
}

export function drawCar(ctx, x, y, angle, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-20, -10, 44, 24);
  ctx.fillStyle = color;
  ctx.fillRect(-20, -11, 42, 22);
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(-6, -9, 14, 18);
  ctx.fillStyle = '#ffe9a0';
  ctx.fillRect(20, -8, 3, 6); ctx.fillRect(20, 2, 3, 6);
  ctx.fillStyle = '#ff3a3a';
  ctx.fillRect(-22, -8, 3, 6); ctx.fillRect(-22, 2, 3, 6);
  ctx.restore();
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 18);
    ctx.textAlign = 'left';
  }
}

export function drawPerson(ctx, x, y, angle, shirt, name) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shirt;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(Math.cos(angle) * 4, Math.sin(angle) * 4, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (name) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - 16);
    ctx.textAlign = 'left';
  }
}

export function currentDistrictName(player) {
  return districtAt(player.x, player.y).name;
}
