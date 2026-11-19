// main.js — the game loop: input, camera, state machine (title / playing /
// map / chapter), shooting, carjacking, drift and near-miss scoring, saves,
// and the staged screenshot scenes (?shot=chase|combat|title|map) that put
// the real game into its best-evidence states. One job: run the game.

import { GAME_TITLE, WORLD, MISSIONS, RADIO, SAVE_KEY, clamp, dist, formatMoney } from './config.js';
import { buildCity, drawCity, districtAt } from './city.js';
import { createPlayer, createTraffic, createPedestrians, updateTraffic, updatePedestrians, updatePlayer, drawCar, drawPerson, CAR_COLORS } from './entities.js';
import { createWanted, createPoliceCars, updatePolice, addWanted, clearWanted, drawPoliceCar, drawHelicopter } from './police.js';
import { activeMission, missionObjectives, DIALOGUE } from './missions.js';
import { createStorm, drawStormRain } from './storm.js';
import { createAudio } from './audio.js';
import { drawWantedStars, drawMinimap, drawRadioWidget, drawStormBanner, drawPolicePanel, drawMissionTracker, drawStatsBar, drawHealthBar, drawDialogue, drawFloatingScores, drawDisguiseTabs } from './hud.js';
import { drawTitleScreen, drawMapScreen, drawChapterCard } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || '';

const city = buildCity();
const audio = createAudio();
const keys = {};
let state = 'title';
let timeOfDay = 'sunset';
let clockText = 'DAY 2 · 18:52';
let player = createPlayer(940, 640);
let traffic = createTraffic(26);
let peds = createPedestrians(40);
let wanted = createWanted();
let policeCars = createPoliceCars(5, player);
let storm = createStorm(2);
let mission = activeMission();
let stage = 3;
let popups = [];
let bullets = [];
let enemies = [];
let cam = { x: 0, y: 0, w: 1280, h: 800 };
let elapsed = 0;
let lastDistrict = '';
let districtCard = 0;
let score = 0;

function addPopup(text, color, wx, wy) {
  popups.push({ text, color: color || '#ffd23a', x: wx, y: wy, life: 1.4 });
}

function stageScene(name) {
  if (name === 'chase') {
    state = 'playing'; timeOfDay = 'sunset'; clockText = 'DAY 2 · 18:52';
    storm = createStorm(2);
    player = createPlayer(940, 640);
    player.onFoot = false; player.speed = 0; player.angle = 0.1; player.cash = 38420;
    wanted = createWanted(); wanted.stars = 4; wanted.state = 'IN SIGHT';
    policeCars = createPoliceCars(5, player);
    traffic = createTraffic(26);
    mission = MISSIONS[5]; stage = 3;
    popups = [];
    addPopup('DRIFT x3  +$150', '#ffd23a', player.x + 60, player.y - 130);
    addPopup('NEAR MISS  +$100', '#7de88a', player.x + 110, player.y - 90);
    addPopup('DRIFT x2  +$90', '#ffd23a', player.x - 40, player.y - 110);
  } else if (name === 'combat') {
    state = 'playing'; timeOfDay = 'night'; clockText = 'DAY 3 · 23:14';
    storm = createStorm(3);
    player = createPlayer(980, 1000);
    player.onFoot = true; player.health = 82; player.cash = 41200;
    wanted = createWanted(); wanted.stars = 3; wanted.state = 'SEARCHING';
    policeCars = createPoliceCars(3, player);
    mission = MISSIONS[5]; stage = 3;
    enemies = [
      { x: 820, y: 900, hp: 60, angle: 0, shirt: '#d43a3a', name: 'LOOTER' },
      { x: 1120, y: 880, hp: 60, angle: 0, shirt: '#d43a3a', name: 'LOOTER' },
      { x: 900, y: 1180, hp: 100, angle: 0, shirt: '#8a2f2f', name: 'BOS LOOTER' },
      { x: 1240, y: 1120, hp: 60, angle: 0, shirt: '#d43a3a', name: 'LOOTER' },
    ];
    popups = [];
    addPopup('HIT +$50', '#fff', 900, 860);
  } else if (name === 'title') {
    state = 'title'; timeOfDay = 'sunset'; clockText = 'DAY 2 · 18:52';
    storm = createStorm(2);
  } else if (name === 'map') {
    state = 'map'; timeOfDay = 'day'; clockText = 'DAY 4 · 09:40';
    storm = createStorm(4);
    player.cash = 38420 + 18500;
    player.rep = 760;
  }
  // Staged scenes must not flash a district title card over the player.
  lastDistrict = districtAt(player.x, player.y).name;
  districtCard = 0;
  // Staged floating scores must survive until the screenshot is taken.
  for (const p of popups) p.life = 6;
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    player.cash = s.cash ?? player.cash;
    player.rep = s.rep ?? player.rep;
    player.level = s.level ?? player.level;
  } catch (e) { /* fresh save */ }
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: player.cash, rep: player.rep, level: player.level,
      mission: mission.id, stage, day: storm.day,
    }));
  } catch (e) { /* storage unavailable */ }
}

function resize() {
  canvas.width = 1280;
  canvas.height = 800;
  cam.w = 1280; cam.h = 800;
}
resize();

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyM') { state = state === 'map' ? 'playing' : 'map'; audio.click(); }
  if (e.code === 'KeyN') { state = state === 'chapter' ? 'playing' : 'chapter'; audio.click(); }
  if (e.code === 'KeyR') { audio.nextStation(); }
  if (e.code === 'KeyP') { saveGame(); addPopup('GAME SAVED', '#7de88a', player.x, player.y - 40); }
  if (e.code === 'KeyE') tryEnterExitCar();
  if (e.code === 'Space' && state === 'title') { state = 'playing'; audio.click(); }
  if (e.code === 'Space' && state === 'chapter') { state = 'playing'; audio.click(); }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('mousedown', (e) => {
  if (state !== 'playing' || player.onFoot === false) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left + cam.x;
  const my = e.clientY - rect.top + cam.y;
  const a = Math.atan2(my - player.y, mx - player.x);
  bullets.push({ x: player.x, y: player.y, angle: a, speed: 900, life: 0.8 });
  audio.gunshot();
  if (wanted.stars < 2) addWanted(wanted, 1);
});

function tryEnterExitCar() {
  if (!player.onFoot) {
    player.onFoot = true;
    player.speed = 0;
    return;
  }
  let best = null, bestD = 60;
  for (const c of traffic) {
    const d = dist(c.x, c.y, player.x, player.y);
    if (d < bestD) { best = c; bestD = d; }
  }
  if (best) {
    player.onFoot = false;
    player.car = best;
    player.x = best.x; player.y = best.y; player.angle = best.angle;
    player.carsStolen += 1;
    player.cash += 50;
    addPopup('CAR STOLEN  +$50', '#7de88a', player.x, player.y - 30);
    addWanted(wanted, 1);
    audio.pickup();
  }
}

function update(dt) {
  elapsed += dt;
  if (state !== 'playing') return;
  const drift = updatePlayer(player, keys, dt, WORLD);
  if (drift > 0) {
    player.cash += drift;
    if (Math.random() < dt * 2) addPopup('DRIFT +$' + drift, '#ffd23a', player.x + 40, player.y - 50);
  }
  updateTraffic(traffic, dt, WORLD);
  updatePedestrians(peds, dt, player, WORLD);
  if (!player.onFoot) {
    for (const c of traffic) {
      if (c !== player.car && dist(c.x, c.y, player.x, player.y) < 46 && Math.abs(player.speed) > 300 && !player.nearMissCooldown) {
        player.nearMiss += 1;
        player.cash += 100;
        addPopup('NEAR MISS  +$100', '#7de88a', player.x, player.y - 60);
        player.nearMissCooldown = 2;
        audio.pickup();
      }
    }
  }
  updatePolice(wanted, policeCars, player, dt, storm);
  // Bullets vs enemies.
  for (const b of bullets) {
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;
    for (const en of enemies) {
      if (en.hp > 0 && dist(b.x, b.y, en.x, en.y) < 22) {
        en.hp -= 34; b.life = 0;
        addPopup('HIT +$50', '#fff', en.x, en.y - 24);
        player.cash += 50;
        if (en.hp <= 0) { addPopup('LOOTER DOWN  +$250', '#7de88a', en.x, en.y - 40); player.cash += 250; }
      }
    }
  }
  bullets = bullets.filter((b) => b.life > 0);
  // Enemies advance on the player.
  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const d = dist(en.x, en.y, player.x, player.y);
    if (d > 60) {
      const a = Math.atan2(player.y - en.y, player.x - en.x);
      en.x += Math.cos(a) * 70 * dt;
      en.y += Math.sin(a) * 70 * dt;
      en.angle = a;
    } else if (Math.random() < dt * 0.5) {
      player.health = Math.max(0, player.health - 4);
      addPopup('-4 HP', '#ff6a6a', player.x, player.y - 30);
    }
  }
  // Popups age.
  for (const p of popups) { p.life -= dt; p.y -= 20 * dt; }
  popups = popups.filter((p) => p.life > 0);
  // District title card (not in staged screenshot scenes).
  const d = districtAt(player.x, player.y);
  if (d.name !== lastDistrict && !SHOT) { lastDistrict = d.name; districtCard = 2.5; }
  if (districtCard > 0) districtCard -= dt;
  // Camera follows the player.
  cam.x = clamp(player.x - cam.w / 2, 0, WORLD.w - cam.w);
  cam.y = clamp(player.y - cam.h / 2, 0, WORLD.h - cam.h);
  // Mission complete: all enemies down in combat scene.
  if (SHOT === 'combat' && enemies.length && enemies.every((e) => e.hp <= 0) && state === 'playing') {
    state = 'map';
    player.cash += mission.payout;
    player.rep = Math.min(900, player.rep + 120);
    audio.missionPass();
    saveGame();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawCity(ctx, city, cam, timeOfDay, storm);
  // Traffic.
  for (const c of traffic) {
    if (c === player.car && !player.onFoot) continue;
    drawCar(ctx, c.x, c.y, c.angle, c.color);
  }
  // Pedestrians.
  for (const p of peds) {
    if (p.x < cam.x || p.x > cam.x + cam.w || p.y < cam.y || p.y > cam.y + cam.h) continue;
    drawPerson(ctx, p.x, p.y, p.angle, p.shirt);
  }
  // Enemies.
  for (const en of enemies) {
    if (en.hp <= 0) continue;
    drawPerson(ctx, en.x, en.y, en.angle, en.shirt, en.name);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(en.x - 20, en.y - 30, 40, 5);
    ctx.fillStyle = '#ff3a3a';
    ctx.fillRect(en.x - 20, en.y - 30, 40 * (en.hp / 100), 5);
  }
  // Police.
  for (const c of policeCars) drawPoliceCar(ctx, c);
  drawHelicopter(ctx, wanted.heli, timeOfDay === 'night');
  // Player.
  if (player.onFoot) drawPerson(ctx, player.x, player.y, player.angle, '#e8b23a', 'ARUN');
  else drawCar(ctx, player.x, player.y, player.angle, '#e8b23a', 'ARUN');
  // Bullets.
  ctx.fillStyle = '#ffe9a0';
  for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }
  // Mission target marker.
  const target = { x: 1560, y: 1560 };
  ctx.strokeStyle = '#ffd23a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(target.x, target.y, 26 + Math.sin(elapsed * 3) * 6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffd23a';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▼ MISSION', target.x, target.y - 34);
  ctx.textAlign = 'left';
  // Floating scores in world space.
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, p.life / 1.4);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
  // Time-of-day tint.
  if (timeOfDay === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, 'rgba(255,120,40,0.08)');
    g.addColorStop(1, 'rgba(255,80,20,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 800);
  } else if (timeOfDay === 'night') {
    ctx.fillStyle = 'rgba(8,12,30,0.35)';
    ctx.fillRect(0, 0, 1280, 800);
  }
  if (storm.windKmh >= 120) drawStormRain(ctx, 1280, 800, storm.windKmh / 300, elapsed);
}

function drawPlayingHUD() {
  drawStormBanner(ctx, 0, 0, 1280, storm);
  drawStatsBar(ctx, 16, 48, player);
  drawWantedStars(ctx, 16, 168, wanted.stars);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('WANTED — ' + wanted.state + ' · HEAT ' + wanted.heat + '%', 16, 190);
  drawHealthBar(ctx, 16, 200, player);
  drawMinimap(ctx, 1150, 175, 90, player, city, traffic, policeCars, { x: 1560, y: 1560 });
  drawRadioWidget(ctx, 700, 48, audio.station, clockText);
  drawPolicePanel(ctx, 920, 282, wanted);
  drawMissionTracker(ctx, 16, 640, mission, stage);
  drawDisguiseTabs(ctx, 400, 640, wanted);
  const d = districtAt(player.x, player.y);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('» ' + d.name + ' — ' + d.blurb.slice(0, 14), 400, 64);
  if (districtCard > 0) {
    ctx.globalAlpha = Math.min(1, districtCard);
    ctx.fillStyle = 'rgba(8,12,20,0.8)';
    ctx.fillRect(440, 300, 400, 70);
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.name, 640, 332);
    ctx.fillStyle = '#fff';
    ctx.font = '15px monospace';
    ctx.fillText(d.blurb, 640, 356);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  const dlg = SHOT === 'combat' ? DIALOGUE.combat : DIALOGUE.chase;
  drawDialogue(ctx, 400, 500, 480, dlg);
  if (SHOT === 'combat') {
    // Chapter card banner over the combat scene (story evidence).
    ctx.fillStyle = 'rgba(8,8,18,0.92)';
    ctx.fillRect(340, 120, 600, 130);
    ctx.strokeStyle = '#e8b23a';
    ctx.lineWidth = 2;
    ctx.strokeRect(340, 120, 600, 130);
    ctx.fillStyle = '#e8b23a';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHAPTER 6 OF 8', 640, 150);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('BADAI MENDEKAT', 640, 190);
    ctx.fillStyle = '#c9a0e8';
    ctx.font = 'italic 14px monospace';
    ctx.fillText('For the people of Tanjung Selatan.', 640, 216);
    ctx.fillStyle = '#ffd23a';
    ctx.font = '13px monospace';
    ctx.fillText('OBJECTIVE: Clear the looters from the shelter road — PRESS SPACE', 640, 238);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px monospace';
  ctx.fillText('WASD drive/walk · E steal car · SPACE drift · CLICK shoot · M map · R radio · P save', 16, 786);
}

function draw() {
  ctx.clearRect(0, 0, 1280, 800);
  if (state === 'title') {
    drawTitleScreen(ctx, 1280, 800, player, storm);
  } else if (state === 'map') {
    drawMapScreen(ctx, 1280, 800, player, storm, SHOT === 'map', clockText);
  } else if (state === 'chapter') {
    drawChapterCard(ctx, 1280, 800, 6, 'BADAI MENDEKAT', 'For the people of Tanjung Selatan.', 'Evacuate 12 residents before Topan Arunika lands.');
  } else {
    drawWorld();
    drawPlayingHUD();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSave();
if (SHOT) stageScene(SHOT);
else { state = 'title'; storm = createStorm(2); timeOfDay = 'sunset'; clockText = 'DAY 2 · 18:52'; }
if (SHOT === 'title') state = 'title';
document.title = GAME_TITLE + ' — ' + 'BADAI ARUNIKA';
requestAnimationFrame(loop);
