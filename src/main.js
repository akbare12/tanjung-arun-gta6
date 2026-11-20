// TANJUNG ARUN — BADAI ARUNIKA (GTA6-01 v5)
// Open-world crime 3D low-poly. Deterministic: seeded RNG only, fixed cameras per shot.
const STATES = {
  chase: { day: 2, time: '17:40', storm: '4D 0H', cat: 2, score: 150, money: 'Rp 12.000.000', lv: 2, xp: 180, xpMax: 400, mission: '2/8', collect: '7/24', done: 18 },
  combat: { day: 3, time: '12:20', storm: '3D 5H', cat: 3, score: 195, money: 'Rp 24.750.000', lv: 3, xp: 320, xpMax: 400, mission: '4/8', collect: '11/24', done: 32, health: 82, armour: 45, weapon: 'SMG', ammo: '24/120' },
  title: { day: 2, time: '17:40', storm: '4D 0H', cat: 2, score: 150, money: 'Rp 12.000.000', lv: 2, xp: 180, xpMax: 400, mission: '2/8', collect: '7/24', done: 18 },
  map: { day: 4, time: '09:05', storm: '2D 9H', cat: 4, score: 239, money: 'Rp 38.420.000', lv: 4, xp: 260, xpMax: 400, mission: '5/8', collect: '15/24', done: 46 }
};

let renderer, scene, camera, heli, rotor, playerCar, police1, police2, civCar, peds = [];
let clock = { t: 0 };

function makeSkyTexture() {
  return canvasTex(4, 512, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, '#6B4A8F');
    grad.addColorStop(0.42, '#E86A92');
    grad.addColorStop(0.72, '#FFB36B');
    grad.addColorStop(1.0, '#FFCF8A');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  });
}

function buildSky(scene) {
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xE88A7A, 110, 300);
  // low sun disc toward -Z horizon
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(13, 32),
    new THREE.MeshBasicMaterial({ color: 0xFFD27A, fog: false })
  );
  sun.position.set(-28, 20, -195);
  sun.lookAt(0, 20, 0);
  scene.add(sun);
  // a few flat sunset clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xFFE9D6, transparent: true, opacity: 0.85, fog: false });
  const rng = makeRng(4242);
  for (let i = 0; i < 5; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(rng.range(4, 7), 8, 6), cloudMat);
      s.scale.y = 0.35;
      s.position.set(j * 6 - 6, rng.range(-0.5, 0.5), rng.range(-1, 1));
      cl.add(s);
    }
    cl.position.set(rng.range(-70, 70), rng.range(42, 62), rng.range(-150, -90));
    scene.add(cl);
  }
}

function buildWorld(scene) {
  const roadTex = makeRoadTexture();
  buildGround(scene);
  buildRoads(scene, roadTex);
  buildBuildings(scene);
  buildTrees(scene);
  buildBushes(scene);
  buildLamps(scene);
  buildBillboards(scene);
  buildFlood(scene);
}

function placeActors(scene, shot) {
  // player car: red #E8443A
  playerCar = makeCar({ body: 0xE8443A });
  police1 = makeCar({ body: 0xF2F2F2, police: true });
  police2 = makeCar({ body: 0xF2F2F2, police: true });
  civCar = makeCar({ body: 0x2E7A8E });
  heli = makeHelicopter();
  rotor = heli.getObjectByName('rotor');
  scene.add(playerCar, police1, police2, civCar, heli);
  // pedestrians: fixed sidewalk spots
  const rng = makeRng(777);
  const shirts = [0xE8A33D, 0x3E7A8E, 0xC95A5A, 0x7A9A4A, 0xE8DCC8, 0x8A6AA8];
  const spots = [
    [-8.6, -14, 0.6], [8.6, -22, -0.9], [-8.6, 12, 2.4], [8.6, 26, 1.8],
    [-8.6, -42, -1.5], [8.6, 44, 0.3], [-8.6, 30, 2.9], [8.6, -8, -2.2]
  ];
  spots.forEach(([x, z, ry], i) => {
    const p = makePedestrian({ shirt: shirts[i % shirts.length], pants: [0x2E3A55, 0x4A3520, 0x22262E][i % 3] });
    p.position.set(x, 0.14, z);
    p.rotation.y = ry;
    peds.push(p);
    scene.add(p);
  });
  // one officer crouched by the police car (combat shot)
  const officer = makePedestrian({ shirt: 0x1E3A5A, pants: 0x1E3A5A, skin: 0xC98E6B });
  officer.name = 'officer';
  officer.position.set(-3.2, 0.14, -5.2);
  officer.rotation.y = 0.8;
  officer.scale.y = 0.72;
  peds.push(officer);
  scene.add(officer);
  layoutShot(shot);
}

function layoutShot(shot) {
  // default (chase / title / map): police chase the player from behind
  playerCar.position.set(0, 0, 8);
  playerCar.rotation.y = Math.PI; // facing -Z
  police1.position.set(-2.6, 0, 16);
  police1.rotation.y = Math.PI;
  police2.position.set(3.1, 0, 22.5);
  police2.rotation.y = Math.PI;
  civCar.position.set(-11.5, 0, -6);
  civCar.rotation.y = 0.15;
  heli.position.set(2, 17.8, 6);
  heli.rotation.y = -0.4;
  if (shot === 'combat') {
    playerCar.position.set(-7, 0, 8);
    playerCar.rotation.y = Math.PI * 0.9;
    police1.position.set(-4.5, 0, -7);
    police1.rotation.y = 0.12;
    police2.position.set(6.5, 0, -13);
    police2.rotation.y = -0.35;
    heli.position.set(-6, 17.8, -2);
    heli.rotation.y = 0.5;
    // player on foot in the flooded intersection, aiming at the police car
    const hero = peds[0];
    hero.position.set(1.5, 0.07, 3);
    hero.rotation.y = Math.PI; // facing -Z toward police
    hero.scale.y = 1.12;
    // two civilians fleeing on the sidewalk
    peds[1].position.set(8.6, 0.14, 14);
    peds[1].rotation.y = 2.6;
    peds[2].position.set(-8.6, 0.14, 16);
    peds[2].rotation.y = -2.4;
  }
}

const CAMERAS = {
  chase: { pos: [11, 7.5, 30], look: [0, 1.2, 2] },
  combat: { pos: [9, 4.2, 13], look: [0, 1, -2] },
  title: { pos: [0, 26, 58], look: [0, 5, -12] },
  map: { pos: [0, 95, 24], look: [0, 0, -2] }
};

function setupCamera(shot) {
  const c = CAMERAS[shot] || CAMERAS.chase;
  camera.position.set(c.pos[0], c.pos[1], c.pos[2]);
  camera.lookAt(c.look[0], c.look[1], c.look[2]);
}

function el(id) { return document.getElementById(id); }

function buildHUD(shot) {
  const s = STATES[shot];
  el('hud-tl').innerHTML =
    '<div class="day">DAY ' + s.day + ' &middot; ' + s.time + '</div>' +
    '<div class="storm">BADAI ARUNIKA &middot; ' + s.storm + ' LAGI</div>' +
    '<span class="cat">KATEGORI ' + s.cat + '</span>';
  el('hud-tr').innerHTML =
    '<div class="score">SKOR ' + s.score + '</div>' +
    '<div class="money">' + s.money + '</div>';
  const pct = Math.round((s.xp / s.xpMax) * 100);
  el('hud-bl').innerHTML =
    '<div class="lv">LV' + s.lv + '</div>' +
    '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
    '<div class="xp">XP ' + s.xp + '/' + s.xpMax + '</div>';
  el('hud-br').innerHTML =
    '<div class="misi">MISI ' + s.mission + '</div>' +
    '<div class="kolek">KOLEKSI ' + s.collect + '</div>' +
    '<div class="done">' + s.done + '% SELESAI</div>';
  if (shot === 'combat') {
    const c = el('hud-combat');
    c.style.display = 'block';
    c.innerHTML =
      '<div class="row"><span>HEALTH ' + s.health + '</span><span>ARMOUR ' + s.armour + '</span></div>' +
      '<div class="hpbar"><div style="width:' + s.health + '%"></div></div>' +
      '<div class="ambar"><div style="width:' + s.armour + '%"></div></div>' +
      '<div class="wpn">' + s.weapon + ' &middot; ' + s.ammo + '</div>';
  }
  const pops = { chase: [['+150', 'KEJAR-KEJARAN', 58, 36, 44], ['+25', 'DRIFT', 30, 55, 30]],
                 combat: [['+45', 'TEMBAKAN TEPAT', 56, 34, 40], ['+30', 'SELAMAT DARI ROB', 24, 60, 28]] };
  (pops[shot] || []).forEach(([txt, sub, x, y, fs]) => {
    const d = document.createElement('div');
    d.className = 'popup';
    d.style.left = x + '%';
    d.style.top = y + '%';
    d.style.fontSize = fs + 'px';
    d.innerHTML = txt + '<small>' + sub + '</small>';
    el('popups').appendChild(d);
  });
  if (shot === 'title') {
    const t = el('title-ov');
    t.style.display = 'flex';
    t.innerHTML =
      '<div class="kicker">MAKE.FUN &middot; GTA6-01</div>' +
      '<h1>TANJUNG ARUN</h1>' +
      '<div class="sub">BADAI ARUNIKA &mdash; KOTA PESISIR &middot; 7 HARI MENUJU BADAI</div>' +
      '<div class="save">LANJUTKAN SAVE &mdash; <b>DAY 2 &middot; 17:40</b> &middot; BADAI <b>4D 0H</b> &middot; KAT <b>2</b><br>' +
      'SKOR <b>150</b> &middot; <b>Rp 12.000.000</b> &middot; LV<b>2</b> &middot; XP <b>180/400</b> &middot; MISI <b>2/8</b></div>' +
      '<div class="press">TEKAN ENTER UNTUK MAIN</div>';
  }
  if (shot === 'map') {
    // Hide the standard HUD panels that the map overlay duplicates,
    // otherwise they collide with the map info box (top-left) and the
    // legend (bottom-left). All S4 numbers live on in the mapbox below.
    el('hud-tl').style.display = 'none';
    el('hud-bl').style.display = 'none';
    const m = el('map-ov');
    m.style.display = 'block';
    m.innerHTML =
      '<div class="maptitle">PETA &mdash; TANJUNG ARUN</div>' +
      '<div class="mapbox"><div class="hd">DAY 4 &middot; 09:05</div>' +
      'BADAI: 2D 9H &middot; KAT 4<br>SKOR 239 &middot; Rp 38.420.000<br>' +
      'LV4 &middot; XP 260/400<br>MISI 5/8 &middot; KOLEKSI 15/24<br>SELESAI 46%</div>' +
      '<div class="dist" style="left:330px;top:190px">PELABUHAN</div>' +
      '<div class="dist" style="left:560px;top:150px">KOTA LAMA</div>' +
      '<div class="dist" style="left:900px;top:430px">PASAR ARUN</div>' +
      '<div class="dist" style="left:180px;top:520px">PANTAI ROB</div>' +
      '<div class="floodtag" style="left:600px;top:330px">BANJIR ROB</div>' +
      '<div class="floodtag" style="left:520px;top:560px">BANJIR ROB</div>' +
      '<div class="legend">LEGENDA<br><span style="color:#FFD27A">&#9679;</span> LOKASI KAMU &middot; <span style="color:#E8443A">&#9679;</span> POLISI<br>' +
      '<span style="color:#7FE3FF">&#9679;</span> BANJIR ROB &middot; <span style="color:#2FA8B5">&#9679;</span> LAUT</div>';
  }
}

function init() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot') || 'chase';
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  el('app').appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 600);
  scene.add(new THREE.HemisphereLight(0xFFD9B0, 0x4A5A6A, 1.0));
  const sun = new THREE.DirectionalLight(0xFFB36B, 1.4);
  sun.position.set(-35, 40, -70);
  scene.add(sun);
  buildSky(scene);
  buildWorld(scene);
  placeActors(scene, shot);
  setupCamera(shot);
  buildHUD(shot);
  if (params.get('shot')) {
    // deterministic shot mode: render a few frames, then signal ready
    let n = 0;
    (function frame() {
      renderer.render(scene, camera);
      if (++n < 6) requestAnimationFrame(frame);
      else window.__shotReady = true;
    })();
  } else {
    // interactive mode: slow ambient motion
    let last = performance.now();
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.t += dt;
      if (rotor) rotor.rotation.y += dt * 9;
      playerCar.position.z -= dt * 0.4;
      police1.position.z -= dt * 0.4;
      police2.position.z -= dt * 0.4;
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    })(last);
  }
}

window.addEventListener('error', (e) => {
  el('err').textContent = 'ERR: ' + e.message;
  window.__shotError = String(e.message);
});
try {
  init();
} catch (e) {
  el('err').textContent = 'ERR: ' + e.message;
  window.__shotError = String(e.message);
}
