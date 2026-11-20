/* TANJUNG ARUN — BADAI ARUNIKA. Entry point.
   ?shot=1..4 renders one deterministic screenshot scene and sets
   window.__shotReady. Without ?shot the game is playable (WASD drive).
   All progression numbers live in SHOTS so every screen agrees. */
(function () {
'use strict';

window.addEventListener('error', function (e) {
  window.__shotError = String((e && (e.message || e.error)) || 'unknown error');
});

var SHOTS = {
  1: { n: 1, name: 'chase', day: 2, clock: '17:40', countdown: '4D 0H', cat: 2,
    score: 150, moneyNum: 12000000, level: 2, xp: 180, xpMax: 400,
    mission: 2, missionTotal: 8, missionName: 'ROB PERTAMA', chapter: 'CH.2 PASANG NAIK',
    next: 'Kabur ke Pelabuhan — ikuti panah kuning',
    collect: 4, collectTotal: 24, progress: 12, wanted: 3,
    district: 'KUMALA STRAND', standing: 'NEUTRAL · 58',
    cam: { pos: [-34, 11, 122], look: [50, 1, 136] } },
  2: { n: 2, name: 'combat', day: 3, clock: '14:20', countdown: '3D 6H', cat: 3,
    score: 195, moneyNum: 22750000, level: 3, xp: 250, xpMax: 400,
    mission: 3, missionTotal: 8, missionName: 'ARUNIKA MENYALA', chapter: 'CH.3 AIR NAIK',
    next: 'Selamat dari rob — capai titik tinggi di Pasar Arun',
    collect: 7, collectTotal: 24, progress: 21, wanted: 4,
    health: 78, armour: 45, weapon: 'SMG ARUN-9', ammo: '24/120',
    district: 'PASAR ARUN', standing: 'NEUTRAL · 61',
    cam: { pos: [-8, 5.5, 0], look: [-22, 1.5, 24] } },
  3: { n: 3, name: 'title', day: 2, clock: '17:40', countdown: '4D 0H', cat: 2,
    score: 150, moneyNum: 12000000, level: 2, xp: 180, xpMax: 400,
    mission: 2, missionTotal: 8, missionName: 'ROB PERTAMA', chapter: 'CH.2 PASANG NAIK',
    next: 'Kabur ke Pelabuhan — ikuti panah kuning',
    collect: 4, collectTotal: 24, progress: 12, wanted: 3,
    district: 'KUMALA STRAND', standing: 'NEUTRAL · 58',
    cam: { pos: [0, 70, -110], look: [0, 0, 110] } },
  4: { n: 4, name: 'map', day: 4, clock: '09:05', countdown: '2D 9H', cat: 4,
    score: 239, moneyNum: 38420000, level: 4, xp: 320, xpMax: 400,
    mission: 5, missionTotal: 8, missionName: 'BADAI DATANG', chapter: 'CH.4 BADAI DATANG',
    next: 'Capai dermaga sebelum CAT 5 — bawa KM Arunika keluar',
    collect: 15, collectTotal: 24, progress: 46, wanted: 3,
    district: 'PELABUHAN', standing: 'NEUTRAL · 64',
    cam: { pos: [0, 200, 190], look: [0, 0, 10], ortho: true } }
};

var params = new URLSearchParams(location.search);
var shotNum = parseInt(params.get('shot') || '0', 10);
var shot = SHOTS[shotNum] || null;

var canvas = document.getElementById('c');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

var world = TA.buildWorld(THREE);
var scene = world.scene;
var camera;

function makeCamera(s) {
  var c = s.cam;
  if (c.ortho) {
    var cam = new THREE.OrthographicCamera(-230, 230, 150, -150, 1, 600);
    cam.up.set(0, 0, -1);
    cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
    cam.lookAt(c.look[0], c.look[1], c.look[2]);
    return cam;
  }
  var pcam = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 1500);
  pcam.position.set(c.pos[0], c.pos[1], c.pos[2]);
  pcam.lookAt(c.look[0], c.look[1], c.look[2]);
  return pcam;
}

function stageShot(s) {
  camera = makeCamera(s);
  if (s.n === 4) {
    scene.fog = null;
  } else {
    scene.fog = new THREE.Fog(0xE86A92, 220, 650);
  }
  // hero shop signs face the camera AFTER the camera is placed
  if (s.n !== 4) {
    world.heroSigns.forEach(function (sign) { sign.lookAt(camera.position); });
  }
  if (s.n === 2) {
    world.heli.visible = false; // combat shot: no heli, the flood is the threat
    var ped = TA.makePed(0xE8443A); // player on foot, red shirt
    ped.position.set(-14, 0, 12); ped.rotation.y = Math.PI * 0.78;
    scene.add(ped);
    world.playerPed = ped;
    world.policeCars[0].position.set(-30, 0, 28);
    world.policeCars[0].rotation.y = Math.PI * 0.62;
    world.policeCars[1].position.set(-12, 0, 32);
    world.policeCars[1].rotation.y = Math.PI * 0.9;
  }
  if (s.n === 1) {
    world.playerCar.position.set(8, 0, 132);
    world.playerCar.rotation.y = 0;
    world.policeCars[0].position.set(-6, 0, 132.5);
    world.policeCars[0].rotation.y = 0;
    world.policeCars[1].position.set(-12, 0, 131);
    world.policeCars[1].rotation.y = 0;
    world.heli.visible = true;
  }
}

function renderOnce() {
  scene.updateMatrixWorld(true);
  renderer.render(scene, camera);
}

function projectToScreen(v3) {
  var v = v3.clone().project(camera);
  if (v.z > 1 || v.z < -1) return null;
  return { x: (v.x + 1) / 2 * 1280, y: (1 - v.y) / 2 * 720, ndcX: v.x, ndcY: v.y };
}

function shotDebug() {
  var out = { shot: shot ? shot.n : 0, items: {}, hudOverlap: [], brightness: 0, calls: 0, triangles: 0 };
  function measure(name, obj, halfW) {
    var c = projectToScreen(obj.position);
    if (!c) { out.items[name] = { visible: false }; return; }
    var right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    var pL = projectToScreen(obj.position.clone().addScaledVector(right, -halfW));
    var pR = projectToScreen(obj.position.clone().addScaledVector(right, halfW));
    var w = (pL && pR) ? Math.abs(pR.x - pL.x) : 0;
    out.items[name] = { visible: true, shown: obj.visible !== false,
      x: Math.round(c.x), y: Math.round(c.y),
      widthPx: Math.round(w), inFrame: c.x >= 0 && c.x <= 1280 && c.y >= 0 && c.y <= 720 };
  }
  world.heroSigns.forEach(function (sign, i) {
    var hw = (sign.geometry.parameters && sign.geometry.parameters.width) || 8.5;
    measure('sign' + (i + 1) + ':' + sign.userData.heroName, sign, hw / 2);
  });
  measure('ship', world.ship, 17);
  measure('heli', world.heli, 4);
  measure('playerCar', world.playerCar, 2.2);
  measure('police1', world.policeCars[0], 2.2);
  measure('police2', world.policeCars[1], 2.2);
  measure('floodMarket', { position: new THREE.Vector3(-20, 0.4, 20) }, 20);
  measure('floodRoad', { position: new THREE.Vector3(44, 0.4, 132) }, 20);
  measure('boat1', world.boats[1], 8);
  measure('boat2', world.boats[2], 11);
  measure('tugu', world.tugu, 1);
  if (world.playerPed) measure('playerPed', world.playerPed, 0.5);
  if (shot && shot.n === 4) {
    Object.keys(world.anchors).forEach(function (k) {
      measure('anchor:' + k, { position: world.anchors[k] }, 4);
    });
  }
  // hero-sign rectangles vs HUD panel rectangles
  var panelIds = ['tl', 'tc', 'tr', 'dispatch', 'dialog', 'bl', 'br', 'minimapWrap'];
  var panels = {};
  panelIds.forEach(function (id) {
    var n = document.getElementById(id);
    if (n) { var r = n.getBoundingClientRect(); panels[id] = { x: r.x, y: r.y, w: r.width, h: r.height }; }
  });
  world.heroSigns.forEach(function (sign) {
    var it = out.items['sign' + (world.heroSigns.indexOf(sign) + 1) + ':' + sign.userData.heroName];
    if (!it || !it.visible) return;
    var rect = { x: it.x - it.widthPx / 2, y: it.y - 20, w: it.widthPx, h: 40 };
    Object.keys(panels).forEach(function (id) {
      var p = panels[id];
      var ox = Math.max(0, Math.min(rect.x + rect.w, p.x + p.w) - Math.max(rect.x, p.x));
      var oy = Math.max(0, Math.min(rect.y + rect.h, p.y + p.h) - Math.max(rect.y, p.y));
      if (ox > 0 && oy > 0) out.hudOverlap.push({ sign: sign.userData.heroName, panel: id, area: Math.round(ox * oy) });
    });
  });
  // mean brightness of the rendered frame (non-blank check)
  try {
    var c2 = document.createElement('canvas'); c2.width = 160; c2.height = 90;
    var ctx = c2.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 160, 90);
    var d = ctx.getImageData(0, 0, 160, 90).data;
    var sum = 0, n = 0;
    for (var i = 0; i < d.length; i += 16) { sum += d[i] + d[i + 1] + d[i + 2]; n++; }
    out.brightness = Math.round(sum / n / 3);
  } catch (e) { out.brightness = -1; }
  out.calls = renderer.info.render.calls;
  out.triangles = renderer.info.render.triangles;
  return out;
}

function buildHudForShot(s) {
  var hud = document.getElementById('hud');
  hud.innerHTML = '';
  if (s.n === 1 || s.n === 2) {
    var minimapOpts = s.n === 1
      ? { player: { x: 8, z: 132 }, police: [{ x: -6, z: 132.5 }, { x: -12, z: 131 }], marker: { x: 100, z: 168 } }
      : { player: { x: -14, z: 12 }, police: [{ x: -30, z: 28 }, { x: -12, z: 32 }], marker: { x: 112, z: 180 } };
    TA.buildGameplayHud(hud, s, { minimap: minimapOpts });
  } else if (s.n === 3) {
    TA.buildTitle(hud, s);
  } else if (s.n === 4) {
    TA.buildMap(hud, s, function (anchorName) {
      var a = world.anchors[anchorName];
      return a ? projectToScreen(a) : null;
    });
  }
}

function boot() {
  var loading = document.getElementById('loading');
  if (loading) loading.remove();
  if (shot) {
    stageShot(shot);
    buildHudForShot(shot);
    renderOnce();
    window.__shotReady = true;
    window.__shotDebug = shotDebug;
    window.__shotInfo = { n: shot.n, name: shot.name };
  } else {
    startPlayMode();
  }
}

/* ---- playable mode: drive the red car with WASD, police follow ---- */
function startPlayMode() {
  var s = SHOTS[1];
  camera = makeCamera({ cam: { pos: [-20, 8, 124], look: [45, 2, 134] } });
  scene.fog = new THREE.Fog(0xE86A92, 220, 650);
  world.heroSigns.forEach(function (sign) { sign.lookAt(camera.position); });
  TA.buildGameplayHud(document.getElementById('hud'), s, {
    minimap: { player: { x: 8, z: 132 }, police: [{ x: -6, z: 132.5 }], marker: { x: 100, z: 168 } }
  });
  var hint = document.createElement('div');
  hint.className = 'panel small';
  hint.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%)';
  hint.textContent = 'WASD — KEMUDI · SPASI — REM · M — PETA';
  document.getElementById('hud').appendChild(hint);

  var keys = {};
  addEventListener('keydown', function (e) { keys[e.code] = true; });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  var car = world.playerCar;
  var speed = 0, heading = 0;
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (keys.KeyW) speed = Math.min(22, speed + 14 * dt);
    else if (keys.KeyS) speed = Math.max(-6, speed - 14 * dt);
    else speed *= (1 - 1.6 * dt);
    if (keys.Space) speed *= (1 - 4 * dt);
    if (Math.abs(speed) > 0.5) {
      if (keys.KeyA) heading += 1.5 * dt * Math.sign(speed);
      if (keys.KeyD) heading -= 1.5 * dt * Math.sign(speed);
    }
    car.position.x += Math.cos(heading) * speed * dt;
    car.position.z += -Math.sin(heading) * speed * dt;
    car.position.x = Math.max(-140, Math.min(140, car.position.x));
    car.position.z = Math.max(-140, Math.min(150, car.position.z));
    car.rotation.y = -heading;
    var camTarget = new THREE.Vector3(
      car.position.x - Math.cos(heading) * 13,
      7.5,
      car.position.z + Math.sin(heading) * 13);
    camera.position.lerp(camTarget, 1 - Math.pow(0.001, dt));
    camera.lookAt(car.position.x + Math.cos(heading) * 10, 1.5, car.position.z - Math.sin(heading) * 10);
    world.policeCars.forEach(function (p, i) {
      var dx = car.position.x - p.position.x, dz = car.position.z - p.position.z;
      var d = Math.hypot(dx, dz) || 1;
      if (d > 12) {
        p.position.x += dx / d * (6 + i * 2) * dt;
        p.position.z += dz / d * (6 + i * 2) * dt;
        p.rotation.y = -Math.atan2(dz, dx);
      }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__shotReady = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
})();
