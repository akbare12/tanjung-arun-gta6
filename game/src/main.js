// TANJUNG ARUN v7 · main.js — renderer + kamera per shot, render sekali lalu diam
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var shot = parseInt(params.get('shot') || '1', 10);
  var W = 1280, H = 720;

  function show(id) { document.getElementById(id).classList.remove('hidden'); }

  if (shot === 4) {
    show('hud-map');
    window.TAHud.drawBigMap();
    document.title = 'SHOT4-READY';
    return;
  }

  var night = (shot === 2);
  var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(1);
  document.getElementById('gl').appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var refs = window.TAWorld.buildWorld(scene, { night: night });
  var camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 600);

  if (shot === 1) {
    // CHASE: di belakang mobil merah, polisi di belakang kita, dermaga + perahu di kanan
    camera.position.set(60, 7.5, 44);
    camera.lookAt(60, 2.5, -20);
    show('hud-chase');
    window.TAHud.drawMini('mm1', 'PANTAI ROB');
  } else if (shot === 2) {
    // COMBAT: pasar banjir malam hujan, kios beratap di tiang
    camera.position.set(-12, 5.5, -22);
    camera.lookAt(-30, 2, -46);
    show('hud-combat');
    window.TAHud.drawMini('mm2', 'PASAR ARUN');
  } else {
    // TITLE: pantai + laut foreground, kota di belakang, senja
    camera.position.set(96, 10, 96);
    camera.lookAt(20, 8, -10);
    show('hud-title');
  }

  var frames = 0;
  function tick() {
    // rotor heli berputar pelan + perahu bergoyang halus
    if (refs.heli) refs.heli.children[3].rotation.y += 0.35;
    refs.boats.forEach(function (b, i) { b.rotation.z = Math.sin((frames + i * 20) * 0.06) * 0.02; });
    renderer.render(scene, camera);
    frames++;
    if (frames < 12) requestAnimationFrame(tick);
    else document.title = 'SHOT' + shot + '-READY';
  }
  tick();
})();
