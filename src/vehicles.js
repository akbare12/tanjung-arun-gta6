// Vehicles, helicopter with searchlight, pedestrians.
function blobShadow(rx, rz) {
  const s = new THREE.Mesh(
    new THREE.CircleGeometry(1, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  s.rotation.x = -Math.PI / 2;
  s.scale.set(rx, rz, 1);
  s.position.y = 0.05;
  return s;
}

function makeCar(opts) {
  const o = Object.assign({ body: 0xE8443A, cabin: 0x22262E, police: false }, opts || {});
  const g = new THREE.Group();
  const bodyMat = mat(o.body);
  const darkMat = mat(0x1B2430);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.2), bodyMat);
  body.position.y = 0.62;
  g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.9), bodyMat);
  hood.position.set(0, 0.95, 1.55);
  g.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.0), bodyMat);
  cabin.position.set(0, 1.12, -0.25);
  g.add(cabin);
  // windshield + rear glass
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), darkMat);
  shield.position.set(0, 1.12, 0.78);
  shield.rotation.x = -0.18;
  g.add(shield);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.08), darkMat);
  rear.position.set(0, 1.12, -1.28);
  rear.rotation.x = 0.18;
  g.add(rear);
  // side glass
  [-0.86, 0.86].forEach((x) => {
    const sg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 1.7), darkMat);
    sg.position.set(x, 1.12, -0.25);
    g.add(sg);
  });
  // wheels
  const wheelMat = mat(0x14161A);
  const hubMat = mat(0xC8CCD2);
  [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.36, z);
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8), hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, 0.36, z);
    g.add(hub);
  });
  // headlights + taillights
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xFFF6C8, emissive: 0xFFE9A0 });
  const tailMat = new THREE.MeshLambertMaterial({ color: 0xFF2A20, emissive: 0xC81E14 });
  [-0.65, 0.65].forEach((x) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), lightMat);
    h.position.set(x, 0.68, 2.11);
    g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tailMat);
    t.position.set(x, 0.68, -2.11);
    g.add(t);
  });
  // bumpers
  [-2.12, 2.12].forEach((z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 0.12), mat(0x22262E));
    b.position.set(0, 0.42, z);
    g.add(b);
  });
  if (o.police) {
    // blue stripe along the sides
    [-1.01, 1.01].forEach((x) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 3.6), mat(0x1E4FD8));
      s.position.set(x, 0.72, 0);
      g.add(s);
    });
    // POLISI door decals
    const decal = makeSignTexture('POLISI', 'rgba(0,0,0,0)', '#1E4FD8');
    [-1.03, 1.03].forEach((x) => {
      const d = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.8),
        new THREE.MeshBasicMaterial({ map: decal, transparent: true, depthWrite: false })
      );
      d.position.set(x, 0.75, -0.25);
      d.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(d);
    });
    // roof light bar: red + blue
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.3), mat(0x22262E));
    bar.position.set(0, 1.48, -0.25);
    g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.32),
      new THREE.MeshLambertMaterial({ color: 0xFF2A20, emissive: 0xFF2010 }));
    red.position.set(-0.28, 1.5, -0.25);
    g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.32),
      new THREE.MeshLambertMaterial({ color: 0x2A6AFF, emissive: 0x1E4FD8 }));
    blue.position.set(0.28, 1.5, -0.25);
    g.add(blue);
  }
  g.add(blobShadow(1.5, 2.6));
  return g;
}

function makeHelicopter() {
  const g = new THREE.Group();
  const bodyMat = mat(0x2E4A6B);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 3.4), bodyMat);
  body.position.y = 0;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.0), mat(0x3A5A7A));
  nose.position.set(0, -0.1, 2.0);
  g.add(nose);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 0.7), mat(0x1B2430));
  glass.position.set(0, 0.15, 1.9);
  g.add(glass);
  // tail boom + fin + tail rotor
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.6), bodyMat);
  boom.position.set(0, 0.15, -3.2);
  g.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.9), mat(0x2E4A6B));
  fin.position.set(0, 0.6, -4.9);
  g.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.18), mat(0x22262E));
  tailRotor.position.set(-0.35, 0.3, -4.9);
  g.add(tailRotor);
  // skids
  [-0.7, 0.7].forEach((x) => {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 6), mat(0x22262E));
    skid.rotation.x = Math.PI / 2;
    skid.position.set(x, -0.95, 0.2);
    g.add(skid);
  });
  // main rotor (static angle for shots; spins in interactive mode)
  const rotor = new THREE.Group();
  const bladeMat = mat(0x22262E);
  [-1, 1].forEach((s) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, 0.4), bladeMat);
    b.position.x = s * 1.8;
    rotor.add(b);
  });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6), mat(0x22262E));
  mast.position.y = 0.85;
  rotor.add(mast);
  rotor.position.y = 0.6;
  rotor.name = 'rotor';
  g.add(rotor);
  // searchlight: cone widening DOWNWARD (narrow at heli, wide at ground) + light pool
  const coneH = 17;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, coneH, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xFFF6C8, transparent: true, opacity: 0.15,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  // ConeGeometry apex is already at +h/2: narrow at the heli belly, wide at the ground.
  cone.position.y = -0.8 - coneH / 2;
  g.add(cone);
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xFFEFA0, transparent: true, opacity: 0.3, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -0.8 - coneH + 0.05;
  g.add(pool);
  // small lamp at the belly
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xFFF6C8, emissive: 0xFFE9A0 }));
  lamp.position.y = -0.8;
  g.add(lamp);
  return g;
}

function makePedestrian(opts) {
  const o = Object.assign({ shirt: 0xE8A33D, pants: 0x2E3A55, skin: 0xC98E6B, hair: 0x22262E }, opts || {});
  const g = new THREE.Group();
  // legs in a walking pose (one forward, one back)
  const legMat = mat(o.pants);
  const legF = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.55, 0.17), legMat);
  legF.position.set(-0.11, 0.28, 0.14);
  legF.rotation.x = -0.35;
  g.add(legF);
  const legB = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.55, 0.17), legMat);
  legB.position.set(0.11, 0.28, -0.14);
  legB.rotation.x = 0.35;
  g.add(legB);
  // torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.62, 0.26), mat(o.shirt));
  torso.position.y = 0.86;
  g.add(torso);
  // arms: one swung forward, one back
  const armMat = mat(o.skin);
  const armF = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), armMat);
  armF.position.set(-0.29, 0.85, 0.12);
  armF.rotation.x = -0.4;
  g.add(armF);
  const armB = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), armMat);
  armB.position.set(0.29, 0.85, -0.12);
  armB.rotation.x = 0.4;
  g.add(armB);
  // head + hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mat(o.skin));
  head.position.y = 1.32;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(o.hair));
  hair.position.y = 1.35;
  g.add(hair);
  g.add(blobShadow(0.4, 0.4));
  return g;
}
