// hud.js — every HUD panel, the round minimap and the full 2D city map.
// All numbers come from state.js, so the dossier shots can never disagree.
import { SHOTS, MISSIONS, DISASTER_JOBS, CREW, DISTRICTS, GARAGE, POLICE_UNITS, WEAPONS, RADIOS, CAREER, DIALOGUE, STREETS, fmtRp } from './state.js';

export function el(tag, cls, html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export function stars(n, max = 5) {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n));
}

export function moneyPanel(shot) {
  const s = SHOTS[shot];
  return el('div', 'hud-panel money-panel',
    `<div class="money">${fmtRp(s.money)}</div>
     <div class="stars">${stars(shot === 1 ? 3 : shot === 2 ? 4 : 2)}</div>
     <div class="rep">REP LV${s.repLevel} · ${s.rank} · ${s.rep}/${s.repMax}</div>
     <div class="repbar"><i style="width:${Math.round((s.rep / s.repMax) * 100)}%"></i></div>`);
}

export function stormPanel(shot) {
  const s = SHOTS[shot];
  return el('div', 'hud-panel storm-panel',
    `<div class="storm-title">🌀 BADAI ARUNIKA</div>
     <div class="storm-count">${s.countdown}</div>
     <div class="storm-cat">CAT ${s.cat} · ANGIN ${s.wind} KM/H</div>
     <div class="storm-land">LANDFALL · DAY 6 · 18:00</div>`);
}

export function missionPanel(shot, missionIdx = 4, stage = '2/3') {
  const s = SHOTS[shot];
  const m = MISSIONS[missionIdx];
  const p = el('div', 'hud-panel mission-panel',
    `<div class="mission-title">MISI ${m.n}/8 · ${m.name}</div>
     <div class="mission-stage">STAGE ${stage} · ${m.desc}</div>
     <div class="mission-bar"><i style="width:${(m.n / 8) * 100}%"></i></div>
     <div class="mission-meta">DAY ${s.day} · ${s.time} · ${fmtRp(s.money)}</div>`);
  return p;
}

export function policePanel(units = POLICE_UNITS, title = 'POLISI · 6 UNIT') {
  const rows = units.map((u) => `
    <div class="pol-row"><span class="pol-unit">${u.unit}</span>
    <span class="pol-tactic" style="color:${u.color}">${u.tactic}</span>
    <span class="pol-dist">${u.dist} m</span></div>`).join('');
  return el('div', 'hud-panel police-panel', `<div class="panel-title">${title}</div>${rows}`);
}

export function disguisePanel(active = 'CAR') {
  const tabs = ['FACE', 'CAR', 'CLOTHES', 'CAMERA'].map((t) =>
    `<span class="dis-tab${t === active ? ' on' : ''}">${t}</span>`).join('');
  return el('div', 'hud-panel disguise-panel',
    `<div class="panel-title">DISGUISE</div><div class="dis-tabs">${tabs}</div>
     <div class="dis-note">RESPRAY ${fmtRp(400000)} · CLEARS 1 STAR</div>`);
}

export function weaponWheel(activeIdx = 1) {
  const slots = WEAPONS.map((w, i) => `
    <div class="wheel-slot${i === activeIdx ? ' active' : ''}">
      <span class="wheel-key">${w.key}</span><span class="wheel-name">${w.name}</span>
      <span class="wheel-ammo">${w.ammo}</span></div>`).join('');
  return el('div', 'hud-panel weapon-wheel', `<div class="panel-title">SENJATA</div>${slots}`);
}

export function healthBars(health = 95, armour = 60) {
  return el('div', 'hud-panel health-panel',
    `<div class="bar-row"><span>HEALTH</span><b>${health}</b><div class="bar"><i class="hp" style="width:${health}%"></i></div></div>
     <div class="bar-row"><span>ARMOUR</span><b>${armour}</b><div class="bar"><i class="ar" style="width:${armour}%"></i></div></div>
     <div class="bar-row"><span>STAMINA</span><b>78</b><div class="bar"><i class="st" style="width:78%"></i></div></div>`);
}

export function dialogueBox(kind) {
  const d = DIALOGUE[kind];
  const boxEl = el('div', 'hud-panel dialogue',
    `<img class="dlg-face" src="" alt="">
     <div class="dlg-body"><div class="dlg-name" style="color:${d.color}">${d.name}</div>
     <div class="dlg-text">“${d.text}”</div></div>`);
  return boxEl;
}

export function radioPanel(idx = 0) {
  const r = RADIOS[idx];
  return el('div', 'hud-panel radio-panel', `♪ <b>${r.name}</b> — ${r.track}`);
}

export function speedPanel(kmh, carName, condition) {
  return el('div', 'hud-panel speed-panel',
    `<div class="speed">${kmh}</div><div class="speed-unit">KM/H</div>
     <div class="car-name">${carName}</div>
     <div class="car-cond">CONDITION <div class="bar"><i style="width:${condition}%"></i></div> ${condition}%</div>`);
}

export function floatingScore(text, cls = '') {
  return el('div', `float-score ${cls}`, text);
}

export function ammoCounter(weaponName, ammo) {
  return el('div', 'hud-panel ammo-counter', `<div class="ammo-big">${ammo}</div><div class="ammo-name">${weaponName}</div>`);
}

export function crosshair() {
  return el('div', 'crosshair', '<i></i><i></i><i></i><i></i>');
}

// --- round minimap ---------------------------------------------------------

export function drawMinimap(canvas, { player = { x: 0.5, y: 0.62 }, police = [], route = true } = {}) {
  const g = canvas.getContext('2d');
  const S = canvas.width, C = S / 2;
  g.clearRect(0, 0, S, S);
  g.save();
  g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#1A2433'; g.fillRect(0, 0, S, S);
  // sea east
  g.fillStyle = '#2FA8B5'; g.fillRect(S * 0.72, 0, S * 0.28, S);
  g.fillStyle = '#E8D5A3'; g.fillRect(S * 0.66, 0, S * 0.06, S);
  // district blocks
  const cols = ['#B565D8', '#F2A541', '#2FA8B5', '#D94F70', '#3A9A5A'];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    g.fillStyle = cols[(i + j) % 5]; g.globalAlpha = 0.55;
    g.fillRect(6 + i * 20, 6 + j * 20, 17, 17); g.globalAlpha = 1;
  }
  // roads
  g.strokeStyle = '#F2F2F2'; g.lineWidth = 3;
  for (let i = 0; i <= 5; i++) {
    g.beginPath(); g.moveTo(6 + i * 20, 0); g.lineTo(6 + i * 20, S); g.stroke();
    g.beginPath(); g.moveTo(0, 6 + i * 20); g.lineTo(S, 6 + i * 20); g.stroke();
  }
  // flood zone
  g.fillStyle = 'rgba(74,122,106,0.75)';
  g.fillRect(S * 0.1, S * 0.7, S * 0.4, S * 0.2);
  g.fillStyle = '#FFFFFF'; g.font = 'bold 9px sans-serif'; g.fillText('BANJIR ROB', S * 0.12, S * 0.78);
  // GPS route
  if (route) {
    g.strokeStyle = '#FF5C8A'; g.lineWidth = 4; g.setLineDash([]);
    g.beginPath(); g.moveTo(S * player.x, S * player.y);
    g.lineTo(S * 0.3, S * 0.3); g.lineTo(S * 0.62, S * 0.22); g.stroke();
  }
  // police dots
  g.fillStyle = '#2A6BFF';
  for (const p of police) { g.beginPath(); g.arc(S * p.x, S * p.y, 4, 0, Math.PI * 2); g.fill(); }
  // player arrow
  g.fillStyle = '#E8443A';
  g.beginPath(); g.moveTo(S * player.x, S * player.y - 7); g.lineTo(S * player.x + 5, S * player.y + 5);
  g.lineTo(S * player.x - 5, S * player.y + 5); g.closePath(); g.fill();
  g.restore();
  g.strokeStyle = '#2DD4BF'; g.lineWidth = 3;
  g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#FFFFFF'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center';
  g.fillText('N', C, 14);
}

// --- full 2D city map (shot 4) ---------------------------------------------

export function drawMap(canvas, shot = 4) {
  const s = SHOTS[shot];
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  g.fillStyle = '#101827'; g.fillRect(0, 0, W, H);
  // district zones: 3 cols x 3 rows (x: 30/260/470, y: 20/175/330)
  const zones = [
    { x: 30, y: 20, w: 220, h: 145, c: '#4A2A6B', name: 'KOTA TUA' },
    { x: 260, y: 20, w: 200, h: 145, c: '#6B4A1F', name: 'PANTAI ARUNIKA' },
    { x: 470, y: 20, w: 200, h: 145, c: '#1F4A4A', name: 'PELABUHAN' },
    { x: 30, y: 175, w: 220, h: 145, c: '#5E1F30', name: 'PASAR SENJA' },
    { x: 260, y: 175, w: 200, h: 145, c: '#1F3A6B', name: 'MARINA' },
    { x: 470, y: 175, w: 200, h: 145, c: '#3A3A3A', name: 'BANDARA ARUN' },
    { x: 30, y: 330, w: 220, h: 145, c: '#1F4A2A', name: 'PERBUKITAN' },
    { x: 260, y: 330, w: 200, h: 145, c: '#6B5E2A', name: 'KAMPUNG NELAYAN' },
  ];
  for (const z of zones) {
    g.fillStyle = z.c; g.fillRect(z.x, z.y, z.w, z.h);
    g.strokeStyle = 'rgba(45,212,191,0.7)'; g.lineWidth = 2; g.strokeRect(z.x, z.y, z.w, z.h);
    g.fillStyle = '#FFFFFF'; g.font = 'bold 13px sans-serif'; g.fillText(z.name, z.x + 12, z.y + 28);
  }
  // street grid
  g.strokeStyle = 'rgba(242,242,242,0.85)'; g.lineWidth = 3;
  for (let i = 0; i <= 6; i++) {
    g.beginPath(); g.moveTo(40 + i * 105, 20); g.lineTo(40 + i * 105, 470); g.stroke();
    g.beginPath(); g.moveTo(30, 30 + i * 72); g.lineTo(680, 30 + i * 72); g.stroke();
  }
  // street names in the gaps between zones (never over a district title)
  g.fillStyle = '#FFD23F'; g.font = 'bold 10px sans-serif'; g.textAlign = 'left';
  for (const [name, x] of [['JL. MERDEKA', 255], ['JL. PELABUHAN', 465]]) {
    g.save(); g.translate(x, 460); g.rotate(-Math.PI / 2); g.fillText(name, 0, 0); g.restore();
  }
  g.fillText('JL. PASAR SENJA', 48, 168);
  g.fillText('JL. MARINA', 48, 323);
  // sea strip on the east edge + label
  g.fillStyle = '#2FA8B5'; g.fillRect(690, 0, 70, H);
  g.fillStyle = '#FFFFFF'; g.font = 'bold 15px sans-serif';
  g.save(); g.translate(742, 240); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillText('LAUT ARUNIKA', 0, 0); g.restore();
  // flood zones growing per day — nested boxes, one label each at a
  // different corner so no two labels ever overlap
  const floods = [
    { label: 'ROB · HARI 3', x: 300, y: 432, w: 110, h: 28, lx: 306, ly: 450 },
    { label: 'BANJIR ROB · HARI 4', x: 395, y: 420, w: 140, h: 40, lx: 400, ly: 434 },
    { label: 'BANJIR ROB · HARI 5', x: 480, y: 402, w: 190, h: 58, lx: 560, ly: 416 },
  ];
  for (const f of floods) {
    g.fillStyle = 'rgba(74,122,106,0.8)'; g.fillRect(f.x, f.y, f.w, f.h);
    g.strokeStyle = '#7FB5A5'; g.setLineDash([6, 4]); g.strokeRect(f.x, f.y, f.w, f.h); g.setLineDash([]);
  }
  // labels AFTER all boxes, so no label is covered by a later (larger) box
  g.fillStyle = '#FFFFFF'; g.font = 'bold 10px sans-serif'; g.textAlign = 'left';
  for (const f of floods) g.fillText(f.label, f.lx, f.ly);
  // storm cone + eye track over the SEA strip (right edge), clear of districts
  g.fillStyle = 'rgba(232,106,146,0.28)';
  g.beginPath(); g.moveTo(725, 40); g.lineTo(760, 180); g.lineTo(695, 180); g.closePath(); g.fill();
  g.strokeStyle = '#E86A92'; g.setLineDash([8, 6]); g.lineWidth = 2;
  g.beginPath(); g.moveTo(725, 40); g.lineTo(720, 250); g.lineTo(730, 400); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#E86A92'; g.font = 'bold 10px sans-serif'; g.textAlign = 'left';
  g.fillText('D6 · CAT 4', 694, 215);
  g.fillStyle = '#FFFFFF';
  g.fillText('LANDFALL', 694, 290); g.fillText('D6 18:00', 694, 303);
  // GPS route: PERBUKITAN -> MARINA -> PELABUHAN (evacuation), land only
  g.strokeStyle = '#FF5C8A'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(140, 430); g.lineTo(300, 340); g.lineTo(420, 360); g.lineTo(620, 120); g.stroke();
  g.fillStyle = '#FF5C8A'; g.beginPath(); g.arc(620, 120, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = 'bold 12px sans-serif'; g.textAlign = 'left'; g.fillText('EVAKUASI', 540, 100);
  // POI pins (land only, at zone centres)
  g.font = '16px sans-serif'; g.textAlign = 'center';
  const pins = [['🏠', 140, 92], ['🛍️', 360, 92], ['⚓', 620, 92], ['🔧', 140, 247], ['🏭', 570, 290], ['🏖️', 360, 402]];
  for (const [icon, x, y] of pins) g.fillText(icon, x, y);
  // player marker
  g.fillStyle = '#E8443A'; g.beginPath(); g.arc(140, 430, 8, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 2; g.stroke();
  return zones;
}

// --- title screen (shot 3) ---------------------------------------------------

export function titleScreen(shot = 3) {
  const s = SHOTS[shot];
  const root = el('div', 'title-screen');
  const left = el('div', 'title-left');
  left.innerHTML = `
    <div class="game-title"><span>TANJUNG</span><span class="t2">ARUN</span></div>
    <div class="game-sub">— BADAI ARUNIKA —</div>
    <div class="title-menu">
      <div class="menu-item active">▶ CONTINUE <span class="menu-detail">Ch.5 · ${fmtRp(s.money)} · Day ${s.day} · ${s.completion}%</span></div>
      <div class="menu-item">NEW GAME</div>
      <div class="menu-item">CONTROLS</div>
      <div class="menu-item">SETTINGS</div>
    </div>
    <div class="save-slots">
      <div class="save-slot"><b>SAVE 1</b> · Story ${s.missionsDone}/8 · ${fmtRp(s.money)} · Rank ${s.repLevel} · Day ${s.day} · ${s.time}</div>
      <div class="save-slot dim"><b>SAVE 2</b> · Story 2/8 · Rp 12.000.000 · Rank 2 · Day 2 · 17:40</div>
      <div class="save-slot dim"><b>SAVE 3</b> · EMPTY</div>
    </div>`;
  const right = el('div', 'title-right');
  right.innerHTML = `
    <div class="hud-panel storm-panel big">${stormPanel(shot).innerHTML}</div>
    <div class="hud-panel judge-box">
      <div class="panel-title">UPDATED — FOR THE JUDGE</div>
      <div class="judge-lines">
        🌊 BANJIR ROB membesar per hari · misi evakuasi ber-angka<br>
        🏁 BALAPAN LIAR: SUNSET SPRINT · Race wins 2 · Best lap 1:12<br>
        📋 8 MISI STORY + 4 DISASTER JOBS · 24 SHELLS (${SHOTS[4].shells}/24)<br>
        🚔 6 UNIT POLISI + HELI ELANG-1 · taktik + jarak meter<br>
        📻 3 STASIUN RADIO · 5 KRU + PERK · GARASI + UPGRADE<br>
        🎭 DISGUISE FACE/CAR/CLOTHES · RESPRAY clears wanted
      </div>
    </div>`;
  const crewStrip = el('div', 'crew-strip');
  crewStrip.innerHTML = '<div class="panel-title">KRU · 5 + KAMU</div>' + CREW.map((c) => `
    <div class="crew-card"><div class="crew-dot" style="background:${c.color}"></div>
    <b>${c.name}</b><span>${c.role}</span><i>${c.perk}</i></div>`).join('');
  root.append(left, right, crewStrip);
  return root;
}

// --- map screen side panels (shot 4) -----------------------------------------

export function mapSidePanels(shot = 4) {
  const s = SHOTS[shot];
  const wrap = el('div', 'map-panels');
  const dist = el('div', 'hud-panel district-panel');
  dist.innerHTML = '<div class="panel-title">DISTRICT STANDING</div>' + DISTRICTS.map((d) => `
    <div class="dist-row"><span class="dist-dot" style="background:${d.color}"></span>
    <b>${d.name}</b><span>${d.seen}% SEEN</span><span class="dist-stand">${d.standing}</span>
    <i>${d.effect}</i></div>`).join('');
  const stats = el('div', 'hud-panel career-panel');
  stats.innerHTML = `<div class="panel-title">CAREER STATS · ${fmtRp(s.money)}</div>
    <div class="stat-grid">
      <span>Cars stolen</span><b>${CAREER.carsStolen}</b><span>Cops lost</span><b>${CAREER.copsLost}</b>
      <span>Near misses</span><b>${CAREER.nearMisses}</b><span>Drifts</span><b>${CAREER.drifts}</b>
      <span>Shots · Hits</span><b>${CAREER.shots} · ${CAREER.hits}</b><span>Play time</span><b>${CAREER.playTime}</b>
      <span>Race wins</span><b>${CAREER.raceWins}</b><span>Best lap</span><b>${CAREER.bestLap}</b>
      <span>km driven</span><b>${CAREER.kmDriven}</b><span>Shells</span><b>${s.shells}/${s.shellsTotal}</b>
      <span>Missions</span><b>${s.missionsDone}/${s.missionsTotal} done</b><span>Completion</span><b>46%</b>
    </div>
    <div class="panel-title" style="margin-top:10px">GARASI · DOCKSIDE CUSTOMS</div>
    ${GARAGE.map((gv) => `<div class="gar-row"><span>${gv.service}</span><i>${gv.note}</i><b>${gv.owned ? 'OWNED' : fmtRp(gv.price)}</b></div>`).join('')}`;
  const missions = el('div', 'hud-panel mission-list');
  missions.innerHTML = '<div class="panel-title">STORY · 8 MISI</div>' + MISSIONS.map((m) => `
    <div class="mis-row ${m.status.toLowerCase()}"><span>${m.n}. ${m.name}</span><b>${m.status === 'DONE' ? '✓ DONE' : m.status}</b><i>${fmtRp(m.reward)}</i></div>`).join('')
    + '<div class="panel-title" style="margin-top:8px">DISASTER JOBS</div>'
    + DISASTER_JOBS.map((j) => `<div class="mis-row"><span>${j.name}</span><b>REPEATABLE</b><i>${fmtRp(j.pay)}</i></div>`).join('');
  wrap.append(dist, stats, missions);
  return wrap;
}
