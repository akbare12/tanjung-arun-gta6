// TANJUNG ARUN — BADAI ARUNIKA v8
// hud.js — HUD, dispatch, dialog, radio, minimap, dan layar peta 2D.
// Angka kanonik: S1 -> S4 naik dan konsisten di semua shot.
import { mulberry32 } from './world.js';

export const SHOT_STATE = {
  chase: {
    day: 'HARI 2', time: '17:40', cd: '4D 0J', cat: 'CAT 2', stormFill: 57,
    money: 'Rp 12.000.000', heat: 150, score: '180/400', wanted: 2,
    missionTitle: 'MISI 2: KABUR DARI BLOKADE',
    missionObj: 'Tembus blokade di Jalan Pantai. Jangan berhenti — Unit Macan 120 m di belakangmu.',
    dispatch: [
      ['UNIT 07 “MACAN”', '120 m — MENGEJAR', '#ff8f8f'],
      ['UNIT 12 “ELANG”', '240 m — MEMOTONG JALAN', '#ffb36b'],
      ['UNIT 03 “BADAK”', '310 m — MENYIAPKAN BLOKADE', '#aee6ff'],
    ],
    dialogWho: 'FIXER — BANG JAKA',
    dialogSay: '“Lewat jalan pantai, jangan berhenti!”',
    radio: 'RADIO ARUNIKA 98.5 · DJ NADIA SENJA: “Selamat sore, Tanjung Arun!”',
    speed: 142, gear: 'GIGI 4', toast: '+150 · Lolos dari blokade',
    minimapLabel: 'TANJUNG ARUN · JALAN PANTAI',
    player: [112, 55], police: [[107, 67], [116, 78], [110, 90]], mission: [112, -20],
  },
  combat: {
    day: 'HARI 3', time: '02:15', cd: '3D 15J', cat: 'CAT 3', stormFill: 71,
    money: 'Rp 24.750.000', heat: 194, score: '320/400', wanted: 3,
    missionTitle: 'MISI 4: SERBU GUDANG PELABUHAN',
    missionObj: 'Bersihkan gudang 7 dari penjaga. Lintang bilang polisi geser jam 2 pagi.',
    dispatch: [
      ['UNIT 07 “MACAN”', '85 m — MENGEPUNG', '#ff8f8f'],
      ['UNIT 21 “HIU”', '160 m — MENUJU LOKASI', '#ffb36b'],
      ['UNIT 03 “BADAK”', '400 m — MENUTUP JALAN', '#aee6ff'],
    ],
    dialogWho: 'INFO — LINTANG',
    dialogSay: '“Dua penjaga di pintu barat. Sari standby di ujung gang.”',
    radio: 'RADIO OMBAK 101.2 · DJ BUDI GELOMBANG: “Hujan turun di pelabuhan, ombak naik dua meter!”',
    health: 78, armour: 45, weapon: 'PINDAD SS2', ammo: '24 / 180',
    toast: '+120 · Gudang 7 dibersihkan',
    minimapLabel: 'TANJUNG ARUN · PUSAT KOTA',
    player: [2, 14], police: [[-13, -4], [-9, -8]], mission: [-9, -8],
  },
};

const $ = (id) => document.getElementById(id);

function stars(n) {
  let s = '';
  for (let i = 0; i < 5; i++) s += `<span class="star${i < n ? '' : ' off'}">&#9733;</span>`;
  return s;
}

/** Terapkan HUD gameplay untuk shot chase / combat. */
export function applyGameHUD(shot) {
  const st = SHOT_STATE[shot];
  $('hud').style.display = 'block';
  $('title').style.display = 'none';
  $('mapscreen').style.display = 'none';
  $('mission-title').textContent = st.missionTitle;
  $('mission-obj').textContent = st.missionObj;
  $('storm-cd').textContent = st.cd;
  $('storm-cat').textContent = st.cat;
  $('storm-day').textContent = `${st.day} · ${st.time}`;
  $('stormfill').style.width = `${st.stormFill}%`;
  $('money').textContent = st.money;
  $('heat').textContent = st.heat;
  $('score').textContent = st.score;
  $('stars').innerHTML = stars(st.wanted);
  $('wanted').textContent = `LV${st.wanted}`;
  $('dispatch-lines').innerHTML = st.dispatch.map(([u, a, c]) =>
    `<div class="line"><b style="color:${c}">${u}</b> &nbsp;${a}</div>`).join('');
  $('dialog-who').textContent = st.dialogWho;
  $('dialog-say').textContent = st.dialogSay;
  $('radio').textContent = st.radio;
  $('toast').textContent = st.toast;
  $('minimap-label').textContent = st.minimapLabel;
  if (shot === 'combat') {
    $('healthrow').style.display = 'block';
    $('weapon').style.display = 'block';
    $('speedo').style.display = 'none';
    $('crosshair').style.display = 'block';
    $('healthfill').style.width = `${st.health}%`;
    $('armourfill').style.width = `${st.armour}%`;
    $('healthnum').textContent = st.health;
    $('armournum').textContent = st.armour;
    $('weapon-name').textContent = st.weapon;
    $('ammo').textContent = st.ammo;
  } else {
    $('healthrow').style.display = 'none';
    $('weapon').style.display = 'none';
    $('speedo').style.display = 'block';
    $('crosshair').style.display = 'none';
    $('speed').textContent = st.speed;
    $('gear').textContent = st.gear;
  }
}

export function showTitle() {
  $('hud').style.display = 'none';
  $('title').style.display = 'block';
  $('mapscreen').style.display = 'none';
}

export function showMap() {
  $('hud').style.display = 'none';
  $('title').style.display = 'none';
  $('mapscreen').style.display = 'block';
}

/** Minimap 200x200: jalan, laut, pemain, polisi, misi, genangan. */
export function drawMinimap(shot) {
  const st = SHOT_STATE[shot];
  const cv = $('minimap');
  const g = cv.getContext('2d');
  const W = 200, H = 200;
  g.clearRect(0, 0, W, H);
  // laut + pantai (timur = kanan)
  g.fillStyle = '#0d2036'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b6a7a'; g.fillRect(164, 0, 36, H);
  g.fillStyle = '#c9b184'; g.fillRect(156, 0, 8, H);
  // genangan rob di jalan pantai
  g.fillStyle = 'rgba(47,168,181,0.55)'; g.fillRect(150, 30, 14, 90);
  // jalan kota
  g.strokeStyle = '#5a6472'; g.lineWidth = 4;
  for (const x of [-120, -80, -40, 0, 40, 80]) {
    const px = 30 + ((x + 160) / 280) * 140;
    g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke();
  }
  for (const z of [-120, -80, -40, 0, 40, 80, 120]) {
    const py = 10 + ((z + 160) / 320) * 180;
    g.beginPath(); g.moveTo(0, py); g.lineTo(156, py); g.stroke();
  }
  // jalan pantai
  g.strokeStyle = '#7a8494'; g.lineWidth = 6;
  const coastX = 30 + ((112 + 160) / 280) * 140;
  g.beginPath(); g.moveTo(coastX, 0); g.lineTo(coastX, H); g.stroke();
  g.strokeStyle = '#ffd27a'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(coastX - 3, 0); g.lineTo(coastX - 3, H); g.stroke();
  g.beginPath(); g.moveTo(coastX + 3, 0); g.lineTo(coastX + 3, H); g.stroke();
  const toPx = (wx, wz) => [30 + ((wx + 160) / 280) * 140, 10 + ((wz + 160) / 320) * 180];
  // misi
  const [mx, my] = toPx(...st.mission);
  g.fillStyle = '#ffd23e';
  g.beginPath(); g.arc(mx, my, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a1030'; g.font = 'bold 8px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('M', mx, my);
  // polisi
  for (const [px, pz] of st.police) {
    const [x, y] = toPx(px, pz);
    g.fillStyle = '#2a6bff';
    g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke();
  }
  // pemain (panah kuning)
  const [px, py] = toPx(...st.player);
  g.fillStyle = '#ffd23e';
  g.beginPath(); g.moveTo(px, py - 8); g.lineTo(px + 6, py + 6); g.lineTo(px, py + 2);
  g.lineTo(px - 6, py + 6); g.closePath(); g.fill();
  g.strokeStyle = '#1a1030'; g.lineWidth = 1.5; g.stroke();
  // utara
  g.fillStyle = '#cfe6ff'; g.font = 'bold 11px Arial'; g.textAlign = 'left';
  g.fillText('U', 6, 14);
}

// ==================== LAYAR PETA 2D ====================
const DISTRICTS = [
  ['PELABUHAN', -100, -118, '#cfe6ff'],
  ['TERMINAL', 65, -112, '#cfe6ff'],
  ['KOTA LAMA', -115, 2, '#cfe6ff'],
  ['PUSAT KOTA', 0, -32, '#ffffff'],
  ['PASAR IKAN', -10, 42, '#ffe9a8'],
  ['KAMPUNG NELAYAN', 70, 102, '#cfe6ff'],
  ['BUKIT ARUN', -100, 117, '#cfe6ff'],
  ['PANTAI ARUNIKA', 117, -82, '#ffe9a8'],
  ['DERMAGA ARUNIKA', 178, -52, '#aee6ff'],
  ['LAUT ARUNIKA', 258, 62, '#7fd4e0'],
];
const MISSIONS = [
  ['M1', -110, -100, 'done'], ['M2', 112, 40, 'done'], ['M3', 12, 56, 'done'],
  ['M4', -88, -132, 'done'], ['M5', 76, 88, 'done'], ['M6', -68, 126, 'now'],
  ['M7', -126, 22, 'lock'], ['M8', 22, -42, 'lock'],
];
const PACKAGES = (() => {
  const rng = mulberry32(77);
  const out = [];
  for (let i = 0; i < 24; i++) {
    out.push([Math.floor(-140 + rng() * 230), Math.floor(-140 + rng() * 280), i < 15]);
  }
  return out;
})();

/** Gambar peta kota lengkap di canvas 972x720. Label sudah diposisikan anti-tumpuk. */
export function drawMap() {
  const cv = $('mapcanvas');
  const g = cv.getContext('2d');
  const W = 972, H = 720;
  const SX = 2.02, OX = 322, OY = 36; // skala + offset: x dunia [-160,320] -> px
  const px = (wx) => (wx + 160) * SX;
  const py = (wz) => (wz + 160) * SX + OY;
  // dasar darat + laut
  g.fillStyle = '#12283e'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b6a7a'; g.fillRect(px(135), 0, W - px(135), H);
  // ombak
  g.strokeStyle = 'rgba(234,252,255,0.5)'; g.lineWidth = 2;
  for (let z = -150; z < 160; z += 22) {
    g.beginPath(); g.moveTo(px(136), py(z)); g.lineTo(px(146), py(z)); g.stroke();
  }
  // pasir pantai
  g.fillStyle = '#c9b184'; g.fillRect(px(100), 0, px(135) - px(100), H);
  // blok kota
  g.fillStyle = '#1e3a52';
  for (let x = -150; x < 95; x += 40) {
    for (let z = -150; z < 150; z += 40) {
      if (Math.abs(x + 20 - 112) < 14) continue;
      g.fillRect(px(x + 6), py(z + 6), 28 * SX * 0.9, 28 * SX * 0.9);
    }
  }
  // taman + lapangan
  g.fillStyle = '#2e7d4f';
  g.fillRect(px(-58), py(62), 30, 22);
  g.fillRect(px(22), py(-118), 26, 18);
  // (label TAMAN digambar belakangan, setelah jalan — v8 fix F2h)
  // jalan
  g.strokeStyle = '#8a94a4'; g.lineWidth = 5;
  for (const x of [-120, -80, -40, 0, 40, 80]) {
    g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), H); g.stroke();
  }
  for (const z of [-120, -80, -40, 0, 40, 80, 120]) {
    g.beginPath(); g.moveTo(0, py(z)); g.lineTo(px(100), py(z)); g.stroke();
  }
  // jalan pantai + marka kuning tepi
  g.strokeStyle = '#9aa4b4'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(px(112), 0); g.lineTo(px(112), H); g.stroke();
  g.strokeStyle = '#ffd27a'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(px(105.4), 0); g.lineTo(px(105.4), H); g.stroke();
  g.beginPath(); g.moveTo(px(118.6), 0); g.lineTo(px(118.6), H); g.stroke();
  // marka putih tengah jalan kota
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.5;
  g.setLineDash([8, 10]);
  for (const x of [-120, -80, -40, 0, 40, 80]) {
    g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), H); g.stroke();
  }
  g.setLineDash([]);
  // v8 fix F2h: label TAMAN di atas blok taman + garis jalan (z-order naik),
  // digeser sedikit ke bawah agar tidak menimpa blok hijau.
  // v8 fix r2: kontras terlalu rendah (hijau gelap di biru gelap) — samakan dengan
  // label distrik lain: kuning + halo gelap.
  g.font = 'bold 11px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 4; g.strokeStyle = 'rgba(8,12,26,0.85)';
  g.strokeText('TAMAN', px(-43), py(79));
  g.fillStyle = '#ffe9a8';
  g.fillText('TAMAN', px(-43), py(79));
  // genangan banjir rob (pesisir)
  g.fillStyle = 'rgba(47,168,181,0.5)';
  g.fillRect(px(98), py(-62), px(136) - px(98), py(42) - py(-62));
  g.strokeStyle = '#7fe3d0'; g.lineWidth = 1.5;
  g.strokeRect(px(98), py(-62), px(136) - px(98), py(42) - py(-62));
  g.fillStyle = '#7fe3d0'; g.font = 'bold 12px Arial'; g.textAlign = 'left';
  g.fillText('BANJIR ROB', px(100), py(-66));
  // dermaga
  g.fillStyle = '#7a5a38';
  g.fillRect(px(135), py(-34), px(210) - px(135), 8);
  g.fillStyle = '#aee6ff'; g.font = 'bold 12px Arial';
  g.fillText('DERMAGA', px(140), py(-38));
  // perahu di laut
  g.fillStyle = '#fff6d8';
  for (const [bx, bz] of [[168, -30], [186, -58], [205, -8], [232, -44], [258, -18], [176, 42], [214, 66], [248, 30]]) {
    g.beginPath(); g.moveTo(px(bx), py(bz)); g.lineTo(px(bx) + 9, py(bz) + 5); g.lineTo(px(bx), py(bz) + 8); g.closePath(); g.fill();
  }
  // paket koleksi 15/24
  for (const [wx, wz, found] of PACKAGES) {
    const x = px(wx), y = py(wz);
    g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2);
    if (found) { g.fillStyle = '#7fe3d0'; g.fill(); }
    else { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.2; g.stroke(); }
  }
  // penanda misi
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [name, wx, wz, st] of MISSIONS) {
    const x = px(wx), y = py(wz);
    g.font = 'bold 13px Arial';
    if (st === 'done') {
      g.fillStyle = '#58d68d';
      g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0d2036'; g.fillText('✓', x, y + 0.5);
    } else if (st === 'now') {
      g.fillStyle = '#ffd23e';
      g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#1a1030'; g.fillText('6', x, y + 0.5);
      g.strokeStyle = '#ffd23e'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.stroke();
    } else {
      g.fillStyle = '#5a6472';
      g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#cfe6ff'; g.fillText('🔒', x, y + 0.5);
    }
    // label misi di samping penanda, arah menjauhi label distrik
    g.font = 'bold 11px Arial';
    g.fillStyle = st === 'now' ? '#ffd23e' : 'rgba(255,255,255,0.85)';
    g.textAlign = 'left';
    g.fillText(name, x + 14, y - 1);
  }
  // pemain + polisi di peta
  g.fillStyle = '#ffd23e';
  g.beginPath(); g.moveTo(px(112), py(40) - 9); g.lineTo(px(112) + 7, py(40) + 7);
  g.lineTo(px(112), py(40) + 3); g.lineTo(px(112) - 7, py(40) + 7); g.closePath(); g.fill();
  g.strokeStyle = '#1a1030'; g.lineWidth = 1.5; g.stroke();
  for (const [wx, wz] of [[107, 67], [116, 78]]) {
    g.fillStyle = '#2a6bff';
    g.beginPath(); g.arc(px(wx), py(wz), 5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke();
  }
  // label distrik — posisi tetap, halo gelap, tanpa tumpuk
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [name, wx, wz, col] of DISTRICTS) {
    const x = px(wx), y = py(wz);
    g.font = 'bold 15px Arial';
    g.lineWidth = 4; g.strokeStyle = 'rgba(8,12,26,0.85)';
    g.strokeText(name, x, y);
    g.fillStyle = col; g.fillText(name, x, y);
  }
  // kompas + skala
  g.fillStyle = '#cfe6ff'; g.font = 'bold 13px Arial'; g.textAlign = 'left';
  g.fillText('U ▲', 14, 24);
  g.strokeStyle = '#cfe6ff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(14, H - 22); g.lineTo(14 + 50 * SX, H - 22); g.stroke();
  g.fillText('50 m', 14, H - 30);
}
