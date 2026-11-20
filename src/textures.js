// Canvas textures: living facades, roads with aligned lane paint, signs.
// All drawing is deterministic (seeded loops only).
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Facade: base gradient + lit windows + door + sign band + balcony slabs.
// variant: { base, dark, trim, sign, signBg, floors, cols, balconies }
function makeFacadeTexture(v) {
  return canvasTex(256, 512, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, v.base);
    grad.addColorStop(1, v.dark);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    // sign band near the top
    g.fillStyle = v.signBg;
    g.fillRect(0, 26, W, 46);
    g.fillStyle = '#FFF6DC';
    g.font = 'bold 26px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(v.sign, W / 2, 50);
    // windows
    const cols = v.cols, floors = v.floors;
    const ww = 30, wh = 40, gx = (W - cols * ww) / (cols + 1), gy = 26;
    const rng = makeRng(v.seed);
    for (let f = 0; f < floors; f++) {
      const y = 96 + f * ((H - 150) / floors);
      for (let c = 0; c < cols; c++) {
        const x = gx + c * (ww + gx);
        const lit = rng.next() < 0.55;
        g.fillStyle = '#20242E';
        g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
        g.fillStyle = lit ? '#FFD98A' : '#2E3A55';
        g.fillRect(x, y, ww, wh);
        if (lit) {
          g.fillStyle = 'rgba(255,255,255,0.55)';
          g.fillRect(x, y, ww, 8);
        } else {
          g.fillStyle = 'rgba(255,255,255,0.10)';
          g.fillRect(x, y, ww, wh);
        }
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + wh); g.stroke();
      }
      // balcony slab on some floors
      if (v.balconies && f % 2 === 1) {
        g.fillStyle = 'rgba(0,0,0,0.30)';
        g.fillRect(0, y + wh + 4, W, 8);
        g.fillStyle = v.trim;
        g.fillRect(0, y + wh + 12, W, 4);
      }
    }
    // door at street level
    g.fillStyle = '#1B1E26';
    g.fillRect(W / 2 - 26, H - 62, 52, 62);
    g.fillStyle = v.trim;
    g.fillRect(W / 2 - 30, H - 66, 60, 6);
    g.fillStyle = '#FFD98A';
    g.fillRect(W / 2 + 12, H - 34, 6, 6);
    // ground-floor awning strip
    g.fillStyle = v.trim;
    g.fillRect(0, H - 78, W, 10);
  });
}

// Road: dark asphalt, white dashed centre line, solid edge lines. Repeats along length.
function makeRoadTexture() {
  const t = canvasTex(128, 512, (g, W, H) => {
    g.fillStyle = '#33373F';
    g.fillRect(0, 0, W, H);
    const rng = makeRng(77);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rng.next() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
      g.fillRect(rng.next() * W, rng.next() * H, 2, 2);
    }
    // edge lines
    g.fillStyle = '#E8E8E0';
    g.fillRect(4, 0, 4, H);
    g.fillRect(W - 8, 0, 4, H);
    // centre dashes: two long dashes per tile (tile = 512px), aligned on tile seam
    g.fillStyle = '#FFFFFF';
    g.fillRect(W / 2 - 4, 40, 8, 170);
    g.fillRect(W / 2 - 4, 300, 8, 170);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Simple text sign / billboard.
function makeSignTexture(text, bg, fg, sub) {
  return canvasTex(512, 256, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = fg;
    g.lineWidth = 10;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = fg;
    g.font = '900 52px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const lines = text.split('\n');
    const y0 = sub ? H / 2 - 34 : H / 2;
    lines.forEach((ln, i) => g.fillText(ln, W / 2, y0 + i * 56));
    if (sub) {
      g.font = 'bold 30px Arial';
      g.fillText(sub, W / 2, H / 2 + 62);
    }
  });
}
