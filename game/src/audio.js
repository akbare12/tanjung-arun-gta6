// TANJUNG ARUN procedural audio: engine, sirens, gunshots, radio.
// One job: every sound the game makes, synthesized with WebAudio —
// no audio files, no network, nothing to load.

import { RADIO } from './config.js';

let ctx = null;
let engineOsc = null, engineGain = null;
let radioTimer = null;
let sirenOsc = null, sirenGain = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* audio is optional; the game plays silent */ }
  return ctx;
}

export function setEngine(speed01, on) {
  if (!ctx || !on) { if (engineGain) engineGain.gain.value = 0; return; }
  try {
    if (!engineOsc) {
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 900;
      engineOsc.connect(filt); filt.connect(engineGain); engineGain.connect(ctx.destination);
      engineOsc.start();
    }
    engineOsc.frequency.value = 60 + speed01 * 160;
    engineGain.gain.value = 0.03 + speed01 * 0.05;
  } catch { /* ignore */ }
}

export function setSiren(on, wanted) {
  if (!ctx) return;
  try {
    if (on && !sirenOsc) {
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sine';
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0.02;
      sirenOsc.connect(sirenGain); sirenGain.connect(ctx.destination);
      sirenOsc.start();
      let hi = false;
      sirenOsc._iv = setInterval(() => { sirenOsc.frequency.value = hi ? 950 : 700; hi = !hi; }, 420);
    } else if (!on && sirenOsc) {
      clearInterval(sirenOsc._iv);
      sirenOsc.stop(); sirenOsc = null; sirenGain = null;
    }
    if (sirenGain) sirenGain.gain.value = 0.012 + wanted * 0.004;
  } catch { /* ignore */ }
}

export function blip(freq = 880, dur = 0.08, type = 'square', vol = 0.05) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}

export function gunshot() {
  if (!ctx) return;
  try {
    const len = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.16;
    src.connect(g); g.connect(ctx.destination); src.start();
  } catch { /* ignore */ }
}

export function cashSound() { blip(1320, 0.09, 'sine', 0.06); setTimeout(() => blip(1760, 0.12, 'sine', 0.06), 90); }
export function missionPassSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.07), i * 130));
}

// Radio: a tiny procedural "song" per station — a looping bassline + lead
// notes from a pentatonic set, different tempo/scale per station.
const SCALES = {
  '101.9': { bpm: 132, notes: [220, 262, 294, 330, 392, 440], wave: 'triangle' }, // dangdut-ish
  '88.1': { bpm: 96, notes: [196, 220, 247, 294, 330, 392], wave: 'sine' },     // synthwave
  '99.5': { bpm: 60, notes: [330, 330, 392, 330], wave: 'square' },             // emergency beeps
};

export function startRadio(stationId) {
  stopRadio();
  if (!ctx) return;
  const sc = SCALES[stationId] || SCALES['88.1'];
  const stepMs = 60000 / sc.bpm / 2;
  let i = 0;
  radioTimer = setInterval(() => {
    if (!ctx) return;
    const n = sc.notes[i % sc.notes.length];
    blip(i % 4 === 0 ? n / 2 : n, 0.16, sc.wave, i % 4 === 0 ? 0.05 : 0.028);
    i++;
  }, stepMs);
}
export function stopRadio() { if (radioTimer) { clearInterval(radioTimer); radioTimer = null; } }
export function radioStation(i) { return RADIO[i % RADIO.length]; }
