// audio.js — tiny WebAudio synth: radio jingles, engine hum, police siren.
// No audio files: everything is synthesized, so the game stays fully offline.
export class GameAudio {
  constructor() {
    this.ctx = null; this.master = null; this.radioNodes = null; this.sirenNodes = null;
  }
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);
  }
  // A short radio jingle: a little pentatonic riff per station.
  playRadioJingle(station = 0) {
    this.ensure(); if (!this.ctx) return;
    this.stopRadio();
    const riffs = [
      [523, 659, 784, 659, 587, 523], // VELMARA FM — breezy major
      [440, 554, 659, 554, 440, 330], // DANGDUT ARUN — dangdut-ish
      [392, 494, 587, 740, 587, 494], // SUNSET BAY — mellow
    ];
    const notes = riffs[station % riffs.length];
    const t0 = this.ctx.currentTime + 0.05;
    const gain = this.ctx.createGain(); gain.gain.value = 0.18; gain.connect(this.master);
    const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.connect(gain);
    notes.forEach((f, i) => osc.frequency.setValueAtTime(f, t0 + i * 0.16));
    osc.start(t0); osc.stop(t0 + notes.length * 0.16 + 0.1);
    this.radioNodes = { osc, gain };
  }
  stopRadio() {
    if (this.radioNodes) { try { this.radioNodes.osc.stop(); } catch { /* already stopped */ } this.radioNodes = null; }
  }
  // Two-tone police siren loop.
  startSiren() {
    this.ensure(); if (!this.ctx || this.sirenNodes) return;
    const osc = this.ctx.createOscillator(); osc.type = 'sine';
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.8;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    osc.frequency.value = 900;
    const gain = this.ctx.createGain(); gain.gain.value = 0.05; gain.connect(this.master);
    osc.connect(gain); osc.start(); lfo.start();
    this.sirenNodes = { osc, lfo, gain };
  }
  stopSiren() {
    if (!this.sirenNodes) return;
    const { osc, lfo } = this.sirenNodes;
    try { osc.stop(); lfo.stop(); } catch { /* already stopped */ }
    this.sirenNodes = null;
  }
  // Engine hum whose pitch follows speed.
  engine(speed01) {
    this.ensure(); if (!this.ctx) return;
    if (!this.engineOsc) {
      const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
      const gain = this.ctx.createGain(); gain.gain.value = 0.0; gain.connect(this.master);
      const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
      osc.connect(filt); filt.connect(gain); osc.start();
      this.engineOsc = { osc, gain };
    }
    this.engineOsc.osc.frequency.value = 60 + speed01 * 160;
    this.engineOsc.gain.gain.value = 0.03 + speed01 * 0.05;
  }
  beep(freq = 880, dur = 0.12) {
    this.ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(this.master); osc.start(t); osc.stop(t + dur);
  }
}
