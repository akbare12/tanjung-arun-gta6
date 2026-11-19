// TANJUNG ARUN entities: player, traffic, pedestrians, police units.
// One job: the moving things in the world and how they behave —
// driving physics, traffic flow, foot patrols, and the police response.

import { WORLD_W, WORLD_H, BLOCK, CAR_MODELS, POLICE_UNITS, makeRng, pick } from './config.js';
import { hitsBuilding, isOnRoad, nearestRoadPoint, pointInWater, terrainAt, ROAD_XS, ROAD_YS } from './city.js';

export function makePlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, speed: 0,
    onFoot: false, health: 100, armor: 0,
    car: { model: CAR_MODELS[0], color: '#e67e22', angle: -Math.PI / 2, speed: 0 },
    drifting: false, driftTime: 0, nearMissAt: 0,
  };
}

export function makeTrafficCar(rng, x, y) {
  const model = pick(rng, CAR_MODELS);
  const horizontal = rng() < 0.5;
  return {
    x, y, angle: horizontal ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
    speed: 60 + rng() * 70, model, color: model.color,
    lane: (rng() - 0.5) * 14, stopped: false,
  };
}

export function makePedestrian(rng, x, y) {
  const palette = ['#f5d76e', '#85c1e9', '#f1948a', '#a9dfbf', '#d2b4de', '#f0e6d2'];
  return {
    x, y, angle: rng() * Math.PI * 2, speed: 18 + rng() * 22,
    color: pick(rng, palette), panic: 0, walkPhase: rng() * 6,
  };
}

export function makePoliceUnit(def, x, y) {
  return {
    id: def.id, kind: def.kind, tactic: def.tactic,
    x, y, angle: 0, speed: 0, distance: 0,
    siren: true, grounded: false,
  };
}

// ---------------------------------------------------------------- driving
const ACCEL = 260, BRAKE = 420, MAX_REV = 90, DRAG = 0.6, STEER = 2.4;

export function drivePlayer(p, input, dt, city) {
  const car = p.car;
  const top = car.model.top * (1 + 0.12 * (p.engineLevel || 0));
  if (input.up) car.speed += ACCEL * dt * (car.model.accel || 1);
  if (input.down) car.speed -= (car.speed > 0 ? BRAKE : ACCEL * 0.6) * dt;
  if (!input.up && !input.down) car.speed -= Math.sign(car.speed) * DRAG * 120 * dt;
  if (input.handbrake) { car.speed *= (1 - 3.2 * dt); p.drifting = Math.abs(car.speed) > 60; }
  else p.drifting = false;
  car.speed = Math.max(-MAX_REV, Math.min(top, car.speed));
  if (Math.abs(car.speed) < 2) car.speed = 0;
  const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const dir = car.speed >= 0 ? 1 : -1;
  car.angle += steer * STEER * dt * dir * Math.min(1, Math.abs(car.speed) / 60);
  const nx = p.x + Math.cos(car.angle) * car.speed * dt;
  const ny = p.y + Math.sin(car.angle) * car.speed * dt;
  if (!hitsBuilding(city, nx, p.y, 14) && !pointInWater(nx, p.y)) p.x = nx;
  else car.speed *= 0.4;
  if (!hitsBuilding(city, p.x, ny, 14) && !pointInWater(p.x, ny)) p.y = ny;
  else car.speed *= 0.4;
  p.x = Math.max(30, Math.min(WORLD_W - 30, p.x));
  p.y = Math.max(30, Math.min(WORLD_H - 30, p.y));
  p.angle = car.angle; p.speed = car.speed;
  if (p.drifting) p.driftTime += dt; else p.driftTime = 0;
  return car.speed;
}

export function walkPlayer(p, input, dt, city) {
  const sp = 150;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    p.angle = Math.atan2(dy, dx);
    const nx = p.x + dx * sp * dt, ny = p.y + dy * sp * dt;
    if (!hitsBuilding(city, nx, p.y, 10)) p.x = nx;
    if (!hitsBuilding(city, p.x, ny, 10)) p.y = ny;
    p.speed = sp;
  } else p.speed = 0;
  p.x = Math.max(20, Math.min(WORLD_W - 20, p.x));
  p.y = Math.max(20, Math.min(WORLD_H - 20, p.y));
}

// ---------------------------------------------------------------- traffic
export function updateTraffic(traffic, dt, city, rng) {
  for (const c of traffic) {
    // Traffic follows roads: if it drifted off-road, steer back to a road.
    if (!isOnRoad(c.x, c.y, 26)) {
      const rp = nearestRoadPoint(c.x, c.y);
      const want = Math.atan2(rp.y - c.y, rp.x - c.x);
      let d = want - c.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      c.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, d));
    } else {
      // Small wander so the flow is not a perfect grid.
      c.angle += (rng() - 0.5) * 0.12 * dt;
    }
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (!hitsBuilding(city, nx, ny, 12) && !pointInWater(nx, ny)) { c.x = nx; c.y = ny; }
    else { c.angle += Math.PI / 2; }
    // Wrap around the world edges so traffic never runs out.
    if (c.x < -60) c.x = WORLD_W + 50; if (c.x > WORLD_W + 60) c.x = -50;
    if (c.y < -60) c.y = WORLD_H + 50; if (c.y > WORLD_H + 60) c.y = -50;
  }
}

export function updatePedestrians(peds, dt, city, rng, player, wanted) {
  for (const p of peds) {
    p.walkPhase += dt * 6;
    // Panic: run away from the player when wanted or the player is speeding.
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if ((wanted > 0 || Math.abs(player.speed) > 140) && d < 220) {
      p.panic = 1;
      const away = Math.atan2(p.y - player.y, p.x - player.x);
      p.angle = away;
      p.x += Math.cos(away) * 90 * dt;
      p.y += Math.sin(away) * 90 * dt;
    } else {
      p.panic = Math.max(0, p.panic - dt);
      if (rng() < 0.01) p.angle = rng() * Math.PI * 2;
      const nx = p.x + Math.cos(p.angle) * p.speed * dt;
      const ny = p.y + Math.sin(p.angle) * p.speed * dt;
      if (!hitsBuilding(city, nx, ny, 8) && !pointInWater(nx, ny) && terrainAt(nx, ny) === 'land') { p.x = nx; p.y = ny; }
      else p.angle += Math.PI / 2;
    }
  }
}

// ---------------------------------------------------------------- police
export function spawnPolice(state, rng) {
  const units = [];
  const n = Math.min(6, 1 + state.wanted); // 2-6 units by wanted level
  for (let i = 0; i < n; i++) {
    const def = POLICE_UNITS[i % POLICE_UNITS.length];
    const a = rng() * Math.PI * 2;
    const dist = 420 + rng() * 260;
    const x = state.player.x + Math.cos(a) * dist;
    const y = state.player.y + Math.sin(a) * dist;
    const u = makePoliceUnit(def, x, y);
    u.grounded = def.kind === 'heli' && state.heliGrounded;
    if (u.grounded) u.tactic = 'GROUNDED: WIND';
    units.push(u);
  }
  // The air unit is mandatory once the heat is serious: at wanted 3+
  // ELANG-1 joins (or replaces the last ground unit) so the response
  // always shows 5+ ground units AND 1 helicopter.
  if (state.wanted >= 3 && !units.some((u) => u.kind === 'heli')) {
    const def = POLICE_UNITS.find((d) => d.kind === 'heli');
    const u = makePoliceUnit(def, state.player.x + 200, state.player.y - 160);
    u.grounded = state.heliGrounded;
    if (u.grounded) u.tactic = 'GROUNDED: WIND';
    if (units.length >= 6) units.pop();
    units.push(u);
  }
  return units;
}

export function updatePolice(units, dt, player, state, city) {
  const p = player;
  for (const u of units) {
    if (u.kind === 'heli') {
      if (state.heliGrounded) { u.grounded = true; u.tactic = 'GROUNDED: WIND'; continue; }
      // Helicopter hovers off the player's shoulder with a searchlight —
      // close enough to threaten, never sitting on top of the player.
      const tx = p.x + 180, ty = p.y - 140;
      const dx = tx - u.x, dy = ty - u.y;
      const d = Math.hypot(dx, dy) || 1;
      u.x += (dx / d) * 190 * dt; u.y += (dy / d) * 190 * dt;
      u.angle = Math.atan2(dy, dx);
      // Panel distance is always to the player, not to the hover point.
      u.distance = Math.round(Math.hypot(p.x - u.x, p.y - u.y));
      continue;
    }
    const dx = p.x - u.x, dy = p.y - u.y;
    const d = Math.hypot(dx, dy) || 1;
    u.distance = Math.round(d);
    const want = Math.atan2(dy, dx);
    let diff = want - u.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const top = u.tactic === 'RAMMING' ? 250 : 215;
    u.speed = Math.min(top, u.speed + 200 * dt);
    // ROADBLOCK units park ahead of the player instead of chasing.
    if (u.tactic === 'ROADBLOCK' && d < 500) {
      const ahead = { x: p.x + Math.cos(p.angle) * 260, y: p.y + Math.sin(p.angle) * 260 };
      const bx = ahead.x - u.x, by = ahead.y - u.y;
      const bd = Math.hypot(bx, by) || 1;
      u.angle = Math.atan2(by, bx);
      u.x += (bx / bd) * u.speed * dt; u.y += (by / bd) * u.speed * dt;
    } else {
      u.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
      const nx = u.x + Math.cos(u.angle) * u.speed * dt;
      const ny = u.y + Math.sin(u.angle) * u.speed * dt;
      if (!hitsBuilding(city, nx, ny, 12)) { u.x = nx; u.y = ny; }
      else { u.angle += Math.PI / 2; u.speed *= 0.5; }
    }
    // Ram: if a police car touches the player car, shake the player.
    if (d < 34 && !p.onFoot) {
      p.speed *= 0.86;
      p.x += Math.cos(want) * 26; p.y += Math.sin(want) * 26;
    }
  }
}

// Distance helper used by HUD + police panel.
export function unitDistance(u, p) { return Math.round(Math.hypot(u.x - p.x, u.y - p.y)); }
