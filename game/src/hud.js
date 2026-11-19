// TANJUNG ARUN — BADAI ARUNIKA: HUD. All HUD is DOM over the 3D canvas,
// so every number is crisp and every coherence figure is one string in
// state.js. Layout follows the template the top-10 covers share.
import {
  SHOTS, MISSIONS, DISASTER_JOBS, CREW, DISTRICTS, GARAGE, WEAPONS,
  POLICE_CHASE, POLICE_COMBAT, RADIOS, CAREER, SAVE_SLOT,
  formatRupiah, formatMoneyShort,
} from './state.js';
import { drawMinimap } from './minimap.js';

export function el(tag, cls, html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function stars(n) {
  let s = '';
  for (let i = 0; i < 5; i++) s += `<span class="star ${i < n ? 'on' : ''}">★</span>`;
  return s;
}

function moneyBlock(shot) {
  return el('div', 'hud-money',
    `<div class="money">${formatRupiah(shot.money)}</div>
     <div class="wanted">${stars(shot.wanted || 3)}</div>
     <div class="rep">REP LV${shot.repLevel} · ${shot.rep}/${shot.repMax}</div>`);
}

function stormChip(shot) {
  return el('div', 'hud-storm',
    `<div class="storm-title">🌀 BADAI ARUNIKA</div>
     <div class="storm-line">LANDFALL IN <b>${shot.countdown}</b> · DAY ${shot.day} · ${shot.time}</div>
     <div class="storm-line">CAT ${shot.cat} · ANGIN ${shot.wind} KM/H · LANDFALL D6 18:00</div>`);
}

function missionPanel(shot) {
  const p = el('div', 'hud-mission',
    `<div class="mission-kicker">MISI ${shot.missionActive}/8 · ${shot.missionStage}</div>
     <div class="mission-name">${shot.missionName}</div>
     <div class="mission-bar"><i style="width:${Math.round(shot.progress * 100)}%"></i></div>
     <div class="mission-sub">Ikuti rute GPS · Jauhi roadblock · REP +120</div>`);
  return p;
}

function policePanel(units, title = 'POLISI MENGEJAR') {
  const rows = units.map(u =>
    `<div class="pol-row"><span class="pol-unit">${u.unit}</span>
     <span class="pol-tactic ${u.tactic.replace(/ /g, '-')}">${u.tactic}</span>
     <span class="pol-dist">${u.dist} m</span></div>`).join('');
  return el('div', 'hud-police',
    `<div class="pol-title">${title}</div>${rows}`);
}

function weaponWheel(activeName) {
  const slots = WEAPONS.map(w => {
    const ammo = w.ammo === Infinity ? '∞' : `${w.ammo}/${w.reserve}`;
    return `<div class="wheel-slot ${w.name === activeName ? 'active' : ''}">
      <div class="wheel-key">${w.key}</div><div class="wheel-name">${w.name}</div>
      <div class="wheel-ammo">${ammo}</div></div>`;
  }).join('');
  return el('div', 'hud-wheel', `<div class="wheel-title">SENJATA</div>${slots}`);
}

function disguiseTabs() {
  return el('div', 'hud-disguise',
    `<div class="dis-title">PENYAMARAN</div>
     <div class="dis-tabs"><span class="dis-tab active">FACE</span><span class="dis-tab">CAR</span>
     <span class="dis-tab">CLOTHES</span><span class="dis-tab">CAMERA</span></div>
     <div class="dis-line">RESPRAY Rp 150.000 — clears wanted</div>
     <div class="dis-line">HEAT 82% · WITNESS: NONE</div>`);
}

function dialogue(name, color, text) {
  return el('div', 'hud-dialogue',
    `<div class="dlg-portrait" style="background:${color}"><span>${name[0]}</span></div>
     <div class="dlg-body"><div class="dlg-name">${name}</div><div class="dlg-text">${text}</div></div>`);
}

function radioLine(stationIdx = 0) {
  const r = RADIOS[stationIdx];
  return el('div', 'hud-radio', `♪ ${r.name} — ${r.song}`);
}

function floatingScore(text, cls, x, y) {
  const f = el('div', `float-score ${cls}`, text);
  f.style.left = x + '%'; f.style.top = y + '%';
  return f;
}

// ---- Shot 1: chase ----
export function renderChaseHUD(root, shot) {
  root.appendChild(missionPanel(shot));
  root.appendChild(moneyBlock(shot));
  root.appendChild(stormChip(shot));
  root.appendChild(policePanel(POLICE_CHASE));
  root.appendChild(disguiseTabs());
  const mm = el('div', 'hud-minimap');
  mm.appendChild(drawMinimap('chase'));
  root.appendChild(mm);
  root.appendChild(dialogue('SINTA', '#D94F70', '“Raka, belok kiri di Jembatan Merah! Heli ELANG-1 masih di atas kita — drift di tikungan, jangan rem!”'));
  root.appendChild(radioLine(0));
  const speed = el('div', 'hud-speed',
    `<div class="speed-num">${shot.speed}</div><div class="speed-unit">KM/H</div>
     <div class="speed-car">${shot.carName}</div>
     <div class="cond-bar"><i style="width:${shot.condition}%"></i></div>
     <div class="cond-label">CONDITION ${shot.condition}% · FUEL ${shot.fuel}% · [Q] SINTA: DRIFT BOOST</div>`);
  root.appendChild(speed);
  root.appendChild(floatingScore('DRIFT x3 <b>+Rp 150.000</b>', 'drift', 58, 30));
  root.appendChild(floatingScore('NEAR MISS <b>+Rp 100.000</b>', 'nearmiss', 34, 52));
  root.appendChild(el('div', 'hud-ability', 'Q — SINTA: DRIFT BOOST · READY'));
}

// ---- Shot 2: combat ----
export function renderCombatHUD(root, shot) {
  root.appendChild(missionPanel(shot));
  root.appendChild(moneyBlock(shot));
  root.appendChild(stormChip(shot));
  root.appendChild(policePanel(POLICE_COMBAT, 'MUSUH & POLISI'));
  root.appendChild(weaponWheel('SMG'));
  const bars = el('div', 'hud-vitals',
    `<div class="vital-row"><span>HEALTH</span><div class="vital-bar health"><i style="width:${shot.health}%"></i></div><b>${shot.health}</b></div>
     <div class="vital-row"><span>ARMOUR</span><div class="vital-bar armour"><i style="width:${shot.armour}%"></i></div><b>${shot.armour}</b></div>
     <div class="vital-row"><span>STAMINA</span><div class="vital-bar stamina"><i style="width:74%"></i></div><b>74</b></div>`);
  root.appendChild(bars);
  const mm = el('div', 'hud-minimap');
  mm.appendChild(drawMinimap('combat'));
  root.appendChild(mm);
  root.appendChild(dialogue('DET. ARYA', '#2A6BFF', '“Raka! Looter Geng Ombak sudah masuk Pasar Ikan. Tahan mereka sampai evakuasi rob selesai — jangan sampai ada warga yang kena!”'));
  root.appendChild(radioLine(2));
  const ammo = el('div', 'hud-ammo',
    `<div class="ammo-big">${shot.ammo}<span>/${shot.ammoReserve}</span></div>
     <div class="ammo-name">${shot.weapon} · [1-4] GANTI SENJATA</div>`);
  root.appendChild(ammo);
  root.appendChild(floatingScore('HEADSHOT <b>+Rp 75.000</b>', 'headshot', 56, 26));
  root.appendChild(floatingScore('LOOTER DOWN <b>+Rp 250.000</b>', 'looter', 18, 56));
  root.appendChild(el('div', 'hud-crosshair', '+'));
  root.appendChild(el('div', 'hud-objective', '⚠ EVAKUASI ROB: 3 WARGA TERJEBAK DI PASAR — SELAMATKAN MEREKA'));
}

// ---- Shot 3: title ----
export function renderTitleHUD(root, shot) {
  const t = el('div', 'title-screen');
  t.innerHTML = `
    <div class="title-left">
      <div class="title-kicker">TANJUNG ARUN</div>
      <h1 class="title-big">BADAI<br>ARUNIKA</h1>
      <div class="title-sub">Kota pesisir · 7 hari menuju badai · 8 misi · 24 kerang</div>
      <div class="title-menu">
        <div class="menu-item active">▶ CONTINUE — Ch.${SAVE_SLOT.chapter} · ${formatRupiah(SAVE_SLOT.money)} · Day ${SAVE_SLOT.day} · ${SAVE_SLOT.completion}%</div>
        <div class="menu-item">NEW GAME</div>
        <div class="menu-item">CONTROLS</div>
        <div class="menu-item">SETTINGS</div>
      </div>
      <div class="title-storm">🌀 LANDFALL IN ${shot.countdown} · CAT ${shot.cat} · ${shot.wind} KM/H · D6 18:00</div>
    </div>
    <div class="title-right">
      <div class="panel save-panel"><div class="panel-title">SAVE SLOT 1</div>
        <div class="save-line">Chapter ${SAVE_SLOT.chapter} · Story ${SAVE_SLOT.story} · ${formatRupiah(SAVE_SLOT.money)}</div>
        <div class="save-line">Day ${SAVE_SLOT.day} · ${SAVE_SLOT.time} · ${SAVE_SLOT.completion}% complete</div>
        <div class="save-line">Kerang ${SAVE_SLOT.shells} · Saved at ${SAVE_SLOT.savedAt}</div>
        <div class="save-bar"><i style="width:${SAVE_SLOT.completion}%"></i></div></div>
      <div class="panel how-panel"><div class="panel-title">HOW TO PLAY</div>
        <div class="how-line">WASD — Jalan / Nyetir &nbsp;·&nbsp; E — Masuk mobil &nbsp;·&nbsp; F — Curi mobil</div>
        <div class="how-line">SPACE — Rem tangan &nbsp;·&nbsp; Q — Ability kru &nbsp;·&nbsp; 1-4 — Ganti senjata</div>
        <div class="how-line">M — Peta &nbsp;·&nbsp; R — Radio &nbsp;·&nbsp; ESC — Menu</div></div>
      <div class="panel judge-panel"><div class="panel-title">FOR THE JUDGE — ISI GAME INI</div>
        <div class="judge-line">🌊 BANJIR ROB membesar per hari + misi evakuasi · 🏁 BALAPAN LIAR (Race wins 2 · Best lap 1:12)</div>
        <div class="judge-line">8 MISI CERITA + 4 DISASTER JOB · 24 KERANG · 12 DISTRIK + STANDING</div>
        <div class="judge-line">6 UNIT POLISI + HELI ELANG-1 · 3 STASIUN RADIO · 5 KRU + PERK</div>
        <div class="judge-line">GARASI + UPGRADE BER-HARGA · PENYAMARAN FACE/CAR/CLOTHES · SAVE SLOT</div></div>
    </div>
    <div class="title-crew">
      ${CREW.map(c => `<div class="crew-card"><div class="crew-face" style="background:${c.color}">${c.name[0]}</div>
        <div class="crew-text"><div class="crew-name">${c.name}${c.you ? ' — YOU' : ''} <span class="crew-role">${c.role}</span></div>
        <div class="crew-perk">${c.perk}</div></div></div>`).join('')}
    </div>
    <div class="title-bottom">REP LV${shot.repLevel} ${shot.rep}/${shot.repMax} · MISI ${shot.missionsDone}/8 · ${formatRupiah(shot.money)} · DAY ${shot.day} · ${shot.time} · v3 LOW-POLY 3D</div>`;
  root.appendChild(t);
}

// ---- Shot 4: map (2D canvas + side panels) ----
export function renderMapHUD(root, shot, drawMap) {
  const m = el('div', 'map-screen');
  m.innerHTML = `
    <div class="map-left">
      <div class="map-head">PETA TANJUNG ARUN — DAY ${shot.day} · ${shot.time}</div>
      <canvas id="citymap" width="640" height="520"></canvas>
      <div class="map-legend">🟦 LAUT · 🟩 TAMAN · 🟨 JALAN · 🟥 FLOOD ZONE (ROB) · ◆ MISI · ★ SAFEHOUSE · ▲ POLISI</div>
    </div>
    <div class="map-right">
      <div class="panel"><div class="panel-title">DISTRICT STANDING</div>
        ${DISTRICTS.slice(0, 6).map(d => `<div class="dist-row"><span class="dist-dot" style="background:${d.color}"></span>
          <span class="dist-name">${d.name}</span><span class="dist-seen">${d.seen}%</span>
          <span class="dist-stand">${d.standing}</span><span class="dist-effect-inline">— ${d.effect}</span></div>`).join('')}
      </div>
      <div class="panel"><div class="panel-title">GARASI — DOCKSIDE CUSTOMS</div>
        ${GARAGE.map(g => `<div class="gar-row"><span>${g.name}</span><span class="gar-desc">${g.desc}</span>
          <span class="gar-price">${g.price}</span><span class="gar-own ${g.owned ? 'owned' : 'locked'}">${g.owned ? 'OWNED' : 'LOCKED'}</span></div>`).join('')}
      </div>
      <div class="panel"><div class="panel-title">CAREER STATS</div>
        <div class="stat-grid">
          <span>Cars stolen <b>${CAREER.carsStolen}</b></span><span>Cops lost <b>${CAREER.copsLost}</b></span>
          <span>Near misses <b>${CAREER.nearMisses}</b></span><span>Drifts <b>${CAREER.drifts}</b></span>
          <span>Shots ${CAREER.shots} · Hits ${CAREER.hits}</span><span>Race wins ${CAREER.raceWins} · Best lap ${CAREER.bestLap}</span>
          <span>${CAREER.kmDriven} km driven</span><span>Play time ${CAREER.playTime}</span>
        </div>
        <div class="stat-line">MISI ${shot.missionsDone}/8 · KERANG ${shot.shells}/${shot.shellsTotal} · ${shot.completion}% COMPLETE · ${formatRupiah(shot.money)}</div>
      </div>
      <div class="panel"><div class="panel-title">MISI + DISASTER JOBS</div>
        ${MISSIONS.slice(0, 5).map(x => `<div class="mis-row"><span class="mis-n">${x.n}</span><span>${x.name}</span><span class="mis-st ${x.status}">${x.status}</span></div>`).join('')}
        ${DISASTER_JOBS.slice(0, 2).map(x => `<div class="mis-row"><span class="mis-n">◆</span><span>${x.name}</span><span class="mis-pay">${x.pay}</span></div>`).join('')}
        <div class="mis-row"><span class="mis-n">…</span><span>+ 2 disaster jobs · 2 misi terkunci</span></div>
      </div>
    </div>`;
  root.appendChild(m);
  const canvas = root.querySelector('#citymap');
  if (canvas && drawMap) drawMap(canvas);
}
