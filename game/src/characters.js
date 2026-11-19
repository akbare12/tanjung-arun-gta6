// TANJUNG ARUN — BADAI ARUNIKA: low-poly people.
// Every person is SEPARATE articulated parts (head, torso, arms, legs as
// their own meshes) with a walk-cycle animation — never a rigid box.
import * as THREE from 'three';
import { mat } from './city.js';

const SKINS = [0xE8B88A, 0xC98A5A, 0x8A5A3A, 0xF2C9A0];
const SHIRTS = [0xE8443A, 0xFFD23F, 0x2FA8B5, 0xB565D8, 0xF2F2F2, 0x3A9A5A, 0xF2A541, 0xD94F70];

// opts: { shirt, skin, hair, hat, scale, weapon }
export function makeCharacter(opts = {}) {
  const g = new THREE.Group();
  const shirt = opts.shirt ?? SHIRTS[Math.floor(Math.random() * SHIRTS.length)];
  const skin = opts.skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const s = opts.scale ?? 1;

  // Head: sphere + half-sphere hair.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(skin));
  head.position.y = 1.62; head.castShadow = true;
  g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(opts.hair ?? 0x1A1A1A),
  );
  hair.position.y = 1.64;
  g.add(hair);
  if (opts.hat) {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.09, 10), mat(opts.hat));
    hat.position.y = 1.78;
    g.add(hat);
  }
  // Torso: solid-color box.
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.22), mat(shirt));
  torso.position.y = 1.18; torso.castShadow = true;
  g.add(torso);
  // Arms: separate meshes, pivot at the shoulder (group per arm).
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.27, 1.42, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.14), mat(shirt));
    arm.position.y = -0.25; arm.castShadow = true;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(skin));
    hand.position.y = -0.52;
    pivot.add(hand);
    g.add(pivot);
    arms.push(pivot);
  }
  // Legs: separate meshes, pivot at the hip.
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.11, 0.9, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), mat(0x2A2A33));
    leg.position.y = -0.35; leg.castShadow = true;
    pivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.3), mat(0x111111));
    shoe.position.set(0, -0.72, 0.05);
    pivot.add(shoe);
    g.add(pivot);
    legs.push(pivot);
  }
  // Weapon in the right hand (aimed forward): chunky dark SMG + muzzle tip.
  let weapon = null;
  if (opts.weapon) {
    weapon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.7), mat(0x1A1A1A));
    weapon.position.set(0, -0.52, 0.3);
    arms[1].add(weapon);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFE9A8 }));
    muzzle.position.set(0, -0.52, 0.68);
    arms[1].add(muzzle);
  }
  g.scale.setScalar(s);
  g.userData = { arms, legs, weapon, walkPhase: Math.random() * Math.PI * 2, walking: true };
  return g;
}

// Walk cycle: arms and legs swing in opposition. Call every frame.
export function animateWalk(person, dt, speed = 1) {
  const u = person.userData;
  if (!u.walking) return;
  u.walkPhase += dt * 6 * speed;
  const swing = Math.sin(u.walkPhase) * 0.55;
  u.legs[0].rotation.x = swing;
  u.legs[1].rotation.x = -swing;
  u.arms[0].rotation.x = -swing * 0.8;
  u.arms[1].rotation.x = swing * 0.8;
  // Slight body bob.
  person.position.y = Math.abs(Math.sin(u.walkPhase)) * 0.04;
}

// Aiming pose for combat: right arm forward, left arm supporting.
export function aimPose(person) {
  const u = person.userData;
  u.walking = false;
  u.arms[1].rotation.x = -Math.PI / 2 + 0.15;
  u.arms[0].rotation.x = -Math.PI / 2 + 0.5;
  u.legs[0].rotation.x = 0.25;
  u.legs[1].rotation.x = -0.3;
}

// Red triangle marker above an enemy's head (combat).
export function makeEnemyMarker() {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xFF2A2A }),
  );
  m.rotation.x = Math.PI; // point down
  return m;
}
