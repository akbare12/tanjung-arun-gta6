// TANJUNG ARUN screenshot staging: deterministic scene setups.
// One job: given ?shot=<name>, put the live game into a staged frame
// that shows a real system at work. Every shot is a real render of the
// game's own code — the scene is set, then the normal loop draws it.

import { makeRng } from './config.js';
import { makePlayer, makeTrafficCar, makePedestrian, makePoliceUnit, spawnPolice } from './entities.js';
import { POLICE_UNITS, MISSIONS } from './config.js';
import { stageSpot, startMission } from './missions.js';
import { BLOCK } from './config.js';

function baseScene(state, city) {
  // Common staged state: mission 6 active, stage 3, sunset->night variety.
  state.missionIndex = 5;
  state.missionStage = 2;
  state.missionsDone = [0, 1, 2, 3, 4];
  state.money = 38420000;
  state.rep = 640; state.repLevel = 4; state.repNext = 900;
  state.shells = 7;
  state.objective = stageSpot(5, 2);
  state.screen = 'playing';
  state.dialogue = null;
}

export function applyShot(state, city, name, seed = 1) {
  const rng = makeRng(seed * 7919 + 13);
  baseScene(state, city);
  state.gameTime = 12.5; // fixed clock so rain/light flashes are stable

  if (name === 'chase') {
    // COVER: police chase at sunset, helicopter overhead, 4 stars.
    state.day = 3; state.clockMin = 18 * 60 + 52;
    state.stormHoursLeft = 42; state.windKmh = 198; state.stormCat = 3;
    state.wanted = 4; state.heat = 82; state.wantedStatus = 'IN SIGHT';
    state.player = makePlayer(5 * BLOCK, 3 * BLOCK + 120);
    state.player.onFoot = false;
    state.player.car.color = '#e67e22';
    state.player.speed = 168; state.player.car.speed = 168;
    state.player.angle = Math.PI / 4; state.player.car.angle = Math.PI / 4;
    state.player.drifting = true; state.player.driftTime = 1.2;
    state.police = spawnPolice(state, rng);
    // Heli close overhead, two units boxing in.
    state.police[0].x = state.player.x + 260; state.police[0].y = state.player.y - 180;
    state.police[1].x = state.player.x - 220; state.police[1].y = state.player.y + 160;
    for (const u of state.police) u.distance = Math.round(Math.hypot(u.x - state.player.x, u.y - state.player.y));
    state.popups = [
      { text: 'DRIFT x3  +Rp 150.000', x: 700, y: 300, ttl: 1, color: '#ffd166' },
      { text: 'NEAR MISS  +Rp 100.000', x: 640, y: 340, ttl: 1, color: '#58d68d' },
    ];
    state.dialogue = { who: 'SINTA', line: 'Kiri! Gang pasar — heli nggak bisa ikut ke sana!', ttl: 9 };
    state.districtCard = { name: 'KOTA TUA', blurb: 'Gedung kolonial & alun-alun', ttl: 1 };
    state.camera = { x: state.player.x, y: state.player.y, zoom: 0.85 };
  } else if (name === 'combat') {
    // On-foot combat at night in the rain, mission 6, dialogue + enemies.
    state.day = 3; state.clockMin = 23 * 60 + 14;
    state.stormHoursLeft = 18; state.windKmh = 239; state.stormCat = 4;
    state.blackout = false;
    state.wanted = 2; state.heat = 44; state.wantedStatus = 'SEARCHING';
    state.player = makePlayer(2 * BLOCK, 3 * BLOCK + 60);
    state.player.onFoot = true;
    state.player.angle = Math.PI / 3;
    state.player.health = 78;
    state.enemies = [
      { name: 'GENG OMBAK-1', x: state.player.x + 190, y: state.player.y - 90, hp: 64, angle: 0 },
      { name: 'GENG OMBAK-2', x: state.player.x + 240, y: state.player.y + 60, hp: 100, angle: 0 },
      { name: 'GENG OMBAK-3', x: state.player.x + 120, y: state.player.y + 170, hp: 38, angle: 0 },
    ];
    state.bullets = [
      { x: state.player.x + 60, y: state.player.y + 18 },
      { x: state.player.x + 110, y: state.player.y + 34 },
    ];
    state.police = spawnPolice(state, rng).slice(0, 3);
    for (const u of state.police) u.distance = Math.round(Math.hypot(u.x - state.player.x, u.y - state.player.y));
    state.dialogue = { who: 'DET. ARYA', line: 'Prasetyo! Kau pikir badai ini tamengmu? Aku yang memburumu.', ttl: 9 };
    state.popups = [{ text: 'LOOTER DOWN  +Rp 250.000', x: 660, y: 280, ttl: 1, color: '#58d68d' }];
    state.camera = { x: state.player.x + 60, y: state.player.y, zoom: 0.95 };
  } else if (name === 'title') {
    state.screen = 'title';
    state.day = 3; state.clockMin = 18 * 60 + 52;
    state.stormHoursLeft = 66; state.windKmh = 198; state.stormCat = 3;
    state.player = makePlayer(5 * BLOCK, 3 * BLOCK);
  } else if (name === 'map') {
    state.screen = 'map';
    state.day = 4; state.clockMin = 9 * 60 + 5;
    state.stormHoursLeft = 30; state.windKmh = 214; state.stormCat = 4;
    state.wanted = 1; state.heat = 18; state.wantedStatus = 'HIDDEN';
    state.player = makePlayer(6 * BLOCK, 4 * BLOCK + 120);
    state.player.onFoot = false;
    state.police = spawnPolice(state, rng).slice(0, 2);
  }
  // Traffic + pedestrians around the camera for a dense frame.
  const cx = state.camera ? state.camera.x : state.player.x;
  const cy = state.camera ? state.camera.y : state.player.y;
  state.traffic = [];
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2, d = 120 + rng() * 420;
    const c = makeTrafficCar(rng, cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    state.traffic.push(c);
  }
  state.peds = [];
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2, d = 90 + rng() * 380;
    state.peds.push(makePedestrian(rng, cx + Math.cos(a) * d, cy + Math.sin(a) * d));
  }
  // Keep staged entities on roads / land so the frame reads clean.
  for (const c of state.traffic) {
    c.x = Math.round(c.x / BLOCK) * BLOCK + (rng() - 0.5) * 20;
  }
  return state;
}
