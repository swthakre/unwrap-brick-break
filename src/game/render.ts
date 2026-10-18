import { BALL_R, BOWL_Y, DX, H, PLAY_TOP, W, GameEvent, LevelDef } from '../core/types.ts';
import { Sim } from '../core/sim.ts';

export const INK = '#1C1F2E', BG = '#EEF1F6', HAIR = '#D5DBE5', CORAL = '#FF6B4A', INDIGO = '#4B55D6';

// light, mid, dark per world. Same indigo family, nudged in hue so worlds feel different but calm.
export const PAL: Array<[string, string, string]> = [
  ['#B7BCF4', '#8790EC', '#5D66DB'],
  ['#B3CBF2', '#7FA6EA', '#4F7FD8'],
  ['#AEDCE0', '#78C0C9', '#3F9CAB'],
  ['#C3C8D6', '#98A0B8', '#6C7691'],
  ['#CDBDF2', '#A58BE6', '#7C5BD3'],
];
const STAR_COL = '#F2B63D';

const R = DX / Math.sqrt(3) - 0.55; // slightly smaller than touching, leaves a hairline gap
const hex = new Path2D();
// pointy-top hexagon
{
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 3; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  hex.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) hex.lineTo(pts[i][0], pts[i][1]);
  hex.closePath();
}


// Hidden picture under the tiles: a soft two-colour gradient per world with a light spot,
// so breaking tiles uncovers colour. Shared by gameplay and gallery thumbnails.
const PIC: Array<[string, string]> = [['#6FC3A0', '#F2C14E'], ['#7FA6EA', '#F4B8C8'], ['#3F9CAB', '#A5E3CF'], ['#E7A978', '#B87AA8'], ['#7C5BD3', '#F29AC1']];
const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function picColors(pts: Array<[number, number]>, world: number): string[] {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const a = rgb(PIC[world][0]), b = rgb(PIC[world][1]);
  return pts.map(([x, y], i) => {
    const nx = (x - x0) / Math.max(1, x1 - x0), ny = (y - y0) / Math.max(1, y1 - y0);
    const t = Math.min(1, Math.max(0, 0.65 * ny + 0.35 * nx));
    const d = Math.sqrt((nx - 0.3) * (nx - 0.3) + (ny - 0.25) * (ny - 0.25));
    const lift = Math.max(0, 0.22 - d * 0.3) * 255 + ((i * 2654435761) % 7) - 3;
    const c = [0, 1, 2].map((k) => Math.round(Math.min(255, Math.max(0, a[k] + (b[k] - a[k]) * t + lift))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  });
}
const picCache = new WeakMap<object, string[]>();

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; s: number; txt?: string }

export class Fx {
  parts: Particle[] = [];
  shake = 0;
  add(ev: GameEvent, world: number, reduce: boolean) {
    const pal = PAL[world];
    if (ev.t === 'break') {
      if (reduce) return;
      const n = ev.n ? 7 : 3;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = 40 + Math.random() * 90;
        this.parts.push({ x: ev.x, y: ev.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45, max: 0.45, col: ev.n ? CORAL : pal[1], s: 2.2 });
      }
    } else if (ev.t === 'prism') {
      this.parts.push({ x: ev.x, y: ev.y, vx: 0, vy: -38, life: 0.8, max: 0.8, col: CORAL, s: 0, txt: '×' + ev.n });
    } else if (ev.t === 'token') {
      const names = ['', 'Wide', 'Pierce', 'Echo', 'Net', '+3'];
      this.parts.push({ x: ev.x, y: ev.y - 10, vx: 0, vy: -34, life: 0.9, max: 0.9, col: INDIGO, s: 0, txt: names[ev.n ?? 0] });
    }
  }
  update(dt: number) {
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.txt) p.vy += 220 * dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
  }
}

function shade(t: { r: number; c: number; hp: number; maxHp: number }, pal: [string, string, string]): string {
  // depth by remaining hit points: more hits left = darker
  return t.hp >= 3 ? pal[2] : t.hp === 2 ? pal[1] : pal[0];
}

export function drawGame(ctx: CanvasRenderingContext2D, sim: Sim, fx: Fx, now: number, endAge = 0) {
  const lv = sim.level;
  const pal = PAL[lv.world];
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // faint top limit
  ctx.strokeStyle = HAIR; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, PLAY_TOP + 0.5); ctx.lineTo(W, PLAY_TOP + 0.5); ctx.stroke();

  // hidden picture, visible through holes and hairline gaps
  const d = sim.drift;
  let pc = picCache.get(sim);
  if (!pc) { pc = picColors(sim.tiles.map((t) => [t.x, t.y]), lv.world); picCache.set(sim, pc); }
  ctx.save();
  for (let i = 0; i < sim.tiles.length; i++) {
    const t = sim.tiles[i];
    ctx.fillStyle = pc[i];
    ctx.save(); ctx.translate(t.x + d, t.y); ctx.scale(1.07, 1.07); ctx.fill(hex); ctx.restore();
  }
  ctx.restore();

  // tiles
  for (const t of sim.tiles) {
    if (!t.alive) continue;
    const x = t.x + d, y = t.y;
    ctx.save();
    ctx.translate(x, y);
    if (t.kind) {
      ctx.fillStyle = CORAL; ctx.fill(hex);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.font = '700 8.5px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(t.kind), 0, 0.5);
    } else {
      ctx.fillStyle = shade(t, pal); ctx.fill(hex);
      if (t.hp < t.maxHp) { ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill(hex); }
      if (t.pu) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, 6.283); ctx.fill(); }
    }
    ctx.restore();
  }

  // safety net
  if (sim.netT > 0) {
    const a = Math.min(1, sim.netT / 90);
    ctx.globalAlpha = a; ctx.strokeStyle = CORAL; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(10, BOWL_Y + 28); ctx.lineTo(W - 10, BOWL_Y + 28); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  const won = sim.state === 'won';
  // tokens
  for (const k of won ? [] : sim.tokens) {
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INDIGO; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(k.x, k.y, 11, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INDIGO; ctx.font = '800 10px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['', 'W', 'P', 'E', 'N', '+3'][k.type], k.x, k.y + 0.5);
  }

  // bowl: a curved cup, wider means a bigger catch
  const bw = sim.bowlW, bx = sim.bowlX;
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(bx - bw / 2 + 3, BOWL_Y + 3); ctx.quadraticCurveTo(bx, BOWL_Y + 17, bx + bw / 2 - 3, BOWL_Y + 3); ctx.stroke();
  if (sim.pierceT > 0 || sim.echoT > 0) {
    ctx.strokeStyle = sim.pierceT > 0 ? CORAL : INDIGO; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx - bw / 2 + 8, BOWL_Y + 11); ctx.quadraticCurveTo(bx, BOWL_Y + 21, bx + bw / 2 - 8, BOWL_Y + 11); ctx.stroke();
  }

  // balls
  for (const b of won ? [] : sim.balls) {
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, 6.283);
    if (b.ttl > 0) { ctx.fillStyle = 'rgba(75,85,214,.55)'; }
    else ctx.fillStyle = sim.pierceT > 0 ? CORAL : INK;
    ctx.fill();
  }

  // particles
  for (const p of fx.parts) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    if (p.txt) {
      ctx.fillStyle = p.col; ctx.font = '800 15px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.txt, p.x, p.y);
    } else { ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  }
  ctx.globalAlpha = 1;

  // reveal moment: shine sweep and the picture's name
  if (sim.state === 'won' && endAge > 0) {
    const k = Math.min(1, endAge / 700);
    const sx = -120 + (W + 240) * Math.min(1, endAge / 1400);
    ctx.save();
    ctx.globalAlpha = 0.28 * (1 - Math.min(1, endAge / 1500));
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.moveTo(sx, PLAY_TOP); ctx.lineTo(sx + 70, PLAY_TOP); ctx.lineTo(sx - 30, BOWL_Y); ctx.lineTo(sx - 100, BOWL_Y); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = k; ctx.fillStyle = INK; ctx.font = '800 30px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lv.name, W / 2, 668);
    ctx.fillStyle = '#5E6577'; ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText(`STAGE ${lv.id} UNWRAPPED`, W / 2, 696);
    ctx.globalAlpha = 1;
  }

  // launch hint
  if (sim.waiting && sim.state === 'play') {
    const pulse = 0.55 + 0.45 * Math.sin(now / 320);
    ctx.globalAlpha = pulse; ctx.fillStyle = '#5E6577'; ctx.font = '600 13px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Tap to launch', W / 2, BOWL_Y - 46);
    ctx.globalAlpha = 1;
  }
}

/** Mini picture for gallery cards and the home screen. */
export function drawThumb(c: HTMLCanvasElement, lv: LevelDef, mode: 'done' | 'open' | 'locked', px = 1) {
  const g = c.getContext('2d')!;
  const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  const pts: Array<[number, number, number, number]> = [];
  for (const t of lv.tiles) {
    const x = 0 + t.c * DX + (t.r & 1 ? DX / 2 : 0), y = t.r * 12.6;
    pts.push([x, y, t.hp, t.kind]);
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const bw = maxX - minX + DX, bh = maxY - minY + 14;
  const k = Math.min((w - 6 * px) / bw, (h - 6 * px) / bh);
  const ox = (w - bw * k) / 2 - minX * k + (DX / 2) * k, oy = (h - bh * k) / 2 - minY * k + 7 * k;
  const r = Math.max(1, (DX / 2 - 0.4) * k);
  const cols = picColors(pts.map(([x, y]) => [x, y]), lv.world);
  let pi = 0;
  for (const [x, y] of pts) {
    g.fillStyle = mode === 'locked' ? '#DDE2EB' : mode === 'open' ? '#C9CFDC' : cols[pi];
    pi++;
    g.beginPath(); g.arc(ox + x * k, oy + y * k, r, 0, 6.283); g.fill();
  }
}

export { STAR_COL };
