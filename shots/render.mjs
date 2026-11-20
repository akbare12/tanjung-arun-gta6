// Headless CDP screenshot driver for the 4 deterministic shots.
// usage: node shots/render.mjs <repoDir> [quality] [port]
// Requires chrome on --remote-debugging-port=<port> with WebGL (SwiftShader).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repo = resolve(process.argv[2] || '.');
const quality = +(process.argv[3] || 80);
const port = process.argv[4] || '9222';
const SHOTS = [['chase', '1-chase.jpg'], ['combat', '2-combat.jpg'], ['title', '3-title.jpg'], ['map', '4-map.jpg']];

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('no page target on port ' + port);
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});
await new Promise((r) => { ws.onopen = r; });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id).res(m.result); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') {
    console.log('PAGE EXCEPTION:', JSON.stringify(m.params.exceptionDetails).slice(0, 500));
  }
};
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

for (const [shot, file] of SHOTS) {
  const url = `file://${repo}/index.html?shot=${shot}`;
  await send('Page.navigate', { url });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const ev = await send('Runtime.evaluate', { expression: 'window.__shotReady === true ? "ready" : (window.__shotError || "")', returnByValue: true });
    const v = ev.result?.value;
    if (v === 'ready') { ready = true; break; }
    if (v) { console.log(`shot ${shot} PAGE ERROR:`, v); break; }
  }
  if (!ready) console.log(`shot ${shot}: NOT READY after 60s`);
  const s = await send('Page.captureScreenshot', { format: 'jpeg', quality });
  const buf = Buffer.from(s.data, 'base64');
  writeFileSync(`${repo}/screenshots/${file}`, buf);
  console.log(`wrote screenshots/${file}`, buf.length, 'bytes');
}
ws.close();
process.exit(0);
