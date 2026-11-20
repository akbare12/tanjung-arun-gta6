// TANJUNG ARUN — BADAI ARUNIKA v8
// world.js — kota pesisir 3D low-poly: gedung hidup, jalan, pohon, laut, banjir rob.
// Semua geometri dibuat dari seed tetap, jadi setiap shot deterministik.
import * as THREE from 'three';

/** RNG deterministik mulberry32. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const rr = (rng, a, b) => a + rng() * (b - a);

/** Tekstur kanvas generik. */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Langit gradasi vertikal (matahari terbenam / malam / senja). */
export function skyTexture(top, mid, bot) {
  return canvasTex(16, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

/** Kolam cahaya radial (sorot heli / lampu jalan). */
function poolTexture() {
  return canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,242,176,0.95)');
    gr.addColorStop(0.55, 'rgba(255,242,176,0.38)');
    gr.addColorStop(1, 'rgba(255,242,176,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

/** Papan nama toko / rambu, teks terbaca. */
export function signTexture(text, bg, fg, sub) {
  return canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg; g.font = 'bold 54px Arial';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, sub ? h / 2 - 16 : h / 2);
    if (sub) { g.font = 'bold 26px Arial'; g.fillText(sub, w / 2, h - 30); }
  });
}

const SHOP_NAMES = [
  ['WARUNG KOPI', '#3a2a1a', '#ffd27a'], ['TOKO KELONTONG', '#274156', '#ffe9a8'],
  ['BENGKEL ROJAK', '#402020', '#ffb36b'], ['KOST ARUNIKA', '#5b3a6e', '#f2d8ff'],
  ['HOTEL SENJA', '#173a2e', '#7fe3d0'], ['PASAR IKAN', '#123a4d', '#aee6ff'],
  ['WARTEG BU SRI', '#4d2a10', '#ffe9a8'], ['KARAOKE NADA', '#4a1040', '#ff9ecf'],
  ['FOTOKOPI 24J', '#2c2c34', '#e8e8e8'], ['APOTEK SEHAT', '#0f5132', '#b8ffce'],
  ['MASJID ARUN', '#1d4d33', '#ffe9a8'], ['KANTOR POLISI', '#16294d', '#aee6ff'],
  ['BAR OMBAK', '#3d1040', '#ff9ecf'], ['LAUNDRY KILAT', '#274156', '#ffe9a8'],
  ['BAKSO MAS BEJO', '#4d2a10', '#ffd27a'], ['POM MINI', '#402020', '#ffb36b'],
];
const WALL_COLORS = ['#e8d5a3', '#d9a05b', '#c97e5a', '#7fa8a0', '#b8c4a8', '#e0b48f', '#9db8c9', '#d98a7a'];

/** Tekstur fasad gedung: jendela menyala + pintu + papan nama toko di lantai dasar. */
function buildingTexture(rng, litRatio) {
  const base = pick(rng, WALL_COLORS);
  const shop = pick(rng, SHOP_NAMES);
  const lit = rng() < 0.72;
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.20)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // jendela 5 kolom x 9 baris
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 14 + c * 48, y = 14 + r * 42;
        const on = rng() < litRatio;
        g.fillStyle = on ? (lit ? '#ffd27a' : '#ffe9a8') : '#20283a';
        g.fillRect(x, y, 30, 26);
        g.fillStyle = 'rgba(255,255,255,0.25)';
        g.fillRect(x, y, 30, 4);
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
        g.strokeRect(x, y, 30, 26);
      }
    }
    // lantai dasar: papan nama + pintu + etalase
    g.fillStyle = shop[1]; g.fillRect(0, h - 78, w, 78);
    g.fillStyle = shop[2]; g.font = 'bold 24px Arial'; g.textAlign = 'center';
    g.fillText(shop[0], w / 2, h - 50);
    g.fillStyle = '#241a12'; g.fillRect(18, h - 40, 34, 40);
    g.fillStyle = 'rgba(140,220,255,0.75)'; g.fillRect(150, h - 40, 88, 34);
  });
}

function box(w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

/**
 * Bangun dunia. opts: { seed, mood: 'sunset' | 'night' | 'dusk', rain, flood }
 * Mengembalikan { scene, camera, refs, layout }.
 */
export function buildWorld(opts = {}) {
  const seed = opts.seed || 1337;
  const rng = mulberry32(seed);
  const mood = opts.mood || 'sunset';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1280 / 720, 0.1, 1200);

  // ---- langit + kabut + cahaya sesuai suasana ----
  const skyCols = mood === 'night'
    ? ['#070d24', '#16244d', '#2c3d6e']
    : mood === 'dusk'
      ? ['#4a2a6e', '#c65a86', '#ff9e5e']
      : ['#6b4a8f', '#e86a92', '#ffb36b'];
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(...skyCols), side: THREE.BackSide, fog: false }),
  );
  scene.add(sky);
  scene.fog = new THREE.Fog(mood === 'night' ? 0x0d1730 : 0x8a5a7e, 120, 620);
  const hemi = new THREE.HemisphereLight(
    mood === 'night' ? 0x33456e : 0xffd9b0, mood === 'night' ? 0x0a1428 : 0x4a3a5e,
    mood === 'night' ? 0.55 : 1.15);
  scene.add(hemi);
  // matahari rendah di utara-timur: menyinari jalan pantai, bayangan jatuh ke belakang kamera
  const sun = new THREE.DirectionalLight(mood === 'night' ? 0x8fa8ff : 0xffb36b, mood === 'night' ? 0.5 : 1.9);
  sun.position.set(mood === 'night' ? -80 : 120, mood === 'night' ? 120 : 90, mood === 'night' ? 90 : -100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -180; sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180;
  sun.shadow.camera.far = 500;
  scene.add(sun);
  // lampu isi dari arah kamera (barat-daya): mengangkat fasad yang membelakangi matahari
  if (mood !== 'night') {
    const fill = new THREE.DirectionalLight(0xffd9b0, 0.4);
    fill.position.set(-60, 40, 160);
    scene.add(fill);
  }
  // matahari / bulan rendah di cakrawala
  const orb = new THREE.Mesh(new THREE.CircleGeometry(mood === 'night' ? 14 : 26, 32),
    new THREE.MeshBasicMaterial({ color: mood === 'night' ? 0xdfe8ff : 0xffd27a, fog: false }));
  orb.position.set(mood === 'night' ? -320 : 180, mood === 'night' ? 150 : 30, -380);
  orb.lookAt(0, 40, 0);
  scene.add(orb);

  // ---- tanah, pantai, laut ----
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5e });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(40, 0, 0);
  ground.receiveShadow = true;
  scene.add(ground);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 700),
    new THREE.MeshLambertMaterial({ color: 0x2fa8b5 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(300, 0.4, 0);
  sea.receiveShadow = true;
  scene.add(sea);
  // garis ombak di bibir pantai
  for (let i = 0; i < 26; i++) {
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(rr(rng, 6, 16), 1.6),
      new THREE.MeshBasicMaterial({ color: 0xeafcff, transparent: true, opacity: 0.55 }));
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(rr(rng, 132, 140), 0.5, rr(rng, -280, 280));
    scene.add(foam);
  }
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(38, 700),
    new THREE.MeshLambertMaterial({ color: 0xe8d5a3 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(118, 0.15, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  // ---- jalan: aspal + marka putih rata + trotoar ----
  const asphalt = new THREE.MeshLambertMaterial({ color: mood === 'night' ? 0x23262e : 0x33363e });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf2f2e8 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0x9a938a });
  const vStreets = [-120, -80, -40, 0, 40, 80];
  const hStreets = [-120, -80, -40, 0, 40, 80, 120];
  const roadMeshes = [];
  function addRoad(w, l, x, z) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), asphalt);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.05, z);
    r.receiveShadow = true; scene.add(r); roadMeshes.push(r);
    // trotoar di kedua sisi
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, l), walkMat);
    s1.rotation.x = -Math.PI / 2;
    s1.position.set(x - w / 2 - 1.4, 0.08, z); scene.add(s1);
    const s2 = s1.clone(); s2.position.x = x + w / 2 + 1.4; scene.add(s2);
  }
  function addDashesVertical(x, z0, z1) {
    for (let z = z0; z < z1; z += 8) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.4), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.09, z + 1.7);
      scene.add(d);
    }
  }
  function addDashesHorizontal(z, x0, x1) {
    for (let x = x0; x < x1; x += 8) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.35), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(x + 1.7, 0.09, z);
      scene.add(d);
    }
  }
  for (const x of vStreets) { addRoad(10, 300, x, 0); addDashesVertical(x, -148, 148); }
  for (const z of hStreets) { addRoad(300, 10, -20, z); addDashesHorizontal(z, -168, 128); }
  // jalan pantai (pesisir) — jalur kejar-kejaran
  addRoad(14, 320, 112, 0);
  addDashesVertical(112, -158, 158);
  // marka tepi jalan pantai
  for (const ex of [105.4, 118.6]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 320),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    edge.rotation.x = -Math.PI / 2; edge.position.set(ex, 0.09, 0);
    scene.add(edge);
  }

  // ---- gedung: blok kota padat, fasad hidup + balkon 3D + atap ----
  const balconyMat = new THREE.MeshLambertMaterial({ color: 0x6e5a44 });
  const railMat = new THREE.MeshLambertMaterial({ color: 0x2c2c34 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  const buildings = [];
  const blockXs = [-140, -100, -60, -20, 20, 60];
  const blockZs = [-140, -100, -60, -20, 20, 60, 100];
  for (const bx of blockXs) {
    for (const bz of blockZs) {
      if (bx > 80) continue;
      const n = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < n; k++) {
        const w = rr(rng, 16, 26), d = rr(rng, 14, 22);
        const hgt = rr(rng, 9, 42);
        let x = bx + 8 + k * 14 + rr(rng, -2, 2);
        let z = bz + 10 + rr(rng, -3, 3);
        if (x > 92) continue;
        // v8 fix F2a/F2d/F2f: geser 3 gedung agar papan nama terbaca utuh.
        // Tidak memanggil rng, jadi urutan acak dunia lainnya tidak berubah.
        if (bx === 60 && bz === 20 && k === 0) x += 3;   // F2a: P "PASAR IKAN" keluar dari sudut gedung oranye
        if (bx === 20 && bz === -20 && k === 0) z -= 16; // F2d: "BENGKEL ROJAK" sisi selatan masuk frame S2
        if (bx === -20 && bz === -60 && k === 0) x -= 3; // F2f r1: gedung ini MASJID ARUN, bukan "BAR IKAN"
        // (tidak ada papan "BAR IKAN" di scene — lihat neon BAR IKAN di bawah)
        if (bx === 60 && bz === 20 && k === 1) x += 8;   // F2b r2: "FOTOKOPI 24J" keluar dari balik PASAR IKAN (gedung 70.5,30.5)
        if (bx === -20 && bz === -60 && k === 1) x += 4; // S2 r2: P "PASAR IKAN" keluar dari balik fasad timur WARTEG
        const litRatio = mood === 'night' ? 0.62 : mood === 'dusk' ? 0.55 : 0.34;
        const tex = buildingTexture(rng, litRatio);
        const mat = new THREE.MeshLambertMaterial({ map: tex });
        const b = box(w, hgt, d, mat, x, hgt / 2, z);
        scene.add(b);
        buildings.push({ x, z, w, d, h: hgt });
        // atap: tangki air + kotak AC + parapet
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 10),
          new THREE.MeshLambertMaterial({ color: 0x7a7f8a }));
        tank.position.set(x + w / 4, hgt + 1.2, z); tank.castShadow = true; scene.add(tank);
        scene.add(box(2.2, 1, 1.6, roofMat, x - w / 4, hgt + 0.5, z - d / 5));
        scene.add(box(w + 0.4, 0.7, d + 0.4, roofMat, x, hgt + 0.1, z));
        // balkon 3D di fasad depan (sisi jalan)
        const nb = 1 + Math.floor(rng() * 3);
        for (let bi = 0; bi < nb; bi++) {
          const by = rr(rng, 5, Math.max(6, hgt - 4));
          const slab = box(4.4, 0.35, 1.6, balconyMat, x, by, z + d / 2 + 0.8);
          scene.add(slab);
          scene.add(box(4.4, 0.9, 0.12, railMat, x, by + 0.6, z + d / 2 + 1.55));
          scene.add(box(0.12, 0.9, 1.5, railMat, x - 2.1, by + 0.6, z + d / 2 + 0.8));
          scene.add(box(0.12, 0.9, 1.5, railMat, x + 2.1, by + 0.6, z + d / 2 + 0.8));
        }
      }
    }
  }

  // ---- pohon 3D bervariasi + semak + rumput ----
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const leafMats = [0x2e7d4f, 0x3a9a5b, 0x1f6b3a, 0x57a773].map(c => new THREE.MeshLambertMaterial({ color: c }));
  const palmMat = new THREE.MeshLambertMaterial({ color: 0x2f8f5b });
  function palm(x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.38 * s, 7 * s, 7), trunkMat);
    trunk.position.y = 3.5 * s; trunk.rotation.z = rr(rng, -0.08, 0.08);
    trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 3.4 * s, 4), palmMat);
      frond.scale.set(1, 1, 0.18);
      const a = (i / 6) * Math.PI * 2;
      frond.position.set(Math.cos(a) * 1.4 * s, 7 * s, Math.sin(a) * 1.4 * s);
      frond.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
      frond.castShadow = true; g.add(frond);
    }
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x8a6b3a }));
    nut.position.y = 6.8 * s; g.add(nut);
    g.position.set(x, 0, z);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
  }
  function leafy(x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.42 * s, 3.2 * s, 7), trunkMat);
    trunk.position.y = 1.6 * s; trunk.castShadow = true; g.add(trunk);
    const lm = pick(rng, leafMats);
    const blobs = [[0, 4.4, 0, 2.4], [1.4, 3.6, 0.6, 1.7], [-1.3, 3.8, -0.5, 1.6]];
    for (const [bx, by, bz, br] of blobs) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(br * s, 0), lm);
      b.position.set(bx * s, by * s, bz * s); b.castShadow = true; g.add(b);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
  }
  function bush(x, z, s) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * s, 0),
      pick(rng, leafMats));
    b.scale.y = 0.6; b.position.set(x, 0.5 * s, z); b.castShadow = true;
    scene.add(b);
  }
  // palem di sepanjang jalan pantai — lajur barat dikosongkan di koridor kejar-kejaran
  // (z -30..110) supaya palem tidak menutup kamera chase
  for (let z = -150; z <= 150; z += 15) {
    if (Math.abs(z - 10) < 12) continue;
    if (z > -30 && z < 110) {
      if (rng() < 0.6) palm(121.5, z + 8 + rr(rng, -3, 3), rr(rng, 0.85, 1.15));
      continue;
    }
    palm(103.5, z + rr(rng, -3, 3), rr(rng, 0.9, 1.25));
    if (rng() < 0.6) palm(121.5, z + 8 + rr(rng, -3, 3), rr(rng, 0.85, 1.15));
  }
  for (let i = 0; i < 64; i++) {
    const x = rr(rng, -145, 95), z = rr(rng, -145, 145);
    if (Math.abs(x - 112) < 12) continue;
    if (rng() < 0.5) leafy(x, z, rr(rng, 0.8, 1.5));
    else palm(x, z, rr(rng, 0.8, 1.2));
  }
  // v8 fix F2b/F2e: geser 2 pohon yang menutupi papan nama. Dicari dari posisi
  // hasil probe layar (bukan dari urutan RNG) — dunia lainnya tidak berubah.
  for (const o of scene.children) {
    if (o.type !== 'Group' || o.children.length < 4) continue;
    if (Math.abs(o.position.x - 89.9) < 1.5 && Math.abs(o.position.z - 52.8) < 1.5) o.position.x += 4; // F2b: "2" TOKOP
    if (Math.abs(o.position.x + 9.9) < 1.5 && Math.abs(o.position.z - 11.5) < 1.5) o.position.x -= 3; // F2e: W WARTEG
    // S2 r2: 2 tajuk menutupi "BAKS" BAKSO MAS BEJO di frame combat — geser ke barat
    // agar "BAKSO MAS" keluar dari balik tajuk (probe raycast: tajuk di (-8.8,16) & (-12.9,11.5)).
    if (Math.abs(o.position.x + 8.8) < 1.5 && Math.abs(o.position.z - 16.0) < 1.5) o.position.x -= 6;
    if (Math.abs(o.position.x + 12.9) < 1.5 && Math.abs(o.position.z - 11.5) < 1.5) o.position.x -= 6;
    // F2b r2: tajuk di (93.9,52.8) — sudah digeser +4 oleh F2b r1 — menutupi "I 24J"
    // FOTOKOPI setelah gedung digeser +8. Geser ke selatan (mendekati kamera) agar
    // tajuk turun ke bawah papan nama, bukan menutupinya.
    if (Math.abs(o.position.x - 93.9) < 1.5 && Math.abs(o.position.z - 52.8) < 1.5) o.position.z += 16;
    // S3 r3: 2 palem menutupi papan "KARAOKE NADA" di frame title (probe layar:
    // batang A di x~67 menutupi "K", batang B di x~195 menutupi "NA").
    // A digeser ke barat agar batangnya keluar dari kotak glyph; B digeser ke
    // selatan agar tajuknya turun ke bawah papan (pola yang sama seperti F2b r2).
    // Dicari dari posisi hasil probe layar (bukan dari urutan RNG).
    if (Math.abs(o.position.x + 101.3) < 1.5 && Math.abs(o.position.z - 118.9) < 1.5) o.position.x -= 5; // palem A: batang keluar dari "K"
    if (Math.abs(o.position.x + 89.5) < 1.5 && Math.abs(o.position.z - 121.4) < 1.5) o.position.z += 12; // palem B: tajuk turun ke bawah papan
  }
  for (let i = 0; i < 90; i++) {
    const x = rr(rng, -145, 128), z = rr(rng, -148, 148);
    bush(x, z, rr(rng, 0.6, 1.4));
  }

  // ---- lampu jalan ----
  const lampPoleMat = new THREE.MeshLambertMaterial({ color: 0x2c2c34 });
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const lamps = [];
  for (const x of [-120, -80, -40, 0, 40, 80]) {
    for (let z = -135; z <= 135; z += 45) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 6), lampPoleMat);
      pole.position.y = 3.5; pole.castShadow = true; g.add(pole);
      const arm = box(2.2, 0.14, 0.14, lampPoleMat, 1, 6.9, 0);
      g.add(arm);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), lampGlowMat);
      head.position.set(2, 6.8, 0); g.add(head);
      g.position.set(x + 5.4, 0, z);
      scene.add(g); lamps.push(g);
    }
  }

  // ---- banjir rob: air pasang masuk kota ----
  let floodGroup = null;
  if (opts.flood !== false) {
    floodGroup = new THREE.Group();
    // genangan rob menutup lajur timur jalan pantai; lajur barat tetap kering + marka terlihat
    const water = new THREE.Mesh(new THREE.PlaneGeometry(46, 110),
      new THREE.MeshLambertMaterial({ color: 0x2fa8b5, transparent: true, opacity: 0.55 }));
    water.rotation.x = -Math.PI / 2; water.position.set(132, 0.32, -10);
    floodGroup.add(water);
    // genangan kedua: jalan samping di barat jalan pantai (tidak menutup jalan utama)
    const water2 = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
      new THREE.MeshLambertMaterial({ color: 0x2fa8b5, transparent: true, opacity: 0.45 }));
    water2.rotation.x = -Math.PI / 2; water2.position.set(70, 0.3, 40);
    floodGroup.add(water2);
    // karung pasir di tepi genangan (batas lajur kering)
    const sandMat = new THREE.MeshLambertMaterial({ color: 0xc9b184 });
    for (let i = 0; i < 22; i++) {
      const s = box(1.6, 0.55, 0.9, sandMat, 106 + rr(rng, -1, 1), 0.3, -60 + i * 3.2);
      s.rotation.y = rr(rng, -0.2, 0.2);
      floodGroup.add(s);
    }
    // rambu peringatan banjir
    const warn = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2),
      new THREE.MeshBasicMaterial({ map: signTexture('AWAS BANJIR ROB', '#e8443a', '#ffffff', 'AIR PASANG • JALAN DITUTUP') }));
    warn.position.set(104, 2.6, -32); warn.rotation.y = -Math.PI / 2 - 0.35;
    floodGroup.add(warn);
    scene.add(floodGroup);
  }

  // ---- billboard selamat datang + papan neon ----
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(16, 6),
    new THREE.MeshBasicMaterial({ map: signTexture('SELAMAT DATANG', '#6b4a8f', '#ffd27a', 'DI TANJUNG ARUN') }));
  bb.position.set(100, 8, -58); bb.rotation.y = Math.PI / 2 - 0.15;
  scene.add(bb);
  scene.add(box(0.5, 8, 0.5, lampPoleMat, 100, 4, -62));
  scene.add(box(0.5, 8, 0.5, lampPoleMat, 100, 4, -54));
  const neons = [
    ['KOPI', '#ff9ecf', -38, 6, 44], ['HOTEL', '#7fe3d0', 42, 9, -38],
    ['KARAOKE', '#ff6b9e', -78, 7, -42], ['BAR', '#ffb36b', 82, 6, 38],
    ['WARTEG', '#ffe9a8', 2, 5, 82], ['24 JAM', '#aee6ff', -118, 6, 2],
  ];
  for (const [txt, col, x, y, z] of neons) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.8),
      new THREE.MeshBasicMaterial({ map: signTexture(txt, '#12081f', col) }));
    n.position.set(x, y, z); n.rotation.y = rng() > 0.5 ? 0 : Math.PI / 2;
    scene.add(n);
  }
  // v8 fix F2f r2: TIDAK ADA papan "BAR IKAN" di scene (semua 73 papan dicek —
  // yang ada hanya "BAR OMBAK" + neon "BAR" dan "PASAR IKAN"). Tambah neon
  // "BAR IKAN" di tepi barat jalan pantai agar masuk frame S1. Rotasi hardcode,
  // tanpa rng, jadi urutan acak dunia tidak berubah.
  const barIkan = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.8),
    new THREE.MeshBasicMaterial({ map: signTexture('BAR IKAN', '#12081f', '#7fe3d0') }));
  barIkan.position.set(102, 5, 30); barIkan.rotation.y = 0;
  scene.add(barIkan);

  return { scene, camera, rng, buildings, lamps, floodGroup, poolTexture, mood };
}

// ==================== KENDARAAN, ORANG, HELIKOPTER, LAUT ====================

/** Mobil low-poly: bodi + kabin + 4 roda + lampu. */
export function buildCar(THREE, color, police = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a2733 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.85, 2.1), bodyMat);
  body.position.y = 0.75; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 1.9), glassMat);
  cabin.position.set(-0.2, 1.5, 0); cabin.castShadow = true; g.add(cabin);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
  for (const [wx, wz] of [[1.5, 1.05], [1.5, -1.05], [-1.5, 1.05], [-1.5, -1.05]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), wheelMat);
    w.rotation.x = Math.PI / 2; w.position.set(wx, 0.42, wz);
    w.castShadow = true; g.add(w);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const wz of [0.7, -0.7]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.4), lightMat);
    hl.position.set(2.32, 0.85, wz); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xe8443a }));
    tl.position.set(-2.32, 0.85, wz); g.add(tl);
  }
  if (police) {
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x14181f });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.14), doorMat);
    door.position.set(0.1, 0.85, 0); g.add(door);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x222222 }));
    bar.position.set(-0.2, 1.98, 0); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    red.position.set(-0.2, 2.12, 0.26); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
    blue.position.set(-0.2, 2.12, -0.26); g.add(blue);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55),
      new THREE.MeshBasicMaterial({ map: signTexture('POLISI', '#f2f2f2', '#16294d') }));
    sign.position.set(0.1, 1.15, 1.09); g.add(sign);
  }
  return g;
}

/** Pejalan kaki low-poly, pose bervariasi. */
export function buildPed(THREE, rng) {
  const g = new THREE.Group();
  const skin = [0xe8b88a, 0xc98d5f, 0x8a5a3b, 0xf0c8a0][Math.floor(rng() * 4)];
  const shirt = [0xe8443a, 0x2fa8b5, 0xffd27a, 0x7a5fc0, 0x58d68d, 0xf2f2f2, 0xff8fb0][Math.floor(rng() * 7)];
  const pants = [0x2c3550, 0x3a3a3a, 0x5b4a68][Math.floor(rng() * 3)];
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirt });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pants });
  const skinMat = new THREE.MeshLambertMaterial({ color: skin });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.36), shirtMat);
  torso.position.y = 1.28; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), skinMat);
  head.position.y = 1.95; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x1c1410 }));
  hair.position.y = 2.0; g.add(hair);
  const pose = rng();
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.24), pantsMat);
    leg.position.set(0, 0.43, side * 0.17);
    leg.rotation.x = pose < 0.4 ? (side > 0 ? 0.45 : -0.45) : 0;
    leg.castShadow = true; g.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.16), shirtMat);
    arm.position.set(0, 1.3, side * 0.42);
    if (pose > 0.8 && side > 0) { arm.rotation.z = -2.6; arm.position.y = 1.75; } // melambai
    else if (pose < 0.4) { arm.rotation.x = side > 0 ? -0.5 : 0.5; }
    arm.castShadow = true; g.add(arm);
  }
  return g;
}

/** Helikopter polisi + sorot yang melebar ke bawah + kolam cahaya di tanah.
 *  `height` = tinggi heli di atas tanah; kerucut + kolam dihitung dari sana. */
export function buildHeli(THREE, poolTex, height = 53) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1c2f4d });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 2.2), bodyMat);
  body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x2c4a6e }));
  nose.position.set(2.4, -0.1, 0); nose.scale.set(1.2, 0.8, 0.9); g.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 0.5), bodyMat);
  tail.position.set(-4, 0.3, 0); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.9), bodyMat);
  fin.position.set(-5.8, 0.9, 0); g.add(fin);
  const rotorMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
  const rotor = new THREE.Group();
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.5), rotorMat);
    blade.rotation.y = a; rotor.add(blade);
  }
  rotor.position.y = 1.1; g.add(rotor);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const sz of [0.9, -0.9]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.12), skidMat);
    skid.position.set(0, -1.1, sz); g.add(skid);
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  lamp.position.set(1.2, -0.9, 0); g.add(lamp);
  // kerucut sorot: kecil di heli (y=-0.9), melebar ke tanah (y=-(height-0.1))
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2b0, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
  });
  const coneLen = height - 1;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 13, coneLen, 24, 1, true), coneMat);
  cone.position.set(1.2, -(0.9 + coneLen / 2), 0);
  g.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(13, 28),
    new THREE.MeshBasicMaterial({
      map: poolTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(1.2, -(height - 0.1), 0);
  g.add(pool);
  g.userData.rotor = rotor;
  g.userData.cone = cone;
  g.userData.pool = pool;
  return g;
}

/** Perahu nelayan low-poly di laut / dermaga. */
export function buildBoat(THREE, rng, color) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshLambertMaterial({ color: color || [0xe8443a, 0x2fa8b5, 0xffd27a, 0x7a5fc0][Math.floor(rng() * 4)] });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 2.4), hullMat);
  hull.position.y = 0.55; hull.castShadow = true; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 4), hullMat);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.position.set(4.4, 0.55, 0); bow.scale.set(1, 1, 2); g.add(bow);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.8),
    new THREE.MeshLambertMaterial({ color: 0xf2ead8 }));
  cabin.position.set(-0.6, 1.6, 0); cabin.castShadow = true; g.add(cabin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.4, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2f }));
  mast.position.set(1.6, 2.6, 0); g.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.8),
    new THREE.MeshLambertMaterial({ color: 0xfff6d8, side: THREE.DoubleSide }));
  sail.position.set(1.6, 2.8, 0.7); sail.rotation.y = 0.4; g.add(sail);
  // jaring + keranjang ikan
  const net = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6),
    new THREE.MeshLambertMaterial({ color: 0x8a6b3a }));
  net.position.set(-2.4, 1.3, 0); g.add(net);
  return g;
}

/** Dermaga kayu menjorok ke laut + perahu tertambat. */
export function buildPier(THREE, rng, scene) {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(70, 0.5, 8), wood);
  deck.position.set(0, 1.1, 0); deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
  for (let x = -33; x <= 33; x += 6) {
    for (const z of [-3.4, 3.4]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 8), wood);
      pile.position.set(x, 0.1, z); g.add(pile);
    }
  }
  // lampu dermaga + papan nama
  for (const x of [-24, 0, 24]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x2c2c34 }));
    pole.position.set(x, 2.8, -3.2); g.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    bulb.position.set(x, 4.6, -3.2); g.add(bulb);
  }
  const name = new THREE.Mesh(new THREE.PlaneGeometry(10, 2),
    new THREE.MeshBasicMaterial({ map: signTexture('DERMAGA ARUNIKA', '#123a4d', '#aee6ff') }));
  name.position.set(-18, 3.4, 0); name.rotation.y = Math.PI / 2; g.add(name);
  g.position.set(170, 0, -30);
  scene.add(g);
  return g;
}

/** Hujan malam: garis-garis hujan + genangan berkilat. */
export function buildRain(THREE, scene) {
  const count = 900;
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 220;
    const y = Math.random() * 60;
    const z = (Math.random() - 0.5) * 220;
    pos.set([x, y, z, x + 0.4, y - 1.6, z], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0x9fc4e8, transparent: true, opacity: 0.4,
  }));
  scene.add(rain);
  // genangan
  const puddleMat = new THREE.MeshLambertMaterial({ color: 0x2a4a6e, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1 + Math.random() * 2.4, 14), puddleMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set((Math.random() - 0.5) * 160, 0.12, (Math.random() - 0.5) * 160);
    scene.add(p);
  }
  return rain;
}

/**
 * Aktor + staging per shot. Mengisi scene dengan mobil, orang, heli, perahu.
 * shot: 'chase' | 'combat' | 'title' | 'map'
 */
export function stageActors(THREE, world, shot) {
  const { scene, rng } = world;
  const refs = { policeCars: [], boats: [], peds: [] };

  // ---- dermaga + perahu (semua shot, lebih banyak dari v7) ----
  buildPier(THREE, rng, scene);
  const boatSpots = [
    [168, -30, 0.3], [186, -58, -0.5], [205, -8, 0.9], [232, -44, 0.2],
    [258, -18, -0.8], [176, 42, 0.6], [214, 66, -0.3], [248, 30, 0.4],
    [290, -70, 0.1], [160, -78, 0.7], [270, 58, -0.6], [196, 12, 0.2],
  ];
  for (const [x, z, ry] of boatSpots) {
    const b = buildBoat(THREE, rng);
    b.position.set(x, 0.35, z); b.rotation.y = ry;
    scene.add(b); refs.boats.push(b);
  }

  // ---- lalu lintas + pejalan kaki padat di trotoar ----
  const trafficColors = [0x3a6ea5, 0xd9a05b, 0x7a5fc0, 0xe8e8e8, 0x58a05c, 0xc9c9c9];
  const trafficSpots = [
    [-120, -60, 0], [-80, 30, 1], [-40, -90, 0], [0, 60, 1], [40, -20, 0],
    [80, 90, 1], [-120, 100, 0], [0, -110, 1], [40, 110, 0], [-40, 10, 1],
  ];
  for (const [x, z, dir] of trafficSpots) {
    const c = buildCar(THREE, trafficColors[Math.floor(rng() * trafficColors.length)]);
    c.position.set(x + (dir ? 2.6 : -2.6), 0, z);
    c.rotation.y = dir ? Math.PI / 2 : -Math.PI / 2;
    if (Math.abs(x - 112) < 20) continue;
    scene.add(c);
  }
  // pejalan kaki: 42 orang, pose bervariasi, di trotoar & zebra cross
  for (let i = 0; i < 42; i++) {
    const p = buildPed(THREE, rng);
    const street = [-120, -80, -40, 0, 40, 80][Math.floor(rng() * 6)];
    const z = rr(rng, -140, 140);
    const side = rng() > 0.5 ? 6.6 : -6.6;
    p.position.set(street + side, 0, z);
    p.rotation.y = rng() * Math.PI * 2;
    scene.add(p); refs.peds.push(p);
  }
  // kerumunan di pasar ikan + depan warung kopi
  for (let i = 0; i < 10; i++) {
    const p = buildPed(THREE, rng);
    p.position.set(rr(rng, -8, 8), 0, rr(rng, 34, 48));
    p.rotation.y = rng() * Math.PI * 2;
    scene.add(p); refs.peds.push(p);
  }

  // ---- mobil pemain (merah) + polisi mengejar dari belakang ----
  // forward mobil = +x lokal; rotation.y = heading - PI/2, heading PI = menghadap -z (utara)
  const playerCar = buildCar(THREE, 0xe8443a);
  playerCar.position.set(112, 0, 55);
  playerCar.rotation.y = Math.PI / 2; // menghadap -z, kamera di belakang (z+)
  scene.add(playerCar);
  refs.playerCar = playerCar;
  const policeSpots = [
    [107, 67, 0.08], [116, 78, -0.12], [110, 90, 0.05],
  ];
  for (const [x, z, ry] of policeSpots) {
    const pc = buildCar(THREE, 0xf2f2f2, true);
    pc.position.set(x, 0, z);
    pc.rotation.y = Math.PI / 2 + ry;
    scene.add(pc); refs.policeCars.push(pc);
  }
  // satu mobil polisi memotong dari jalan silang (depan, jauh) — menghadap +x ke jalan pantai
  const blocker = buildCar(THREE, 0xf2f2f2, true);
  blocker.position.set(84, 0, -52);
  blocker.rotation.y = 0;
  scene.add(blocker); refs.policeCars.push(blocker);

  // ---- helikopter di atas kejar-kejaran, sorot ke jalan di depan mobil pemain ----
  // v8 fix F1: geser ke barat (x 115 -> 80) agar badan heli terlihat di langit
  // kiri panel HUD "BADAI ARUNIKA", bukan tersembunyi di baliknya.
  const heli = buildHeli(THREE, world.poolTexture(), 42);
  heli.position.set(80, 42, 10);
  heli.rotation.y = 0.5;
  scene.add(heli);
  refs.heli = heli;
  // sorot heli kedua, jauh di atas kota
  // v8 fix F1 (S2): turunkan (y 60 -> 48) agar badan heli masuk frame,
  // tidak hanya sorotnya yang tampak dari tepi atas.
  const heli2 = buildHeli(THREE, world.poolTexture(), 48);
  heli2.position.set(-30, 48, -90);
  heli2.rotation.y = -0.8;
  heli2.scale.setScalar(0.8);
  scene.add(heli2);
  refs.heli2 = heli2;

  // ---- mobil setengah tenggelam di genangan rob ----
  const sunk = buildCar(THREE, 0x3a6ea5);
  sunk.position.set(118, -0.15, 23);
  sunk.rotation.set(0.06, Math.PI / 2 + 0.3, 0.08);
  scene.add(sunk);
  refs.sunkCar = sunk;

  if (shot === 'combat') {
    // pemain jalan kaki + musuh di persimpangan pusat kota
    const player = buildPed(THREE, rng);
    player.scale.setScalar(1.15);
    player.position.set(2, 0, 14);
    player.rotation.y = Math.PI;
    scene.add(player);
    refs.playerPed = player;
    // senapan di tangan pemain
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.14),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    gun.position.set(0.4, 1.35, 0.6);
    player.add(gun);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    flash.position.set(0.4, 1.35, 1.2);
    player.add(flash);
    refs.muzzle = flash;
    for (const [x, z, ry] of [[-9, -8, 0.6], [11, -14, -0.9], [-4, -22, 0.2]]) {
      const e = buildPed(THREE, rng);
      e.position.set(x, 0, z); e.rotation.y = ry;
      scene.add(e); refs.peds.push(e);
    }
    // mobil polisi dengan lampu depan menyala, terlihat di kiri frame menghadap pemain
    const pc = buildCar(THREE, 0xf2f2f2, true);
    pc.position.set(-13, 0, -4);
    pc.rotation.y = -0.9;
    scene.add(pc); refs.policeCars.push(pc);
    buildRain(THREE, scene);
  }

  return refs;
}
