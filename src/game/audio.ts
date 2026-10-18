// Tiny WebAudio synth. No audio files, so nothing to license.
let ctx: AudioContext | null = null;
let on = true;
let last = 0;
export function setSound(v: boolean) { on = v; }
export function unlock() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { ctx = null; }
}
function tone(f: number, dur: number, type: OscillatorType, vol: number, slide = 0, delay = 0) {
  if (!ctx || !on) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export function sfx(kind: string, combo = 0) {
  if (!ctx || !on) return;
  const now = ctx.currentTime;
  if ((kind === 'break' || kind === 'hit') && now - last < 0.035) return; // thin out dense bursts
  if (kind === 'break' || kind === 'hit') last = now;
  switch (kind) {
    case 'break': tone(392 * Math.pow(2, SCALE[Math.min(10, combo >> 2)] / 12), 0.09, 'triangle', 0.07); break;
    case 'hit': tone(240, 0.05, 'sine', 0.05); break;
    case 'bowl': tone(180, 0.08, 'sine', 0.09, -40); break;
    case 'prism': tone(660, 0.16, 'triangle', 0.09, 440); tone(990, 0.2, 'sine', 0.05, 0, 0.05); break;
    case 'token': tone(520, 0.1, 'triangle', 0.09); tone(780, 0.14, 'triangle', 0.09, 0, 0.07); break;
    case 'launch': tone(300, 0.1, 'sine', 0.07, 200); break;
    case 'life': tone(220, 0.35, 'sawtooth', 0.05, -120); break;
    case 'lose': tone(196, 0.5, 'triangle', 0.08, -90); break;
    case 'win': [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.35, 'triangle', 0.08, 0, i * 0.11)); break;
    case 'tap': tone(420, 0.04, 'sine', 0.04); break;
  }
}
export function buzz(ms: number, enabled: boolean) {
  if (!enabled) return;
  try { navigator.vibrate?.(ms); } catch { /* not supported */ }
}
