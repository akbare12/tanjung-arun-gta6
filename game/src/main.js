// TANJUNG ARUN — BADAI ARUNIKA: bootstrap + game loop.
// Renderer, warm sunset lighting, fog, shot routing (?shot=chase|combat|
// title|map), keyboard driving/walking, HUD wiring, save slots.
import * as THREE from 'three';
import { SHOTS } from './state.js';
import { buildShot, tickShot } from './scenes.js';
import { renderChaseHUD, renderCombatHUD, renderTitleHUD, renderMapHUD } from './hud.js';
import { drawCityMap } from './mapview.js';
import { startRadio, engineHum } from './audio.js';

const params = new URLSearchParams(location.search);
const shotId = ['chase', 'combat', 'title', 'map'].includes(params.get('shot'))
  ? params.get('shot')
  : 'chase';
const shot = SHOTS[shotId];
const still = params.has('still'); // screenshot mode: render, then stop on a good frame

// ---- Renderer (per spec: ACES, sRGB, PCFSoft shadows, warm haze) ----
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xE88A6B, 60, 220);

// Warm sunset light: low south-west sun, pink hemisphere, dim ambient.
const sun = new THREE.DirectionalLight(0xFFB36B, 2.4);
sun.position.set(-40, 26, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xE8A0B0, 0x2A2118, 0.95));
scene.add(new THREE.AmbientLight(0x604858, 0.5));
// One heli spotlight + one fire point light at most (perf rule).
const heliLight = new THREE.PointLight(0xFFE9A8, 30, 40, 1.6);
heliLight.position.set(6, 14, 22);
scene.add(heliLight);
const fireLight = new THREE.PointLight(0xFF7A1A, 18, 18, 1.8);
fireLight.position.set(-7.5, 2, 18);
scene.add(fireLight);

const { camera, anim } = buildShot(scene, shotId);

// ---- HUD ----
const hudRoot = document.getElementById('hud');
if (shotId === 'chase') renderChaseHUD(hudRoot, shot);
else if (shotId === 'combat') renderCombatHUD(hudRoot, shot);
else if (shotId === 'title') renderTitleHUD(hudRoot, shot);
else renderMapHUD(hudRoot, shot, drawCityMap);

// ---- Input: drive (chase) / walk (combat) / menus ----
const keys = {};
addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'm' || e.key === 'M') location.search = '?shot=map';
  if (e.key === 'Escape') location.search = '?shot=title';
  if (['1', '2', '3', '4'].includes(e.key)) {
    document.querySelectorAll('.wheel-slot').forEach((s, i) => s.classList.toggle('active', i === Number(e.key) - 1));
  }
  if (e.key.toLowerCase() === 'r') startRadio();
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

let speed = shotId === 'chase' ? 41.8 : 0; // 41.8 * 3.4 ≈ 142 KM/H on the HUD
let carHeading = 0;
function drive(dt) {
  const car = anim.playerCar;
  if (!car) return;
  if (still) {
    // Screenshot mode: hold the staged speed, don't decay to zero.
    car.position.x = Math.max(-3.2, Math.min(3.2, car.position.x));
    const speedEl = document.querySelector('.speed-num');
    if (speedEl) speedEl.textContent = Math.round(Math.abs(speed) * 3.4);
    engineHum(0);
    return;
  }
  if (keys['w'] || keys['arrowup']) speed = Math.min(speed + 22 * dt, 42);
  else if (keys['s'] || keys['arrowdown']) speed = Math.max(speed - 26 * dt, -8);
  else speed *= Math.max(0, 1 - 1.6 * dt);
  if (keys['a'] || keys['arrowleft']) carHeading += 1.1 * dt * Math.sign(speed || 1);
  if (keys['d'] || keys['arrowright']) carHeading -= 1.1 * dt * Math.sign(speed || 1);
  car.rotation.y = carHeading - Math.PI / 2; // model faces +X; heading 0 = +Z
  car.position.x += Math.sin(carHeading) * speed * dt;
  car.position.z += Math.cos(carHeading) * speed * dt;
  car.position.x = Math.max(-3.2, Math.min(3.2, car.position.x));
  // Chase camera follows smoothly (lerp, never snaps).
  const target = new THREE.Vector3(
    car.position.x - Math.sin(carHeading) * 8.5,
    3.2,
    car.position.z - Math.cos(carHeading) * 8.5,
  );
  camera.position.lerp(target, 1 - Math.pow(0.001, dt));
  camera.lookAt(car.position.x + Math.sin(carHeading) * 8, 1.2, car.position.z + Math.cos(carHeading) * 8);
  const speedEl = document.querySelector('.speed-num');
  if (speedEl) speedEl.textContent = Math.round(Math.abs(speed) * 3.4);
  engineHum(Math.abs(speed) / 42);
}

function walk(dt) {
  const hero = anim.playerChar;
  if (!hero || shotId !== 'combat') return;
  let mx = 0, mz = 0;
  if (keys['w'] || keys['arrowup']) mz += 1;
  if (keys['s'] || keys['arrowdown']) mz -= 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (mx || mz) {
    hero.userData.walking = true;
    hero.position.x = Math.max(-4, Math.min(4, hero.position.x + mx * 3.2 * dt));
    hero.position.z = Math.max(-3, Math.min(30, hero.position.z + mz * 3.2 * dt));
    hero.rotation.y = Math.atan2(mx, mz);
    camera.position.set(hero.position.x, 2.0, hero.position.z - 4.5);
    camera.lookAt(hero.position.x, 1.4, hero.position.z + 10);
  }
}

// ---- Save slots (localStorage) ----
export function saveGame(slot = 1) {
  const save = {
    slot, chapter: 5, money: shot.money, day: shot.day, time: shot.time,
    missionsDone: shot.missionsDone, shells: 15, completion: 46, savedAt: new Date().toISOString(),
  };
  localStorage.setItem('tanjung-arun-save-' + slot, JSON.stringify(save));
  return save;
}
export function loadGame(slot = 1) {
  try { return JSON.parse(localStorage.getItem('tanjung-arun-save-' + slot)); } catch { return null; }
}
document.querySelector('.menu-item.active')?.addEventListener('click', () => {
  location.search = '?shot=chase';
});

// ---- Main loop ----
const clock = new THREE.Clock();
let frames = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  tickShot(anim, dt, t);
  if (shotId === 'chase') drive(dt);
  if (shotId === 'combat') walk(dt);
  renderer.render(scene, camera);
  frames++;
  if (still && frames === 45) {
    // Screenshot mode: hold a settled frame and signal readiness.
    document.title = 'READY';
    return;
  }
  requestAnimationFrame(loop);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
requestAnimationFrame(loop);

// Expose for debugging / finalist review console.
window.TANJUNG_ARUN = { shot: shotId, saveGame, loadGame, version: '3.0.0-lowpoly' };
