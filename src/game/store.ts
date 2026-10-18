// Local progress. Wrapped in try/catch: storage can be blocked or empty in private windows.
export interface Save {
  v: 1;
  stars: number[];      // 50 entries, 0 = not cleared
  best: number[];       // best score per stage
  nick: string;
  sound: boolean;
  haptics: boolean;
  unlockAll: boolean;
  daily: Record<string, number>; // yyyy-mm-dd -> best score
  seenHint: boolean;
}
const KEY = 'unwrap.brickbreak.v1';
const blank = (): Save => ({
  v: 1, stars: new Array(50).fill(0), best: new Array(50).fill(0), nick: 'Player',
  sound: true, haptics: true, unlockAll: false, daily: {}, seenHint: false,
});
let mem: Save | null = null;

export function load(): Save {
  if (mem) return mem;
  let s = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.v === 1 && Array.isArray(p.stars) && p.stars.length === 50) s = { ...s, ...p };
    }
  } catch { /* storage unavailable: play without saving */ }
  mem = s;
  return s;
}
export function save(): void {
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* ignore */ }
}
export function reset(): void {
  mem = blank();
  save();
}
export const totalScore = (s: Save) => s.best.reduce((a, b) => a + b, 0);
export const totalStars = (s: Save) => s.stars.reduce((a, b) => a + b, 0);
export function unlocked(s: Save, i: number): boolean {
  return s.unlockAll || i === 0 || s.stars[i] > 0 || s.stars[i - 1] > 0;
}
export function nextStage(s: Save): number {
  for (let i = 0; i < 50; i++) if (s.stars[i] === 0) return i;
  return 49;
}
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}
/** Same shape for everyone on the same UTC day. */
export function dailyStage(key = todayKey()): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 50;
}
export function cleanNick(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, ' ');
  if (t.length < 3 || t.length > 14) return null;
  return /^[A-Za-z0-9_. ]+$/.test(t) ? t : null;
}
