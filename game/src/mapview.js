// TANJUNG ARUN — BADAI ARUNIKA: full-city map (shot 4, 2D canvas).
// Street names sit ON the street lines, coloured districts, GPS route,
// storm cone + eye track drawn UNDER the zones, flood zones growing per
// day (HARI 3/4/5) with staggered labels, pins on land.
import { DISTRICTS, SHOTS } from './state.js';

// Street names sit on the yellow grid lines (y=150/260/370, x=195/365)
// or in the free bottom strip — never inside a district zone.
const STREETS = [
  { name: 'JL. MERDEKA', x: 230, y: 164, rot: 0 },
  { name: 'JL. JEMBATAN MERAH', x: 380, y: 274, rot: 0 },
  { name: 'JL. PASAR IKAN', x: 230, y: 384, rot: 0 },
  { name: 'JL. PANTAI ARUNIKA', x: 395, y: 52, rot: 0 },
  { name: 'JL. SENJA', x: 202, y: 330, rot: -90 },
  { name: 'JL. GARAM', x: 372, y: 330, rot: -90 },
  { name: 'JL. NELAYAN', x: 60, y: 505, rot: 0 },
  { name: 'JL. BANDARA', x: 230, y: 505, rot: 0 },
];

const ZONES = [
  { name: 'KOTA TUA', x: 40, y: 60, w: 150, h: 90, color: '#F2C9A0' },
  { name: 'PANTAI ARUNIKA', x: 430, y: 60, w: 150, h: 90, color: '#E8D5A3' },
  { name: 'PELABUHAN', x: 40, y: 170, w: 150, h: 90, color: '#9FC8E8' },
  { name: 'PASAR IKAN', x: 210, y: 170, w: 150, h: 90, color: '#A8D8C8' },
  { name: 'MARINA', x: 430, y: 170, w: 150, h: 90, color: '#2FA8B5' },
  { name: 'KAMPUNG NELAYAN', x: 40, y: 280, w: 150, h: 90, color: '#4A7A6A' },
  { name: 'CBD ARUN', x: 210, y: 280, w: 150, h: 90, color: '#E8A0A0' },
  { name: 'TAMAN SENJA', x: 430, y: 280, w: 150, h: 90, color: '#3A9A5A' },
  { name: 'BANDARA ARUNIKA', x: 40, y: 390, w: 180, h: 90, color: '#B8B0A0' },
  { name: 'PERUMAHAN BUKIT', x: 240, y: 390, w: 150, h: 90, color: '#C9A0E8' },
  { name: 'STASIUN ARUN', x: 410, y: 390, w: 170, h: 90, color: '#E8C85A' },
];

const PINS = [
  { x: 120, y: 105, label: 'SAFEHOUSE', icon: '★' },
  { x: 290, y: 215, label: 'MISI 6: EVAKUASI ROB', icon: '◆' },
  { x: 480, y: 120, label: 'PANTAI ARUNIKA', icon: '●' },
  { x: 130, y: 435, label: 'BANDARA ARUNIKA', icon: '✈' },
  { x: 480, y: 320, label: 'TAMAN SENJA', icon: '●' },
  { x: 55, y: 292, label: '', icon: '●' }, // zone name already labels it
];

export function drawCityMap(canvas) {
  const ctx = canvas.getContext('2d');
  const W = 640, H = 520;
  const shot = SHOTS.map;
  // Base land.
  ctx.fillStyle = '#1E2634'; ctx.fillRect(0, 0, W, H);
  // Sea on the east edge.
  ctx.fillStyle = '#2FA8B5'; ctx.fillRect(600, 0, 40, H);
  ctx.fillStyle = '#E8D5A3'; ctx.fillRect(588, 0, 12, H);
  // Storm cone + eye track FIRST (under the zones, faint).
  ctx.fillStyle = 'rgba(232,106,146,0.16)';
  ctx.beginPath(); ctx.moveTo(560, 40); ctx.lineTo(640, 260); ctx.lineTo(480, 260); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(232,106,146,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(590, 20); ctx.lineTo(560, 120); ctx.lineTo(530, 200); ctx.lineTo(500, 260); ctx.stroke();
  ctx.setLineDash([]);
  // District zones.
  for (const z of ZONES) {
    ctx.fillStyle = z.color;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = '#0A101C';
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(z.name, z.x + z.w / 2, z.y + 18);
    const d = DISTRICTS.find(x => x.name === z.name);
    if (d) {
      ctx.font = '10px sans-serif';
      ctx.fillText(`${d.seen}% SEEN · ${d.standing}`, z.x + z.w / 2, z.y + 34);
    }
  }
  // Streets (grid lines) + names on the lines.
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 2;
  for (const y of [150, 260, 370]) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(585, y); ctx.stroke(); }
  for (const x of [195, 365]) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 490); ctx.stroke(); }
  ctx.fillStyle = '#FFD23F'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
  for (const s of STREETS) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate((s.rot * Math.PI) / 180);
    ctx.fillText(s.name, 0, 0); ctx.restore();
  }
  // Flood zones growing per day: nested rects, labels staggered so none collide.
  const floods = [
    { label: 'ROB · HARI 3', x: 60, y: 300, w: 90, h: 40, lx: 64, ly: 312 },
    { label: 'ROB · HARI 4', x: 60, y: 300, w: 130, h: 60, lx: 64, ly: 354 },
    { label: 'ROB · HARI 5', x: 60, y: 300, w: 170, h: 80, lx: 166, ly: 374 },
  ];
  for (const f of floods) {
    ctx.fillStyle = 'rgba(74,122,106,0.5)';
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.strokeStyle = '#4A7A6A'; ctx.lineWidth = 2;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = '#E8F5EE'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(f.label, f.lx, f.ly);
  }
  // Storm labels (in the free strip above the zones / at the bottom).
  ctx.fillStyle = '#E86A92'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('D6 · CAT 4', 520, 38);
  ctx.fillText('LANDFALL · D6 18:00', 420, 505);
  // GPS route (thick) — follows streets, never through a district name.
  ctx.strokeStyle = '#E86A92'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(120, 105); ctx.lineTo(120, 150); ctx.lineTo(195, 150);
  ctx.lineTo(195, 250); ctx.lineTo(290, 250); ctx.lineTo(290, 215); ctx.stroke();
  // Pins (all on land).
  ctx.textAlign = 'left';
  for (const p of PINS) {
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0A101C'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.icon, p.x, p.y + 3);
    if (p.label) {
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(p.label, p.x + 11, p.y + 4);
    }
  }
  // Player arrow.
  ctx.fillStyle = '#E8443A';
  ctx.save(); ctx.translate(120, 105); ctx.rotate(0);
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Header strip inside the canvas.
  ctx.fillStyle = 'rgba(10,16,28,0.85)'; ctx.fillRect(0, 0, W, 30);
  ctx.fillStyle = '#2DD4A7'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`DAY ${shot.day} · ${shot.time} — LANDFALL IN ${shot.countdown} · CAT ${shot.cat} · ${shot.wind} KM/H`, 10, 20);
}
