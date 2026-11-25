// Soto Rush — tiny synthesized sound effects, no audio files.
// Everything is an oscillator blip through the Web Audio API, created on
// the first user gesture (browsers block audio before one). In screenshot
// mode the game never touches audio at all.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Call from a click / key handler. Safe to call often; does nothing until
  // the browser allows an AudioContext.
  ensure() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One short tone. `type` is an oscillator shape, `slide` bends the pitch.
  tone(freq, ms, type = 'sine', volume = 0.12, slide = 0) {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + ms / 1000);
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + ms / 1000 + 0.02);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  click() { this.tone(620, 60, 'square', 0.05); }
  pick() { this.tone(520, 70, 'sine', 0.1, 220); }
  place() { this.tone(760, 80, 'sine', 0.1, -120); }
  error() { this.tone(160, 140, 'sawtooth', 0.07, -60); }
  ding() { this.tone(880, 120, 'sine', 0.11); this.tone(1320, 160, 'sine', 0.08); }
  coin() {
    this.tone(988, 90, 'sine', 0.1);
    setTimeout(() => this.tone(1319, 140, 'sine', 0.1), 70);
  }
  serve() {
    this.tone(523, 110, 'triangle', 0.12);
    setTimeout(() => this.tone(659, 110, 'triangle', 0.12), 90);
    setTimeout(() => this.tone(784, 180, 'triangle', 0.12), 180);
  }
  leave() { this.tone(220, 220, 'sawtooth', 0.06, -110); }
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 130, 'triangle', 0.1), i * 80));
  }
}
