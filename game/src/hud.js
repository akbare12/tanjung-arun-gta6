/* TANJUNG ARUN — HUD, minimap, title screen and map screen.
   Pure DOM over the WebGL canvas. All numbers come from the shot config
   in main.js, so every shot of one progression agrees with the others. */
(function () {
'use strict';

function el(tag, cls, html) {
  var d = document.createElement(tag);
  if (cls) d.className = cls;
  if (html !== undefined && html !== null) d.innerHTML = html;
  return d;
}
function stars(n) {
  var s = '';
  for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '<span class="off">★</span>';
  return s;
}
function money(n) {
  return 'Rp ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function topBar(hud, s) {
  var tl = el('div', 'panel'); tl.id = 'tl';
  tl.innerHTML = '<div class="stars">' + stars(s.wanted) + '</div>' +
    '<div class="small">WANTED · ' + (s.wanted === 3 ? 'BURON' : s.wanted === 4 ? 'BURON BESAR' : 'BURON') + '</div>' +
    '<div style="margin-top:6px"><span class="small">SKOR</span> <span class="big yellow">' + s.score + '</span></div>' +
    '<div class="small">LV' + s.level + ' · ' + s.xp + '/' + s.xpMax + ' XP</div>' +
    '<div class="bar" style="width:150px"><i style="width:' + Math.round(s.xp / s.xpMax * 100) + '%"></i></div>';
  hud.appendChild(tl);

  var tc = el('div', 'panel'); tc.id = 'tc';
  tc.innerHTML = '<div><span class="yellow" style="font-weight:800">MISI ' + s.mission + '/' + s.missionTotal +
    '</span> · <b>' + s.missionName + '</b> <span class="small teal">' + s.chapter + '</span></div>' +
    '<div class="small" style="margin-top:3px">NEXT: ' + s.next + '</div>';
  hud.appendChild(tc);

  var tr = el('div'); tr.id = 'tr';
  tr.innerHTML = '<div class="panel" style="text-align:right">' +
    '<div><span class="small">BADAI</span> <b class="red">' + s.countdown + '</b> · CAT ' + s.cat + '</div>' +
    '<div class="small" style="margin-top:2px">DAY ' + s.day + ' · ' + s.clock + '</div>' +
    '<div style="margin-top:2px"><span class="big yellow">' + money(s.moneyNum) + '</span></div>' +
    '<div class="small" style="margin-top:2px">KOLEKSI ' + s.collect + '/' + s.collectTotal +
    ' · PROGRES ' + s.progress + '%</div></div>';
  hud.appendChild(tr);
}

function drawMinimap(canvas, o) {
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var minX = -165, maxX = 165, minZ = -165, maxZ = 165;
  function px(x) { return (x - minX) / (maxX - minX) * W; }
  function py(z) { return (z - minZ) / (maxZ - minZ) * H; }
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#16233D'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2FA8B5'; ctx.fillRect(0, py(154), W, H - py(154)); // sea
  ctx.fillStyle = '#E8D5A3'; ctx.fillRect(0, py(140), W, py(154) - py(140)); // beach
  ctx.fillStyle = '#2C3A55'; // blocks
  TA.STREETS.forEach(function (x) {
    TA.STREETS.forEach(function (z) {
      ctx.fillRect(px(x - 15), py(z - 15), px(x + 15) - px(x - 15), py(z + 15) - py(z - 15));
    });
  });
  ctx.strokeStyle = '#5A6B8A'; ctx.lineWidth = 3; // streets
  TA.STREETS.forEach(function (v) {
    ctx.beginPath(); ctx.moveTo(px(v), 0); ctx.lineTo(px(v), H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, py(v)); ctx.lineTo(W, py(v)); ctx.stroke();
  });
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 2.5; // coastal avenue
  ctx.beginPath(); ctx.moveTo(0, py(132)); ctx.lineTo(W, py(132)); ctx.stroke();
  function dot(x, z, color, r) {
    var X = Math.max(6, Math.min(W - 6, px(x))), Y = Math.max(6, Math.min(H - 6, py(z)));
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (o.marker) { // mission marker
    var mx = Math.max(10, Math.min(W - 10, px(o.marker.x)));
    var my = Math.max(10, Math.min(H - 10, py(o.marker.z)));
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath(); ctx.moveTo(mx, my - 8); ctx.lineTo(mx + 6, my + 5); ctx.lineTo(mx - 6, my + 5);
    ctx.closePath(); ctx.fill();
  }
  (o.police || []).forEach(function (p) { dot(p.x, p.z, '#3B82F6', 4); });
  if (o.player) dot(o.player.x, o.player.z, '#E8443A', 6);
  ctx.restore();
}

function minimapBlock(hud, s, o) {
  var wrap = el('div'); wrap.id = 'minimapWrap';
  wrap.style.cssText = 'position:absolute;top:118px;right:14px;text-align:center';
  var cv = document.createElement('canvas');
  cv.id = 'minimap'; cv.width = 200; cv.height = 200;
  cv.style.width = '200px'; cv.style.height = '200px';
  wrap.appendChild(cv);
  var tag = el('div', null, s.district + ' · ' + s.standing);
  tag.id = 'districtTag'; wrap.appendChild(tag);
  hud.appendChild(wrap);
  drawMinimap(cv, o);
}

function dispatchPanel(hud, units) {
  var d = el('div', 'panel'); d.id = 'dispatch';
  var html = '<div class="small" style="margin-bottom:4px">🚓 <b>DISPATCH POLISI</b></div>';
  units.forEach(function (u) {
    html += '<div class="unit"><b>' + u.name + '</b> ' + u.role +
      ' <span class="yellow">' + u.dist + 'm</span><span class="tac">' + u.tac + '</span></div>';
  });
  d.innerHTML = html;
  hud.appendChild(d);
}

function dialogBox(hud, name, line) {
  var d = el('div', 'panel'); d.id = 'dialog';
  d.innerHTML = '<div class="portrait">SA</div><div><div><b style="color:#FFD23F">' + name +
    '</b> <span class="small teal">· FIXER</span></div>' +
    '<div style="font-size:15px;margin-top:3px">“' + line + '”</div></div>';
  hud.appendChild(d);
}

function floater(hud, text, left, top, sub) {
  var f = el('div', 'floater' + (sub ? ' sub' : ''), text);
  f.style.left = left; f.style.top = top;
  hud.appendChild(f);
}

function buildGameplayHud(hud, s, o) {
  topBar(hud, s);
  minimapBlock(hud, s, o.minimap);
  if (s.n === 1) {
    dispatchPanel(hud, [
      { name: 'KITE-1', role: 'MARKSMAN', dist: 15, tac: 'SPOTLIGHT' },
      { name: 'VIPER-2', role: 'PATROLI', dist: 22, tac: 'RAMMING' },
      { name: 'BADAK-3', role: 'PATROLI', dist: 40, tac: 'ROADBLOCK' }
    ]);
    dialogBox(hud, 'SARI “ARUNIKA”', 'Bawa paketnya ke dermaga sebelum rob naik. Jangan berhenti, jangan menoleh.');
    var bl = el('div', 'panel'); bl.id = 'bl';
    bl.innerHTML = '<div class="small">MOBIL</div><div class="bar hp" style="width:180px"><i style="width:82%"></i></div>' +
      '<div class="small" style="margin-top:3px">82% · PLAT PALSU AKTIF</div>';
    hud.appendChild(bl);
    var br = el('div', 'panel'); br.id = 'br';
    br.innerHTML = '<div class="big">128 <span class="small">KM/H</span></div>' +
      '<div class="small">HEAT <span class="yellow">●●○○○</span> · DISGUISE AKTIF</div>';
    hud.appendChild(br);
    floater(hud, '+150', '58%', '30%');
    floater(hud, 'ROB PERTAMA', '58%', '34%', true);
    floater(hud, '+50 DRIFT', '70%', '52%', true);
  } else {
    var warn = el('div', 'panel'); warn.id = 'tcWarn';
    warn.style.cssText = 'position:absolute;top:104px;left:50%;transform:translateX(-50%);' +
      'border-color:#FF5A4E;color:#FFD9D0;font-weight:700;font-size:13px';
    warn.textContent = '⚠ ROB NAIK — AIR PASANG 0,4 M MASUK PASAR ARUN';
    hud.appendChild(warn);
    var bl2 = el('div', 'panel'); bl2.id = 'bl';
    bl2.innerHTML = '<div class="row"><span class="small">HEALTH</span><b>' + s.health + '</b></div>' +
      '<div class="bar hp" style="width:200px"><i style="width:' + s.health + '%"></i></div>' +
      '<div class="row" style="margin-top:6px"><span class="small">ARMOUR</span><b>' + s.armour + '</b></div>' +
      '<div class="bar ar" style="width:200px"><i style="width:' + s.armour + '%"></i></div>' +
      '<div class="small" style="margin-top:5px">RANK RESPECT · <span class="yellow">“ANAK ARUN”</span></div>';
    hud.appendChild(bl2);
    var br2 = el('div', 'panel'); br2.id = 'br';
    br2.innerHTML = '<div><span class="small">SENJATA</span> <b>' + s.weapon + '</b></div>' +
      '<div class="big" style="margin-top:2px">' + s.ammo + '</div>' +
      '<div class="small">AMMO · GANTI SENJATA [1-3]</div>';
    hud.appendChild(br2);
    floater(hud, '+500', '46%', '26%');
    floater(hud, 'SELAMAT DARI ROB', '40%', '30%', true);
    floater(hud, '+195', '62%', '44%', true);
  }
}

function buildTitle(hud, s) {
  var t = el('div'); t.id = 'title';
  t.innerHTML =
    '<div id="titleInner">' +
    '<div id="gameTitle">TANJUNG<br><span class="a">ARUN</span></div>' +
    '<div id="tagline">— BADAI ARUNIKA —</div>' +
    '<div id="tagline" style="color:#fff;font-size:15px;margin-top:6px">Tujuh hari menuju badai. Satu kota untuk direbut.</div>' +
    '<div id="menu"><div class="sel">LANJUTKAN</div><div>MULAI BARU</div>' +
    '<div>PENGATURAN</div><div>KELUAR</div></div></div>' +
    '<div id="slots">' +
    '<div class="slot sel"><h3>SLOT 1 · LANJUTKAN</h3>' +
    '<p>DAY 2 · 17:40 · KUMALA STRAND</p><p>Rp 12.000.000 · MISI 2/8</p><p>PROGRES 12% · LV2</p></div>' +
    '<div class="slot"><h3>SLOT 2</h3>' +
    '<p>DAY 4 · 09:05 · PELABUHAN</p><p>Rp 38.420.000 · MISI 5/8</p><p>PROGRES 46% · LV4</p></div>' +
    '<div class="slot"><h3>SLOT 3</h3><div class="empty">SLOT KOSONG<br>MULAI BARU</div></div>' +
    '</div>' +
    '<div id="shopStrip"><div class="panel"><div class="small" style="margin-bottom:4px">🔧 <b>BENGKEL ARUN</b></div>' +
    '<div class="unit">GANTI PLAT <span class="yellow" style="float:right">Rp 150.000</span></div>' +
    '<div class="unit">CAT ULANG <span class="yellow" style="float:right">Rp 450.000</span></div>' +
    '<div class="unit">ARMOUR <span class="yellow" style="float:right">Rp 750.000</span></div>' +
    '<div class="small" style="margin-top:6px">👥 <b>KRU</b> — SARI (FIXER) · BUDI (DRIVER)</div>' +
    '<div class="unit">HIRE <span class="yellow" style="float:right">Rp 2.000.000</span></div>' +
    '<div class="unit">TRAIN <span class="yellow" style="float:right">Rp 500.000</span></div>' +
    '</div></div>' +
    '<div id="titleFoot">TANJUNG ARUN v1.0 · THREE.JS r160 · OFFLINE · TEKAN ENTER · © 2026 ARUNIKA STUDIO</div>';
  hud.appendChild(t);
}

var MISSIONS = [
  '1 · KEDATANGAN', '2 · ROB PERTAMA', '3 · ARUNIKA MENYALA', '4 · PASAR GELAP',
  '5 · BADAI DATANG', '6 · PELABUHAN TERAKHIR', '7 · ARUNIKA RUNTUH', '8 · BADAI ARUNIKA'
];

function buildMap(hud, s, project) {
  var title = el('div', 'panel'); title.id = 'mapTitle';
  title.innerHTML = '<div class="big">🗺 PETA — TANJUNG ARUN</div>' +
    '<div class="small" style="margin-top:3px">DAY ' + s.day + ' · ' + s.clock + ' · BADAI ' +
    s.countdown + ' · CAT ' + s.cat + '</div>';
  hud.appendChild(title);

  var side = el('div', 'panel'); side.id = 'mapSide';
  side.innerHTML = '<div class="small" style="margin-bottom:4px"><b>DISTRIK</b></div>' +
    '<div class="missionList">' +
    '<div>🏖 PANTAI ROB — <span class="yellow">BANJIR ROB</span></div>' +
    '<div>⚓ PELABUHAN — <span class="yellow">TARGET MISI</span></div>' +
    '<div>🛒 PASAR ARUN — <span class="yellow">BANJIR ROB</span></div>' +
    '<div>🌆 KUMALA STRAND — NETRAL</div></div>' +
    '<div style="margin-top:8px"><span class="small">SKOR</span> <span class="big yellow">' + s.score + '</span>' +
    ' <span class="small">· LV' + s.level + '</span></div>' +
    '<div class="small">UANG <b class="yellow">' + money(s.moneyNum) + '</b></div>' +
    '<div class="small">KOLEKSI ' + s.collect + '/' + s.collectTotal + ' · PROGRES ' + s.progress + '%</div>' +
    '<div class="bar" style="margin-top:4px"><i style="width:' + s.progress + '%"></i></div>' +
    '<div style="margin-top:8px"><span class="chip">HEAT ●●●○○</span><span class="chip">PLAT PALSU</span></div>' +
    '<div class="small" style="margin-top:10px;margin-bottom:3px"><b>DAFTAR MISI — ' + s.mission + '/' +
    s.missionTotal + ' · ' + s.missionName + '</b> <span class="teal">' + s.chapter + '</span></div>' +
    '<div class="missionList">' + MISSIONS.map(function (m, i) {
      var n = i + 1;
      var cls = n < s.mission ? 'done' : (n === s.mission ? 'cur' : 'lock');
      var mark = n < s.mission ? '✓ ' : (n === s.mission ? '▶ ' : '🔒 ');
      return '<div class="' + cls + '">' + mark + m + '</div>';
    }).join('') + '</div>' +
    '<div class="small" style="margin-top:6px">NEXT: ' + s.next + '</div>';
  hud.appendChild(side);

  // district / road / place labels projected from the 3D world
  var labels = [
    { a: 'pantaiRob', text: 'PANTAI ROB', cls: 'district' },
    { a: 'pelabuhan', text: 'PELABUHAN', cls: 'district' },
    { a: 'pasarArun', text: 'PASAR ARUN', cls: 'district' },
    { a: 'kumalaStrand', text: 'KUMALA STRAND', cls: 'district' },
    { a: 'roadPantai', text: 'JL. PANTAI ROB', cls: 'road' },
    { a: 'roadKumala', text: 'JL. KUMALA', cls: 'road' },
    { a: 'roadPasar', text: 'JL. PASAR ARUN', cls: 'road' },
    { a: 'roadPelabuhan', text: 'JL. PELABUHAN', cls: 'road' },
    { a: 'ship', text: 'KM ARUNIKA', cls: 'place' },
    { a: 'pier', text: 'DERMAGA ARUN', cls: 'place' }
  ];
  labels.forEach(function (L) {
    var p = project(L.a);
    if (!p) return;
    var d = el('div', 'mapLabel ' + L.cls, L.text);
    d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    hud.appendChild(d);
  });
}

window.TA = window.TA || {};
TA.buildGameplayHud = buildGameplayHud;
TA.buildTitle = buildTitle;
TA.buildMap = buildMap;
TA.drawMinimap = drawMinimap;
TA.MISSIONS = MISSIONS;
})();
