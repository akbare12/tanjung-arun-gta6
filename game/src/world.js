/* TANJUNG ARUN — world builder. Deterministic: one seeded RNG drives every
   placement, colour and texture, so every render of the same shot is identical.
   No network, no clock, no Math.random in the scene. */
(function () {
'use strict';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rng = mulberry32(20261120);
function rr(a, b) { return a + rng() * (b - a); }
function ri(a, b) { return Math.floor(rr(a, b + 1)); }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }

var STREETS = [-120, -80, -40, 0, 40, 80, 120];
var SHOP_NAMES = ['KEDAI BAKSO', 'TOKO BANGUNAN', 'APOTEK', 'WARUNG KOPI',
  'TOKO KELONTONG', 'BENGKEL ARUN', 'TOKO IKAN', 'WARUNG NASI', 'TOKO BAJU',
  'AYAM GORENG', 'FOTOKOPI', 'ES KELAPA', 'TOKO EMAS', 'WARUNG SOTO'];
var SHOP_BG = ['#C0392B', '#1F618D', '#117A65', '#7D3C98', '#B9770E', '#2E4053'];
var BUILDING_COLORS = ['#E8C9A0', '#D9A066', '#C97B5A', '#A8B8A0', '#E0D5C1',
  '#C9A227', '#B56576', '#7A9E9F', '#E8B4B8', '#9B7EDE', '#D7B98A', '#F2E3C6'];
var TREE_GREENS = [0x3E7A3A, 0x4C8A3F, 0x2F6B33, 0x5A9A45, 0x6FA050];
var CAR_COLORS = [0xE8443A, 0x2E86C1, 0xF1C40F, 0xECF0F1, 0x1C2833, 0x7D3C98,
  0xE67E22, 0x16A085, 0xBDC3C7, 0xC0392B];

function makeCanvas(w, h, fn) {
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  fn(cv.getContext('2d'), w, h);
  return cv;
}

/* Facade texture: lit windows, door, sign band — one texture per building type,
   so a building is a single mesh but reads as a lived-in shophouse. */
function facadeTexture(base, shopName, signBg) {
  var cv = makeCanvas(128, 256, function (ctx, w, h) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.14)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    var y0 = shopName ? 34 : 10;
    for (var r = 0; r < 6; r++) {
      for (var c = 0; c < 4; c++) {
        var x = 8 + c * 30, y = y0 + r * 34;
        var lit = rng() < 0.55;
        ctx.fillStyle = lit ? (rng() < 0.5 ? '#FFD98A' : '#FFE9B8') : '#232833';
        ctx.fillRect(x, y, 20, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, 20, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + 9, y, 2, 24);
      }
    }
    ctx.fillStyle = '#3B2F2F'; ctx.fillRect(52, h - 34, 24, 34); // door
    ctx.fillStyle = '#FFD23F'; ctx.fillRect(52, h - 38, 24, 4);
    if (shopName) {
      ctx.fillStyle = signBg; ctx.fillRect(0, 0, w, 30);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(shopName, w / 2, 16, w - 6);
    }
  });
  var tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Big readable text texture for hero blade signs and ship names. */
function textTexture(text, bg, fg, fontPx) {
  var cv = makeCanvas(512, 128, function (ctx, w, h) {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = fg; ctx.font = 'bold ' + fontPx + 'px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2, w - 24);
  });
  var tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyTexture() {
  var cv = makeCanvas(1024, 512, function (ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#6B4A8F');
    g.addColorStop(0.42, '#9A5A9E');
    g.addColorStop(0.62, '#E86A92');
    g.addColorStop(0.78, '#FFB36B');
    g.addColorStop(0.88, '#FFD9A0');
    g.addColorStop(1.00, '#5A3A55');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var sun = ctx.createRadialGradient(w * 0.72, h * 0.74, 4, w * 0.72, h * 0.74, 120);
    sun.addColorStop(0, 'rgba(255,246,200,1)');
    sun.addColorStop(0.25, 'rgba(255,214,140,0.9)');
    sun.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath(); ctx.arc(w * 0.72, h * 0.74, 26, 0, Math.PI * 2); ctx.fill();
  });
  var tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roadTexture() {
  var cv = makeCanvas(64, 256, function (ctx, w, h) {
    ctx.fillStyle = '#23262B'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var i = 0; i < 200; i++) ctx.fillRect(rng() * w, rng() * h, 2, 2);
    ctx.fillStyle = '#F5F5F0';
    ctx.fillRect(w / 2 - 2, 20, 4, 60);   // centre dash, aligned with the road
    ctx.fillRect(w / 2 - 2, 148, 4, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(3, 0, 2, h); ctx.fillRect(w - 5, 0, 2, h); // edge lines
  });
  var tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function lam(color, opts) {
  var o = { color: color };
  if (opts) for (var k in opts) o[k] = opts[k];
  return new THREE.MeshLambertMaterial(o);
}
function box(w, h, d, mat, x, y, z, parent) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function makeTree(parent) {
  var g = new THREE.Group();
  var trunkH = rr(3.5, 6);
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, trunkH, 6),
    lam(0x6B4A2F));
  trunk.position.y = trunkH / 2; g.add(trunk);
  var green = pick(TREE_GREENS);
  var n = ri(3, 4);
  for (var i = 0; i < n; i++) {
    var s = new THREE.Mesh(new THREE.SphereGeometry(rr(1.3, 2.1), 8, 6), lam(green));
    s.position.set(rr(-1.2, 1.2), trunkH + rr(0.4, 1.6), rr(-1.2, 1.2));
    s.scale.y = 0.75;
    g.add(s);
  }
  g.position.y = 0;
  g.userData.isTree = true;
  parent.add(g);
  return g;
}

function makeCar(color, isPolice) {
  var g = new THREE.Group();
  var bodyMat = lam(color);
  box(4.4, 0.85, 2.0, bodyMat, 0, 0.75, 0, g);
  box(2.3, 0.7, 1.8, lam(isPolice ? 0xF4F6F7 : 0x1B2A3A), -0.2, 1.5, 0, g); // cabin + glass
  box(4.45, 0.28, 2.02, lam(isPolice ? 0xFFFFFF : color), 0, 1.12, 0, g); // belt stripe
  var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  var wheelMat = lam(0x111111);
  var hubMat = lam(0xC0C0C0);
  [[1.5, 0.95], [1.5, -0.95], [-1.5, 0.95], [-1.5, -0.95]].forEach(function (p) {
    var w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2; w.position.set(p[0], 0.42, p[1]); g.add(w);
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 8), hubMat);
    hub.rotation.x = Math.PI / 2; hub.position.set(p[0], 0.42, p[1]); g.add(hub);
  });
  // headlights (front = +X) and taillights
  box(0.1, 0.22, 0.42, lam(0xFFF9C4, { emissive: 0xAAA455 }), 2.22, 0.85, 0.6, g);
  box(0.1, 0.22, 0.42, lam(0xFFF9C4, { emissive: 0xAAA455 }), 2.22, 0.85, -0.6, g);
  box(0.1, 0.22, 0.42, lam(0xFF2A1E, { emissive: 0x881111 }), -2.22, 0.85, 0.6, g);
  box(0.1, 0.22, 0.42, lam(0xFF2A1E, { emissive: 0x881111 }), -2.22, 0.85, -0.6, g);
  if (isPolice) {
    box(1.1, 0.22, 0.5, lam(0x2244FF, { emissive: 0x1122AA }), -0.2, 1.95, -0.3, g);
    box(1.1, 0.22, 0.5, lam(0xFF2222, { emissive: 0xAA1111 }), -0.2, 1.95, 0.3, g);
    box(0.06, 0.5, 1.4, lam(0xFFFFFF), -1.2, 1.35, 0, g); // door POLISI band
  }
  return g;
}

function makePed(shirt) {
  var g = new THREE.Group();
  box(0.22, 0.5, 0.22, lam(0x2C3E50), -0.12, 0.25, 0, g);
  box(0.22, 0.5, 0.22, lam(0x2C3E50), 0.12, 0.25, 0, g);
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.95, 8), lam(shirt));
  body.position.y = 0.98; g.add(body);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), lam(0xE8B98A));
  head.position.y = 1.68; g.add(head);
  if (rng() < 0.4) {
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 10), lam(pick(CAR_COLORS)));
    cap.position.y = 1.9; g.add(cap);
  }
  g.scale.setScalar(rr(0.92, 1.08));
  return g;
}

function makeBoat(len, color, withSail) {
  var g = new THREE.Group();
  var hullMat = lam(color);
  box(len, 2.0, 4.4, hullMat, 0, 1.0, 0, g);
  box(len * 0.92, 0.5, 4.6, lam(0xF4F6F7), 0, 2.1, 0, g); // gunwale rim
  var bow = new THREE.Mesh(new THREE.ConeGeometry(2.2, len * 0.32, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.scale.set(1, 1, 2.0); bow.position.set(len / 2 + len * 0.14, 1.0, 0); g.add(bow);
  box(len * 0.28, 1.6, 3.0, lam(0xF4F6F7), -len * 0.18, 3.1, 0, g); // cabin
  box(len * 0.2, 0.8, 2.6, lam(0x1B2A3A), -len * 0.18, 4.2, 0, g); // cabin glass
  if (withSail) {
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 6), lam(0x6B4A2F));
    mast.position.set(len * 0.1, 6, 0); g.add(mast);
    var sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, 2.4, 0, 0, 9.4, 0, 5.2, 2.4, 0]), 3));
    sailGeo.computeVertexNormals();
    var sail = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color: 0xFFF3D6, side: THREE.DoubleSide }));
    sail.position.set(len * 0.1, 0, 0); g.add(sail);
  }
  return g;
}

function makeShip() {
  var g = new THREE.Group();
  var hull = box(34, 4.2, 9, lam(0x1F618D), 0, 2.1, 0, g);
  var bow = new THREE.Mesh(new THREE.ConeGeometry(4.5, 7, 4), lam(0x1F618D));
  bow.rotation.z = -Math.PI / 2;
  bow.scale.set(1, 1, 2.0); bow.position.set(20, 2.1, 0); g.add(bow);
  box(33, 0.5, 9.2, lam(0xF4F6F7), 0, 4.4, 0, g); // deck
  var contColors = [0xC0392B, 0x2E86C1, 0xF1C40F, 0x117A65, 0xE67E22];
  for (var i = 0; i < 6; i++) {
    box(4.5, 2.4, 3.8, lam(pick(contColors)), -12 + i * 5.2, 5.9, (i % 2 ? 1.8 : -1.8), g);
    if (i % 2 === 0) box(4.5, 2.4, 3.8, lam(pick(contColors)), -12 + i * 5.2, 8.3, (i % 2 ? 1.8 : -1.8), g);
  }
  box(5, 6.5, 7, lam(0xF4F6F7), 13.5, 7.6, 0, g); // bridge tower
  box(5.1, 1.4, 7.1, lam(0x1B2A3A), 13.5, 9.6, 0, g); // bridge glass
  var funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 4.5, 10), lam(0xE8443A));
  funnel.position.set(9, 8.5, 0); g.add(funnel);
  var nameTex = textTexture('KM ARUNIKA', '#123A5C', '#FFFFFF', 64);
  var nameMat = new THREE.MeshBasicMaterial({ map: nameTex });
  var n1 = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), nameMat);
  n1.position.set(-2, 2.2, 4.55); g.add(n1);
  var n2 = n1.clone(); n2.rotation.y = Math.PI; n2.position.z = -4.55; g.add(n2);
  return g;
}

function makeHeli() {
  var g = new THREE.Group();
  box(4.6, 2.0, 2.3, lam(0x1A5276), 0, 0, 0, g); // body
  box(1.6, 1.5, 2.1, lam(0x1B2A3A), 2.2, -0.1, 0, g); // glass nose
  var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 5.5, 8), lam(0x1A5276));
  tail.rotation.z = Math.PI / 2; tail.position.set(-4.6, 0.35, 0); g.add(tail);
  box(0.3, 1.8, 0.9, lam(0xE8443A), -7.2, 1.0, 0, g); // tail fin
  var rotorMat = lam(0x222222);
  var r1 = box(8.5, 0.12, 0.5, rotorMat, 0, 1.35, 0, g);
  var r2 = box(0.5, 0.12, 8.5, rotorMat, 0, 1.35, 0, g);
  r1.rotation.y = 0.5; r2.rotation.y = 0.5;
  var disc = new THREE.Mesh(new THREE.CircleGeometry(4.3, 24),
    new THREE.MeshBasicMaterial({ color: 0xCCCCCC, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 1.35; g.add(disc);
  box(0.5, 0.9, 2.6, lam(0xE8443A), 0, -1.3, 0.9, g); // skid
  box(0.5, 0.9, 2.6, lam(0xE8443A), 0, -1.3, -0.9, g);
  return g; // spotlight cone + ground pool are built in buildWorld (height = heli height)
}

/* Spotlight: cone narrow at the heli, wide at the ground, + a bright pool. */
function makeSpotlight(THREE, x, y, z) {
  var g = new THREE.Group();
  var spot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 6.5, y, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  spot.position.set(x, y / 2, z); g.add(spot);
  var pool = new THREE.Mesh(new THREE.CircleGeometry(6.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xFFE9A0, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.15, z); g.add(pool);
  return g;
}

function buildWorld(THREE) {
  var scene = new THREE.Scene();
  var sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xFFD9B0, 0x4A3A5A, 0.95));
  var sun = new THREE.DirectionalLight(0xFFB36B, 1.35);
  sun.position.set(-120, 55, -60); scene.add(sun);

  var world = { scene: scene, heroSigns: [], boats: [], anchors: {}, streets: STREETS };

  // ground, beach, sea
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), lam(0x454A52));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  var beach = new THREE.Mesh(new THREE.PlaneGeometry(420, 16), lam(0xE8D5A3));
  beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0.06, 148); scene.add(beach);
  var sea = new THREE.Mesh(new THREE.PlaneGeometry(620, 220), lam(0x2FA8B5));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.04, 266); scene.add(sea);

  // roads with aligned white dashes
  var roadTex = roadTexture();
  var roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
  function roadStrip(w, l, x, z, rotY) {
    var tex = roadTex.clone();
    tex.needsUpdate = true; tex.repeat.set(1, Math.max(1, Math.round(l / 32)));
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, l),
      new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rotY || 0;
    m.position.set(x, 0.08, z); scene.add(m);
  }
  STREETS.forEach(function (x) { roadStrip(10, 280, x, 0, 0); });
  STREETS.forEach(function (z) { roadStrip(10, 280, 0, z, Math.PI / 2); });
  roadStrip(9, 300, 0, 132, Math.PI / 2); // coastal avenue JL. PANTAI ROB

  // ---- buildings, block by block ----
  var facadeCache = {};
  function facadeFor(base, shop) {
    var key = base + '|' + (shop || '');
    if (!facadeCache[key]) facadeCache[key] = facadeTexture(base, shop, pick(SHOP_BG));
    return facadeCache[key];
  }
  function building(x, z, w, h, d, shop) {
    var g = new THREE.Group();
    var tex = facadeFor(pick(BUILDING_COLORS), shop);
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ map: tex }));
    body.position.y = h / 2; g.add(body);
    box(w + 0.5, 0.5, d + 0.5, lam(0x2C2C34), 0, h + 0.25, 0, g); // roof slab
    if (rng() < 0.5) box(rr(1, 2), 0.8, rr(1, 2), lam(0x888888), rr(-w / 4, w / 4), h + 0.9, rr(-d / 4, d / 4), g);
    if (rng() < 0.4) { // balcony
      box(w * 0.5, 0.25, 1.2, lam(0x5D4037), 0, h * 0.55, d / 2 + 0.5, g);
      box(0.15, 1.0, 1.2, lam(0x8D6E63), -w * 0.25, h * 0.55 + 0.5, d / 2 + 0.5, g);
      box(0.15, 1.0, 1.2, lam(0x8D6E63), w * 0.25, h * 0.55 + 0.5, d / 2 + 0.5, g);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }

  var shopIdx = 0;
  [-100, -60, -20, 20, 60, 100].forEach(function (bx) {
    [-100, -60, -20, 20, 60, 100].forEach(function (bz) {
      if (bx === -20 && bz === 20) return; // PASAR ARUN plaza
      if (bx === 60 && bz === -60) return; // park
      if (bx === 100 && bz >= 60) return;  // harbour containers zone
      var n = ri(2, 4);
      for (var i = 0; i < n; i++) {
        var w = rr(9, 16), d = rr(9, 15);
        var h = rr(6, bx * bx + bz * bz < 8000 ? 22 : 13);
        var x = bx + rr(-11, 11), z = bz + rr(-11, 11);
        var onMain = Math.abs(x) < 14 || Math.abs(z) < 14;
        var shop = onMain && rng() < 0.6 ? SHOP_NAMES[shopIdx++ % SHOP_NAMES.length] : null;
        building(x, z, w, h, d, shop);
      }
    });
  });

  // coastal shop row facing the sea road (facades at z=118)
  for (var sx = -100; sx <= 100; sx += 20) {
    if (sx === 5) continue; // hero shop below
    var shop = SHOP_NAMES[shopIdx++ % SHOP_NAMES.length];
    building(sx + rr(-3, 3), 112, rr(13, 16), rr(7, 11), 12, shop);
  }
  // hero shops: one shophouse on the street side, two beach kiosks on the
  // sand side — spread across the chase frame so no two signs overlap.
  function heroSign(name, bg, x, y, z, w, h) {
    var tex = textTexture(name, bg, '#FFFFFF', 56);
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(w || 8.5, h || 2.1),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    sign.position.set(x, y, z);
    sign.userData.heroName = name;
    scene.add(sign);
    world.heroSigns.push(sign);
    return sign;
  }
  building(5, 112, 15, 10, 12, 'KEDAI BAKSO');
  // Roadside signboard (F3): the facade sign is edge-on to the chase camera
  // and its left half hides behind the neighbouring shophouse, so the board
  // stands on posts in front of the building line (z=124) where the
  // sightline from the chase camera is clear. Posts sit under the board's
  // ends as seen from the chase camera.
  heroSign('KEDAI BAKSO', '#C0392B', 8, 7.2, 124);
  box(0.3, 6.2, 0.3, lam(0x4E342E), 7.3, 3.1, 128.2, scene);
  box(0.3, 6.2, 0.3, lam(0x4E342E), 8.7, 3.1, 119.8, scene);
  function beachKiosk(name, bg, x, z) {
    box(6, 6, 5, lam(0xE8C9A0), x, 3, z, scene);
    box(7, 0.5, 6, lam(0xC0392B), x, 6.2, z, scene); // roof
    box(5.5, 2.2, 0.4, lam(0x2E86C1), x, 2.2, z - 2.6, scene); // counter
    var poleMat = lam(0x4E342E);
    var p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 6), poleMat);
    p1.position.set(x - 4.2, 7.2, z - 2.6); scene.add(p1);
    var p2 = p1.clone(); p2.position.x = x + 4.2; scene.add(p2);
    heroSign(name, bg, x, 8.4, z - 2.6, 11, 2.7); // bigger: beach kiosks sit far from the chase camera
  }
  beachKiosk('TOKO BANGUNAN', '#1F618D', 30, 147);
  beachKiosk('APOTEK', '#117A65', 70, 144);

  // ---- PASAR ARUN plaza ----
  var plaza = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), lam(0x7A7568));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(-20, 0.09, 20); scene.add(plaza);
  var tugu = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 4.5, 8), lam(0xD7B98A));
  tugu.position.set(-36, 2.25, 36); scene.add(tugu); // far plaza corner: out of the combat frame centre
  world.tugu = tugu;
  box(2.2, 0.6, 2.2, lam(0x8D6E63), -36, 0.3, 36, scene);
  var stallColors = [0xE8443A, 0xF1C40F, 0x2E86C1, 0x117A65, 0xE67E22, 0x7D3C98];
  var stalls = [];
  for (var s = 0; s < 6; s++) {
    var sg = new THREE.Group();
    var ang = (s / 6) * Math.PI * 2;
    var px = -20 + Math.cos(ang) * 13, pz = 20 + Math.sin(ang) * 13;
    box(4.5, 0.9, 2.4, lam(0x6B4A2F), 0, 0.9, 0, sg);
    var canopy = box(5, 0.15, 3, lam(stallColors[s]), 0, 2.6, 0, sg);
    canopy.rotation.z = 0.12;
    for (var f = 0; f < 5; f++) {
      var fruit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
        lam(pick([0xFF6B35, 0xFFD23F, 0x7BE495, 0xE86A92])));
      fruit.position.set(-1.8 + f * 0.9, 1.55, rr(-0.6, 0.6)); sg.add(fruit);
    }
    sg.position.set(px, 0, pz); sg.rotation.y = -ang + Math.PI / 2;
    scene.add(sg); stalls.push(sg);
  }
  world.stalls = stalls;

  // ---- park ----
  var grass = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), lam(0x4C8A3F));
  grass.rotation.x = -Math.PI / 2; grass.position.set(60, 0.09, -60); scene.add(grass);

  // ---- trees (kept out of the chase sightline and hero-sign sightlines) ----
  function treeAt(x, z) {
    var t = makeTree(scene);
    t.position.set(x, 0, z); t.rotation.y = rr(0, Math.PI * 2);
    var sc = rr(0.85, 1.35); t.scale.set(sc, sc, sc);
  }
  for (var tx = -110; tx <= 110; tx += 20) {
    [-118, -78, -38, 2, 42, 82, 118].forEach(function (tz) {
      if (rng() < 0.45) treeAt(tx + rr(-4, 4), tz + rr(-3, 3));
    });
  }
  for (var i = 0; i < 12; i++) treeAt(60 + rr(-15, 15), -60 + rr(-15, 15)); // park
  for (var b = 0; b < 10; b++) treeAt(-100 + b * 20 + rr(-4, 4), 143 + rr(-2, 2)); // beach palms
  // clear chase corridor + hero-sign sightlines (hide any tree that landed there)
  scene.traverse(function (o) {
    if (o.userData && o.userData.isTree) {
      var p = o.position;
      if (p.x > -32 && p.x < 72 && p.z > 104 && p.z < 130) o.visible = false;
      if (p.x > 16 && p.x < 46 && p.z > 136 && p.z < 156) o.visible = false; // TOKO BANGUNAN kiosk (F3: canopy covered the G)
      if (p.x > 56 && p.x < 84 && p.z > 136 && p.z < 156) o.visible = false; // APOTEK kiosk
    }
  });

  // ---- parked + traffic cars ----
  var parked = [];
  for (var c = 0; c < 22; c++) {
    var car = makeCar(pick(CAR_COLORS), false);
    var horizontal = rng() < 0.5;
    var street = pick(STREETS);
    if (horizontal) {
      car.position.set(rr(-130, 130), 0, street + (rng() < 0.5 ? 4.2 : -4.2));
      car.rotation.y = rng() < 0.5 ? 0 : Math.PI;
    } else {
      car.position.set(street + (rng() < 0.5 ? 4.2 : -4.2), 0, rr(-130, 130));
      car.rotation.y = rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    }
    scene.add(car); parked.push(car);
  }
  world.parkedCars = parked;
  var traffic = [];
  for (var t2 = 0; t2 < 6; t2++) {
    var tc = makeCar(pick(CAR_COLORS), false);
    tc.position.set(pick(STREETS) + rr(-2, 2), 0, rr(-120, 120));
    tc.rotation.y = Math.PI / 2; scene.add(tc); traffic.push(tc);
  }
  world.traffic = traffic;

  // ---- player car + police ----
  var playerCar = makeCar(0xE8443A, false);
  playerCar.position.set(8, 0, 132); scene.add(playerCar);
  world.playerCar = playerCar;
  var police1 = makeCar(0x1A5276, true); police1.position.set(-6, 0, 132.5); scene.add(police1);
  var police2 = makeCar(0x1A5276, true); police2.position.set(-18, 0, 131); scene.add(police2);
  world.policeCars = [police1, police2];

  // ---- pedestrians: market crowd + beach crowd + walkers ----
  var peds = [];
  function pedAt(x, z) {
    var p = makePed(pick([0xE8443A, 0x2E86C1, 0xF1C40F, 0xECF0F1, 0x7D3C98, 0xE67E22, 0x16A085]));
    p.position.set(x, 0, z); p.rotation.y = rr(0, Math.PI * 2);
    scene.add(p); peds.push(p);
  }
  for (var m = 0; m < 14; m++) pedAt(-20 + rr(-14, 14), 20 + rr(-14, 14)); // market crowd
  for (var b2 = 0; b2 < 8; b2++) pedAt(rr(-90, -30), rr(141, 151)); // beach crowd
  for (var w2 = 0; w2 < 16; w2++) pedAt(pick(STREETS) + rr(-6, 6), rr(-120, 120));
  world.peds = peds;

  // ---- harbour: containers, pier, boats, ship ----
  for (var k = 0; k < 10; k++) {
    var cc = pick([0xC0392B, 0x2E86C1, 0xF1C40F, 0x117A65, 0xE67E22]);
    box(6, 2.6, 2.6, lam(cc), 100 + (k % 5) * 7, 1.3, 108 + Math.floor(k / 5) * 8, scene);
    if (k % 3 === 0) box(6, 2.6, 2.6, lam(pick([0xC0392B, 0x2E86C1, 0xF1C40F])), 100 + (k % 5) * 7, 3.9, 108 + Math.floor(k / 5) * 8, scene);
  }
  for (var p = 0; p < 12; p++) { // pier planks (F5: 15 wide so the pier reads big on the map)
    box(15, 0.35, 3.6, lam(p % 2 ? 0x8D6E63 : 0x6D4C41), 112, 0.5, 152 + p * 4.2, scene);
  }
  for (var pp = 0; pp < 6; pp++) {
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), lam(0x4E342E));
    post.position.set(105.5, 0.8, 154 + pp * 9); scene.add(post);
    var post2 = post.clone(); post2.position.x = 118.5; scene.add(post2);
  }
  var ship = makeShip();
  ship.position.set(100, 0.1, 178); ship.rotation.y = -0.35; scene.add(ship);
  world.ship = ship;
  var boat1 = makeBoat(16, 0xE67E22, true); boat1.position.set(-55, 0.1, 168); boat1.rotation.y = 0.5; scene.add(boat1);
  var boat2 = makeBoat(22, 0xE8443A, true); boat2.position.set(38, 0.1, 172); boat2.rotation.y = -1.74; scene.add(boat2); // F1: big red fishing boat, long axis across the chase view so the hull reads >=150px
  var boat3 = makeBoat(11, 0xC0392B, false); boat3.position.set(122, 0.1, 162); boat3.rotation.y = 1.1; scene.add(boat3);
  var boat4 = makeBoat(10, 0x117A65, false); boat4.position.set(126, 0.1, 186); boat4.rotation.y = -0.4; scene.add(boat4);
  world.boats = [ship, boat1, boat2, boat3, boat4];

  // ---- helicopter (chase shot) + spotlight onto the player car ----
  var heli = makeHeli();
  heli.position.set(16, 24, 131); scene.add(heli);
  world.heli = heli;
  var spot = makeSpotlight(THREE, 16, 24, 131);
  scene.add(spot);
  world.spotlight = spot;

  // ---- ROB flood: water pushing into the city (F2: brighter teal, wider,
  // foam streaks + splashes + debris so the flood reads in S1 and S2) ----
  var floodMat = new THREE.MeshLambertMaterial({ color: 0x2FB3D4, transparent: true, opacity: 0.72 });
  var floodMarket = new THREE.Mesh(new THREE.PlaneGeometry(56, 56), floodMat);
  floodMarket.rotation.x = -Math.PI / 2; floodMarket.position.set(-20, 0.35, 20); scene.add(floodMarket);
  var floodRoad = new THREE.Mesh(new THREE.PlaneGeometry(80, 18), floodMat.clone());
  floodRoad.rotation.x = -Math.PI / 2; floodRoad.position.set(34, 0.35, 132); scene.add(floodRoad);
  // foam, splashes and debris use a separate seeded RNG so the main
  // placement sequence (and every other shot) is untouched
  var fxRng = mulberry32(20261121);
  function fxRR(a, b) { return a + fxRng() * (b - a); }
  var foamMat = new THREE.MeshBasicMaterial({ color: 0xEAF7FF, transparent: true, opacity: 0.4, depthWrite: false });
  var splashMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85 });
  function foamStreak(cx, cz, len, w, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), foamMat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot;
    m.position.set(cx, 0.42, cz); scene.add(m);
  }
  function splash(cx, cz) {
    var s = new THREE.Mesh(new THREE.ConeGeometry(fxRR(0.25, 0.55), fxRR(0.7, 1.4), 6), splashMat);
    s.position.set(cx, 0.35, cz); scene.add(s);
  }
  for (var f1 = 0; f1 < 8; f1++) foamStreak(fxRR(0, 68), fxRR(124, 140), fxRR(6, 14), fxRR(0.5, 1.1), fxRR(-0.4, 0.4));
  for (var f2 = 0; f2 < 10; f2++) splash(fxRR(0, 68), fxRR(124, 140));
  for (var f3 = 0; f3 < 10; f3++) foamStreak(fxRR(-44, 4), fxRR(-4, 44), fxRR(5, 12), fxRR(0.5, 1.1), fxRR(-0.4, 0.4));
  for (var f4 = 0; f4 < 12; f4++) splash(fxRR(-44, 4), fxRR(-4, 44));
  for (var f5 = 0; f5 < 3; f5++) { // crates adrift in the market flood
    var crate = box(1.3, 0.5, 0.9, lam(0x8D6E63), fxRR(-40, 0), 0.55, fxRR(0, 40), scene);
    crate.rotation.y = fxRR(0, Math.PI);
  }
  world.flood = [floodMarket, floodRoad];

  world.anchors = {
    pantaiRob: new THREE.Vector3(-60, 2, 150),
    pelabuhan: new THREE.Vector3(115, 2, 168),
    pasarArun: new THREE.Vector3(-20, 2, 20),
    kumalaStrand: new THREE.Vector3(10, 2, -60),
    roadPantai: new THREE.Vector3(-30, 2, 132),
    roadKumala: new THREE.Vector3(0, 2, -40),
    roadPasar: new THREE.Vector3(-60, 2, 20),
    roadPelabuhan: new THREE.Vector3(95, 2, 100),
    ship: new THREE.Vector3(100, 6, 178),
    pier: new THREE.Vector3(112, 2, 180)
  };
  return world;
}

window.TA = window.TA || {};
TA.buildWorld = buildWorld;
TA.makeCar = makeCar;
TA.makePed = makePed;
TA.STREETS = STREETS;
})();
