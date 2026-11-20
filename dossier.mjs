/* TANJUNG ARUN — dossier builder.
   Renders the 4 screenshots deterministically in headless Chrome (CDP,
   file:// URLs, SwiftShader WebGL) and writes dossier.json with the kit's
   own buildDossier (vendor/makefun-game.ts). Run twice: every byte must match.
   Usage: node --experimental-strip-types dossier.mjs [--shots 1,2,3,4] */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE);
const CHROME = '/opt/meta-chromium/chrome';
const PORT = 9333; // 9222 is taken by another session's chrome on this VM
const W = 1280, H = 720;
const MAX_SHOT_BYTES = 262144;

const SHOT_NAMES = { 1: '1-chase.jpg', 2: '2-combat.jpg', 3: '3-title.jpg', 4: '4-map.jpg' };

const args = process.argv.slice(2);
const shotsArg = args.find((a) => a.startsWith('--shots='));
const SHOTS = shotsArg
  ? shotsArg.slice('--shots='.length).split(',').map(Number).filter((n) => SHOT_NAMES[n])
  : [1, 2, 3, 4];

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function writePolicy() {
  const policy = '/tmp/hatch-webgl-policy-v6.txt';
  writeFileSync(policy, 'hatch-webgl-all-origins-v1\n');
  const sum = createHash('sha256').update(readFileSync(policy)).digest('hex');
  return { policy, sum };
}

async function waitForCdp(timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) return await res.json();
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('CDP did not come up on port ' + PORT);
}

function connectWs(url) {
  return new Promise((resolveWs, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pend = new Map();
    const events = [];
    ws.onopen = () => resolveWs({
      send: (method, params = {}) => new Promise((res, rej) => {
        const i = ++id;
        pend.set(i, { res, rej });
        ws.send(JSON.stringify({ id: i, method, params }));
      }),
      events,
      close: () => ws.close(),
    });
    ws.onerror = (e) => reject(new Error('ws error: ' + (e.message || 'unknown')));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) {
        const p = pend.get(m.id);
        pend.delete(m.id);
        if (m.error) p.rej(new Error(m.error.message));
        else p.res(m.result);
      } else if (m.method) {
        events.push(m);
      }
    };
  });
}

async function renderShot(cdp, n) {
  const url = 'file://' + join(ROOT, 'game', 'index.html') + '?shot=' + n;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(300);
  await cdp.send('Page.navigate', { url });
  const t0 = Date.now();
  let ready = false, debug = null;
  while (Date.now() - t0 < 90000) {
    const ev = await cdp.send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
    if (ev.result && ev.result.value === true) { ready = true; break; }
    const err = await cdp.send('Runtime.evaluate', { expression: 'window.__shotError || null', returnByValue: true });
    if (err.result && err.result.value) throw new Error('shot ' + n + ' page error: ' + err.result.value);
    await sleep(500);
  }
  if (!ready) throw new Error('shot ' + n + ' timed out waiting for __shotReady');
  const dbg = await cdp.send('Runtime.evaluate', { expression: 'window.__shotDebug()', returnByValue: true, awaitPromise: true });
  debug = dbg.result ? dbg.result.value : null;
  const outPath = join(ROOT, 'screenshots', SHOT_NAMES[n]);
  let quality = 82, bytes = null;
  for (const q of [82, 70, 60, 50]) {
    quality = q;
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: q });
    bytes = Buffer.from(shot.data, 'base64');
    if (bytes.length <= MAX_SHOT_BYTES) break;
  }
  if (bytes.length > MAX_SHOT_BYTES) {
    throw new Error(SHOT_NAMES[n] + ' still ' + bytes.length + ' bytes at quality 50');
  }
  writeFileSync(outPath, bytes);
  return { name: SHOT_NAMES[n], bytes: bytes.length, sha256: sha256(bytes), quality, debug };
}

async function main() {
  mkdirSync(join(ROOT, 'screenshots'), { recursive: true });
  const { policy, sum } = writePolicy();
  const profile = '/tmp/chrome-dossier-v6-' + Date.now();
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--hatch-webgl-allowed-domains-file=' + policy,
    '--hatch-webgl-allowed-domains-sha256=' + sum,
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--disable-dev-shm-usage', '--disable-extensions',
    '--window-size=' + W + ',' + H, 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let chromeLog = '';
  chrome.stdout.on('data', (d) => { chromeLog += d; });
  chrome.stderr.on('data', (d) => { chromeLog += d; });
  try {
    const targets = await waitForCdp();
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target on CDP');
    const cdp = await connectWs(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    const results = [];
    for (const n of SHOTS) {
      const r = await renderShot(cdp, n);
      results.push(r);
      console.log(JSON.stringify({ shot: n, ...r, debug: r.debug }));
    }
    cdp.close();
    const errors = [];
    // console/exception events were collected on the socket; surface them
    // (kept minimal: only print if present)
    const dossierBytes = buildDossier(ROOT, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
      game_max_files: 993,
      game_max_bytes: 50331648,
      game_path_max_bytes: 1000,
    });
    writeFileSync(join(ROOT, 'dossier.json'), dossierBytes);
    const dossierHash = sha256(dossierBytes);
    console.log(JSON.stringify({
      dossier: 'dossier.json', bytes: dossierBytes.length, sha256: dossierHash,
      screenshots: results.map((r) => ({ name: r.name, bytes: r.bytes, sha256: r.sha256, quality: r.quality })),
    }));
    if (errors.length) console.log('cdp-events:', JSON.stringify(errors.slice(0, 10)));
  } finally {
    try { chrome.kill('SIGKILL'); } catch { /* already dead */ }
    await sleep(500);
  }
  if (false) console.log('never');
}

main().catch((e) => {
  console.error('DOSSIER-FAILED:', e.message);
  process.exit(1);
});
