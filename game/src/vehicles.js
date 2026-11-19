// TANJUNG ARUN — BADAI ARUNIKA: vehicles. Low-poly cars, vans, taxi,
// police cars with light bars, and the ELANG-1 police helicopter.
import * as THREE from 'three';
import { mat, emissiveMat } from './city.js';

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function makeWheel(x, z) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 10), mat(0x1A1A1A));
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.34, z);
  w.castShadow = true;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 8), mat(0xC8C8C8));
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, 0.34, z);
  const g = new THREE.Group();
  g.add(w); g.add(hub);
  return g;
}

function shade(hex, f) {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((hex >> 8) & 255) * f));
  const b = Math.min(255, Math.round((hex & 255) * f));
  return (r << 16) | (g << 8) | b;
}

// kind: 'sport' | 'sedan' | 'police' | 'taxi' | 'pickup' | 'van'
export function makeCar(color, kind = 'sedan') {
  const car = new THREE.Group();
  const bodyMat = mat(color);
  const isVan = kind === 'van';
  const bodyLen = isVan ? 4.6 : 4.2;
  const bodyH = isVan ? 1.6 : 0.55;
  const bodyY = isVan ? 1.15 : 0.62;

  const body = box(bodyLen, bodyH, 1.9, bodyMat, 0, bodyY, 0);
  car.add(body);
  if (!isVan) {
    // Cabin in a darker shade of the body colour (two-tone read from behind)
    // + dark windshield + rear window.
    car.add(box(2.0, 0.5, 1.7, mat(shade(color, 0.55)), -0.2, 1.12, 0));
    car.add(box(0.08, 0.42, 1.6, mat(0x141C26, { roughness: 0.2, metalness: 0.4 }), 0.82, 1.1, 0));
    car.add(box(0.08, 0.42, 1.6, mat(0x141C26, { roughness: 0.2, metalness: 0.4 }), -1.22, 1.1, 0));
  } else {
    car.add(box(0.08, 0.9, 1.7, mat(0x141C26, { roughness: 0.2, metalness: 0.4 }), 2.28, 1.25, 0));
  }
  // Wheels.
  const wheels = [];
  for (const [wx, wz] of [[1.35, 0.95], [1.35, -0.95], [-1.35, 0.95], [-1.35, -0.95]]) {
    const w = makeWheel(wx, wz);
    car.add(w); wheels.push(w);
  }
  // Emissive headlights + taillights.
  const headMat = emissiveMat(0xFFF2C0, 2.0);
  const tailMat = emissiveMat(0xFF2A2A, 1.6);
  car.add(box(0.08, 0.16, 0.3, headMat, bodyLen / 2 + 0.02, 0.62, 0.6));
  car.add(box(0.08, 0.16, 0.3, headMat, bodyLen / 2 + 0.02, 0.62, -0.6));
  car.add(box(0.08, 0.14, 0.3, tailMat, -bodyLen / 2 - 0.02, 0.62, 0.6));
  car.add(box(0.08, 0.14, 0.3, tailMat, -bodyLen / 2 - 0.02, 0.62, -0.6));

  if (kind === 'sport') {
    // Thin rear spoiler + hood scoop.
    car.add(box(0.5, 0.06, 1.7, mat(0x1A1A1A), -2.0, 1.05, 0));
    car.add(box(0.5, 0.1, 0.8, mat(0x1A1A1A), 1.2, 0.95, 0));
  }
  if (kind === 'police') {
    // White stripe + roof light bar (red left, blue right).
    car.add(box(4.22, 0.1, 0.5, mat(0xF2F2F2), 0, 0.92, 0));
    car.add(box(0.5, 0.14, 0.5, emissiveMat(0xFF2A2A, 2.4), -0.2, 1.45, 0.28));
    car.add(box(0.5, 0.14, 0.5, emissiveMat(0x2A6BFF, 2.4), -0.2, 1.45, -0.28));
    car.add(box(0.06, 0.5, 1.7, mat(0xF2F2F2), 0.4, 0.62, 0));
  }
  if (kind === 'taxi') {
    car.add(box(0.6, 0.18, 0.5, mat(0x111111), -0.2, 1.45, 0));
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xFFD23F }),
    );
    sign.position.set(-0.2, 1.56, 0.26); sign.rotation.x = 0;
    car.add(sign);
  }
  if (kind === 'pickup') {
    car.add(box(1.4, 0.5, 1.7, mat(0x222222), -1.3, 1.05, 0));
  }
  car.userData.wheels = wheels;
  return car;
}

export function makePlayerCar() {
  return makeCar(0xE8443A, 'sport');
}
export function makePoliceCar() {
  return makeCar(0xF2F2F2, 'police');
}
export function makeTaxi() {
  return makeCar(0xFFD23F, 'taxi');
}

// ELANG-1: police helicopter with spinning rotor + spotlight cone.
export function makeHeli() {
  const heli = new THREE.Group();
  const body = box(3.4, 1.1, 1.4, mat(0x2A4A6B), 0, 0, 0);
  heli.add(body);
  heli.add(box(1.2, 0.8, 1.1, mat(0x141C26, { roughness: 0.2 }), 1.9, -0.1, 0));
  heli.add(box(2.6, 0.5, 0.5, mat(0x2A4A6B), -2.6, 0.2, 0));
  heli.add(box(0.1, 1.2, 0.9, mat(0x2A4A6B), -3.8, 0.5, 0));
  // Rotor: two long thin boxes, spun by the animator.
  const rotor = new THREE.Group();
  rotor.add(box(7.5, 0.06, 0.35, mat(0x1A1A1A), 0, 0, 0));
  rotor.add(box(0.35, 0.06, 7.5, mat(0x1A1A1A), 0, 0, 0));
  rotor.position.y = 0.75;
  heli.add(rotor);
  // Tail rotor.
  const tailRotor = new THREE.Group();
  tailRotor.add(box(0.06, 1.6, 0.2, mat(0x1A1A1A), 0, 0, 0));
  tailRotor.position.set(-3.85, 0.5, 0.35);
  heli.add(tailRotor);
  // Skids.
  heli.add(box(2.6, 0.08, 0.12, mat(0x1A1A1A), 0, -0.85, 0.55));
  heli.add(box(2.6, 0.08, 0.12, mat(0x1A1A1A), 0, -0.85, -0.55));
  // Spotlight cone, additive transparent, aimed at the road below.
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 16, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xFFE9A8, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  cone.rotation.x = Math.PI; // apex up at the heli
  cone.position.y = -8.5;
  heli.add(cone);
  const spot = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 20),
    new THREE.MeshBasicMaterial({ color: 0xFFE9A8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = -16.4;
  heli.add(spot);
  // Red beacon.
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), emissiveMat(0xFF2A2A, 3));
  beacon.position.set(0, 0.65, 0);
  heli.add(beacon);
  heli.userData.rotor = rotor;
  heli.userData.tailRotor = tailRotor;
  heli.userData.beacon = beacon;
  return heli;
}
