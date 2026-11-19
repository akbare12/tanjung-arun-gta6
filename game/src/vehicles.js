// vehicles.js — low-poly cars (sedan, sport, pickup, taxi, police, van) and
// the police helicopter with a CORRECT spotlight cone: narrow at the heli,
// widening to the ground, plus a bright pool where it lands.
import * as THREE from 'three';
import { box, mat } from './world.js';

function wheel(x, z) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 10), mat(0x1a1a1a, { roughness: 0.9 }));
  w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); w.castShadow = true;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 8), mat(0xaaaaaa, { metalness: 0.6, roughness: 0.4 }));
  hub.rotation.z = Math.PI / 2; hub.position.copy(w.position);
  const g = new THREE.Group(); g.add(w); g.add(hub);
  return g;
}

export function makeCar(kind = 'sedan', color = 0xe8443a) {
  const g = new THREE.Group();
  const bodyColor = kind === 'police' ? 0xf2f2f2 : color;
  const body = box(4.2, 0.55, 1.9, bodyColor, { roughness: 0.35, metalness: 0.35 });
  body.position.y = 0.62; g.add(body);
  if (kind !== 'convertible') {
    const cabin = box(2.0, 0.5, 1.7, bodyColor, { roughness: 0.35, metalness: 0.3 });
    cabin.position.set(-0.2, 1.12, 0); g.add(cabin);
    const glass = box(1.9, 0.34, 1.72, 0x1a2a3a, { roughness: 0.15, metalness: 0.6 });
    glass.position.set(-0.2, 1.14, 0); g.add(glass);
  }
  // bumpers + grille
  const bumperF = box(0.18, 0.22, 1.85, 0x222222); bumperF.position.set(2.12, 0.5, 0); g.add(bumperF);
  const bumperR = bumperF.clone(); bumperR.position.x = -2.12; g.add(bumperR);
  // wheels
  for (const [x, z] of [[1.35, 0.95], [1.35, -0.95], [-1.35, 0.95], [-1.35, -0.95]]) g.add(wheel(x, z));
  // headlights (emissive white) + taillights (emissive red)
  for (const z of [-0.6, 0.6]) {
    const hl = box(0.08, 0.16, 0.4, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 2.2 });
    hl.position.set(2.16, 0.68, z); g.add(hl);
    const tl = box(0.08, 0.14, 0.4, 0xff2222, { emissive: 0xff2222, emissiveIntensity: 1.8 });
    tl.position.set(-2.16, 0.68, z); g.add(tl);
  }
  if (kind === 'sport' || kind === 'player') {
    const spoiler = box(0.5, 0.07, 1.7, 0x1a1a1a, { metalness: 0.4 });
    spoiler.position.set(-1.95, 1.05, 0); g.add(spoiler);
    const strutL = box(0.08, 0.25, 0.08, 0x1a1a1a); strutL.position.set(-1.95, 0.9, 0.6); g.add(strutL);
    const strutR = strutL.clone(); strutR.position.z = -0.6; g.add(strutR);
  }
  if (kind === 'police') {
    // white stripe + roof light bar (red + blue)
    const stripe = box(4.24, 0.1, 0.5, 0x1a3a8a, { roughness: 0.5 });
    stripe.position.set(0, 0.62, 0); g.add(stripe);
    const barBase = box(0.9, 0.12, 1.0, 0x111111); barBase.position.set(-0.2, 1.45, 0); g.add(barBase);
    const red = box(0.4, 0.18, 0.5, 0xff2a2a, { emissive: 0xff2a2a, emissiveIntensity: 2.5 });
    red.position.set(-0.2, 1.58, 0.28); g.add(red);
    const blue = box(0.4, 0.18, 0.5, 0x2a6bff, { emissive: 0x2a6bff, emissiveIntensity: 2.5 });
    blue.position.set(-0.2, 1.58, -0.28); g.add(blue);
  }
  if (kind === 'taxi') {
    const sign = box(0.7, 0.22, 0.4, 0xffd23f, { emissive: 0xffd23f, emissiveIntensity: 0.9 });
    sign.position.set(-0.2, 1.48, 0); g.add(sign);
    const door = box(0.9, 0.4, 0.02, 0x1a1a1a); door.position.set(0.4, 0.62, 0.96); g.add(door);
  }
  if (kind === 'pickup') {
    const bed = box(1.7, 0.35, 1.8, 0x2a2a2a, { roughness: 0.8 });
    bed.position.set(-1.15, 0.95, 0); g.add(bed);
  }
  if (kind === 'van') {
    const cargo = box(3.4, 1.5, 1.95, color, { roughness: 0.5, metalness: 0.2 });
    cargo.position.set(-0.3, 1.35, 0); g.add(cargo);
    const win = box(0.1, 0.5, 1.6, 0x1a2a3a, { roughness: 0.15, metalness: 0.6 });
    win.position.set(1.45, 1.35, 0); g.add(win);
  }
  return g;
}

export function makeHelicopter(coneH = 16) {
  const g = new THREE.Group();
  const body = box(3.4, 1.3, 1.6, 0x2a3a4a, { roughness: 0.5, metalness: 0.3 });
  body.position.y = 0; g.add(body);
  const nose = box(1.0, 1.0, 1.4, 0x1a2a3a, { roughness: 0.15, metalness: 0.6 });
  nose.position.set(1.9, -0.05, 0); g.add(nose);
  const tail = box(3.2, 0.35, 0.35, 0x2a3a4a); tail.position.set(-3.0, 0.35, 0); g.add(tail);
  const fin = box(0.15, 1.1, 0.9, 0xe8443a); fin.position.set(-4.5, 0.7, 0); g.add(fin);
  const rotor = new THREE.Group(); rotor.position.y = 0.85;
  for (const ry of [0, Math.PI / 2]) {
    const blade = box(7.2, 0.06, 0.28, 0x1a1a1a); blade.rotation.y = ry; rotor.add(blade);
  }
  g.add(rotor);
  const tailRotor = box(0.06, 1.6, 0.2, 0x1a1a1a); tailRotor.position.set(-4.4, 0.4, 0.3); g.add(tailRotor);
  for (const z of [-0.6, 0.6]) {
    const skid = box(2.6, 0.08, 0.1, 0x333333); skid.position.set(0.3, -0.95, z); g.add(skid);
  }
  // searchlight on the belly
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffe9a8, emissiveIntensity: 3 }));
  lamp.position.set(0.8, -0.7, 0); g.add(lamp);
  // CORRECT spotlight cone: apex (small end) at the helicopter, widening
  // down to the ground. ConeGeometry's apex is at +height/2.
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(4.2 * (coneH / 16), coneH, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  cone.position.set(0.8, -0.7 - coneH / 2, 0);
  g.add(cone);
  g.userData.rotor = rotor;
  g.userData.cone = cone;
  return g;
}

// Bright elliptical pool of light on the ground where the spotlight lands.
export function makeLightPool(x, z, rx = 4.2, rz = 5.2) {
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.5, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(rx, rz, 1);
  pool.position.set(x, 0.06, z);
  return pool;
}

// Traffic car with a simple straight-line driver (used in play mode).
export function makeTrafficCar(kind, color) {
  const car = makeCar(kind, color);
  car.userData.speed = 6 + Math.random() * 5;
  car.userData.lane = (Math.random() - 0.5) * 4;
  return car;
}
