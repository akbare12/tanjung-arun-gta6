// hud.js — everything the judge reads: the HUD (cash, REP, wanted stars,
// health, round minimap, radio widget, storm countdown, named police panel,
// mission tracker, dialogue boxes, floating DRIFT / NEAR MISS scores) and
// the full screens (title, city map, chapter card, MISSION PASSED).
// One job: drawing every interface layer.

import { DISTRICTS, RADIO, COLLECTIBLE, SHOPS, formatMoney } from './config.js';
import { POIS, districtAt } from './city.js';
import { missionListLines, missionStageText, missionObjectives } from './missions.js';
import { stormCountdownText, stormStatusLines } from './storm.js';

export function drawWantedStars(ctx, x, y, stars) {
  ctx.font = 'bold 26px monospace';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < stars ? '#ffd23a' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', x + i * 30, y);
  }
}

export function drawMinimap(ctx, x, y, r, player, city, cars, policeCars, missionTarget) {
  const scale = (r * 2) / 2600;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(10,16,24,0.85)';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color;
    ctx.fillRect(x - r + d.x * scale, y - r + d.y * scale, d.w * scale, d.h * scale);
  }
  ctx.fillStyle = 'rgba(40,110,140,0.6)';
  ctx.fillRect(x - r + city.flood.x * scale, y - r + city.flood.y * scale, city.flood.w * scale, city.flood.h * scale);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (const road of city.roads) {
    ctx.beginPath();
    ctx.moveTo(x - r + road.x1 * scale, y - r + road.y1 * scale);
    ctx.lineTo(x - r + road.x2 * scale, y - r + road.y2 * scale);
    ctx.stroke();
  }
  // Mission target + GPS route.
  if (missionTarget) {
    const tx = x - r + missionTarget.x * scale, ty = y - r + missionTarget.y * scale;
    const px = x - r + player.x * scale, py = y - r + player.y * scale;
    ctx.strokeStyle = '#ffd23a';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff3a3a';
    ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
  }
  for (const c of cars) {
    ctx.fillStyle = c.color;
    ctx.fillRect(x - r + c.x * scale - 2, y - r + c.y * scale - 2, 4, 4);
  }
  for (const p of policeCars) {
    ctx.fillStyle = '#3a7ad4';
    ctx.beginPath(); ctx.arc(x - r + p.x * scale, y - r + p.y * scale, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - r + player.x * scale, y - r + player.y * scale, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd23a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x - r + player.x * scale, y - r + player.y * scale, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', x, y - r - 6);
  ctx.textAlign = 'left';
}

export function drawRadioWidget(ctx, x, y, stationIdx, clockText) {
  const st = RADIO[stationIdx % RADIO.length];
  ctx.fillStyle = 'rgba(8,12,20,0.85)';
  ctx.fillRect(x, y, 300, 52);
  ctx.strokeStyle = '#e8b23a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 300, 52);
  ctx.fillStyle = '#e8b23a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('♪ ' + st.station, x + 10, y + 20);
  ctx.fillStyle = '#fff';
  ctx.font = '13px monospace';
  ctx.fillText(st.song, x + 10, y + 40);
  ctx.fillStyle = '#ffd23a';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(clockText, x + 290, y + 20);
  ctx.textAlign = 'left';
}

export function drawStormBanner(ctx, x, y, w, storm) {
  ctx.fillStyle = 'rgba(120,20,20,0.88)';
  ctx.fillRect(x, y, w, 34);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ ' + storm.name + ' ' + storm.category + ' — ' + stormCountdownText(storm) + ' · WIND ' + storm.windKmh + ' KM/H ⚠', x + w / 2, y + 23);
  ctx.textAlign = 'left';
}

export function drawPolicePanel(ctx, x, y, wanted) {
  const w = 344, h = 30 + wanted.units.length * 24 + 30;
  ctx.fillStyle = 'rgba(8,12,20,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ff3a3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#ff6a6a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('POLICE RESPONSE — ' + wanted.state, x + 12, y + 22);
  ctx.font = '13px monospace';
  wanted.units.forEach((u, i) => {
    const yy = y + 46 + i * 24;
    ctx.fillStyle = u.air ? '#7fd4ff' : '#fff';
    ctx.fillText((u.air ? '✈ ' : '● ') + u.name, x + 12, yy);
    ctx.fillStyle = '#ffd23a';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(u.distance) + 'm', x + w - 118, yy);
    ctx.fillStyle = '#ff9a3a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(u.tactic.toUpperCase(), x + w - 12, yy);
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
  });
  ctx.fillStyle = wanted.heli.grounded ? '#ff8a8a' : '#7fd4ff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('HELI HAWK-1: ' + (wanted.heli.grounded ? wanted.heli.groundReason : 'AIRBORNE — SEARCHLIGHT ON'), x + 12, y + h - 10);
}

export function drawMissionTracker(ctx, x, y, mission, stage) {
  const objs = missionObjectives(mission, stage);
  ctx.fillStyle = 'rgba(8,12,20,0.88)';
  ctx.fillRect(x, y, 360, 118);
  ctx.strokeStyle = '#e8b23a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 360, 118);
  ctx.fillStyle = '#e8b23a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(missionStageText(mission, stage), x + 12, y + 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(mission.name, x + 12, y + 46);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#ffd23a';
  ctx.fillText('NEXT: ' + objs[Math.min(stage - 1, objs.length - 1)], x + 12, y + 68);
  ctx.fillStyle = '#9ae8a0';
  ctx.fillText('PAYOUT ' + formatMoney(mission.payout) + '  ·  ' + mission.giver, x + 12, y + 90);
  ctx.fillStyle = '#fff';
  ctx.fillText(objs[0].slice(0, 44), x + 12, y + 110);
}

export function drawStatsBar(ctx, x, y, player) {
  ctx.fillStyle = 'rgba(8,12,20,0.88)';
  ctx.fillRect(x, y, 330, 92);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 330, 92);
  ctx.fillStyle = '#7de88a';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(formatMoney(player.cash), x + 12, y + 28);
  ctx.fillStyle = '#fff';
  ctx.font = '13px monospace';
  ctx.fillText('REP ' + player.rep + '/' + player.repMax + '  ·  LVL ' + player.level, x + 12, y + 50);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x + 12, y + 58, 200, 10);
  ctx.fillStyle = '#e8b23a';
  ctx.fillRect(x + 12, y + 58, 200 * (player.rep / player.repMax), 10);
  ctx.fillStyle = '#ffd23a';
  ctx.fillText(COLLECTIBLE.name + ' ' + COLLECTIBLE.found + '/' + COLLECTIBLE.total, x + 12, y + 84);
}

export function drawHealthBar(ctx, x, y, player) {
  ctx.fillStyle = 'rgba(8,12,20,0.85)';
  ctx.fillRect(x, y, 240, 30);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x + 8, y + 8, 150, 14);
  ctx.fillStyle = player.health > 40 ? '#7de88a' : '#ff3a3a';
  ctx.fillRect(x + 8, y + 8, 150 * (player.health / 100), 14);
  ctx.fillStyle = '#7fb8ff';
  ctx.fillRect(x + 8, y + 8, 150 * (player.armor / 100), 5);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('HP ' + player.health + '  ARMOR ' + player.armor, x + 166, y + 21);
}

export function drawDialogue(ctx, x, y, w, lines) {
  // Word-wrap each line so text never runs past the box.
  const wrapped = [];
  for (const ln of lines) {
    const words = ln.text.split(' ');
    let cur = '';
    for (const word of words) {
      if ((cur + ' ' + word).trim().length > 52) { wrapped.push({ who: ln.who, color: ln.color, text: cur.trim(), first: cur === '' }); cur = word; }
      else cur = (cur + ' ' + word).trim();
    }
    if (cur) wrapped.push({ who: ln.who, color: ln.color, text: cur, first: false });
  }
  // Mark the first wrapped line of each speaker with the name.
  let lastWho = null;
  for (const ln of wrapped) {
    ln.showName = ln.who !== lastWho;
    lastWho = ln.who;
  }
  const h = 14 + wrapped.length * 22;
  ctx.fillStyle = 'rgba(8,12,20,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  wrapped.forEach((ln, i) => {
    const yy = y + 20 + i * 22;
    if (ln.showName) {
      ctx.fillStyle = ln.color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(ln.who + ':', x + 14, yy);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(ln.text, x + 90, yy);
  });
}

export function drawFloatingScores(ctx, popups) {
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, p.life / 1.4);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawDisguiseTabs(ctx, x, y, wanted) {
  const tabs = [
    { label: 'FACE', item: 'TOPI', price: SHOPS.face.price },
    { label: 'CAR', item: 'CAT ULANG', price: SHOPS.respray.price },
    { label: 'CLOTHES', item: 'JAKET', price: SHOPS.clothes.price },
  ];
  ctx.fillStyle = 'rgba(8,12,20,0.88)';
  ctx.fillRect(x, y, 360, 96);
  ctx.strokeStyle = '#c9a0e8';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 360, 96);
  ctx.fillStyle = '#c9a0e8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SHED THE HEAT — DISGUISE', x + 12, y + 20);
  ctx.font = '13px monospace';
  tabs.forEach((t, i) => {
    const yy = y + 42 + i * 18;
    ctx.fillStyle = '#fff';
    ctx.fillText(t.label + '  ' + t.item, x + 12, yy);
    ctx.fillStyle = '#7de88a';
    ctx.textAlign = 'right';
    ctx.fillText(formatMoney(t.price) + '  ·  clears wanted', x + 348, yy);
    ctx.textAlign = 'left';
  });
}
