// TANJUNG ARUN — BADAI ARUNIKA: builds the 3D low-poly coastal city.
// One city, three framings (chase boulevard / combat street / title vista).
// Every object is a low-poly primitive: boxes, cylinders, spheres, cones.
import * as THREE from 'three';

const PASTEL = [0xF2C9A0, 0xA8D8C8, 0xF7E8C8, 0xE8A0A0, 0x9FC8E8, 0xE8C85A, 0xC9A0E8];
const ROOF_TILE = 0xC85A3A;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.85, metalness: 0.05, ...opts,
    }));
  }
  return matCache.get(key);
}
export function emissiveMat(color, intensity = 1.2) {
  return new THREE.MeshStandardMaterial({
    color: 0x111111, emissive: color, emissiveIntensity: intensity, flatShading: true,
  });
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---- Sky: gradient dome + sun disc + storm clouds + lightning ----
export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(400, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x6B4A8F) },
      mid: { value: new THREE.Color(0xE86A92) },
      bot: { value: new THREE.Color(0xFFB36B) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
      void main(){ float h = normalize(vP).y; vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.8, h)) : mix(bot, mid, smoothstep(-0.05, 0.25, h));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  const dome = new THREE.Mesh(geo, skyMat);
  scene.add(dome);

  // Low sun disc in the west, glowing through the haze.
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(9, 32),
    new THREE.MeshBasicMaterial({ color: 0xFFD27D, fog: false }),
  );
  sun.position.set(-260, 20, 220); sun.lookAt(0, 20, 0);
  scene.add(sun);
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(16, 32),
    new THREE.MeshBasicMaterial({ color: 0xFFB36B, transparent: true, opacity: 0.25, fog: false }),
  );
  sunGlow.position.set(-262, 20, 222); sunGlow.lookAt(0, 20, 0);
  scene.add(sunGlow);

  // Storm clouds: flattened dark spheres on the horizon.
  const cloudMat = mat(0x4A3560, { roughness: 1 });
  const cloudMat2 = mat(0x7B5EA7, { roughness: 1 });
  const clouds = new THREE.Group();
  const rng = mulberry32(77);
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(10 + rng() * 12, 10, 8), i % 2 ? cloudMat : cloudMat2);
    s.scale.y = 0.28;
    s.position.set(-180 + rng() * 360, 58 + rng() * 18, 160 + rng() * 60);
    clouds.add(s);
  }
  scene.add(clouds);

  // Lightning: zigzag emissive line, blinked by the animator.
  const pts = [];
  let lx = 60, ly = 90, lz = 210;
  pts.push(new THREE.Vector3(lx, ly, lz));
  for (let i = 0; i < 6; i++) {
    lx += (rng() - 0.5) * 14; ly -= 9 + rng() * 6;
    pts.push(new THREE.Vector3(lx, ly, lz));
  }
  const boltGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const bolt = new THREE.Line(boltGeo, new THREE.LineBasicMaterial({ color: 0xFFE9A8, transparent: true, opacity: 0 }));
  scene.add(bolt);
  return { bolt, clouds };
}

// ---- Ground: sand, sea, roads, sidewalks, zebra crossings ----
export function buildGround(scene) {
  const g = new THREE.Group();
  // Sand base for the whole island block.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), mat(0xE8D5A3, { flatShading: false }));
  sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true;
  g.add(sand);
  // Sea on the east side (+X), with a thin white surf line.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(150, 320), new THREE.MeshStandardMaterial({
    color: 0x2FA8B5, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.95,
  }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(105, 0.05, 0);
  g.add(sea);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 320), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 }));
  surf.rotation.x = -Math.PI / 2; surf.position.set(30.5, 0.06, 0);
  g.add(surf);

  // Main coastal boulevard along Z, 9 m wide, plus two cross streets.
  const asphalt = mat(0x33383F, { flatShading: false });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 320), asphalt);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.08, 0); road.receiveShadow = true;
  g.add(road);
  for (const zc of [-60, 20, 80]) {
    const cross = new THREE.Mesh(new THREE.PlaneGeometry(120, 8), asphalt);
    cross.rotation.x = -Math.PI / 2; cross.position.set(-30, 0.08, zc); cross.receiveShadow = true;
    g.add(cross);
  }
  // Sidewalks both sides of the boulevard.
  const walk = mat(0xB8B0A0, { flatShading: false });
  for (const x of [-6.5, 6.5]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(4, 320), walk);
    sw.rotation.x = -Math.PI / 2; sw.position.set(x, 0.09, 0); sw.receiveShadow = true;
    g.add(sw);
  }
  // Double yellow centre lines + white dashes (instanced small boxes).
  const yellow = mat(0xFFD23F, { flatShading: false });
  for (const x of [-0.35, 0.35]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 320), yellow);
    line.rotation.x = -Math.PI / 2; line.position.set(x, 0.1, 0);
    g.add(line);
  }
  const dashGeo = new THREE.BoxGeometry(0.15, 0.02, 2.2);
  const dashMat = mat(0xFFFFFF, { flatShading: false });
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, 120);
  const m4 = new THREE.Matrix4();
  let di = 0;
  for (let z = -150; z < 160 && di < 120; z += 6) {
    for (const x of [-3.2, 3.2]) {
      if (di >= 120) break;
      m4.setPosition(x, 0.1, z);
      dashes.setMatrixAt(di++, m4);
    }
  }
  dashes.count = di;
  g.add(dashes);
  // Zebra crossings at the three intersections.
  const zebraMat = mat(0xFFFFFF, { flatShading: false });
  for (const zc of [-60, 20, 80]) {
    for (let i = -4; i <= 4; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.4), zebraMat);
      stripe.rotation.x = -Math.PI / 2; stripe.position.set(i * 1.0, 0.1, zc + 5.5);
      g.add(stripe);
    }
  }
  scene.add(g);
  return g;
}

// ---- Buildings: varied heights, rooftop kit, balconies, awnings, signs, lit windows ----
export function buildBuildings(scene, mode) {
  const group = new THREE.Group();
  const rng = mulberry32(mode === 'title' ? 41 : 11);
  const windowTransforms = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();

  function addWindows(x, y0, z, w, h, d, face) {
    const cols = Math.max(2, Math.floor(w / 3));
    const rows = Math.max(2, Math.floor(h / 3.2));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.25) continue; // some windows dark
        const wx = x - w / 2 + (c + 0.5) * (w / cols);
        const wy = y0 + 1.6 + r * 3.2;
        const wz = face === 'east' ? z + d / 2 + 0.06 : z - d / 2 - 0.06;
        e.set(0, face === 'east' ? 0 : Math.PI, 0);
        q.setFromEuler(e);
        m4.compose(new THREE.Vector3(wx, wy, wz), q, new THREE.Vector3(1, 1, 1));
        windowTransforms.push(m4.clone());
      }
    }
  }

  function building(x, z, w, h, d, colorIdx, opts = {}) {
    const b = new THREE.Group();
    const facade = mat(PASTEL[colorIdx % PASTEL.length]);
    const main = box(w, h, d, facade, 0, h / 2, 0);
    b.add(main);
    // Thin roof cap + pitched roof option.
    if (opts.pyramid) {
      const roof = cyl(0.01, Math.max(w, d) * 0.72, 2.2, mat(ROOF_TILE), 0, h + 1.1, 0, 4);
      roof.rotation.y = Math.PI / 4;
      b.add(roof);
    } else {
      b.add(box(w + 0.4, 0.35, d + 0.4, mat(0x6B5A4A), 0, h + 0.15, 0));
    }
    // Rooftop kit: AC units, water tank, antenna.
    if (rng() < 0.7) b.add(box(1.1, 0.7, 0.9, mat(0x8A8F94), (rng() - 0.5) * w * 0.5, h + 0.7, (rng() - 0.5) * d * 0.4));
    if (rng() < 0.5) b.add(cyl(0.55, 0.55, 1.3, mat(0x4A6B8A), (rng() - 0.5) * w * 0.5, h + 1.0, (rng() - 0.5) * d * 0.4, 10));
    if (rng() < 0.5) {
      const ant = cyl(0.05, 0.05, 3.2, mat(0x333333), (rng() - 0.5) * w * 0.6, h + 1.6, (rng() - 0.5) * d * 0.4, 6);
      b.add(ant);
      b.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), emissiveMat(0xFF2A2A, 2)));
      b.children[b.children.length - 1].position.set(ant.position.x, h + 3.2, ant.position.z);
    }
    // Balconies on the street face.
    if (opts.balconies) {
      for (let f = 1; f <= Math.floor(h / 3.2) - 1; f++) {
        b.add(box(w * 0.7, 0.18, 1.1, mat(0x8A7A6A), 0, f * 3.2, d / 2 + 0.55));
        b.add(box(w * 0.7, 0.9, 0.08, mat(0x5A4A3A), 0, f * 3.2 + 0.5, d / 2 + 1.05));
      }
    }
    // Shop awning + sign on the ground floor.
    if (opts.shop) {
      b.add(box(w * 0.9, 0.25, 1.6, mat(opts.awningColor || 0xD94F70), 0, 3.1, d / 2 + 0.8));
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.8, 1.0),
        new THREE.MeshBasicMaterial({ map: textTexture(opts.shop, '#FFF7E8', opts.awningColor || 0xD94F70) }),
      );
      sign.position.set(0, 4.1, d / 2 + 0.07);
      b.add(sign);
    }
    b.position.set(x, 0, z);
    group.add(b);
    addWindows(x, 0, z, w, h, d, 'east');
    return b;
  }

  // West row along the boulevard (the chase side). In chase mode the row
  // starts ahead of the camera so no building crowds the frame's corner.
  const shops = ['BOLT BURGER', 'VELMARA FM', 'MANGO & RYE', 'PASAR IKAN', 'KOPI SENJA', 'TOKO GARAM'];
  let z = mode === 'chase' ? 15 : -140;
  let i = 0;
  while (z < 150) {
    const w = 8 + rng() * 4, d = 9 + rng() * 4;
    const h = mode === 'title' ? 8 + rng() * 22 : 6 + rng() * 10;
    building(-14 - rng() * 3, z, w, h, d, i, {
      shop: i % 3 === 0 ? shops[i % shops.length] : null,
      awningColor: [0xD94F70, 0xF2A541, 0x2FA8B5][i % 3],
      balconies: rng() < 0.6, pyramid: rng() < 0.25,
    });
    z += d + 4 + rng() * 6;
    i++;
  }
  // East row (between boulevard and sea): low shops + houses — but NOT in
  // chase mode: the sea side stays open beach so the sea reads in frame.
  // In combat mode the row starts ahead of the camera (no wall beside it).
  if (mode !== 'chase') {
  z = mode === 'combat' ? 25 : -130;
  i = 0;
  while (z < 140) {
    const w = 7 + rng() * 3, d = 8 + rng() * 3;
    const h = 5 + rng() * 6;
    building((mode === 'combat' ? 17 : 14) + rng() * 2, z, w, h, d, i + 3, {
      shop: i % 4 === 1 ? shops[(i + 2) % shops.length] : null,
      balconies: rng() < 0.4, pyramid: rng() < 0.4,
    });
    z += d + 5 + rng() * 7;
    i++;
  }
  }
  // Title vista: tall skyline in the far background.
  if (mode === 'title') {
    for (let k = 0; k < 16; k++) {
      const w = 10 + rng() * 4, d = 10 + rng() * 4;
      const h = 25 + rng() * 35;
      building(-70 + k * 9 + rng() * 3, 150 + rng() * 30, w, h, d, k, { balconies: false });
    }
  }
  // Lit windows, one InstancedMesh for the whole city.
  const winGeo = new THREE.PlaneGeometry(1.1, 1.5);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x201408, emissive: 0xFFD27D, emissiveIntensity: 1.2,
  });
  const wins = new THREE.InstancedMesh(winGeo, winMat, Math.max(1, windowTransforms.length));
  windowTransforms.forEach((m, idx) => wins.setMatrixAt(idx, m));
  wins.count = windowTransforms.length;
  group.add(wins);
  scene.add(group);
  return group;
}

// CanvasTexture helper for shop signs / billboards.
export function textTexture(text, fg = '#FFF7E8', bg = '#D94F70', font = 'bold 64px sans-serif') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Trees: palm / pine / broadleaf + bushes + grass tufts ----
export function makePalm(rng) {
  const g = new THREE.Group();
  const trunk = cyl(0.09, 0.14, 3.6, mat(0x8A5A3A), 0, 1.8, 0, 7);
  trunk.rotation.z = (rng() - 0.5) * 0.25;
  g.add(trunk);
  const frondMat = mat(0x3A9A5A, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.4), frondMat);
    const a = (i / 7) * Math.PI * 2;
    frond.position.set(Math.cos(a) * 0.85, 3.55, Math.sin(a) * 0.85);
    frond.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    frond.rotation.y = -a;
    g.add(frond);
  }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat(0x2A7A44));
  top.position.y = 3.6;
  g.add(top);
  return g;
}
export function makePine() {
  const g = new THREE.Group();
  g.add(cyl(0.12, 0.16, 1.2, mat(0x6B4A2A), 0, 0.6, 0, 7));
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), mat(0x2A6B3A));
  c1.position.y = 2.0; c1.castShadow = true; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 8), mat(0x358A4A));
  c2.position.y = 3.2; c2.castShadow = true; g.add(c2);
  return g;
}
export function makeBroadleaf() {
  const g = new THREE.Group();
  g.add(cyl(0.13, 0.18, 1.8, mat(0x6B4A2A), 0, 0.9, 0, 7));
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), mat(0x4A9A4A));
  canopy.position.y = 2.6; canopy.scale.y = 0.85; canopy.castShadow = true;
  g.add(canopy);
  const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), mat(0x5AB85A));
  canopy2.position.set(0.6, 3.1, 0.3); canopy2.castShadow = true;
  g.add(canopy2);
  return g;
}
export function makeBush() {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat(0x3A8A4A));
  b.scale.y = 0.7; b.position.y = 0.35; b.castShadow = true;
  return b;
}
export function makeGrassTuft() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5 + Math.random() * 0.2, 4), mat(0x5AB85A));
    blade.position.set((Math.random() - 0.5) * 0.5, 0.25, (Math.random() - 0.5) * 0.5);
    blade.rotation.z = (Math.random() - 0.5) * 0.4;
    g.add(blade);
  }
  return g;
}

export function buildGreenery(scene, mode) {
  const rng = mulberry32(99);
  const g = new THREE.Group();
  // Palms lining both sides of the boulevard.
  for (let z = -140; z < 150; z += 11 + rng() * 6) {
    for (const x of [-9.5, 9.5]) {
      if (rng() < 0.18) continue;
      const p = makePalm(rng);
      p.position.set(x + (rng() - 0.5), 0, z + (rng() - 0.5) * 3);
      g.add(p);
    }
  }
  // Parks in the corners: pines, broadleafs, bushes, grass, benches.
  const parks = [[-32, -40], [-32, 55], [24, -75], [24, 100]];
  for (const [px, pz] of parks) {
    for (let i = 0; i < 3; i++) {
      const t = rng() < 0.5 ? makePine() : makeBroadleaf();
      t.position.set(px + (rng() - 0.5) * 12, 0, pz + (rng() - 0.5) * 12);
      g.add(t);
    }
    for (let i = 0; i < 6; i++) {
      const b = makeBush();
      b.position.set(px + (rng() - 0.5) * 14, 0, pz + (rng() - 0.5) * 14);
      g.add(b);
    }
    for (let i = 0; i < 10; i++) {
      const tuft = makeGrassTuft();
      tuft.position.set(px + (rng() - 0.5) * 14, 0, pz + (rng() - 0.5) * 14);
      g.add(tuft);
    }
    // Park bench.
    const bench = new THREE.Group();
    bench.add(box(1.8, 0.08, 0.5, mat(0x8A5A3A), 0, 0.45, 0));
    bench.add(box(1.8, 0.5, 0.08, mat(0x8A5A3A), 0, 0.75, -0.22));
    bench.add(box(0.08, 0.45, 0.45, mat(0x333333), -0.8, 0.22, 0));
    bench.add(box(0.08, 0.45, 0.45, mat(0x333333), 0.8, 0.22, 0));
    bench.position.set(px + 3, 0, pz + 2);
    g.add(bench);
  }
  // Beach umbrellas on the east sand (chase side): cone + pole.
  const umbrellaColors = [0xD94F70, 0xF2A541, 0x2FA8B5, 0xE8443A];
  for (let i = 0; i < 5; i++) {
    const u = new THREE.Group();
    u.add(cyl(0.05, 0.05, 2.2, mat(0x8A5A3A), 0, 1.1, 0, 6));
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 8), mat(umbrellaColors[i % 4]));
    canopy.position.y = 2.3; canopy.castShadow = true;
    u.add(canopy);
    u.position.set(16 + rng() * 8, 0, -60 + i * 32 + rng() * 8);
    g.add(u);
  }
  scene.add(g);
  return g;
}

// ---- Street furniture: lamps, traffic lights, hydrant, billboard, ferris wheel, blimp ----
export function buildStreetFurniture(scene) {
  const g = new THREE.Group();
  for (let z = -140; z < 150; z += 24) {
    for (const x of [-8.6, 8.6]) {
      const lamp = new THREE.Group();
      lamp.add(cyl(0.06, 0.08, 4.2, mat(0x2A2A2A), 0, 2.1, 0, 6));
      lamp.add(box(0.5, 0.18, 0.3, emissiveMat(0xFFE9A8, 1.6), 0, 4.25, 0));
      lamp.position.set(x, 0, z);
      g.add(lamp);
    }
  }
  for (const [tx, tz] of [[-5.5, -58], [5.5, 22], [-5.5, 82]]) {
    const tl = new THREE.Group();
    tl.add(cyl(0.07, 0.07, 3.6, mat(0x222222), 0, 1.8, 0, 6));
    tl.add(box(0.35, 1.0, 0.35, mat(0x111111), 0, 3.9, 0));
    const lights = [0xFF2A2A, 0xFFD23F, 0x39D98A];
    lights.forEach((c, i) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), emissiveMat(c, i === 2 ? 2 : 0.4));
      dot.position.set(0, 4.22 - i * 0.3, 0.19);
      tl.add(dot);
    });
    tl.position.set(tx, 0, tz);
    g.add(tl);
  }
  // Red hydrant.
  const hyd = new THREE.Group();
  hyd.add(cyl(0.16, 0.18, 0.7, mat(0xD42A2A), 0, 0.35, 0, 8));
  hyd.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xD42A2A))).children;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xD42A2A));
  cap.position.y = 0.72; hyd.add(cap);
  hyd.position.set(-8.8, 0, 8);
  g.add(hyd);
  // Billboard: SUNSET BAY CLUB.
  const bb = new THREE.Group();
  bb.add(box(0.4, 7, 0.4, mat(0x333333), 0, 3.5, 0));
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 3, 0.3),
    new THREE.MeshStandardMaterial({ map: textTexture('SUNSET BAY CLUB', '#FFD27D', '#2A1A3A', 'bold 52px sans-serif') }),
  );
  board.position.set(0, 7.6, 0); board.castShadow = true;
  bb.add(board);
  bb.position.set(-13, 0, -30);
  g.add(bb);
  // Ferris wheel on the beach side.
  const fw = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5, 0.25, 8, 24), mat(0xF2A541));
  rim.position.y = 7; rim.castShadow = true;
  fw.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = box(0.18, 10, 0.18, mat(0xE8443A), Math.cos(a) * 0, 7, Math.sin(a) * 0);
    spoke.position.set(Math.cos(a) * 2.5, 7 + Math.sin(a) * 2.5, 0);
    spoke.rotation.z = a + Math.PI / 2;
    fw.add(spoke);
    const cabin = box(0.9, 0.9, 0.9, mat([0x2FA8B5, 0xD94F70, 0xF2A541, 0x3A9A5A][i % 4]), Math.cos(a) * 5, 7 + Math.sin(a) * 5, 0);
    fw.add(cabin);
  }
  fw.add(cyl(0.3, 0.4, 7, mat(0x333333), 0, 3.5, 0, 8));
  fw.position.set(26, 0, 60);
  g.add(fw);
  // Orange capsule blimp with fins.
  const blimp = new THREE.Group();
  const cap2 = new THREE.Mesh(new THREE.CapsuleGeometry(2.2, 7, 6, 12), mat(0xF28C28));
  cap2.rotation.z = Math.PI / 2; cap2.castShadow = true;
  blimp.add(cap2);
  blimp.add(box(1.6, 1.4, 0.4, mat(0xF28C28), -4.5, 1.2, 0));
  blimp.add(box(1.6, 0.4, 1.4, mat(0xF28C28), -4.5, -1.2, 0));
  const blimpSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.2),
    new THREE.MeshBasicMaterial({ map: textTexture('VELMARA FM', '#FFFFFF', '#F28C28', 'bold 56px sans-serif') }),
  );
  blimpSign.position.set(0, 0, 2.3);
  blimp.add(blimpSign);
  blimp.position.set(-40, 48, 120);
  g.add(blimp);
  scene.add(g);
  return { group: g, ferris: fw, blimp };
}

// ---- Flood puddles (BANJIR ROB) + fire ----
export function makeFloodPuddle(x, z, w = 4, d = 2.4) {
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: 0x4A7A6A, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.65 }),
  );
  p.rotation.x = -Math.PI / 2; p.position.set(x, 0.11, z);
  return p;
}
export function makeFire(x, z, scale = 1) {
  const g = new THREE.Group();
  const flameMat = emissiveMat(0xFF7A1A, 2.2);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5 * scale, 1.4 * scale, 7), flameMat);
    cone.position.set((i - 1) * 0.5 * scale, 0.7 * scale, (i % 2) * 0.3);
    g.add(cone);
  }
  const smoke = new THREE.Mesh(
    new THREE.ConeGeometry(1.1 * scale, 3.2 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.45, roughness: 1 }),
  );
  smoke.position.y = 2.6 * scale;
  g.add(smoke);
  g.position.set(x, 0, z);
  return g;
}

// Crates / containers with KEEP OUT texture (combat docks).
export function makeCrate(x, z, color = 0x3A7A5A) {
  const c = box(1.6, 1.6, 1.6, new THREE.MeshStandardMaterial({
    map: textTexture('KEEP OUT', '#FFFFFF', '#3A7A5A', 'bold 48px sans-serif'),
  }), x, 0.8, z);
  return c;
}
