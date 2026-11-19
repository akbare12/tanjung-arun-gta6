// TANJUNG ARUN — BADAI ARUNIKA: shot staging. One city, four framings.
// Each shot places the same world (boulevard, sea, skyline) with its own
// camera, cast and props, then animates it: rotor, walkers, wheels,
// lightning, ferris wheel, blimp, fire.
import * as THREE from 'three';
import {
  buildSky, buildGround, buildBuildings, buildGreenery, buildStreetFurniture,
  makeFloodPuddle, makeFire, makeCrate,
} from './city.js';
import { makeCar, makePlayerCar, makePoliceCar, makeTaxi, makeHeli } from './vehicles.js';
import { makeCharacter, animateWalk, aimPose, makeEnemyMarker } from './characters.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHIRTS = [0xE8443A, 0xFFD23F, 0x2FA8B5, 0xB565D8, 0xF2F2F2, 0x3A9A5A, 0xF2A541, 0xD94F70];

function placePedestrians(scene, count, zMin, zMax, rng) {
  const walkers = [];
  for (let i = 0; i < count; i++) {
    const side = rng() < 0.5 ? -1 : 1;
    const p = makeCharacter({
      shirt: SHIRTS[Math.floor(rng() * SHIRTS.length)],
      scale: 0.92 + rng() * 0.18,
      hat: rng() < 0.25 ? [0xF2A541, 0x2FA8B5, 0xE8443A][Math.floor(rng() * 3)] : null,
    });
    p.position.set(side * (6.8 + rng() * 1.6), 0, zMin + rng() * (zMax - zMin));
    p.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    p.userData.walkDir = side < 0 ? 1 : -1;
    p.userData.walkSpeed = 0.5 + rng() * 0.6;
    scene.add(p);
    walkers.push(p);
  }
  return walkers;
}

function placeTraffic(scene, rng) {
  const cars = [];
  const defs = [
    { x: -2.2, z: 26, kind: 'sedan', color: 0x2FA8B5, dir: 1 },
    { x: 2.2, z: 44, kind: 'taxi', color: 0xFFD23F, dir: -1 },
    { x: -2.2, z: 62, kind: 'sedan', color: 0xF2F2F2, dir: 1 },
    { x: 2.2, z: -18, kind: 'pickup', color: 0x3A9A5A, dir: -1 },
    { x: -2.2, z: -38, kind: 'van', color: 0x2A2A33, dir: 1 },
  ];
  for (const d of defs) {
    const c = makeCar(d.color, d.kind);
    c.position.set(d.x, 0, d.z);
    // Cars are built facing +X; rotate so they face down the road (+Z / -Z).
    c.rotation.y = d.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(c);
    cars.push(c);
  }
  return cars;
}

function placePoliceChase(scene) {
  const units = [];
  const p1 = makePoliceCar(); p1.position.set(2.4, 0, 8); p1.rotation.y = -Math.PI / 2; scene.add(p1); units.push(p1);
  const p2 = makePoliceCar(); p2.position.set(-2.4, 0, 16); p2.rotation.y = -Math.PI / 2; scene.add(p2); units.push(p2);
  const p3 = makePoliceCar(); p3.position.set(0, 0, 34); p3.rotation.y = Math.PI / 2; scene.add(p3); units.push(p3);
  return units;
}

function placeHeli(scene, x, y, z) {
  const heli = makeHeli();
  heli.position.set(x, y, z);
  scene.add(heli);
  return heli;
}

// Shared world for every shot: sky, ground, buildings, greenery, furniture.
function buildWorld(scene, mode) {
  const sky = buildSky(scene);
  buildGround(scene);
  buildBuildings(scene, mode);
  buildGreenery(scene, mode);
  const furn = buildStreetFurniture(scene);
  return { sky, furn };
}

export function buildShot(scene, shotId) {
  const rng = mulberry32(shotId === 'chase' ? 5 : shotId === 'combat' ? 6 : 7);
  const anim = { walkers: [], cars: [], heli: null, bolt: null, ferris: null, blimp: null, fire: null, playerCar: null, playerChar: null, t: 0 };
  let camera;

  if (shotId === 'chase') {
    const w = buildWorld(scene, 'chase');
    anim.bolt = w.sky.bolt; anim.ferris = w.furn.ferris; anim.blimp = w.furn.blimp;
    // Player car, big in frame, centre-bottom, facing down the boulevard.
    const player = makePlayerCar();
    player.position.set(0, 0, 0);
    player.rotation.y = -Math.PI / 2;
    scene.add(player);
    anim.playerCar = player;
    anim.cars.push(...placePoliceChase(scene));
    anim.cars.push(...placeTraffic(scene, rng));
    anim.heli = placeHeli(scene, 9, 13, 30);
    anim.walkers.push(...placePedestrians(scene, 8, -20, 50, rng));
    // Flood puddles at the road edge (BANJIR ROB).
    scene.add(makeFloodPuddle(-3.6, 12, 4, 2.2));
    scene.add(makeFloodPuddle(3.6, 30, 3.4, 2.0));
    // Burning barrel fire near the kerb.
    anim.fire = makeFire(-7.5, 18, 0.8);
    scene.add(anim.fire);
    camera = new THREE.PerspectiveCamera(60, 1280 / 720, 0.1, 900);
    camera.position.set(0, 3.6, -10.5);
    camera.lookAt(0, 1.0, 12);
  } else if (shotId === 'combat') {
    const w = buildWorld(scene, 'combat');
    anim.bolt = w.sky.bolt; anim.ferris = w.furn.ferris; anim.blimp = w.furn.blimp;
    // Player character, back to camera, big in frame, aiming.
    const hero = makeCharacter({ shirt: 0x2FA8B5, skin: 0xE8B88A, weapon: true, scale: 1.05 });
    hero.position.set(0, 0, 0);
    aimPose(hero);
    scene.add(hero);
    anim.playerChar = hero;
    // Tracer: a thin bright box from the weapon toward frame centre
    // (a 1px line is invisible at 1280px wide).
    const tracer = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 13),
      new THREE.MeshBasicMaterial({ color: 0xFFF2C0, transparent: true, opacity: 0.85 }),
    );
    tracer.position.set(0.15, 1.35, 7);
    scene.add(tracer);
    // Enemies with red triangles + one burning van.
    const enemySpots = [[-3, 12], [2.5, 15], [-1.5, 20], [4, 9], [-5, 17], [1, 24]];
    for (const [ex, ez] of enemySpots) {
      const e = makeCharacter({ shirt: 0x1A1A1A, skin: 0xC98A5A, weapon: true });
      e.position.set(ex, 0, ez);
      e.rotation.y = Math.PI;
      scene.add(e);
      const marker = makeEnemyMarker();
      marker.position.set(ex, 2.35, ez);
      scene.add(marker);
      anim.walkers.push(e);
    }
    const van = makeCar(0x2A2A33, 'van');
    van.position.set(-3.5, 0, 26); van.rotation.y = -Math.PI / 2 + 0.4;
    scene.add(van);
    anim.fire = makeFire(-2.0, 20, 1.6);
    scene.add(anim.fire);
    // Crates / barricades (docks).
    scene.add(makeCrate(4.5, 18));
    scene.add(makeCrate(5.2, 19.5, 0x2A6B8A));
    const c3 = makeCrate(-5.5, 22, 0xB5652A); c3.rotation.y = 0.3; scene.add(c3);
    // Civilians with hands up + walking.
    anim.walkers.push(...placePedestrians(scene, 4, 4, 30, rng));
    // Flood puddles at the road edge + heli + police.
    scene.add(makeFloodPuddle(-3.8, 8, 4.5, 2.4));
    scene.add(makeFloodPuddle(3.8, 16, 3.6, 2.2));
    anim.heli = placeHeli(scene, -8, 18, 30);
    const pc = makePoliceCar(); pc.position.set(2.4, 0, 38); pc.rotation.y = Math.PI / 2; scene.add(pc);
    camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 900);
    camera.position.set(0, 2.0, -4.5);
    camera.lookAt(0, 1.4, 10);
  } else if (shotId === 'title') {
    const w = buildWorld(scene, 'title');
    anim.bolt = w.sky.bolt; anim.ferris = w.furn.ferris; anim.blimp = w.furn.blimp;
    // Hero + red car on the causeway, centre frame.
    const hero = makeCharacter({ shirt: 0xE8443A, skin: 0xE8B88A, scale: 1.05 });
    hero.position.set(-1.5, 0, 6);
    hero.rotation.y = 0.4;
    scene.add(hero);
    anim.playerChar = hero;
    const car = makePlayerCar();
    car.position.set(1.8, 0, 8);
    car.rotation.y = -Math.PI / 2 - 0.35;
    scene.add(car);
    anim.playerCar = car;
    anim.heli = placeHeli(scene, 14, 20, 40);
    anim.walkers.push(...placePedestrians(scene, 6, -10, 30, rng));
    scene.add(makeFloodPuddle(-3.6, 14, 4, 2.2));
    camera = new THREE.PerspectiveCamera(50, 1280 / 720, 0.1, 900);
    camera.position.set(0, 7, -26);
    camera.lookAt(4, 8, 90);
  } else {
    // Map shot: dim vista behind the 2D map overlay.
    const w = buildWorld(scene, 'title');
    anim.bolt = w.sky.bolt; anim.blimp = w.furn.blimp;
    camera = new THREE.PerspectiveCamera(50, 1280 / 720, 0.1, 900);
    camera.position.set(0, 30, -50);
    camera.lookAt(0, 0, 60);
  }

  return { camera, anim };
}

// Per-frame animation: rotor, walkers, lightning blink, ferris, blimp, fire.
export function tickShot(anim, dt, time) {
  anim.t += dt;
  const t = anim.t;
  if (anim.heli) {
    anim.heli.userData.rotor.rotation.y += dt * 22;
    anim.heli.userData.tailRotor.rotation.x += dt * 30;
    anim.heli.position.y += Math.sin(t * 1.4) * dt * 0.35;
    anim.heli.userData.beacon.material.emissiveIntensity = (Math.sin(t * 6) > 0 ? 3 : 0.3);
  }
  for (const w of anim.walkers) {
    if (w.userData.walking) {
      animateWalk(w, dt, w.userData.walkSpeed || 1);
      if (w.userData.walkDir) {
        w.position.z += w.userData.walkDir * (w.userData.walkSpeed || 1) * dt;
        if (w.position.z > 55) w.position.z = -25;
        if (w.position.z < -25) w.position.z = 55;
      }
    }
  }
  if (anim.playerCar) {
    for (const wheel of anim.playerCar.userData.wheels || []) wheel.rotation.x += dt * 2;
    anim.playerCar.position.y = Math.sin(t * 2) * 0.015;
  }
  if (anim.bolt) {
    // Lightning: brief flash every ~7 seconds.
    const phase = t % 7;
    anim.bolt.material.opacity = phase < 0.12 ? 0.95 : phase < 0.3 ? 0.25 : 0;
  }
  if (anim.ferris) anim.ferris.children[0].rotation.z += dt * 0.15;
  if (anim.blimp) {
    anim.blimp.position.x += Math.sin(t * 0.1) * dt * 0.4;
    anim.blimp.position.y = 48 + Math.sin(t * 0.3) * 1.2;
  }
  if (anim.fire) {
    const s = 1 + Math.sin(t * 9) * 0.08;
    anim.fire.scale.set(s, 1 + Math.sin(t * 11) * 0.12, s);
  }
}
