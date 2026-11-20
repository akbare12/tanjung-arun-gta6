// TANJUNG ARUN — BADAI ARUNIKA v7 · world.js
// Low-poly kota pesisir Indonesia. Semua geometri dibuat fresh di sesi ini.
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry32(20261120);
  function R(a, b) { return a + rng() * (b - a); }
  function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }

  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  // ---- langit sunset / malam ----
  function skyTex(night) {
    return canvasTex(16, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      if (night) { gr.addColorStop(0, '#0B1030'); gr.addColorStop(.55, '#1B2350'); gr.addColorStop(1, '#3A2A5E'); }
      else { gr.addColorStop(0, '#6B4A8F'); gr.addColorStop(.5, '#E86A92'); gr.addColorStop(1, '#FFB36B'); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (!night) { g.fillStyle = 'rgba(255,220,150,.9)'; g.beginPath(); g.arc(8, 400, 26, 0, 7); g.fill(); }
      else { g.fillStyle = '#E8ECFF'; for (var i = 0; i < 40; i++) g.fillRect(R(0, 16), R(0, 300), 1, 1); }
    });
  }

  // ---- fasad gedung hidup: jendela menyala, pintu, papan nama, balkon ----
  var SIGNS = ['WARUNG KOPI ARUN', 'BENGKEL JAYA', 'KOST MELATI', 'RM PADANG SARI',
    'TOKO KELONTONG', 'PASAR ARUN', 'LAUNDRY BERSIH', 'FOTOKOPI ARUN', 'APOTEK SEHAT',
    'BAKSO PAK JO', 'WARTEG BU SRI', 'CELL ARUNIKA', 'BARBERSHOP ROB', 'IKAN BAKAR 88'];
  var PALETTES = [
    { base: '#E8A87C', trim: '#C97B4A', win: '#FFD166' },
    { base: '#7FB3A0', trim: '#4E8570', win: '#FFE9A8' },
    { base: '#D97B7B', trim: '#A94F4F', win: '#FFF2B0' },
    { base: '#8FA8D8', trim: '#5F7FB0', win: '#FFE08A' },
    { base: '#E8D5A3', trim: '#B89B5E', win: '#FFD166' },
    { base: '#C98FD0', trim: '#9668A8', win: '#FFF0A0' }
  ];
  function facadeTex(pal, sign, floors, lit) {
    return canvasTex(256, 256, function (g) {
      var grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, pal.base); grad.addColorStop(1, pal.trim);
      g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
      // papan nama toko
      g.fillStyle = '#241A33'; g.fillRect(0, 8, 256, 34);
      g.fillStyle = '#FFD166'; g.font = 'bold 17px Arial'; g.textAlign = 'center';
      g.fillText(sign, 128, 31);
      // jendela per lantai
      var fh = (256 - 50) / floors;
      for (var f = 0; f < floors; f++) for (var c = 0; c < 4; c++) {
        var x = 18 + c * 60, y = 52 + f * fh + 8, w = 38, h = Math.min(34, fh - 16);
        var on = rng() < lit;
        g.fillStyle = on ? pal.win : '#2A2140';
        g.fillRect(x, y, w, h);
        g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
        g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
        if (f % 2 === 0) { // balkon: pelat + pagar vertikal, dibuat besar biar terbaca
          g.fillStyle = 'rgba(20,12,30,.65)'; g.fillRect(x - 4, y + h, w + 8, 9);
          g.fillStyle = '#3A2A55';
          for (var r = 0; r < 5; r++) g.fillRect(x - 4 + r * 10, y + h + 9, 3, 12);
          g.fillRect(x - 4, y + h + 9, w + 8, 2);
        }
      }
      // pintu
      g.fillStyle = '#3A2418'; g.fillRect(108, 222, 40, 34);
      g.fillStyle = '#FFD166'; g.fillRect(140, 238, 4, 4);
      // garis air banjir di dinding
      g.fillStyle = 'rgba(47,168,181,.35)'; g.fillRect(0, 226, 256, 30);
    });
  }

  function makeCar(color, police) {
    var car = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 4.4), bodyMat);
    body.position.y = 0.55; car.add(body);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x1C2438 }));
    cabin.position.set(0, 1.1, -0.2); car.add(cabin);
    // kap + lampu depan
    var hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x222222 }));
    hood.position.set(0, 0.92, 1.8); car.add(hood);
    var lampMat = new THREE.MeshBasicMaterial({ color: 0xFFF6C8 });
    [-0.65, 0.65].forEach(function (x) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.1), lampMat);
      l.position.set(x, 0.62, 2.21); car.add(l);
      var t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xFF2222 }));
      t.position.set(x, 0.62, -2.21); car.add(t);
    });
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]].forEach(function (p) {
      var w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), wheelMat);
      w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.38, p[1]); car.add(w);
    });
    if (police) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 4.42),
        new THREE.MeshLambertMaterial({ color: 0x2244CC }));
      stripe.position.y = 0.72; car.add(stripe);
      var bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xFF2244 }));
      bar.position.set(0, 1.45, -0.2); car.add(bar);
      var bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x2244FF }));
      bar2.position.set(0, 1.45, 0.15); car.add(bar2);
    }
    return car;
  }

  function makeTree() {
    var t = new THREE.Group();
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, R(1.6, 2.6), 7),
      new THREE.MeshLambertMaterial({ color: 0x6B4226 }));
    trunk.position.y = 1.1; t.add(trunk);
    var greens = [0x2E7D4F, 0x3E9B5F, 0x1F6B3A, 0x5FAE6A];
    var n = 2 + Math.floor(rng() * 2);
    for (var i = 0; i < n; i++) {
      var s = R(0.9, 1.7);
      var leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0),
        new THREE.MeshLambertMaterial({ color: pick(greens) }));
      leaf.position.set(R(-0.7, 0.7), R(2.2, 3.4), R(-0.7, 0.7));
      leaf.scale.y = 0.8; t.add(leaf);
    }
    return t;
  }

  function makePerson(shirt) {
    var p = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: shirt });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.85, 8), mat);
    body.position.y = 0.95; p.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xE8B88A }));
    head.position.y = 1.55; p.add(head);
    var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.55, 8),
      new THREE.MeshLambertMaterial({ color: 0x2A2A3A }));
    legs.position.y = 0.28; p.add(legs);
    return p;
  }

  function makeBoat(hullColor, trimColor, fishing) {
    var b = new THREE.Group();
    var hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 7.5),
      new THREE.MeshLambertMaterial({ color: hullColor }));
    hull.position.y = 0.45; b.add(hull);
    var bow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 4),
      new THREE.MeshLambertMaterial({ color: hullColor }));
    bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.45);
    bow.position.set(0, 0.45, 4.6); b.add(bow);
    var trim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 7.5),
      new THREE.MeshLambertMaterial({ color: trimColor }));
    trim.position.y = 0.95; b.add(trim);
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x6B4226 }));
    mast.position.y = 2.4; b.add(mast);
    if (fishing) {
      [-1.9, 1.9].forEach(function (x) {
        var out = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6),
          new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
        out.rotation.x = Math.PI / 2; out.position.set(x, 0.3, 0); b.add(out);
      });
      var net = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.2),
        new THREE.MeshLambertMaterial({ color: 0xD8C98A }));
      net.position.set(0, 1.2, -1.2); b.add(net);
    } else {
      var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 2.4),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
      cabin.position.set(0, 1.4, -0.8); b.add(cabin);
    }
    return b;
  }

  // ---- kios: ATAP DUDUK DI TIANG (tidak melayang) ----
  function makeKiosk(sign) {
    var k = new THREE.Group();
    var postMat = new THREE.MeshLambertMaterial({ color: 0x4A3220 });
    [[-1.4, -1.1], [1.4, -1.1], [-1.4, 1.1], [1.4, 1.1]].forEach(function (p) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 8), postMat);
      post.position.set(p[0], 1.2, p[1]); k.add(post);
    });
    var counter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 2.2),
      new THREE.MeshLambertMaterial({ color: 0xB08954 }));
    counter.position.y = 0.5; k.add(counter);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.0, 4),
      new THREE.MeshLambertMaterial({ color: 0xC0392B }));
    roof.position.y = 2.9; roof.rotation.y = Math.PI / 4; k.add(roof);
    var board = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.55),
      new THREE.MeshBasicMaterial({ map: canvasTex(256, 48, function (g) {
        g.fillStyle = '#241A33'; g.fillRect(0, 0, 256, 48);
        g.fillStyle = '#FFD166'; g.font = 'bold 24px Arial'; g.textAlign = 'center';
        g.fillText(sign, 128, 33);
      }) }));
    board.position.set(0, 2.15, 1.25); k.add(board);
    // dagangan di atas meja
    for (var i = 0; i < 6; i++) {
      var item = new THREE.Mesh(new THREE.BoxGeometry(0.28, R(0.2, 0.45), 0.28),
        new THREE.MeshLambertMaterial({ color: pick([0xE8443A, 0x2FA8B5, 0xFFD166, 0x7FB3A0]) }));
      item.position.set(R(-1.2, 1.2), 1.2, R(-0.7, 0.7)); k.add(item);
    }
    return k;
  }

  function buildWorld(scene, opts) {
    opts = opts || {};
    var night = !!opts.night;
    scene.background = skyTex(night);
    scene.fog = new THREE.Fog(night ? 0x1B2350 : 0xE86A92, 90, 260);
    var hemi = new THREE.HemisphereLight(night ? 0x8A9ACF : 0xFFD9B0, 0x2A4A3A, night ? 0.7 : 1.0);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(night ? 0xB0C4FF : 0xFFB36B, night ? 0.5 : 1.1);
    sun.position.set(-40, 60, 30); scene.add(sun);

    var refs = { boats: [], police: [], people: [] };

    // ---- tanah dasar, laut, pasir ----
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 340),
      new THREE.MeshLambertMaterial({ color: 0x9A8F6A }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 0); scene.add(ground);
    var sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 340),
      new THREE.MeshLambertMaterial({ color: 0x2FA8B5 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(150, 0.15, 0); scene.add(sea);
    var sea2 = new THREE.Mesh(new THREE.PlaneGeometry(120, 340),
      new THREE.MeshLambertMaterial({ color: 0x2795A2 }));
    sea2.rotation.x = -Math.PI / 2; sea2.position.set(150, 0.12, 0); sea2.scale.set(1, 1, 1); scene.add(sea2);
    var sand = new THREE.Mesh(new THREE.PlaneGeometry(26, 340),
      new THREE.MeshLambertMaterial({ color: 0xE8D5A3 }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(78, 0.1, 0); scene.add(sand);

    // ---- dermaga / pier menjorok ke laut ----
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x7A5230 });
    for (var pi = 0; pi < 26; pi++) {
      var plank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 7),
        pierMat);
      plank.position.set(96 + pi * 3.1, 0.9, 30); scene.add(plank);
      var pile = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 6),
        new THREE.MeshLambertMaterial({ color: 0x4A3220 }));
      pile.position.set(96 + pi * 3.1, 0.2, 28.6); scene.add(pile);
      var pile2 = pile.clone(); pile2.position.z = 31.4; scene.add(pile2);
    }
    // lampu dermaga
    for (var li = 0; li < 5; li++) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x222222 }));
      pole.position.set(100 + li * 16, 2.4, 28.8); scene.add(pole);
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xFFE9A8 }));
      lamp.position.set(100 + li * 16, 4.1, 28.8); scene.add(lamp);
    }

    // ---- dermaga SRI ARUNIKA ke-2: kayu, terlihat di shot chase (kanan frame) ----
    // Dermaga lama di z=30, x>=96 jatuh ~69° ke kanan kamera S1 (di luar FOV).
    // Yang ini menjorok dari pasir ke laut di z=-12, x 82..107: ~23-39° ke kanan, dalam frame.
    for (var pj = 0; pj < 8; pj++) {
      var plank2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 7), pierMat);
      plank2.position.set(84 + pj * 3.1, 0.9, -12); scene.add(plank2);
      var pileA = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 6),
        new THREE.MeshLambertMaterial({ color: 0x4A3220 }));
      pileA.position.set(84 + pj * 3.1, 0.2, -13.4); scene.add(pileA);
      var pileB = pileA.clone(); pileB.position.z = -10.6; scene.add(pileB);
    }
    // lampu dermaga ke-2
    [88, 100].forEach(function (lx) {
      var pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x222222 }));
      pole2.position.set(lx, 2.4, -13.2); scene.add(pole2);
      var lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xFFE9A8 }));
      lamp2.position.set(lx, 4.1, -13.2); scene.add(lamp2);
    });

    // ---- perahu: pantai + dermaga + laut ----
    var boatDefs = [
      { x: 96, z: -40, c: 0xFFFFFF, t: 0x2FA8B5, f: true, ry: 0.4 },
      { x: 102, z: -18, c: 0xFFF2CC, t: 0xE8443A, f: true, ry: -0.3 },
      { x: 108, z: -16, c: 0xFFFFFF, t: 0x3E9B5F, f: false, ry: 1.57 }, // SRI ARUNIKA di pier baru (terlihat S1)
      { x: 122, z: 62, c: 0xFFE9A8, t: 0xE86A92, f: true, ry: 1.2 },
      { x: 118, z: -70, c: 0xFFFFFF, t: 0x2FA8B5, f: false, ry: 0.9 },
      { x: 90, z: 84, c: 0xFFD9B0, t: 0xC0392B, f: true, ry: 2.6 },
      { x: 140, z: 10, c: 0xFFFFFF, t: 0x3E9B5F, f: false, ry: -0.7 }   // kapal nelayan lepas pantai
    ];
    boatDefs.forEach(function (d) {
      var b = makeBoat(d.c, d.t, d.f);
      b.position.set(d.x, 0.25, d.z); b.rotation.y = d.ry; scene.add(b); refs.boats.push(b);
    });
    // perahu penyelamat oranye di banjir
    var rescue = makeBoat(0xFF7A1A, 0xFFFFFF, false);
    rescue.position.set(30, 0.9, -12); rescue.rotation.y = 0.5; scene.add(rescue); refs.boats.push(rescue);

    // ---- jalan: aspal + garis putih RATA mengikuti jalan ----
    function road(x, z, w, l, vertical) {
      var g = new THREE.Group();
      var asp = new THREE.Mesh(new THREE.PlaneGeometry(w, l),
        new THREE.MeshLambertMaterial({ color: 0x2E2E3A }));
      asp.rotation.x = -Math.PI / 2; g.add(asp);
      var dashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      var n = Math.floor(l / 6);
      for (var i = 0; i < n; i++) {
        var d = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.6), dashMat);
        d.rotation.x = -Math.PI / 2;
        if (vertical) d.position.set(0, 0.02, -l / 2 + 3 + i * 6);
        else { d.rotation.z = Math.PI / 2; d.position.set(-l / 2 + 3 + i * 6, 0.02, 0); }
        g.add(d);
      }
      // garis tepi putih
      [-w / 2 + 0.4, w / 2 - 0.4].forEach(function (o) {
        var e = new THREE.Mesh(new THREE.PlaneGeometry(0.25, l),
          new THREE.MeshBasicMaterial({ color: 0xE8E8E8 }));
        e.rotation.x = -Math.PI / 2;
        if (vertical) e.position.set(o, 0.02, 0); else { e.rotation.z = Math.PI / 2; e.position.set(0, 0.02, o); }
        g.add(e);
      });
      // zebra di ujung
      for (var z2 = 0; z2 < 6; z2++) {
        var zb = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.4),
          new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        zb.rotation.x = -Math.PI / 2;
        if (vertical) zb.position.set(-2.5 + z2, 0.02, l / 2 - 4);
        else zb.position.set(l / 2 - 4, 0.02, -2.5 + z2);
        g.add(zb);
      }
      g.position.set(x, 0.05, z); scene.add(g);
    }
    road(60, 0, 12, 300, true);    // JALAN DERMAGA (pesisir)
    road(20, 0, 10, 300, true);    // JALAN PANTAI ROB
    road(-20, 0, 10, 300, true);   // JALAN KOTA LAMA
    road(0, -40, 10, 160, false);  // JALAN PASAR
    road(0, 30, 10, 160, false);   // JALAN PELABUHAN
    road(0, 80, 10, 160, false);   // JALAN STASIUN

    // ---- blok kota: gedung hidup padat, isi semua celah ----
    var blockXs = [-52, -38, -8, 6, 34, 46];
    var blockZs = [-110, -80, -55, -18, 8, 48, 62, 100, 120];
    var signIdx = 0;
    blockXs.forEach(function (bx) {
      blockZs.forEach(function (bz) {
        if (Math.abs(bx - 20) < 9 || Math.abs(bx - 60) < 9 || Math.abs(bx + 20) < 9) return;
        var floors = 2 + Math.floor(rng() * 3);
        var pal = pick(PALETTES);
        var sign = SIGNS[signIdx++ % SIGNS.length];
        var tex = facadeTex(pal, sign, floors, night ? 0.85 : 0.55);
        var h = floors * 3.4 + 1.2;
        var b = new THREE.Mesh(new THREE.BoxGeometry(R(9, 13), h, R(8, 11)),
          new THREE.MeshLambertMaterial({ map: tex }));
        b.position.set(bx + R(-1.5, 1.5), h / 2, bz + R(-1.5, 1.5));
        scene.add(b);
        var roof = new THREE.Mesh(new THREE.BoxGeometry(b.geometry.parameters.width + 0.4, 0.3,
          b.geometry.parameters.depth + 0.4),
          new THREE.MeshLambertMaterial({ color: 0x3A2A44 }));
        roof.position.set(b.position.x, h + 0.15, b.position.z); scene.add(roof);
        // balkon 3D di fasad selatan (+Z, menghadap kamera S1/S3) untuk gedung
        // di tepi jalan dermaga (bx 34/46, terlihat S1+S3) dan pasar (bx -38, terlihat S2)
        if (bx === 46 || bx === 34 || bx === -38) {
          var bw = b.geometry.parameters.width, bd = b.geometry.parameters.depth;
          var balMat = new THREE.MeshLambertMaterial({ color: 0x3A2A55 });
          var railMat = new THREE.MeshBasicMaterial({ color: 0x1A1428 });
          [3.6, 7.0].forEach(function (by) {
            if (by > h - 1.5) return;
            [-2.4, 2.4].forEach(function (ox) {
              var slab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 1.1), balMat);
              slab.position.set(b.position.x + ox, by, b.position.z + bd / 2 + 0.55); scene.add(slab);
              var rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.08), railMat);
              rail.position.set(b.position.x + ox, by + 0.45, b.position.z + bd / 2 + 1.05); scene.add(rail);
            });
          });
        }
        // AC / tangki air di atap
        if (rng() < 0.6) {
          var tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.1, 8),
            new THREE.MeshLambertMaterial({ color: 0x2A2A3A }));
          tank.position.set(b.position.x + 2, h + 0.8, b.position.z); scene.add(tank);
        }
        // pohon / semak di sela gedung
        if (rng() < 0.75) {
          var tr = makeTree(); tr.position.set(bx + R(-7, 7), 0, bz + R(6, 9)); tr.scale.setScalar(R(0.8, 1.3)); scene.add(tr);
        }
        if (rng() < 0.6) {
          var bush = new THREE.Mesh(new THREE.IcosahedronGeometry(R(0.5, 0.9), 0),
            new THREE.MeshLambertMaterial({ color: 0x3E9B5F }));
          bush.position.set(bx + R(-6, 6), 0.4, bz + R(-7, 7)); bush.scale.y = 0.6; scene.add(bush);
        }
      });
    });

    // ---- rumah kampung nelayan dekat pantai ----
    for (var hi = 0; hi < 10; hi++) {
      var hx = R(66, 76), hz = R(-120, 130);
      if (Math.abs(hz - 30) < 8) continue;
      var house = new THREE.Group();
      var walls = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 4),
        new THREE.MeshLambertMaterial({ color: pick([0xE8A87C, 0x7FB3A0, 0xE8D5A3, 0xD97B7B]) }));
      walls.position.y = 1.3; house.add(walls);
      var hroof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 4),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
      hroof.position.y = 3.4; hroof.rotation.y = Math.PI / 4; house.add(hroof);
      var door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8),
        new THREE.MeshLambertMaterial({ color: 0x3A2418 }));
      door.position.set(0, 0.9, 2.01); house.add(door);
      var win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8),
        new THREE.MeshBasicMaterial({ color: 0xFFD166 }));
      win.position.set(-1.3, 1.5, 2.01); house.add(win);
      house.position.set(hx, 0, hz); scene.add(house);
      var ht = makeTree(); ht.position.set(hx + R(-4, 4), 0, hz + R(-4, 4)); scene.add(ht);
    }

    // ---- pohon deret di trotoar + rumput/semak sudut ----
    for (var ti = 0; ti < 46; ti++) {
      var tx = pick([14, 26, 54, 66, -26, -14]);
      var tz = R(-140, 140);
      var tree = makeTree(); tree.position.set(tx, 0, tz); tree.scale.setScalar(R(0.8, 1.4)); scene.add(tree);
    }
    for (var gi = 0; gi < 60; gi++) {
      var grass = new THREE.Mesh(new THREE.ConeGeometry(0.35, R(0.5, 1.0), 5),
        new THREE.MeshLambertMaterial({ color: pick([0x4E9B5F, 0x6BAE5A, 0x3E8B4F]) }));
      grass.position.set(R(-60, 74), 0.3, R(-140, 140)); scene.add(grass);
    }

    // ---- mobil parkir + lalu lintas ----
    var carColors = [0x2FA8B5, 0xFFD166, 0x7FB3A0, 0xE8E8E8, 0x3A6BD8, 0xC0392B, 0x8FA8D8];
    for (var ci = 0; ci < 22; ci++) {
      var c = makeCar(pick(carColors), false);
      var lane = pick([14, 26, 54, -26, -14]);
      c.position.set(lane + R(-1.5, 1.5), 0, R(-135, 135));
      c.rotation.y = (rng() < 0.5 ? 0 : Math.PI) + R(-0.1, 0.1);
      scene.add(c);
    }

    // ---- mobil pemain merah + polisi di belakang (arah kejar benar) ----
    var player = makeCar(0xE8443A, false);
    player.position.set(60, 0, 18); player.rotation.y = Math.PI; scene.add(player);
    refs.player = player;
    var pol1 = makeCar(0xF2F2F2, true); pol1.position.set(60, 0, 34); pol1.rotation.y = Math.PI; scene.add(pol1);
    var pol2 = makeCar(0xF2F2F2, true); pol2.position.set(57.5, 0, 44); pol2.rotation.y = Math.PI; scene.add(pol2);
    var pol3 = makeCar(0xF2F2F2, true); pol3.position.set(62.5, 0, 52); pol3.rotation.y = Math.PI; scene.add(pol3);
    refs.police = [pol1, pol2, pol3];

    // ---- helikopter + sorot melebar ke bawah + pool cahaya ----
    var heli = new THREE.Group();
    var hbody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 5.2),
      new THREE.MeshLambertMaterial({ color: 0x2A3A55 }));
    heli.add(hbody);
    var tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 5.5),
      new THREE.MeshLambertMaterial({ color: 0x2A3A55 }));
    tail.position.set(0, 0.3, -5); heli.add(tail);
    var rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x111111 }));
    rotor.position.y = 1.1; heli.add(rotor);
    var rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; heli.add(rotor2);
    var search = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xFFF6C8 }));
    search.position.set(0, -0.9, 1.8); heli.add(search);
    heli.position.set(60, 18, -10); scene.add(heli); // di depan mobil pemain, dalam frame S1 (dulu y=26/z=6: ~30° di atas pusat, off-frame)
    refs.heli = heli;
    // kerucut sorot: apex KECIL di heli, MELEBAR ke tanah. ConeGeometry apex di +Y,
    // jadi TANPA rotation.x=PI (flip itu yang membaliknya: lebar di atas, titik di tanah).
    var coneGeo = new THREE.ConeGeometry(7, 18, 24, 1, true);
    var cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({
      color: 0xFFF2B0, transparent: true, opacity: 0.28, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending }));
    cone.position.set(60, 9, -8); scene.add(cone); // apex y=18 di searchlight heli, alas r=7 di tanah
    var pool = new THREE.Mesh(new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({ color: 0xFFE9A8, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(60, 0.12, -8); scene.add(pool);

    // ---- banjir rob: air pasang masuk kota + sampah mengambang ----
    var flood = new THREE.Mesh(new THREE.PlaneGeometry(150, 200),
      new THREE.MeshLambertMaterial({ color: 0x2FA8B5, transparent: true, opacity: 0.55 }));
    flood.rotation.x = -Math.PI / 2; flood.position.set(10, 0.55, -10); scene.add(flood);
    for (var di = 0; di < 26; di++) {
      var deb = new THREE.Mesh(new THREE.BoxGeometry(R(0.3, 1.1), 0.12, R(0.3, 0.8)),
        new THREE.MeshLambertMaterial({ color: pick([0x8B5A2B, 0xE8443A, 0xFFD166, 0x3A3A3A, 0x7FB3A0]) }));
      deb.position.set(R(-30, 60), 0.62, R(-60, 40));
      deb.rotation.y = R(0, 3); scene.add(deb);
    }
    // garis air di dinding: pita teal di kaki gedung dekat banjir
    for (var wi = 0; wi < 8; wi++) {
      var stripe = new THREE.Mesh(new THREE.PlaneGeometry(R(6, 10), 0.9),
        new THREE.MeshBasicMaterial({ color: 0x2FA8B5, transparent: true, opacity: 0.5 }));
      stripe.position.set(R(-40, 40), 0.9, R(-50, 30));
      stripe.rotation.y = R(0, 3); scene.add(stripe);
    }

    // ---- pasar: kios beratap di tiang + kerumunan ----
    var kioskSigns = ['KIOS 7 · PAKET SARI', 'IKAN BAKAR 88', 'SAYUR BU SRI', 'BUAH ARUNIKA', 'KOPI ROB'];
    kioskSigns.forEach(function (s, i) {
      var k = makeKiosk(s);
      k.position.set(-34 + i * 7, 0, -46 + (i % 2) * 5);
      k.rotation.y = R(-0.3, 0.3); scene.add(k);
    });
    var shirts = [0xE8443A, 0x2FA8B5, 0xFFD166, 0x7FB3A0, 0xC98FD0, 0xE8E8E8, 0x3A6BD8];
    for (var pi2 = 0; pi2 < 34; pi2++) {
      var person = makePerson(pick(shirts));
      // kerumunan di pasar, pantai, trotoar
      var zone = pi2 % 3;
      if (zone === 0) person.position.set(R(-40, -8), 0, R(-52, -34));
      else if (zone === 1) person.position.set(R(70, 76), 0, R(-60, 90));
      else person.position.set(R(-55, 55), 0, R(-130, 130));
      person.rotation.y = R(0, 6.3);
      scene.add(person); refs.people.push(person);
    }
    // polisi pejalan kaki di pasar (shot combat)
    for (var pp = 0; pp < 3; pp++) {
      var cop = makePerson(0x2244CC);
      cop.position.set(-30 + pp * 4, 0, -40 + pp * 2); scene.add(cop); refs.people.push(cop);
    }

    // ---- hujan (shot malam) ----
    if (night) {
      var rainGeo = new THREE.BufferGeometry();
      var pts = [];
      for (var ri = 0; ri < 900; ri++) pts.push(R(-60, 80), R(0, 40), R(-80, 80));
      rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var rain = new THREE.LineSegments(rainGeo,
        new THREE.LineBasicMaterial({ color: 0x9AB8FF, transparent: true, opacity: 0.5 }));
      scene.add(rain);
      // jalan basah: pantulan lewat plane mengkilap tipis
      var wet = new THREE.Mesh(new THREE.PlaneGeometry(160, 300),
        new THREE.MeshLambertMaterial({ color: 0x1A2038, transparent: true, opacity: 0.35 }));
      wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.08, 0); scene.add(wet);
    }
    return refs;
  }
  window.TAWorld = { buildWorld: buildWorld };
})();
