// main.js — TANJUNG ARUN — BADAI ARUNIKA: 3D low-poly open-world crime game.
// Three.js, fully offline. Modes: ?shot=1..4 renders a staged dossier shot,
// no param starts the playable game (title -> drive / walk / missions).
import * as THREE from 'three';
import { SHOTS, MISSIONS, DISASTER_JOBS, POLICE_UNITS, WEAPONS, RADIOS, CAREER, freshState, fmtRp } from './state.js';
import { PALETTE, mat, makeSky, makeGround, makeLights, makeRoad, makeCrosswalk, makeBuilding, makePalm, makePine, makeRoundTree, makeBush, makeGrassTuft, makeStreetLamp, makeTrafficLight, makeBillboard, makeBeachUmbrella, makeFloodPuddle, makeLightning, signTexture, box } from './world.js';
import { makeCar, makeHelicopter, makeLightPool, makeTrafficCar } from './vehicles.js';
import { makePerson, makePedestrian, animateWalk, poseAim, portraitDataURL } from './people.js';
import { el, moneyPanel, stormPanel, missionPanel, policePanel, disguisePanel, weaponWheel, healthBars, dialogueBox, radioPanel, speedPanel, floatingScore, ammoCounter, crosshair, drawMinimap, drawMap, titleScreen, mapSidePanels } from './hud.js';
import { GameAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot') ? parseInt(params.get('shot'), 10) : 0;
const state = freshState();
const audio = new GameAudio();
let renderer, scene, camera, clock;
const animated = []; // {update(dt, t)}
const peds = [];

function makeRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe88a6b, 60, 220);
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 900);
}

// --- the city ---------------------------------------------------------------

function buildCity() {
  makeSky(scene);
  makeGround(scene);
  makeLights(scene, SHOT === 2);
  // main boulevard along Z + two cross streets along X (kept away from the
  // hero stretch so their edge-on planes never read as a dark band)
  const blvd = makeRoad(150, 8); scene.add(blvd);
  const cross1 = makeRoad(120, 7); cross1.rotation.y = Math.PI / 2; cross1.position.set(0, 0, 48); scene.add(cross1);
  const cross2 = makeRoad(120, 7); cross2.rotation.y = Math.PI / 2; cross2.position.set(0, 0, -46); scene.add(cross2);
  scene.add(makeCrosswalk(0, 12));
  scene.add(makeCrosswalk(0, -14));
  // buildings: west row along the boulevard (varied heights + colours, shops)
  const west = [[-10.5, -42, 10, 9, 8], [-10.5, -28, 9, 13, 8], [-10.5, -14, 11, 7, 9], [-10.5, 2, 10, 16, 8], [-10.5, 16, 9, 10, 8], [-10.5, 32, 12, 12, 9], [-10.5, 48, 10, 8, 8], [-10.5, 60, 9, 14, 8]];
  west.forEach(([x, z, w, h, d], i) => {
    const b = makeBuilding(x, z, w, h, d, i * 2 + 1, i % 2 === 0);
    b.rotation.y = Math.PI / 2; // face the road
    scene.add(b);
  });
  // east row behind the beach (farther back), plus cross-street rows
  const east = [[-30, 20, 10, 11, 9], [14, -20, 9, 9, 8], [22, 34, 10, 7, 8], [-22, -28, 11, 12, 9], [26, -40, 9, 15, 8], [-34, -28, 10, 8, 8]];
  east.forEach(([x, z, w, h, d], i) => scene.add(makeBuilding(x, z, w, h, d, i * 3 + 2, i % 3 === 0)));
  // skyline towers for the title vista (far north)
  for (let i = 0; i < 10; i++) {
    const h = 25 + ((i * 37) % 35);
    const t = makeBuilding(-70 + i * 15, 95 + (i % 3) * 12, 11, h, 11, i * 5 + 4, false);
    scene.add(t);
  }
  // palms along the boulevard, both sides; pines + round trees in corners
  for (let z = -60; z <= 62; z += 11) {
    const p1 = makePalm(1.05 + ((z * 7) % 10) / 40); p1.position.set(-5.7, 0, z); p1.rotation.y = z; scene.add(p1);
    if (z % 22 === 0) { const p2 = makePalm(1.2); p2.position.set(5.7, 0, z + 5); scene.add(p2); }
  }
  [[-20, 44], [18, -34], [-24, -44], [16, 52], [-8, 66]].forEach(([x, z], i) => {
    const t = i % 2 ? makePine(1.1) : makeRoundTree(1.2);
    t.position.set(x, 0, z); scene.add(t);
  });
  // park corners: bushes + grass tufts + benches
  const parkSpots = [[-20, 44], [18, 52], [-24, -44], [16, -36]];
  for (const [px, pz] of parkSpots) {
    for (let i = 0; i < 3; i++) {
      const b = makeBush(0.8 + i * 0.3); b.position.set(px + i * 2.2 - 2, 0, pz + (i % 2) * 1.5); scene.add(b);
      const gt = makeGrassTuft(); gt.position.set(px + i * 1.7 - 1.5, 0, pz - 2); scene.add(gt);
    }
    const bench = box(1.8, 0.1, 0.5, 0x8a5a3a); bench.position.set(px, 0.5, pz + 3); scene.add(bench);
  }
  // street lamps + traffic lights
  for (let z = -55; z <= 60; z += 12) {
    const l = makeStreetLamp(); l.position.set(-5.6, 0, z); scene.add(l);
    if (z % 24 === 0) { const l2 = makeStreetLamp(); l2.position.set(5.6, 0, z + 6); l2.rotation.y = Math.PI; scene.add(l2); }
  }
  const tl1 = makeTrafficLight(); tl1.position.set(5.2, 0, 44); scene.add(tl1); // z=44, not 18: at z=18 its housing sat exactly in front of the SUNSET BAY CLUB billboard and hid "ET"
  const tl2 = makeTrafficLight(); tl2.position.set(-5.2, 0, 22); tl2.rotation.y = Math.PI; scene.add(tl2);
  // billboards
  const bb1 = makeBillboard('SUNSET BAY CLUB', 9.5, 34, Math.PI); scene.add(bb1);
  const bb2 = makeBillboard('BOLT BURGER', -9.5, -34, 0); scene.add(bb2);
  // beach umbrellas (near + far, so the beach reads in the chase shot)
  const umbColors = [0xe8443a, 0xffd23f, 0x2fa8b5, 0xd94f70];
  umbColors.forEach((c, i) => {
    const u = makeBeachUmbrella(c); u.position.set(14 + i * 1.8, 0, -4 + i * 9); scene.add(u);
  });
  umbColors.forEach((c, i) => {
    const u = makeBeachUmbrella(c); u.position.set(16 + i * 2.5, 0, 30 + i * 7); scene.add(u);
  });
  // palms on the sand + a lifeguard tower so the beach is not empty
  for (const [x, z] of [[13, 6], [15, 22], [13, -14]]) {
    const p = makePalm(1.15); p.position.set(x, 0, z); scene.add(p);
  }
  const lg = new THREE.Group();
  const lgLegs = box(0.25, 3.2, 0.25, 0x8a5a3a); lgLegs.position.set(-0.8, 1.6, 0); lg.add(lgLegs);
  const lgLegs2 = lgLegs.clone(); lgLegs2.position.x = 0.8; lg.add(lgLegs2);
  const lgTop = box(2.2, 0.3, 2.2, 0xe8e8e8); lgTop.position.y = 3.3; lg.add(lgTop);
  const lgRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.8, 4), mat(0xe8443a));
  lgRoof.position.y = 4.1; lgRoof.rotation.y = Math.PI / 4; lg.add(lgRoof);
  lg.position.set(15, 0, 10); scene.add(lg);
  // ferris wheel on the pier (hero prop, far north-east)
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(7, 0.3, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf2a541, emissive: 0x664411, emissiveIntensity: 0.4 }));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const spoke = box(0.25, 13.5, 0.25, 0xe86a92); spoke.rotation.z = (i / 8) * Math.PI; wheel.add(spoke);
    const cab = box(1.2, 1.0, 1.0, [0xe8443a, 0x2fa8b5, 0xffd23f, 0xb565d8][i % 4]);
    const a = (i / 8) * Math.PI * 2; cab.position.set(Math.cos(a) * 7, Math.sin(a) * 7, 0); wheel.add(cab);
  }
  wheel.position.set(34, 9, 72); scene.add(wheel);
  // blimp in the sky
  const blimp = new THREE.Group();
  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(2.2, 7, 6, 12), new THREE.MeshStandardMaterial({ color: 0xf28c28, roughness: 0.5 }));
  capsule.rotation.z = Math.PI / 2; blimp.add(capsule);
  const fin = box(1.6, 1.4, 0.2, 0xe8443a); fin.position.set(-4, 1.2, 0); blimp.add(fin);
  const blimpSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2),
    new THREE.MeshBasicMaterial({ map: signTexture('VELMARA FM', '#1A2433', '#FFD23F'), transparent: true }));
  blimpSign.position.set(0, 0, 2.3); blimp.add(blimpSign);
  blimp.position.set(-40, 42, 60); scene.add(blimp);
  // flood puddles at road edges (banjir rob)
  const pud1 = makeFloodPuddle(2.4, 7); pud1.position.set(3.4, 0, 6); scene.add(pud1);
  const pud2 = makeFloodPuddle(2.0, 5); pud2.position.set(-3.4, 0, -4); scene.add(pud2);
  const pud3 = makeFloodPuddle(3.0, 4); pud3.position.set(3.2, 0, -18); scene.add(pud3);
  // lightning over the storm clouds (title + combat)
  if (SHOT === 2 || SHOT === 3) {
    makeLightning(scene, -60, 70, -160);
    makeLightning(scene, 30, 65, -180);
  }
}

function addPedestrians(count, area) {
  for (let i = 0; i < count; i++) {
    const p = makePedestrian();
    p.position.set(area.x + (Math.random() - 0.5) * area.w, 0.06, area.z + (Math.random() - 0.5) * area.d);
    p.rotation.y = Math.random() * Math.PI * 2;
    scene.add(p); peds.push(p);
    animated.push({ update: (dt) => animateWalk(p, dt, true) });
  }
}

function addTrafficCars() {
  const specs = [
    ['taxi', 0xffd23f, 1.8, 26, 0], ['sedan', 0x4da6ff, -1.6, 38, 0], ['van', 0x2fa8b5, 2.0, 50, 0],
    ['sedan', 0xe8e8e8, -1.8, -32, Math.PI], ['pickup', 0x3a9a5a, 1.7, -44, Math.PI],
  ];
  for (const [kind, color, x, z, ry] of specs) {
    const c = makeCar(kind, color); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c);
  }
}

// --- shot staging -------------------------------------------------------------

function stageChase() {
  camera.fov = 58; camera.updateProjectionMatrix();
  camera.position.set(0, 4.1, -11); camera.lookAt(0, 1.0, 10);
  // player car — big in frame, red, facing up the boulevard
  const player = makeCar('player', 0xe8443a); player.position.set(0, 0, 0); scene.add(player);
  // POLICE CHASE THE PLAYER: units BEHIND and FLANKING, never ahead in a line.
  // They must sit between the camera (z=-11) and the player (z=0), or
  // alongside it — never behind the camera, never in a line ahead.
  const pol1 = makeCar('police'); pol1.position.set(-3.3, 0, -4.5); pol1.rotation.y = 0.15; scene.add(pol1);
  const pol2 = makeCar('police'); pol2.position.set(3.1, 0, -5.5); pol2.rotation.y = -0.12; scene.add(pol2);
  const pol3 = makeCar('police'); pol3.position.set(3.2, 0, 2.5); pol3.rotation.y = 0.1; scene.add(pol3);
  // helicopter above-right with CORRECT spotlight cone + ground pool
  const heli = makeHelicopter(12); heli.position.set(5, 12.5, 15); heli.rotation.y = 0.4; heli.scale.setScalar(1.15); scene.add(heli);
  const pool = makeLightPool(5, 15, 5.0, 6.0); scene.add(pool);
  animated.push({ update: (dt, t) => { heli.userData.rotor.rotation.y += dt * 18; heli.position.y = 12.5 + Math.sin(t * 0.8) * 0.4; } });
  addTrafficCars();
  addPedestrians(9, { x: 0, z: 10, w: 12, d: 50 });
  // burning car ahead on the right shoulder (fire light)
  const wreck = makeCar('sedan', 0x333333); wreck.position.set(2.6, 0, 30); wreck.rotation.y = 0.5; scene.add(wreck);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff7a1a, emissiveIntensity: 2.4, transparent: true, opacity: 0.9 }));
  fire.position.set(2.6, 1.4, 30); scene.add(fire);
  const smoke = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x666666, transparent: true, opacity: 0.4 }));
  smoke.position.set(2.6, 4.2, 30); scene.add(smoke);
  const fireLight = new THREE.PointLight(0xff7a1a, 30, 25); fireLight.position.set(2.6, 2.5, 30); scene.add(fireLight);
  animated.push({ update: (dt, t) => { fire.scale.y = 1 + Math.sin(t * 9) * 0.18; fireLight.intensity = 26 + Math.sin(t * 11) * 8; } });
}

function stageCombat() {
  camera.fov = 55; camera.updateProjectionMatrix();
  // hero on foot, back to camera, big in frame
  const hero = makePerson({ shirt: 0xe8443a, weapon: true });
  hero.position.set(0, 0, 6); poseAim(hero); scene.add(hero);
  camera.position.set(0, 2.0, 1.5); camera.lookAt(0, 1.4, 16);
  // tracer line from the hero's gun toward the enemies
  const tracer = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.3, 1.5, 6.5), new THREE.Vector3(0.5, 1.3, 18)]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  scene.add(tracer);
  // enemies ahead with red markers; one down on the ground
  for (let i = 0; i < 5; i++) {
    const e = makePerson({ shirt: [0x1a2a3a, 0x3a3a3a, 0x2a4a6a][i % 3], pants: 0x1a1a1a, weapon: i % 2 === 0 });
    e.position.set(-4 + i * 2.2, 0, 16 + (i % 2) * 3); e.rotation.y = Math.PI + (Math.random() - 0.5) * 0.6;
    scene.add(e);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    marker.position.set(e.position.x, 2.35, e.position.z); marker.rotation.x = Math.PI; scene.add(marker);
    animated.push({ update: (dt, t) => { marker.position.y = 2.35 + Math.sin(t * 3 + i) * 0.08; } });
  }
  const down = makePerson({ shirt: 0x3a3a3a }); down.position.set(3.4, 0.15, 14); down.rotation.set(-Math.PI / 2, 0, 0.6); scene.add(down);
  // burning van + barricades (docks combat) — off to the right so the fire
  // reads past the hero, not hidden behind him
  const van = makeCar('van', 0x2fa8b5); van.position.set(3.8, 0, 18); van.rotation.y = -0.35; scene.add(van);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff7a1a, emissiveIntensity: 2.6, transparent: true, opacity: 0.95 }));
  fire.position.set(3.8, 1.8, 18); scene.add(fire);
  const fireLight = new THREE.PointLight(0xff7a1a, 36, 28); fireLight.position.set(3.8, 3, 18); scene.add(fireLight);
  // flood puddle at the road edge (banjir rob) — visible in this shot
  const pudC = makeFloodPuddle(2.6, 5); pudC.position.set(-3.3, 0, 12); scene.add(pudC);
  for (const [x, z, c] of [[4.5, 18, 0x3a7a4a], [5.2, 21, 0x2a5a8a], [-5.5, 19, 0xd94f70]]) {
    const crate = box(1.6, 1.2, 1.2, c); crate.position.set(x, 0.6, z); crate.rotation.y = 0.3; scene.add(crate);
  }
  const keepOut = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5),
    new THREE.MeshBasicMaterial({ map: signTexture('KEEP OUT', '#1A2433', '#FFD23F', 512, 128) }));
  keepOut.position.set(4.5, 1.35, 17.35); scene.add(keepOut);
  // market stalls with colourful awnings on both sides
  const stallCols = [0xd94f70, 0xf2a541, 0x2fa8b5, 0x3a9a5a];
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 6.8 : -6.8;
    const stall = box(2.4, 1.6, 1.6, 0x8a6a4a); stall.position.set(sx, 0.8, 12 + i * 3.4); scene.add(stall);
    const awn = box(2.8, 0.12, 2.0, stallCols[i]); awn.position.set(sx, 1.9, 12 + i * 3.4); awn.rotation.z = (i % 2 ? -1 : 1) * 0.12; scene.add(awn);
  }
  // heli overhead (small in frame) + its ground pool
  const heli = makeHelicopter(); heli.position.set(-8, 20, 24); heli.rotation.y = -0.5; heli.scale.setScalar(0.8); scene.add(heli);
  scene.add(makeLightPool(-8, 24, 3.4, 4.2));
  animated.push({ update: (dt) => { heli.userData.rotor.rotation.y += dt * 18; } });
  // pedestrians ON THE SIDEWALKS (x = ±5.8), never in the middle of the road.
  // West sidewalk (side -1) spawns clear of the BOLT BURGER shop front
  // (facade z 11.5–20.5): a pedestrian standing there hides the sign text.
  for (let i = 0; i < 6; i++) {
    const p = makePedestrian();
    const side = i % 2 === 0 ? -1 : 1;
    const pz = side < 0 ? 22 + i * 1.6 + Math.random() * 1.5 : 8 + i * 2.6 + Math.random() * 1.5;
    p.position.set(side * (5.6 + Math.random() * 0.9), 0.06, pz);
    p.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(p); peds.push(p);
    animated.push({ update: (dt) => animateWalk(p, dt, true) });
  }
  const lampLight = new THREE.PointLight(0xffe9a8, 20, 20); lampLight.position.set(-5.6, 4.2, 10); scene.add(lampLight);
}

function stageTitle() {
  camera.fov = 50; camera.updateProjectionMatrix();
  camera.position.set(0, 18, -40); camera.lookAt(0, 8, 60);
  // hero + red car on the causeway in the mid-ground
  const player = makeCar('player', 0xe8443a); player.position.set(2, 0, 6); player.rotation.y = -0.35; scene.add(player);
  const hero = makePerson({ shirt: 0xe8443a });
  hero.position.set(4.5, 0, 4); hero.rotation.y = -0.5; scene.add(hero);
  const heli = makeHelicopter(); heli.position.set(-14, 22, 30); heli.rotation.y = 0.6; heli.scale.setScalar(0.9); scene.add(heli);
  scene.add(makeLightPool(-14, 30, 3.6, 4.4));
  animated.push({ update: (dt, t) => { heli.userData.rotor.rotation.y += dt * 18; heli.position.y = 22 + Math.sin(t * 0.7) * 0.5; } });
  addPedestrians(5, { x: 0, z: 20, w: 14, d: 24 });
  addTrafficCars();
}

// --- HUD assembly per shot ----------------------------------------------------

function buildShotHud(shot) {
  const hud = document.getElementById('hud');
  const s = SHOTS[shot];
  if (shot === 1) {
    hud.append(missionPanel(1, 1, '2/3'));
    hud.append(moneyPanel(1));
    hud.append(stormPanel(1));
    const pol = policePanel(POLICE_UNITS, 'POLISI · 6 UNIT · ELANG-1 ON STATION');
    pol.style.left = '24px'; pol.style.top = '170px'; hud.append(pol);
    const dis = disguisePanel('CAR'); dis.style.right = '24px'; dis.style.top = '170px'; hud.append(dis);
    const drift = floatingScore('DRIFT x3<br><span>+Rp 150.000</span>', 'drift');
    drift.style.left = '50%'; drift.style.top = '30%'; hud.append(drift);
    const near = floatingScore('NEAR MISS<br><span>+Rp 100.000</span>', 'near');
    near.style.left = '63%'; near.style.top = '46%'; hud.append(near);
    const mm = el('div', 'hud-panel minimap-wrap'); mm.innerHTML = '<canvas id="minimap" width="160" height="160"></canvas>';
    hud.append(mm);
    drawMinimap(mm.querySelector('canvas'), { police: [{ x: 0.42, y: 0.7 }, { x: 0.58, y: 0.75 }, { x: 0.5, y: 0.85 }] });
    const dlg = dialogueBox('chase'); dlg.querySelector('img').src = portraitDataURL('SINTA', '#F2A541'); hud.append(dlg);
    hud.append(radioPanel(0));
    hud.append(speedPanel(142, 'ARUNIKA GT · SPOILER', 82));
    const crew = el('div', 'hud-panel crew-chip', 'Q · <b>SINTA: DRIFT BOOST</b> — siap!');
    crew.style.left = '24px'; crew.style.bottom = '210px'; hud.append(crew);
  } else if (shot === 2) {
    hud.append(missionPanel(2, 2, '1/3'));
    hud.append(moneyPanel(2));
    hud.append(stormPanel(2));
    hud.append(healthBars(81, 60));
    hud.append(weaponWheel(2));
    const pol = policePanel(POLICE_UNITS.slice(0, 5), 'POLISI · 5 UNIT + ELANG-1');
    pol.style.left = '24px'; pol.style.top = '300px'; hud.append(pol);
    const head = floatingScore('HEADSHOT<br><span>+Rp 75.000</span>', 'headshot');
    head.style.left = '58%'; head.style.top = '26%'; hud.append(head);
    const loot = floatingScore('LOOTER DOWN<br><span>+Rp 250.000</span>', 'loot');
    loot.style.left = '47%'; loot.style.top = '68%'; hud.append(loot);
    hud.append(ammoCounter('SMG', '30/90'));
    hud.append(crosshair());
    const mm = el('div', 'hud-panel minimap-wrap'); mm.innerHTML = '<canvas id="minimap" width="160" height="160"></canvas>';
    hud.append(mm);
    drawMinimap(mm.querySelector('canvas'), { police: [{ x: 0.35, y: 0.4 }, { x: 0.6, y: 0.55 }] });
    const dlg = dialogueBox('combat'); dlg.querySelector('img').src = portraitDataURL('ARYA', '#4DA6FF'); hud.append(dlg);
    hud.append(radioPanel(1));
  } else if (shot === 3) {
    hud.append(titleScreen(3));
  } else if (shot === 4) {
    // grid layout: left = map canvas + missions strip + legend,
    // right = money + storm + districts + career/garage, all in flow
    const mapWrap = el('div', 'map-screen');
    const leftCol = el('div', 'map-left');
    const mapCanvas = document.createElement('canvas');
    mapCanvas.id = 'citymap'; mapCanvas.width = 760; mapCanvas.height = 480;
    leftCol.append(mapCanvas);
    const bottom = el('div', 'map-bottom');
    const misStrip = el('div', 'hud-panel missions-strip');
    misStrip.innerHTML = '<div class="panel-title">STORY · 8 MISI — 5/8 SELESAI</div><div class="mis-grid">'
      + MISSIONS.map((m) => `<div class="mis-chip ${m.status.toLowerCase()}">${m.n}. ${m.name} <b>${m.status === 'DONE' ? '✓ DONE' : m.status}</b></div>`).join('')
      + '</div><div class="dis-jobs">DISASTER JOBS · '
      + DISASTER_JOBS.map((j) => `${j.name} ${fmtRp(j.pay)}`).join(' · ') + '</div>';
    bottom.append(misStrip);
    const legend = el('div', 'hud-panel map-legend',
      `<div class="panel-title">LEGENDA</div>
       <span>🏠 Safehouse</span><span>🏪 Toko</span><span>⚓ Dermaga</span><span>🔧 Garasi</span>
       <span>⛽ Nitro</span><span>🏖️ Pantai</span><span>🎣 Kampung</span>
       <span style="color:#FF5C8A">━━ Rute GPS</span><span style="color:#4A7A6A">▉ Banjir rob</span>
       <span style="color:#E86A92">△ Storm cone</span>`);
    bottom.append(legend);
    leftCol.append(bottom);
    mapWrap.append(leftCol);
    const rightCol = el('div', 'map-right');
    rightCol.append(moneyPanel(4)); rightCol.append(stormPanel(4));
    const panels = mapSidePanels(4);
    const [distPanel, careerPanel] = [...panels.children]; // snapshot: live collection re-indexes on append
    rightCol.append(distPanel); // district standing
    rightCol.append(careerPanel); // career stats + garage
    mapWrap.append(rightCol);
    hud.append(mapWrap);
    drawMap(mapCanvas, 4);
  }
}

// --- play mode -----------------------------------------------------------------

const keys = {};
let playerCar = null, playerChar = null, policeCars = [], playCamMode = 'chase';
let gameState = 'title'; // title | driving | onfoot
let speed = 0, heading = 0, wanted = 3;

function startPlay() {
  camera.fov = 60; camera.updateProjectionMatrix();
  playerCar = makeCar('player', 0xe8443a); playerCar.position.set(0, 0, -6); scene.add(playerCar);
  playerChar = makePerson({ shirt: 0xe8443a, weapon: true });
  playerChar.visible = false; playerChar.position.set(0, 0, -6); scene.add(playerChar);
  for (let i = 0; i < 3; i++) {
    const pc = makeCar('police'); pc.position.set(-3 + i * 3, 0, -22 - i * 6); scene.add(pc); policeCars.push(pc);
  }
  const heli = makeHelicopter(); heli.position.set(8, 19, 12); scene.add(heli);
  scene.add(makeLightPool(8, 12));
  animated.push({ update: (dt, t) => { heli.userData.rotor.rotation.y += dt * 18; heli.position.x = 8 + Math.sin(t * 0.3) * 4; } });
  addTrafficCars();
  addPedestrians(12, { x: 0, z: 0, w: 14, d: 90 });
  buildPlayHud();
  gameState = 'driving';
  audio.startSiren();
}

function buildPlayHud() {
  const hud = document.getElementById('hud');
  hud.innerHTML = '';
  hud.append(missionPanel(1, 1, '2/3'));
  const mp = moneyPanel(1); mp.id = 'live-money'; hud.append(mp);
  hud.append(stormPanel(1));
  const pol = policePanel(POLICE_UNITS, 'POLISI · 6 UNIT');
  pol.style.left = '24px'; pol.style.top = '300px'; hud.append(pol);
  const dis = disguisePanel('CAR'); dis.style.top = '380px'; hud.append(dis);
  hud.append(weaponWheel(1));
  hud.append(healthBars(95, 60));
  const mm = el('div', 'hud-panel minimap-wrap'); mm.innerHTML = '<canvas id="minimap" width="160" height="160"></canvas>';
  hud.append(mm);
  drawMinimap(mm.querySelector('canvas'), { police: [{ x: 0.42, y: 0.7 }, { x: 0.58, y: 0.75 }, { x: 0.5, y: 0.85 }] });
  const dlg = dialogueBox('chase'); dlg.querySelector('img').src = portraitDataURL('SINTA', '#F2A541'); hud.append(dlg);
  hud.append(radioPanel(0));
  const sp = speedPanel(0, 'ARUNIKA GT', 82); sp.id = 'live-speed'; hud.append(sp);
  const help = el('div', 'hud-panel help-panel',
    'WASD drive · E keluar/masuk mobil · SPACE tembak · Q Drift Boost · R ganti radio · M peta · ESC menu');
  hud.append(help);
  const toast = el('div', 'hud-panel toast', 'MISI 2/8: KABUR DARI PELABUHAN — lepas dari 6 unit polisi!');
  hud.append(toast);
  setTimeout(() => toast.remove(), 6000);
}

function updatePlay(dt) {
  const spEl = document.querySelector('#live-speed .speed');
  if (gameState === 'driving' && playerCar) {
    const accel = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 0.6 : 0);
    speed = Math.max(-8, Math.min(42, speed + accel * 22 * dt - speed * 0.4 * dt));
    if (Math.abs(speed) > 0.5) {
      heading += ((keys['a'] || keys['arrowleft'] ? 1 : 0) - (keys['d'] || keys['arrowright'] ? 1 : 0)) * 1.6 * dt * Math.sign(speed);
    }
    playerCar.position.x += Math.sin(heading) * speed * dt;
    playerCar.position.z += Math.cos(heading) * speed * dt;
    playerCar.position.x = Math.max(-3.2, Math.min(3.2, playerCar.position.x));
    playerCar.position.z = Math.max(-70, Math.min(70, playerCar.position.z));
    playerCar.rotation.y = heading;
    // chase camera
    const cx = playerCar.position.x - Math.sin(heading) * 8.5;
    const cz = playerCar.position.z - Math.cos(heading) * 8.5;
    camera.position.lerp(new THREE.Vector3(cx, 3.2, cz), 0.12);
    camera.lookAt(playerCar.position.x + Math.sin(heading) * 8, 1.2, playerCar.position.z + Math.cos(heading) * 8);
    if (spEl) spEl.textContent = Math.round(Math.abs(speed) * 3.4);
    audio.engine(Math.abs(speed) / 42);
    // police chase: converge on the player, keep wanted pressure
    for (const pc of policeCars) {
      const dx = playerCar.position.x - pc.position.x, dz = playerCar.position.z - pc.position.z;
      const d = Math.hypot(dx, dz) || 1;
      pc.position.x += (dx / d) * 9 * dt; pc.position.z += (dz / d) * 9 * dt;
      pc.rotation.y = Math.atan2(dx, dz);
      if (d < 3) { state.money += 0; }
    }
    // drift score when turning hard at speed
    if (Math.abs(speed) > 25 && (keys['a'] || keys['d'])) {
      state.money += Math.round(150 * dt);
      const mp = document.querySelector('#live-money .money');
      if (mp) mp.textContent = fmtRp(state.money);
    }
  } else if (gameState === 'onfoot' && playerChar) {
    const mv = new THREE.Vector3(
      (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0), 0,
      (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0));
    const moving = mv.lengthSq() > 0;
    if (moving) {
      mv.normalize();
      playerChar.position.addScaledVector(mv, 5 * dt);
      playerChar.rotation.y = Math.atan2(mv.x, mv.z);
      animateWalk(playerChar, dt, true);
    }
    camera.position.lerp(new THREE.Vector3(playerChar.position.x, 2.2, playerChar.position.z - 4.5), 0.15);
    camera.lookAt(playerChar.position.x, 1.4, playerChar.position.z + 8);
    if (keys[' ']) {
      keys[' '] = false;
      const toast = el('div', 'hud-panel toast', 'HEADSHOT +Rp 75.000');
      document.getElementById('hud').append(toast);
      setTimeout(() => toast.remove(), 1500);
      state.money += 75000; audio.beep(1200, 0.08);
    }
  }
}

// --- boot ----------------------------------------------------------------------

function boot() {
  clock = new THREE.Clock();
  if (SHOT >= 1 && SHOT <= 4) {
    makeRenderer();
    buildCity();
    if (SHOT === 1) stageChase();
    else if (SHOT === 2) stageCombat();
    else if (SHOT === 3) stageTitle();
    // shot 4 is pure 2D — no WebGL scene needed
    buildShotHud(SHOT);
    if (SHOT === 4) {
      document.querySelector('canvas')?.remove(); // renderer canvas unused
      document.getElementById('app').style.display = 'none';
    }
  } else {
    makeRenderer();
    buildCity();
    // title screen over the vista
    stageTitle();
    const hud = document.getElementById('hud');
    hud.append(titleScreen(3));
    const startHint = el('div', 'hud-panel start-hint', 'TEKAN ENTER / KLIK UNTUK MULAI — WASD nyetir · E keluar mobil · M peta');
    hud.append(startHint);
    addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        hud.innerHTML = ''; startPlay();
      } else if (e.key.toLowerCase() === 'e' && gameState !== 'title') {
        toggleOnFoot();
      } else if (e.key.toLowerCase() === 'r') {
        state.radio = (state.radio + 1) % RADIOS.length; audio.playRadioJingle(state.radio);
      } else if (e.key.toLowerCase() === 'q') {
        speed = Math.min(42, speed + 12); audio.beep(1500, 0.15);
      } else if (e.key.toLowerCase() === 'm') {
        document.getElementById('hud').innerHTML = '';
        const mapWrap = el('div', 'map-screen');
        const mc = document.createElement('canvas'); mc.width = 760; mc.height = 480; mapWrap.append(mc);
        document.getElementById('hud').append(mapWrap, mapSidePanels(4));
        drawMap(mc, 4);
        setTimeout(() => { document.getElementById('hud').innerHTML = ''; buildPlayHud(); }, 8000);
      }
    });
    addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    addEventListener('click', () => {
      if (gameState === 'title') { document.getElementById('hud').innerHTML = ''; startPlay(); }
      audio.ensure();
    });
  }

  function toggleOnFoot() {
    if (gameState === 'driving') {
      gameState = 'onfoot';
      playerChar.visible = true;
      playerChar.position.copy(playerCar.position);
      playerCar.visible = false;
      poseAim(playerChar);
    } else if (gameState === 'onfoot') {
      gameState = 'driving';
      playerChar.visible = false;
      playerCar.visible = true;
      playerCar.position.copy(playerChar.position);
    }
  }

  // main loop
  let frames = 0;
  window.__scene = scene; window.__camera = camera; window.__THREE = THREE; window.__renderer = renderer;
  // debug camera override: ?cam=x,y,z,tx,ty,tz
  if (params.has('cam')) {
    const v = params.get('cam').split(',').map(Number);
    camera.position.set(v[0], v[1], v[2]); camera.lookAt(v[3], v[4], v[5]);
  }
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    for (const a of animated) a.update(dt, t);
    if (!SHOT) updatePlay(dt);
    if (renderer && SHOT !== 4) renderer.render(scene, camera);
    frames++;
    if (frames === 3) {
      window.__shotReady = true;
      document.title = `tanjung-arun-shot-${SHOT || 'play'}-ready`;
    }
  }
  loop();
}

boot();
