// people.js — articulated low-poly characters: head, torso, arms and legs are
// separate meshes with a walk-cycle animation, never stiff boxes.
import * as THREE from 'three';
import { box, mat } from './world.js';

const SKINS = [0xe8b98a, 0xc98a5a, 0x8a5a3a, 0xf2c9a0];
const SHIRTS = [0xe8443a, 0xf2a541, 0x2fa8b5, 0xb565d8, 0x3a9a5a, 0xe8e8e8, 0x4da6ff, 0xd94f70];
const PANTS = [0x2a2f38, 0x3a4a6a, 0x5a4a3a, 0x1a1a1a];

// A person ~1.75 m tall. Arms and legs pivot at shoulder/hip so the walk
// cycle can swing them. Returns a group with userData joints.
export function makePerson({ shirt = 0xe8443a, skin = 0xe8b98a, pants = 0x2a2f38, hat = null, hair = 0x1a1a1a, scale = 1, weapon = false } = {}) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(skin));
  head.position.y = 1.62; head.castShadow = true; g.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair));
  hairM.position.y = 1.65; g.add(hairM);
  const torso = box(0.44, 0.58, 0.24, shirt, { roughness: 0.85 });
  torso.position.y = 1.18; g.add(torso);
  // jacket stripe for the hero
  const stripe = box(0.46, 0.1, 0.26, 0xffd23f); stripe.position.y = 1.32; g.add(stripe);
  const armL = new THREE.Group(); armL.position.set(-0.28, 1.42, 0);
  const armLm = box(0.13, 0.52, 0.15, shirt); armLm.position.y = -0.24; armL.add(armLm);
  const handL = box(0.11, 0.1, 0.12, skin); handL.position.y = -0.52; armL.add(handL);
  g.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.28, 1.42, 0);
  const armRm = box(0.13, 0.52, 0.15, shirt); armRm.position.y = -0.24; armR.add(armRm);
  const handR = box(0.11, 0.1, 0.12, skin); handR.position.y = -0.52; armR.add(handR);
  if (weapon) {
    const gun = box(0.09, 0.14, 0.42, 0x1a1a1a, { metalness: 0.5, roughness: 0.4 });
    gun.position.set(0, -0.55, 0.18); armR.add(gun);
  }
  g.add(armR);
  const legL = new THREE.Group(); legL.position.set(-0.12, 0.92, 0);
  const legLm = box(0.17, 0.86, 0.19, pants); legLm.position.y = -0.44; legL.add(legLm);
  const shoeL = box(0.18, 0.09, 0.3, 0x1a1a1a); shoeL.position.set(0, -0.88, 0.05); legL.add(shoeL);
  g.add(legL);
  const legR = new THREE.Group(); legR.position.set(0.12, 0.92, 0);
  const legRm = box(0.17, 0.86, 0.19, pants); legRm.position.y = -0.44; legR.add(legRm);
  const shoeR = box(0.18, 0.09, 0.3, 0x1a1a1a); shoeR.position.set(0, -0.88, 0.05); legR.add(shoeR);
  g.add(legR);
  if (hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 10), mat(0xe8443a));
    cap.position.y = 1.76; g.add(cap);
    const brim = box(0.2, 0.03, 0.14, 0xe8443a); brim.position.set(0, 1.73, 0.16); g.add(brim);
  } else if (hat === 'straw') {
    const brimH = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), mat(0xe8d5a3));
    brimH.position.y = 1.74; g.add(brimH);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 10), mat(0xe8d5a3));
    top.position.y = 1.8; g.add(top);
  }
  g.scale.setScalar(scale);
  g.userData.joints = { armL, armR, legL, legR, head, torso };
  g.userData.phase = Math.random() * Math.PI * 2;
  g.userData.walkSpeed = 1.6 + Math.random() * 0.8;
  return g;
}

// Walk cycle: arms and legs swing opposite, torso bobs slightly.
export function animateWalk(person, dt, moving = true) {
  const j = person.userData.joints;
  if (!j) return;
  person.userData.phase += dt * (moving ? 7 : 1.2) * person.userData.walkSpeed;
  const p = person.userData.phase;
  const amp = moving ? 0.55 : 0.06;
  j.armL.rotation.x = Math.sin(p) * amp;
  j.armR.rotation.x = -Math.sin(p) * amp;
  j.legL.rotation.x = -Math.sin(p) * amp * 0.9;
  j.legR.rotation.x = Math.sin(p) * amp * 0.9;
  j.torso.position.y = 1.18 + (moving ? Math.abs(Math.sin(p)) * 0.04 : 0);
}

// Aiming pose for the combat shot: right arm raised, weapon forward.
export function poseAim(person) {
  const j = person.userData.joints;
  j.armR.rotation.x = -Math.PI / 2 + 0.15;
  j.armL.rotation.x = -Math.PI / 2 + 0.35;
  j.armL.rotation.z = 0.25;
  j.legL.rotation.x = -0.25; j.legR.rotation.x = 0.3;
}

// Random pedestrian with varied height, outfit and hat.
export function makePedestrian() {
  return makePerson({
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
    skin: SKINS[Math.floor(Math.random() * SKINS.length)],
    pants: PANTS[Math.floor(Math.random() * PANTS.length)],
    hat: Math.random() < 0.3 ? (Math.random() < 0.5 ? 'cap' : 'straw') : null,
    scale: 0.92 + Math.random() * 0.16,
  });
}

// Canvas portrait for HUD dialogue (drawn face, not a 3D render).
export function portraitDataURL(name, color, bg = '#1A2433') {
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
  g.fillStyle = color; g.beginPath(); g.arc(48, 40, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#E8B98A'; g.beginPath(); g.arc(48, 42, 20, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1A1A1A'; g.beginPath(); g.arc(48, 30, 20, Math.PI, 0); g.fill();
  g.fillStyle = '#1A1A1A';
  g.beginPath(); g.arc(41, 42, 2.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(55, 42, 2.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1A1A1A'; g.lineWidth = 2;
  g.beginPath(); g.arc(48, 50, 7, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = color; g.fillRect(18, 68, 60, 28);
  g.fillStyle = '#FFFFFF'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
  g.fillText(name, 48, 92);
  return c.toDataURL('image/png');
}
