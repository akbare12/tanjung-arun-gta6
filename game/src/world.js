// world.js — builds the 3D city of Tanjung Arun: sky, sea, roads with aligned
// paint, buildings with real facades, three tree species, street props.
import * as THREE from 'three';

export const PALETTE = {
  skyTop: 0x6b4a8f, skyMid: 0xe86a92, horizon: 0xffb36b, sun: 0xffd27d,
  sea: 0x2fa8b5, sand: 0xe8d5a3, asphalt: 0x33383f, sidewalk: 0xb8b0a0,
  lineYellow: 0xffd23f, lineWhite: 0xf2f2f2, flood: 0x4a7a6a,
  cloudDark: 0x4a3560, cloudLight: 0x7b5ea7, lightning: 0xffe9a8,
};

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0.05, ...opts });
}

export function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function place(mesh, x, y, z, ry = 0) {
  mesh.position.set(x, y, z); mesh.rotation.y = ry;
  return mesh;
}

// --- canvas textures -------------------------------------------------------

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// A building facade: vertical gradient + window grid (lit/unlit mix) + door
// + shop sign. Drawn once per building, so windows/doors/signs are crisp
// without hundreds of meshes.
export function facadeTexture({ base, top, floors, cols, sign, signColor, litRatio = 0.55 }) {
  return canvasTexture(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top); grad.addColorStop(1, base);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // subtle floor shading bands
    g.fillStyle = 'rgba(0,0,0,0.08)';
    for (let f = 0; f < floors; f++) g.fillRect(0, (f * h) / floors, w, 3);
    const marginX = 18, marginTop = 14, doorH = 34;
    const cw = (w - marginX * 2) / cols, ch = (h - marginTop - doorH - 10) / floors;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() < litRatio;
        g.fillStyle = lit ? '#FFD27D' : '#2A3A55';
        if (lit) { g.shadowColor = '#FFD27D'; g.shadowBlur = 6; } else g.shadowBlur = 0;
        g.fillRect(marginX + c * cw + 4, marginTop + f * ch + 4, cw - 8, ch - 9);
        g.shadowBlur = 0;
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
        g.strokeRect(marginX + c * cw + 4, marginTop + f * ch + 4, cw - 8, ch - 9);
      }
    }
    // door at ground level, centred
    g.fillStyle = '#3A2A22'; g.fillRect(w / 2 - 14, h - doorH, 28, doorH);
    g.fillStyle = '#FFD27D'; g.fillRect(w / 2 - 14, h - doorH, 28, 4);
    if (sign) {
      g.fillStyle = signColor || '#1A2433'; g.fillRect(8, h - doorH - 26, w - 16, 22);
      g.fillStyle = '#FFFFFF'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center';
      g.fillText(sign, w / 2, h - doorH - 11);
    }
  });
}

export function signTexture(text, bg = '#1A2433', fg = '#FFD23F', w = 512, h = 128) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    // auto-fit: shrink the font until the whole text fits inside the
    // board with a margin, so long names (SUNSET BAY CLUB) never clip
    // at the left/right edges of the board
    let size = 56;
    g.font = `bold ${size}px sans-serif`;
    while (size > 20 && g.measureText(text).width > w - 44) {
      size -= 2;
      g.font = `bold ${size}px sans-serif`;
    }
    g.fillStyle = fg; g.textAlign = 'center';
    g.fillText(text, w / 2, h / 2 + size * 0.36);
  });
}

// --- buildings -------------------------------------------------------------

const FACADE_COLORS = [
  { base: '#8A5A44', top: '#F2C9A0' }, { base: '#5A7A6A', top: '#A8D8C8' },
  { base: '#8A6A3A', top: '#F7E8C8' }, { base: '#7A3A44', top: '#E8A0A0' },
  { base: '#3A5A7A', top: '#9FC8E8' }, { base: '#6A4A6A', top: '#D8A0C8' },
];
const SHOP_SIGNS = [
  ['MANGO & RYE', '#2FA8B5'], ['BOLT BURGER', '#E8443A'], ['FARO BOOKS', '#3A5A7A'],
  ['KOPI ARUN', '#8A5A3A'], ['PASAR SENJA', '#D94F70'], ['VELMARA FM', '#B565D8'],
  ['TOKO BAJU', '#3A9A5A'], ['WARUNG TEPI', '#F2A541'],
];

export function makeBuilding(x, z, w, h, d, seed, shop = false) {
  const g = new THREE.Group();
  const c = FACADE_COLORS[seed % FACADE_COLORS.length];
  const floors = Math.max(2, Math.round(h / 3.2));
  const cols = Math.max(3, Math.round(w / 2.6));
  const sign = shop ? SHOP_SIGNS[seed % SHOP_SIGNS.length] : null;
  const tex = facadeTexture({
    base: c.base, top: c.top, floors, cols,
    sign: sign ? sign[0] : null, signColor: sign ? sign[1] : null,
    litRatio: 0.45 + (seed % 3) * 0.15,
  });
  // End faces (±X, the narrow sides seen along the street) get the same
  // facade WITHOUT the shop sign: a sign stretched across an end face
  // reads as a clipped fragment at the frame edge (BOLT BURGER in shot 2).
  // Material order for BoxGeometry: +x, -x, +y, -y, +z, -z.
  const sideTex = facadeTexture({
    base: c.base, top: c.top, floors, cols: Math.max(3, Math.round(d / 2.6)),
    sign: null, litRatio: 0.45 + (seed % 3) * 0.15,
  });
  const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, flatShading: true });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.base), roughness: 0.9, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    [sideMat, sideMat, capMat, capMat, frontMat, frontMat]);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // thin roof slab + rooftop detail (AC unit / water tank / antenna)
  const roof = box(w + 0.3, 0.35, d + 0.3, 0x6a4a3a); roof.position.y = h + 0.18; g.add(roof);
  const detail = seed % 3;
  if (detail === 0) { // AC unit
    const ac = box(1.2, 0.7, 0.9, 0x9aa2ad); ac.position.set(-w / 4, h + 0.7, 0); g.add(ac);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), mat(0x444444));
    ant.position.set(w / 3, h + 1.8, -d / 4); g.add(ant);
  } else if (detail === 1) { // water tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 10), mat(0x3a6a8a));
    tank.position.set(w / 4, h + 1.1, d / 5); tank.castShadow = true; g.add(tank);
  } else { // antenna + parapet boxes
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 4.5, 6), mat(0x333333));
    ant.position.set(0, h + 2.4, 0); g.add(ant);
    const bx = box(1.6, 0.8, 1.0, 0x7a6a5a); bx.position.set(-w / 4, h + 0.75, d / 4); g.add(bx);
  }
  if (shop) {
    // awning over the shop front + a balcony on an upper floor
    const awn = box(w * 0.7, 0.18, 1.4, 0xd94f70);
    awn.position.set(0, 3.4, d / 2 + 0.6); g.add(awn);
    const balc = box(w * 0.5, 0.15, 1.0, 0x8a7a6a);
    balc.position.set(0, 6.4, d / 2 + 0.4); g.add(balc);
  }
  g.position.set(x, 0, z);
  return g;
}

// --- trees: three real 3D species, always rooted on the ground -------------

export function makePalm(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 3.6, 7), mat(0x8a5a3a));
  trunk.position.y = 1.8; trunk.rotation.z = 0.14; trunk.castShadow = true; g.add(trunk);
  const crown = new THREE.Group(); crown.position.set(0.5, 3.55, 0);
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.38), mat(0x3a9a5a, { side: THREE.DoubleSide }));
    frond.position.y = 0; frond.rotation.y = (i / 6) * Math.PI * 2;
    frond.rotation.x = -0.55; frond.translateY(0); frond.translateZ(0.0);
    // bend the frond outward from the crown
    const holder = new THREE.Group(); holder.rotation.y = (i / 6) * Math.PI * 2;
    frond.position.set(0, -0.12, 0.75); frond.rotation.set(-0.5, 0, 0);
    holder.add(frond); crown.add(holder);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x6a4a2a));
  nut.position.y = -0.1; crown.add(nut);
  g.add(crown);
  g.scale.setScalar(scale);
  return g;
}

export function makePine(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.0, 7), mat(0x6a4a2a));
  trunk.position.y = 0.5; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95 - i * 0.22, 1.7, 8), mat(0x2a7a3a));
    cone.position.y = 1.4 + i * 0.95; cone.castShadow = true; g.add(cone);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeRoundTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.6, 7), mat(0x7a5230));
  trunk.position.y = 0.8; g.add(trunk);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), mat(0x4a9a4a));
  c1.position.y = 2.1; c1.castShadow = true; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), mat(0x5ab55a));
  c2.position.set(0.55, 1.7, 0.2); g.add(c2);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(0x3a8a4a));
  c3.position.set(-0.5, 1.8, -0.15); g.add(c3);
  g.scale.setScalar(scale);
  return g;
}

export function makeBush(scale = 1) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat(0x2f7a3f));
  b.scale.y = 0.7; b.position.y = 0.32; g.add(b);
  g.scale.setScalar(scale);
  return g;
}

export function makeGrassTuft() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.55, 4), mat(0x5ab55a));
    blade.position.set((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.4);
    blade.rotation.z = (Math.random() - 0.5) * 0.5;
    g.add(blade);
  }
  return g;
}

// --- roads with paint that follows the geometry ----------------------------

export function makeRoad(length, width = 8) {
  const g = new THREE.Group();
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(width, length), mat(PALETTE.asphalt, { roughness: 0.95 }));
  asphalt.rotation.x = -Math.PI / 2; asphalt.position.y = 0.01; asphalt.receiveShadow = true; g.add(asphalt);
  // double yellow centre lines — continuous, parallel to the road
  for (const dx of [-0.18, 0.18]) {
    const line = box(0.12, 0.02, length, PALETTE.lineYellow, { roughness: 0.6 });
    line.position.set(dx, 0.03, 0); line.castShadow = false; g.add(line);
  }
  // dashed white lane lines, centred in each lane (two lanes -> 2x dashes)
  const dashCount = Math.floor(length / 5) * 2;
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.02, 2.2), mat(PALETTE.lineWhite, { roughness: 0.6 }), dashCount);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let z = -length / 2 + 2; z < length / 2 - 2; z += 5) {
    for (const dx of [-2.1, 2.1]) {
      m4.setPosition(dx, 0.03, z); dash.setMatrixAt(k++, m4);
    }
  }
  dash.count = k; g.add(dash);
  // sidewalks, slightly raised, both sides
  for (const sx of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(3, length), mat(PALETTE.sidewalk, { roughness: 1 }));
    sw.rotation.x = -Math.PI / 2; sw.position.set(sx * (width / 2 + 1.5), 0.06, 0); sw.receiveShadow = true; g.add(sw);
  }
  return g;
}

export function makeCrosswalk(x, z, width = 8, ry = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    // stripes perpendicular to the road direction
    const s = box(0.55, 0.02, width * 0.85, PALETTE.lineWhite, { roughness: 0.6 });
    s.position.set(-1.6 + i * 0.64, 0.03, 0); s.castShadow = false; g.add(s);
  }
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

export function makeStreetLamp() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), mat(0x2a2f38));
  pole.position.y = 2.1; g.add(pole);
  const arm = box(1.1, 0.08, 0.08, 0x2a2f38); arm.position.set(0.5, 4.15, 0); g.add(arm);
  const head = box(0.5, 0.12, 0.22, 0xffe9a8, { emissive: 0xffe9a8, emissiveIntensity: 1.6 });
  head.position.set(1.0, 4.1, 0); g.add(head);
  return g;
}

export function makeTrafficLight() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.6, 8), mat(0x222222));
  pole.position.y = 2.3; g.add(pole);
  const housing = box(0.4, 1.1, 0.3, 0x1a1a1a); housing.position.set(0, 4.4, 0); g.add(housing);
  const colors = [0xff2a2a, 0xffd23f, 0x39d98a];
  colors.forEach((c, i) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i === 2 ? 2.2 : 0.25 }));
    lamp.position.set(0, 4.75 - i * 0.35, 0.16); g.add(lamp);
  });
  return g;
}

export function makeBillboard(text, x, z, ry = 0) {
  const g = new THREE.Group();
  const posts = box(0.25, 5, 0.25, 0x555555); posts.position.set(-2.4, 2.5, 0); g.add(posts);
  const posts2 = posts.clone(); posts2.position.x = 2.4; g.add(posts2);
  const board = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3, 0.25),
    new THREE.MeshStandardMaterial({ map: signTexture(text), roughness: 0.8 }));
  board.position.y = 6.2; board.castShadow = true; g.add(board);
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

export function makeBeachUmbrella(color) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), mat(0xdddddd));
  pole.position.y = 1.1; g.add(pole);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.55, 8), mat(color));
  top.position.y = 2.3; top.castShadow = true; g.add(top);
  return g;
}

export function makeFloodPuddle(w, d) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: PALETTE.flood, transparent: true, opacity: 0.62, roughness: 0.15, metalness: 0.35 }));
  p.rotation.x = -Math.PI / 2; p.position.y = 0.04; p.receiveShadow = true;
  return p;
}

// --- sky, sea, storm ---------------------------------------------------------

export function makeSky(scene) {
  const geo = new THREE.SphereGeometry(420, 24, 16);
  const colors = [];
  const top = new THREE.Color(PALETTE.skyTop), mid = new THREE.Color(PALETTE.skyMid), hor = new THREE.Color(PALETTE.horizon);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 420;
    const c = y > 0.45 ? top.clone().lerp(mid, 1 - (y - 0.45) / 0.55) : mid.clone().lerp(hor, 1 - (y + 0.1) / 0.55);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  // low sun disc in the west
  const sun = new THREE.Mesh(new THREE.CircleGeometry(16, 24),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }));
  sun.position.set(-260, 42, -180); sun.lookAt(0, 20, 0); scene.add(sun);
  // storm clouds at the horizon + lightning
  const clouds = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const cl = new THREE.Mesh(new THREE.SphereGeometry(14 + (i % 3) * 6, 10, 8),
      mat(i % 2 ? PALETTE.cloudDark : PALETTE.cloudLight, { roughness: 1 }));
    cl.scale.y = 0.35;
    cl.position.set(-260 + i * 65, 55 + (i % 3) * 8, -240 + (i % 2) * 60);
    clouds.add(cl);
  }
  scene.add(clouds);
  return clouds;
}

export function makeLightning(scene, x, y, z) {
  const pts = [];
  let px = x, py = y, pz = z;
  pts.push(new THREE.Vector3(px, py, pz));
  for (let i = 0; i < 6; i++) {
    px += (Math.random() - 0.5) * 8; py -= 9; pz += (Math.random() - 0.5) * 4;
    pts.push(new THREE.Vector3(px, py, pz));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: PALETTE.lightning, transparent: true, opacity: 0.95 }));
  scene.add(line);
  return line;
}

export function makeGround(scene) {
  // base ground plane (grass/earth under the grid)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(0x5f7a45, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true;
  scene.add(ground);
  // sand + sea on the east side
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(16, 400), mat(PALETTE.sand, { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(20, 0, 0); sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 400),
    new THREE.MeshStandardMaterial({ color: PALETTE.sea, transparent: true, opacity: 0.95, roughness: 0.25 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(88, 0.02, 0); scene.add(sea);
  const wave = box(0.5, 0.03, 400, 0xffffff, { roughness: 0.4 });
  wave.position.set(28.2, 0.05, 0); wave.castShadow = false; scene.add(wave);
}

export function makeLights(scene, night = false) {
  const sun = new THREE.DirectionalLight(0xffb36b, night ? 1.6 : 2.8);
  sun.position.set(-45, 55, -30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xe8a0b0, 0x2a2118, 1.1));
  scene.add(new THREE.AmbientLight(0x604858, 0.7));
  return sun;
}
