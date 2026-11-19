// TANJUNG ARUN — BADAI ARUNIKA: tiny WebAudio synth.
// No audio files, no network: oscillators only. Radio jingles, engine hum,
// and a one-shot drift sting. Started only after a user gesture.
let ctx = null;
let engineOsc = null;
let engineGain = null;

export function ensureAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const c = ensureAudio();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + dur + 0.05);
}

// VELMARA FM jingle: a little dangdut-ish pentatonic riff.
export function startRadio() {
  const notes = [523, 587, 659, 784, 659, 587, 523, 392];
  notes.forEach((f, i) => blip(f, 0.22, 'triangle', 0.1, i * 0.16));
  blip(130, 0.5, 'sine', 0.14, 0);
}

// Engine hum that follows speed (0..1).
export function engineHum(level) {
  if (level <= 0.02) {
    if (engineOsc) { try { engineOsc.stop(); } catch { /* already stopped */ } engineOsc = null; }
    return;
  }
  const c = ensureAudio();
  if (!engineOsc) {
    engineOsc = c.createOscillator();
    engineGain = c.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.connect(engineGain).connect(c.destination);
    engineOsc.start();
  }
  engineOsc.frequency.setTargetAtTime(55 + level * 130, c.currentTime, 0.08);
  engineGain.gain.setTargetAtTime(0.015 + level * 0.03, c.currentTime, 0.08);
}

// Drift sting: rising two-note chirp.
export function driftSting() {
  blip(880, 0.12, 'square', 0.06, 0);
  blip(1320, 0.18, 'square', 0.06, 0.1);
}
