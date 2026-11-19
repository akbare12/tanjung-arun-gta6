// TANJUNG ARUN — BADAI ARUNIKA: round minimap (canvas) for gameplay shots.
export function drawMinimap(mode) {
  const c = document.createElement('canvas');
  c.width = 150; c.height = 150;
  const ctx = c.getContext('2d');
  const cx = 75, cy = 75, r = 72;
  // Clip to a circle.
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  // Sea + sand + land.
  ctx.fillStyle = '#2FA8B5'; ctx.fillRect(0, 0, 150, 150);
  ctx.fillStyle = '#E8D5A3'; ctx.fillRect(0, 0, 118, 150);
  ctx.fillStyle = '#3A3F47'; ctx.fillRect(0, 0, 112, 150);
  // City blocks.
  ctx.fillStyle = '#4A4F58';
  for (let gx = 6; gx < 110; gx += 18) {
    for (let gy = 6; gy < 144; gy += 18) {
      if ((gx + gy) % 36 === 0) continue;
      ctx.fillRect(gx, gy, 13, 13);
    }
  }
  // Streets.
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(56, 0); ctx.lineTo(56, 150); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(112, 48); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 96); ctx.lineTo(112, 96); ctx.stroke();
  // Flood zone (moss-green, grows per day).
  ctx.fillStyle = 'rgba(74,122,106,0.75)';
  ctx.beginPath(); ctx.ellipse(34, 122, 30, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
  ctx.fillText('ROB', 26, 125);
  // GPS route (thick pink).
  ctx.strokeStyle = '#E86A92'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(56, 138); ctx.lineTo(56, 96); ctx.lineTo(92, 96); ctx.lineTo(92, 48); ctx.lineTo(56, 48); ctx.stroke();
  // Police dots (blue) + mission marker (yellow diamond).
  ctx.fillStyle = '#2A6BFF';
  for (const [px, py] of [[56, 118], [64, 84], [48, 60], [92, 60]]) {
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#FFD23F';
  ctx.save(); ctx.translate(56, 48); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
  // Player arrow (red triangle, centre-bottom).
  ctx.fillStyle = '#E8443A';
  ctx.save(); ctx.translate(56, 132); ctx.rotate(0);
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Ring + N marker.
  ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.strokeStyle = '#2DD4BF'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('N', 71, 14);
  return c;
}
