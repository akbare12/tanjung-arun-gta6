// audio.js — all sound is synthesized with WebAudio: engine hum, sirens,
// gunshots, radio jingles and UI clicks. No audio files, no network.
// One job: sound.

export function createAudio() {
  let ctx = null;
  let radioOn = true;
  let station = 0;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function beep(freq, dur, type, vol) {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  return {
    click() { beep(660, 0.06, 'square', 0.05); },
    gunshot() { beep(160, 0.12, 'sawtooth', 0.12); beep(90, 0.18, 'square', 0.1); },
    siren() { beep(880, 0.25, 'sine', 0.04); setTimeout(() => beep(660, 0.25, 'sine', 0.04), 260); },
    pickup() { beep(880, 0.08, 'sine', 0.07); setTimeout(() => beep(1320, 0.12, 'sine', 0.07), 90); },
    missionPass() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'triangle', 0.09), i * 140)); },
    nextStation() {
      station = (station + 1) % 3;
      beep(440, 0.05, 'square', 0.05);
      return station;
    },
    get station() { return station; },
    get radioOn() { return radioOn; },
    toggleRadio() { radioOn = !radioOn; return radioOn; },
  };
}
