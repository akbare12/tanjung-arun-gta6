// City of Tanjung Arun: coastal Indonesian grid city.
// Avenue runs along Z (x=0). Sea to the west (x < -48). Cross streets at z=-35, 0, 35.
const CITY = { avenueHalf: 7, crossZ: [-35, 0, 35] };

function mat(color, opts) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {}));
}

function buildGround(scene) {
  // base ground (muted grass / packed earth)
  const g = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), mat(0x77875F));
  g.rotation.x = -Math.PI / 2;
  g.position.set(0, 0, 0);
  scene.add(g);
  // sea (teal) west of the beach
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(70, 280), mat(0x2FA8B5));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-83, 0.03, 0);
  scene.add(sea);
  // deep-water strip
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(24, 280), mat(0x1F7E96));
  deep.rotation.x = -Math.PI / 2;
  deep.position.set(-106, 0.035, 0);
  scene.add(deep);
  // sand beach
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(14, 280), mat(0xE8D5A3));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-41, 0.02, 0);
  scene.add(sand);
  // wooden pier into the sea
  const pierMat = mat(0x8A6B45);
  const pier = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 4), pierMat);
  pier.position.set(-56, 0.25, 10);
  scene.add(pier);
  const postMat = mat(0x5F4630);
  [-62, -56, -50].forEach((x) => {
    [-1.5, 1.5].forEach((dz) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 6), postMat);
      p.position.set(x, 0.1, 10 + dz);
      scene.add(p);
    });
  });
}

function buildRoads(scene, roadTex) {
  // avenue along Z
  const ave = new THREE.Mesh(new THREE.PlaneGeometry(14, 150), new THREE.MeshLambertMaterial({ map: roadTex }));
  ave.rotation.x = -Math.PI / 2;
  ave.position.set(0, 0.04, 0);
  roadTex.repeat.set(1, 12);
  scene.add(ave);
  // cross streets along X
  CITY.crossZ.forEach((z) => {
    const t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(7, 1);
    t.rotation = Math.PI / 2;
    t.center.set(0.5, 0.5);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(96, 10), new THREE.MeshLambertMaterial({ map: t }));
    s.rotation.x = -Math.PI / 2;
    s.position.set(0, 0.04, z);
    scene.add(s);
    // zebra crossing on the avenue at each cross street
    for (let i = -2; i <= 2; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.4), mat(0xF2F2EA));
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 2.6, 0.055, z + 6.5);
      scene.add(stripe);
    }
  });
  // sidewalks (raised curbs) along the avenue
  const walkMat = mat(0x9AA0A8);
  [-1, 1].forEach((s) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(3, 0.14, 150), walkMat);
    w.position.set(s * 8.5, 0.07, 0);
    scene.add(w);
  });
  CITY.crossZ.forEach((z) => {
    [-1, 1].forEach((s) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(96, 0.14, 2.4), walkMat);
      w.position.set(0, 0.07, z + s * 6.2);
      scene.add(w);
    });
  });
}

const FACADE_VARIANTS = [
  { base: '#E8C9A0', dark: '#B98F5E', trim: '#8A5A2B', sign: 'WARUNG KOPI', signBg: '#5B3A1E', floors: 3, cols: 4, balconies: true, seed: 11 },
  { base: '#C96F4A', dark: '#8F4630', trim: '#5F2A1A', sign: 'HOTEL ARUN', signBg: '#2E4A5A', floors: 5, cols: 4, balconies: true, seed: 23 },
  { base: '#4A8A8F', dark: '#2E5A60', trim: '#E8D5A3', sign: 'PASAR ARUN', signBg: '#7A2E2E', floors: 4, cols: 5, balconies: false, seed: 37 },
  { base: '#D9A441', dark: '#9A6F22', trim: '#5F4630', sign: 'TOKO KELONTONG', signBg: '#2E5A2E', floors: 3, cols: 4, balconies: true, seed: 41 },
  { base: '#C97A7A', dark: '#8F4A4A', trim: '#E8D5A3', sign: 'KOST MELATI', signBg: '#4A2E5A', floors: 4, cols: 4, balconies: true, seed: 53 },
  { base: '#8FA36B', dark: '#5A7040', trim: '#E8D5A3', sign: 'BENGKEL JAYA', signBg: '#22262E', floors: 3, cols: 5, balconies: false, seed: 67 },
  { base: '#7A6AA8', dark: '#4E3E78', trim: '#FFD98A', sign: 'APOTEK SEHAT', signBg: '#1E5A3A', floors: 5, cols: 4, balconies: true, seed: 71 },
  { base: '#E8DCC8', dark: '#A89878', trim: '#8A5A2B', sign: 'RM PADANG', signBg: '#7A2E2E', floors: 3, cols: 4, balconies: false, seed: 83 }
];

function buildBuildings(scene) {
  const rng = makeRng(20261120);
  const roofMat = mat(0x3A3F4A);
  const sideMat = mat(0x6E6258);
  const tankMat = mat(0x3E6E8E);
  const acMat = mat(0xC8CCD2);
  const nearCross = (z) => CITY.crossZ.some((cz) => Math.abs(z - cz) < 10);
  [-1, 1].forEach((side) => {
    let vi = 0;
    for (let z = -64; z <= 64; z += 11) {
      if (nearCross(z)) continue;
      const v = FACADE_VARIANTS[vi % FACADE_VARIANTS.length];
      vi++;
      const w = rng.range(9, 12);      // depth along X
      const d = rng.range(8, 10);      // width along Z
      const h = rng.range(9, 24);
      const tex = makeFacadeTexture(v);
      const mats = [
        new THREE.MeshLambertMaterial({ map: tex }),
        new THREE.MeshLambertMaterial({ map: tex }),
        roofMat, roofMat, sideMat, sideMat
      ];
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
      const x = side * (13 + w / 2 + rng.range(0, 2));
      b.position.set(x, h / 2, z + rng.range(-1.5, 1.5));
      scene.add(b);
      // rooftop props: water tank + AC box on some roofs
      if (rng.next() < 0.6) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.8, 10), tankMat);
        tank.position.set(x + rng.range(-2, 2), h + 0.9, b.position.z + rng.range(-2, 2));
        scene.add(tank);
      }
      if (rng.next() < 0.5) {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), acMat);
        ac.position.set(x + rng.range(-2.5, 2.5), h + 0.4, b.position.z + rng.range(-2.5, 2.5));
        scene.add(ac);
      }
    }
  });
  // a few buildings along the z=0 cross street, east side
  for (let i = 0; i < 3; i++) {
    const v = FACADE_VARIANTS[(i * 3 + 2) % FACADE_VARIANTS.length];
    const tex = makeFacadeTexture(v);
    const h = 11 + i * 4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(9, h, 9), [
      new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ map: tex }),
      roofMat, roofMat, sideMat, sideMat
    ]);
    b.position.set(18 + i * 12, h / 2, -11 - i * 0);
    scene.add(b);
  }
}

const TREE_GREENS = [0x3E7A3A, 0x4C8A44, 0x5A9A3F, 0x2F6B33];

function makeTree(rng, variant) {
  const g = new THREE.Group();
  const trunkMat = mat(0x6B4A2F);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 7), trunkMat);
  trunk.position.y = 0.9;
  g.add(trunk);
  // root mound
  const root = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 8), mat(0x4A3520));
  root.position.y = 0.17;
  g.add(root);
  if (variant === 2) {
    // palm: tall trunk + drooping fronds
    trunk.scale.y = 1.8;
    trunk.position.y = 1.6;
    const frondMat = mat(0x2F6B33);
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 4), frondMat);
      const a = (i / 6) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.9, 3.1, Math.sin(a) * 0.9);
      f.rotation.z = Math.cos(a) * 0.9;
      f.rotation.x = -Math.sin(a) * 0.9;
      g.add(f);
    }
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat(0x4C8A44));
    crown.position.y = 3.3;
    g.add(crown);
  } else {
    const n = variant === 1 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(rng.range(0.9, 1.5), 8, 6),
        mat(TREE_GREENS[Math.floor(rng.next() * TREE_GREENS.length)])
      );
      c.position.set(rng.range(-0.5, 0.5), 2.1 + i * 0.85, rng.range(-0.5, 0.5));
      c.scale.y = 0.85;
      g.add(c);
    }
  }
  return g;
}

function buildTrees(scene) {
  const rng = makeRng(5150);
  [-1, 1].forEach((side) => {
    for (let z = -66; z <= 66; z += 9) {
      if (CITY.crossZ.some((cz) => Math.abs(z - cz) < 8)) continue;
      if (rng.next() < 0.25) continue;
      const t = makeTree(rng, rng.int(0, 2));
      t.position.set(side * 8.6, 0.14, z + rng.range(-1.5, 1.5));
      t.rotation.y = rng.next() * Math.PI * 2;
      scene.add(t);
    }
  });
  // a small park grove on the west block (between beach and avenue)
  for (let i = 0; i < 6; i++) {
    const t = makeTree(rng, rng.int(0, 2));
    t.position.set(-27 + rng.range(-3, 3), 0, -20 + i * 5 + rng.range(-1, 1));
    scene.add(t);
  }
}

function buildBushes(scene) {
  const rng = makeRng(909);
  const bushMat = mat(0x3A6B32);
  const bushMat2 = mat(0x4C7A3A);
  CITY.crossZ.forEach((z) => {
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        if (rng.next() < 0.3) return;
        const b = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.45, 0.8), 8, 6), rng.next() < 0.5 ? bushMat : bushMat2);
        b.scale.y = 0.7;
        b.position.set(sx * 8.7, 0.45, z + sz * 8.5);
        scene.add(b);
      });
    });
  });
  // grass tufts along sidewalk edges
  for (let i = 0; i < 40; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.28, rng.range(0.35, 0.6), 5), i % 2 ? bushMat : bushMat2);
    tuft.position.set((rng.next() < 0.5 ? -1 : 1) * rng.range(7.6, 9.8), 0.3, rng.range(-68, 68));
    scene.add(tuft);
  }
}

function buildLamps(scene) {
  const poleMat = mat(0x2E3238);
  const lampMat = new THREE.MeshLambertMaterial({ color: 0xFFE9A8, emissive: 0xFFD76A });
  CITY.crossZ.forEach((z) => {
    [[-8.6, -8.6], [8.6, -8.6], [-8.6, 8.6], [8.6, 8.6]].forEach(([x, dz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.2, 6), poleMat);
      pole.position.set(x, 2.7, z + dz);
      scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.35), lampMat);
      head.position.set(x * 0.92, 5.3, z + dz);
      scene.add(head);
    });
  });
}

function buildBillboards(scene) {
  const b1 = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshLambertMaterial({ map: makeSignTexture('TANJUNG\nARUN', '#1E3A5A', '#FFD27A', 'KOTA PESISIR') })
  );
  b1.position.set(-11.6, 15, -18);
  b1.rotation.y = Math.PI / 2;
  scene.add(b1);
  const b2 = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshLambertMaterial({ map: makeSignTexture('BADAI\nARUNIKA', '#7A2E2E', '#FFE9C9', '7 HARI LAGI') })
  );
  b2.position.set(11.6, 16, 22);
  b2.rotation.y = -Math.PI / 2;
  scene.add(b2);
}

// Banjir rob: tidal flood water creeping into the streets (the entry's differentiator).
function buildFlood(scene) {
  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x2E9DBF, transparent: true, opacity: 0.6,
    shininess: 100, specular: 0x99DDFF
  });
  const patches = [
    { x: 0, z: 2, w: 16, d: 16 },     // big intersection flood (combat foreground)
    { x: 0, z: -24, w: 12, d: 14 },   // avenue flood ahead (chase)
    { x: -20, z: -20, w: 14, d: 10 }, // west block, near the beach
    { x: 24, z: 35, w: 12, d: 9 },    // east cross street
    { x: 6, z: 48, w: 8, d: 6 },
    { x: -8, z: -48, w: 8, d: 8 }
  ];
  patches.forEach((p) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), waterMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.07, p.z);
    scene.add(m);
  });
  // sandbag rows along the big intersection flood
  const bagMat = mat(0xC2A878);
  for (let i = 0; i < 9; i++) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 0.5), bagMat);
    bag.position.set(-7 + i * 1.75, 0.22, 10.6);
    bag.rotation.y = (i % 2 ? 0.12 : -0.1);
    scene.add(bag);
  }
}
