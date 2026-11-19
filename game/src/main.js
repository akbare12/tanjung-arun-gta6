// TANJUNG ARUN main: boot, input, the game loop, and the screen machine.
// One job: tie the city, the entities, the missions and the renderer
// together into a playable open-world crime game.

import { GAME_TITLE, MISSIONS, RADIO, ECONOMY, formatRp, makeRng, pick } from './config.js';
import { buildCity, hitsBuilding, districtAt, isOnRoad, nearestRoadPoint } from './city.js';
import { freshState, tickStorm, raiseWanted, clearWanted, saveGame, loadSave, applySave, addMoney, addRep } from './state.js';
import { makePlayer, makeTrafficCar, makePedestrian, drivePlayer, walkPlayer, updateTraffic, updatePedestrians, updatePolice, spawnPolice } from './entities.js';
import { currentMission, currentStage, advanceStage, startMission, stageSpot, AMBIENT_BARKS, missionProgressLabel } from './missions.js';
import { drawWorld } from './render.js';
import { drawTitle as drawTitleScreen, drawMapScreen as drawMap, drawChapter as drawChapterCard, drawPassed as drawMissionPassed, drawPhone as drawPhoneScreen, drawPaused as drawPause, drawGameOver as drawBusted, drawHUD as drawHud } from './render2.js';
import { ensureAudio, setEngine, setSiren, blip, gunshot, cashSound, missionPassSound, startRadio, stopRadio, radioStation } from './audio.js';
import { applyShot } from './shots.js';
import { BLOCK, WORLD_W, WORLD_H } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  canvas.width = 1280;
  canvas.height = 800;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10);

const city = buildCity(20261119);
const state = freshState();
state.camera = { x: 5 * BLOCK, y: 3 * BLOCK, zoom: 0.9 };

// Traffic + pedestrians for live play.
const rng = makeRng(20261119);
state.traffic = [];
for (let i = 0; i < 26; i++) {
  const rx = (1 + Math.floor(rng() * 13)) * BLOCK;
  const ry = (1 + Math.floor(rng() * 10)) * BLOCK;
  state.traffic.push(makeTrafficCar(rng, rx + (rng() - 0.5) * 30, ry + (rng() - 0.5) * 30));
}
state.peds = [];
for (let i = 0; i < 40; i++) {
  state.peds.push(makePedestrian(rng, 200 + rng() * (WORLD_W - 400), 200 + rng() * (WORLD_H - 500)));
}

// Restore a save if one exists (Continue on the title screen).
const saved = loadSave();
if (saved) applySave(state, saved);

state.player = makePlayer(5 * BLOCK, 3 * BLOCK + 120);
state.objective = stageSpot(state.missionIndex, state.missionStage);
state.police = [];
state.enemies = [];
state.bullets = [];

if (shotName) {
  applyShot(state, city, shotName, seed);
  document.title = `TANJUNG ARUN — shot ${shotName}`;
}

// ---------------------------------------------------------------- input
const input = { up: false, down: false, left: false, right: false, handbrake: false };
const mouse = { x: 0, y: 0, down: false };
const keys = {};

function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

window.addEventListener('keydown', (e) => {
  ensureAudio();
  keys[e.code] = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
  if (e.code === 'Space') { input.handbrake = true; if (state.screen === 'chapter' || state.screen === 'passed') state.screen = 'playing'; e.preventDefault(); }
  if (e.code === 'KeyM') state.screen = state.screen === 'map' ? 'playing' : 'map';
  if (e.code === 'KeyP') state.screen = state.screen === 'phone' ? 'playing' : 'phone';
  if (e.code === 'Escape') state.screen = state.screen === 'paused' ? 'playing' : state.screen === 'playing' ? 'paused' : state.screen;
  if (e.code === 'KeyE') toggleEnterExit();
  if (e.code === 'KeyR') respray();
  if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
    state.radioIndex = parseInt(e.code.slice(-1), 10) - 1;
    startRadio(radioStation(state.radioIndex).freq);
  }
  if (e.code === 'KeyS' && state.screen === 'paused') { saveGame(state); blip(1320, 0.12); }
  if (e.code === 'KeyQ' && state.screen === 'paused') state.screen = 'title';
  if (e.code === 'Enter' && state.screen === 'title') { state.screen = 'playing'; startRadio(radioStation(state.radioIndex).freq); }
  if (e.code === 'KeyR' && state.screen === 'gameover') restartRun();
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
  if (e.code === 'Space') input.handbrake = false;
});
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
  mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
});
canvas.addEventListener('mousedown', (e) => {
  ensureAudio();
  mouse.down = true;
  if (state.screen === 'title') { state.screen = 'playing'; startRadio(radioStation(state.radioIndex).freq); return; }
  if (state.screen === 'playing' && state.player.onFoot) shoot();
});
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function toggleEnterExit() {
  if (state.screen !== 'playing') return;
  const p = state.player;
  if (p.onFoot) {
    // Find the nearest car within 60px to steal.
    let best = null, bd = 70;
    for (const c of state.traffic) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) {
      p.onFoot = false;
      p.car = { model: best.model, color: best.color, angle: best.angle, speed: 0 };
      p.angle = best.angle;
      state.traffic = state.traffic.filter((c) => c !== best);
      state.stats.carsStolen += 1;
      raiseWanted(state, Math.max(state.wanted, 1));
      addPopup(`CAR JACKED — ${best.model.name}`, '#ffd166');
      blip(440, 0.1);
    }
  } else {
    p.onFoot = true;
    p.x += Math.cos(p.angle + Math.PI / 2) * 30;
    p.y += Math.sin(p.angle + Math.PI / 2) * 30;
    p.speed = 0;
    // Leave the car parked where it is (it becomes traffic again).
    state.traffic.push(makeTrafficCar(rng, p.x - Math.cos(p.angle) * 30, p.y - Math.sin(p.angle) * 30));
  }
}

function respray() {
  if (state.screen !== 'playing' || state.money < ECONOMY.respray) return;
  state.money -= ECONOMY.respray;
  clearWanted(state, 'respray');
  state.police = [];
  addPopup(`RESPRAY ${formatRp(ECONOMY.respray)} — WANTED CLEARED`, '#58d68d');
  cashSound();
}

function shoot() {
  const p = state.player;
  if (!p.onFoot || state.screen !== 'playing') return;
  gunshot();
  state.stats.shotsFired += 1;
  const a = Math.atan2(mouse.y - 400, mouse.x - 640);
  p.angle = a;
  state.bullets.push({ x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, ttl: 0.6 });
  raiseWanted(state, Math.max(state.wanted, 1));
}

function restartRun() {
  const s = freshState();
  Object.assign(state, s, { camera: state.camera });
  state.player = makePlayer(5 * BLOCK, 3 * BLOCK + 120);
  state.objective = stageSpot(state.missionIndex, state.missionStage);
  state.screen = 'playing';
}

function addPopup(text, color) {
  const p = state.player;
  state.popups.push({ text, x: 640 + (Math.random() - 0.5) * 120, y: 300, ttl: 1.6, color });
}

// ---------------------------------------------------------------- loop
let last = performance.now();
let barkTimer = 14;
let autoSaveTimer = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.gameTime += dt;
  if (!shotName) update(dt);
  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  const p = state.player;
  if (state.screen === 'playing') {
    // Storm + clock tick: 1 real second = 1 game minute.
    tickStorm(state, dt / 60);
    // Driving / walking.
    if (p.onFoot) walkPlayer(p, input, dt, city);
    else drivePlayer(p, input, dt, city);
    // Drift scoring.
    if (p.drifting && p.driftTime > 0.9 && state.gameTime - (p.lastDriftAt || 0) > 2) {
      p.lastDriftAt = state.gameTime;
      const bonus = 150000;
      addMoney(state, bonus);
      state.stats.drifts += 1;
      addPopup(`DRIFT x3  +${formatRp(bonus)}`, '#ffd166');
      cashSound();
    }
    // Near-miss scoring: pass a traffic car fast and close.
    for (const c of state.traffic) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (!p.onFoot && Math.abs(p.speed) > 130 && d < 52 && state.gameTime - (p.nearMissAt || 0) > 2.5) {
        p.nearMissAt = state.gameTime;
        addMoney(state, 100000);
        state.stats.nearMiss += 1;
        addPopup(`NEAR MISS  +${formatRp(100000)}`, '#58d68d');
        cashSound();
      }
    }
    // Traffic, pedestrians, police.
    updateTraffic(state.traffic, dt, city, rng);
    updatePedestrians(state.peds, dt, city, rng, p, state.wanted);
    if (state.wanted > 0) {
      if (!state.police.length) state.police = spawnPolice(state, rng);
      updatePolice(state.police, dt, p, state, city);
      setSiren(true, state.wanted);
    } else {
      state.police = [];
      setSiren(false, 0);
    }
    setEngine(p.onFoot ? 0 : Math.abs(p.speed) / 160, !p.onFoot);
    // Enemies (mission 6 on-foot combat): drift toward the player, shoot back.
    for (const e of state.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.angle = Math.atan2(dy, dx);
      if (d > 160) { e.x += (dx / d) * 60 * dt; e.y += (dy / d) * 60 * dt; }
      if (d < 420 && Math.random() < dt * 0.5) {
        state.bullets.push({ x: e.x, y: e.y, vx: (dx / d) * 420, vy: (dy / d) * 420, ttl: 0.8, foe: true });
      }
    }
    // Bullets.
    for (const b of state.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.ttl -= dt;
      if (!b.foe) {
        for (const e of state.enemies) {
          if (Math.hypot(e.x - b.x, e.y - b.y) < 14) {
            e.hp -= 34; b.ttl = 0;
            state.stats.hits += 1;
            if (e.hp <= 0) {
              addMoney(state, 250000);
              addPopup('LOOTER DOWN  +Rp 250.000', '#58d68d');
              state.enemies = state.enemies.filter((x) => x !== e);
              if (!state.enemies.length) advanceStage(state);
            }
          }
        }
      } else if (Math.hypot(p.x - b.x, p.y - b.y) < 12) {
        p.health -= 8; b.ttl = 0;
        if (p.health <= 0) state.screen = 'gameover';
      }
    }
    state.bullets = state.bullets.filter((b) => b.ttl > 0);
    // Objective reached?
    if (state.objective && Math.hypot(p.x - state.objective.x, p.y - state.objective.y) < 46) {
      const res = advanceStage(state);
      if (res === 'done') missionPassSound();
      else blip(990, 0.12);
    }
    // Collectible shells.
    for (const s of city.shells) {
      if (!s.taken && Math.hypot(p.x - s.x, p.y - s.y) < 26) {
        s.taken = true; state.shells += 1;
        addRep(state, 15);
        addPopup(`KERANG BADAI ${state.shells}/${state.shellsTotal}`, '#48c9b0');
        blip(1560, 0.1);
      }
    }
    // District title card on entering a new district.
    const d = districtAt(p.x, p.y);
    if (state.lastDistrict !== d.id) {
      state.lastDistrict = d.id;
      state.districtCard = { name: d.name, blurb: d.blurb, ttl: 2.2 };
    }
    if (state.districtCard) {
      state.districtCard.ttl -= dt;
      if (state.districtCard.ttl <= 0) state.districtCard = null;
    }
    // Ambient dialogue barks.
    barkTimer -= dt;
    if (barkTimer <= 0) {
      barkTimer = 22 + Math.random() * 18;
      if (!state.dialogue) state.dialogue = { ...pick(rng, AMBIENT_BARKS), ttl: 6 };
    }
    if (state.dialogue) {
      state.dialogue.ttl -= dt;
      if (state.dialogue.ttl <= 0) state.dialogue = null;
    }
    // Heat decays when hidden and slow.
    if (state.wanted > 0 && Math.abs(p.speed) < 20 && !state.police.some((u) => u.distance < 200)) {
      state.heat = Math.max(0, state.heat - dt * 6);
      state.wantedStatus = 'HIDDEN';
      if (state.heat <= 0) { state.wanted = 0; state.wantedStatus = 'CLEAR'; state.stats.copsLost += 1; }
    }
    // Camera follows the player.
    const cam = state.camera;
    cam.x += (p.x - cam.x) * Math.min(1, dt * 4);
    cam.y += (p.y - cam.y) * Math.min(1, dt * 4);
    // Autosave every 60s of play.
    autoSaveTimer += dt;
    if (autoSaveTimer > 60) { autoSaveTimer = 0; saveGame(state); }
    // Popups fade.
    for (const pp of state.popups) { pp.ttl -= dt * 0.6; pp.y -= dt * 14; }
    state.popups = state.popups.filter((pp) => pp.ttl > 0);
    setStatus(`${GAME_TITLE}: ${missionProgressLabel(state)} — ${state.wanted}-star wanted, Day ${state.day}, storm CAT ${state.stormCat}`);
  } else if (state.screen === 'title') {
    // Slow cinematic pan behind the title.
    state.camera.x = 1680 + Math.sin(state.gameTime * 0.05) * 500;
    state.camera.y = 1320 + Math.cos(state.gameTime * 0.04) * 300;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const s = state.screen;
  if (s === 'title') {
    drawTitleScreen(ctx, state);
  } else if (s === 'map') {
    drawMap(ctx, state, city);
  } else if (s === 'chapter') {
    drawChapterCard(ctx, state);
  } else if (s === 'passed') {
    drawWorld(ctx, state, city, state.camera);
    drawMissionPassed(ctx, state);
  } else if (s === 'phone') {
    drawWorld(ctx, state, city, state.camera);
    drawHud(ctx, state, city);
    drawPhoneScreen(ctx, state, city);
  } else if (s === 'paused') {
    drawWorld(ctx, state, city, state.camera);
    drawHud(ctx, state, city);
    drawPause(ctx, state);
  } else if (s === 'gameover') {
    drawBusted(ctx, state);
  } else {
    drawWorld(ctx, state, city, state.camera);
    drawHud(ctx, state, city);
  }
}

// Expose a tiny debug handle for the screenshot harness.
window.__tanjungArun = { state, city, version: '1.0.0' };
requestAnimationFrame(frame);
