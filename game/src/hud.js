// TANJUNG ARUN v7 · hud.js — minimap bundar + peta kota besar (canvas 2D)
(function () {
  'use strict';
  function drawMini(id, label) {
    var c = document.getElementById(id); if (!c) return;
    var g = c.getContext('2d'), s = c.width, cx = s / 2, cy = s / 2;
    g.fillStyle = '#0E2A3A'; g.fillRect(0, 0, s, s);
    // laut
    g.fillStyle = '#2FA8B5'; g.fillRect(s * 0.72, 0, s * 0.28, s);
    // pasir
    g.fillStyle = '#E8D5A3'; g.fillRect(s * 0.66, 0, s * 0.06, s);
    // blok kota
    g.fillStyle = '#3A4A6A';
    for (var x = 0; x < 5; x++) for (var y = 0; y < 6; y++) {
      if (x === 3) continue;
      g.fillRect(6 + x * (s * 0.12), 6 + y * (s * 0.15), s * 0.09, s * 0.11);
    }
    // jalan
    g.strokeStyle = '#E8E8E8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(s * 0.62, 0); g.lineTo(s * 0.62, s); g.stroke();
    g.beginPath(); g.moveTo(0, s * 0.5); g.lineTo(s * 0.66, s * 0.5); g.stroke();
    // dermaga + perahu
    g.strokeStyle = '#B08954'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(s * 0.66, s * 0.3); g.lineTo(s * 0.95, s * 0.3); g.stroke();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(s * 0.85, s * 0.22, 4, 0, 7); g.fill();
    g.beginPath(); g.arc(s * 0.9, s * 0.42, 4, 0, 7); g.fill();
    g.fillStyle = '#FF7A1A';
    g.beginPath(); g.arc(s * 0.8, s * 0.55, 3.5, 0, 7); g.fill();
    // pemain + polisi
    g.fillStyle = '#E8443A'; g.beginPath(); g.arc(s * 0.6, s * 0.55, 5, 0, 7); g.fill();
    g.fillStyle = '#2244FF';
    g.beginPath(); g.arc(s * 0.6, s * 0.66, 4, 0, 7); g.fill();
    g.beginPath(); g.arc(s * 0.58, s * 0.76, 4, 0, 7); g.fill();
    // label distrik
    g.fillStyle = '#FFD166'; g.font = 'bold 11px Arial'; g.textAlign = 'center';
    g.fillText(label || 'PANTAI ROB', cx, s - 8);
    g.fillStyle = '#fff'; g.font = '9px Arial';
    g.fillText('NETRAL 58', cx, 12);
  }

  function drawBigMap() {
    var c = document.getElementById('bigmap'); if (!c) return;
    var g = c.getContext('2d'), W = 760, H = 640;
    // laut
    g.fillStyle = '#2FA8B5'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.15)';
    for (var wv = 0; wv < 40; wv++) {
      g.fillRect(560 + Math.random() * 180, Math.random() * H, 26, 2);
    }
    // daratan
    g.fillStyle = '#9A8F6A'; g.fillRect(0, 0, 540, H);
    // pasir pantai
    g.fillStyle = '#E8D5A3'; g.fillRect(520, 0, 26, H);
    // blok kota rapat
    var districts = [
      { x: 20, y: 20, w: 150, h: 120, name: 'KOTA LAMA', c: '#8A7A5A' },
      { x: 190, y: 20, w: 150, h: 120, name: 'STASIUN', c: '#7A8A6A' },
      { x: 360, y: 20, w: 140, h: 120, name: 'PELABUHAN', c: '#6A7A8A' },
      { x: 20, y: 160, w: 150, h: 140, name: 'PASAR ARUN', c: '#A88A5A' },
      { x: 190, y: 160, w: 150, h: 140, name: 'KAMPUNG NELAYAN', c: '#8A9A7A' },
      { x: 360, y: 160, w: 140, h: 140, name: 'DERMAGA', c: '#7A8A9A' },
      { x: 20, y: 320, w: 150, h: 140, name: 'PANTAI ROB', c: '#C9A86A' },
      { x: 190, y: 320, w: 150, h: 140, name: 'KOTA LAMA', c: '#8A7A5A' },
      { x: 360, y: 320, w: 140, h: 140, name: 'PANTAI ROB', c: '#C9A86A' },
      { x: 20, y: 480, w: 230, h: 130, name: 'KAMPUNG NELAYAN', c: '#8A9A7A' },
      { x: 270, y: 480, w: 230, h: 130, name: 'PANTAI ROB', c: '#C9A86A' }
    ];
    districts.forEach(function (d) {
      g.fillStyle = d.c; g.fillRect(d.x, d.y, d.w, d.h);
      // gedung kecil rapat per blok
      g.fillStyle = 'rgba(40,30,55,.55)';
      for (var bx = d.x + 8; bx < d.x + d.w - 14; bx += 22)
        for (var by = d.y + 8; by < d.y + d.h - 14; by += 20)
          g.fillRect(bx, by, 15, 13);
      g.fillStyle = '#241A33'; g.font = 'bold 12px Arial'; g.textAlign = 'left';
      g.fillText(d.name, d.x + 8, d.y + d.h - 8);
    });
    // jalan putih
    g.strokeStyle = '#F2F2F2'; g.lineWidth = 5;
    [150, 320].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); });
    [150, 320, 470].forEach(function (y) { g.beginPath(); g.moveTo(0, y); g.lineTo(540, y); g.stroke(); });
    g.strokeStyle = '#FFD166'; g.lineWidth = 2; g.setLineDash([8, 8]);
    [150, 320].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); });
    g.setLineDash([]);
    // garis banjir rob
    g.fillStyle = 'rgba(47,168,181,.45)'; g.fillRect(500, 0, 40, H);
    g.fillStyle = '#fff'; g.font = 'bold 11px Arial';
    g.fillText('ROB +1,9 M', 470, 610);
    // dermaga menjorok
    g.fillStyle = '#7A5230'; g.fillRect(540, 200, 130, 22);
    g.fillStyle = '#7A5230'; g.fillRect(540, 420, 90, 22);
    // perahu
    function boat(x, y, col) {
      g.fillStyle = col; g.beginPath();
      g.ellipse(x, y, 12, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#6B4226'; g.fillRect(x - 1, y - 12, 2, 12);
    }
    boat(600, 180, '#fff'); boat(640, 240, '#FFE9A8'); boat(580, 470, '#fff');
    boat(700, 330, '#FFD9B0'); boat(620, 520, '#fff'); boat(680, 90, '#FFE9A8');
    // perahu penyelamat
    g.fillStyle = '#FF7A1A'; g.beginPath(); g.ellipse(480, 260, 12, 5, 0, 0, 7); g.fill();
    // safehouse + misi aktif + polisi
    g.font = '20px Arial'; g.textAlign = 'center';
    g.fillText('\u{1F3E0}', 100, 380); // safehouse
    g.fillText('\u{2B50}', 430, 380);  // misi aktif
    g.fillText('\u{1F694}', 300, 200); // polisi
    g.fillText('\u{1F694}', 330, 540);
    g.fillStyle = '#FFD166'; g.font = 'bold 13px Arial'; g.textAlign = 'left';
    g.fillText('MISI 5/8: JEMBATAN TERAKHIR', 330, 400);
    g.fillText('SAFEHOUSE PIER', 60, 405);
    // judul peta
    g.fillStyle = '#241A33'; g.fillRect(0, 0, 300, 0); // noop keep
    g.fillStyle = '#fff'; g.font = 'bold 18px Arial';
    g.fillText('TANJUNG ARUN', 16, 596);
    g.font = '12px Arial'; g.fillStyle = '#FFE9C9';
    g.fillText('6 DISTRIK · SKALA 1:12.000 · ROB +1,9 M', 16, 616);
  }
  window.TAHud = { drawMini: drawMini, drawBigMap: drawBigMap };
})();
