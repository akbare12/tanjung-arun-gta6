// TANJUNG ARUN — BADAI ARUNIKA v8
// main.js — boot, staging kamera per shot, loop render, kontrol keyboard/mouse.
import * as THREE from 'three';
import { buildWorld, stageActors } from './world.js';
import { applyGameHUD, drawMinimap, showTitle, showMap, drawMap } from './hud.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || 'title';
const SEED = parseInt(params.get('seed') || '1337', 10);

const debug = document.getElementById('debug');
function reportError(msg) {
  debug.style.display = 'block';
  debug.textContent = `ERR: ${msg}`;
  document.title = `ERR: ${msg}`;
}
window.addEventListener('error', (e) => reportError(e.message));

const MOODS = { chase: 'sunset', combat: 'night', title: 'dusk', map: 'sunset' };
const world = buildWorld({ seed: SEED, mood: MOODS[SHOT] || 'sunset', flood: true });
const refs = stageActors(THREE, world, SHOT);
const { scene, camera } = world;
window.__dbg = { scene, camera, refs, THREE };

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(1280, 720);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

/** Kamera + HUD untuk tiap shot. */
function stageShot(shot) {
  if (shot === 'chase') {
    // di belakang mobil merah + di belakang polisi: 2 unit polisi di depan kamera,
    // mobil pemain di tengah, laut + perahu + dermaga di kanan, heli di atas jalan
    // v8 fix F2c: putar pandangan sedikit ke barat agar papan "POM MINI" masuk frame
    // v8 fix F2c r2: P "POM MINI" ternyata bukan terpotong tepi frame (x=15, di dalam
    // frame), melainkan tertutup panel dialog (#dialog y=622..710; P di y=610..640).
    // Menundukkan kamera ~2 derajat agar seluruh "POM MINI" naik ke atas panel.
    camera.position.set(96, 13, 95);
    camera.lookAt(96, -2, -30);
    applyGameHUD('chase');
    drawMinimap('chase');
  } else if (shot === 'combat') {
    // di belakang pemain jalan kaki, hujan malam, musuh di depan
    camera.position.set(3, 4.6, 27);
    camera.lookAt(-1, 1.4, -12);
    applyGameHUD('combat');
    drawMinimap('combat');
  } else if (shot === 'map') {
    camera.position.set(-40, 90, 170);
    camera.lookAt(20, 0, -10);
    showMap();
    drawMap();
  } else {
    // title: tinggi di atas kota senja, laut di kanan
    // v8 fix F2g: mundur + menunduk sedikit agar papan "KARAOKE NADA" masuk frame
    // (tetap di bawah baris menu, tidak menabraknya)
    // v8 fix F2g r2: quad teks "KARAOKE NADA" di y=668..726 (bawahnya 6px di luar
    // frame); menunduk ~2 derajat agar seluruh teks naik ke dalam frame.
    camera.position.set(-70, 52, 198);
    camera.lookAt(30, 0, -30);
    showTitle();
  }
}

stageShot(SHOT);

// render pertama sinkron — screenshot headless menangkap frame ini
renderer.render(scene, camera);
document.title = `TANJUNG ARUN v8 — ${SHOT} — OK`;

// ---- kontrol main bebas (WASD nyetir, C kamera, M peta) ----
const keys = {};
let camMode = 0;
let driving = false; // kamera staged shot dipertahankan sampai pemain benar-benar nyetir
let heading = Math.PI; // mobil menghadap -z
let speed = 0;
const playerCar = refs.playerCar;
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) driving = true;
  if (e.key.toLowerCase() === 'm') {
    const map = document.getElementById('mapscreen');
    if (map.style.display === 'block') { showMapOff(); } else { showMap(); drawMap(); }
  }
  if (e.key.toLowerCase() === 'c') camMode = (camMode + 1) % 3;
  if (e.key === 'Escape') showMapOff();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
function showMapOff() {
  document.getElementById('mapscreen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
}

// drag mouse = orbit kamera (mode bebas)
let dragging = false, lastX = 0, lastY = 0, orbitA = 0.4, orbitB = 0.35;
renderer.domElement.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  orbitA -= (e.clientX - lastX) * 0.005;
  orbitB = Math.max(0.05, Math.min(1.2, orbitB + (e.clientY - lastY) * 0.004));
  lastX = e.clientX; lastY = e.clientY;
});

// ---- loop ----
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // rotor heli berputar, sorot mengikuti jalan di depan mobil pemain
  if (refs.heli) {
    refs.heli.userData.rotor.rotation.y += dt * 14;
    const px = playerCar.position.x, pz = playerCar.position.z;
    refs.heli.position.x += (px - 32 - refs.heli.position.x) * dt * 0.4; // v8 fix F1: target ikut geser heli ke x=80
    refs.heli.position.z += (pz - 45 - refs.heli.position.z) * dt * 0.4;
  }
  if (refs.heli2) refs.heli2.userData.rotor.rotation.y += dt * 12;

  // nyetir bebas (hanya setelah pemain menekan WASD — shot staged tidak diganggu)
  const hudOn = document.getElementById('hud').style.display === 'block';
  if (driving && hudOn && playerCar) {
    if (keys['w'] || keys['arrowup']) speed = Math.min(speed + 26 * dt, 42);
    else if (keys['s'] || keys['arrowdown']) speed = Math.max(speed - 30 * dt, -12);
    else speed *= Math.max(0, 1 - 1.6 * dt);
    if (Math.abs(speed) > 0.5) {
      if (keys['a'] || keys['arrowleft']) heading += 1.7 * dt * Math.sign(speed);
      if (keys['d'] || keys['arrowright']) heading -= 1.7 * dt * Math.sign(speed);
    }
    playerCar.position.x += Math.sin(heading) * speed * dt;
    playerCar.position.z += Math.cos(heading) * speed * dt;
    playerCar.rotation.y = heading - Math.PI / 2; // forward mobil = +x lokal
    playerCar.position.x = Math.max(-150, Math.min(126, playerCar.position.x));
    playerCar.position.z = Math.max(-150, Math.min(150, playerCar.position.z));
    // kamera mengikuti dari belakang mobil
    const back = 13, up = 6.5;
    const cx = playerCar.position.x - Math.sin(heading) * back;
    const cz = playerCar.position.z - Math.cos(heading) * back;
    if (camMode === 0) {
      camera.position.set(cx, up, cz);
      camera.lookAt(playerCar.position.x + Math.sin(heading) * 14, 2, playerCar.position.z + Math.cos(heading) * 14);
    } else if (camMode === 1) {
      camera.position.set(
        playerCar.position.x + Math.sin(heading + orbitA) * 16 * Math.cos(orbitB),
        3 + 14 * Math.sin(orbitB),
        playerCar.position.z + Math.cos(heading + orbitA) * 16 * Math.cos(orbitB));
      camera.lookAt(playerCar.position.x, 2, playerCar.position.z);
    } else {
      camera.position.set(playerCar.position.x, 55, playerCar.position.z + 60);
      camera.lookAt(playerCar.position.x, 0, playerCar.position.z);
    }
    const sp = document.getElementById('speed');
    if (sp) sp.textContent = Math.round(Math.abs(speed) * 3.4);
  }

  renderer.render(scene, camera);
}
animate();
