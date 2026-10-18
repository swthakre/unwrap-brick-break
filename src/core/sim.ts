// Deterministic game simulation. Uses only + - * / and sqrt, which every JS engine
// computes identically, so a server can replay a run and reach the same score.
import {
  BALL_R, BOWL_Y, COLS, DT, DX, DY, H, Input, InputLog, GameEvent, LevelDef, MAX_BALLS,
  PLAY_TOP, ROWS, TILE_RC, TPS, W, X0, Y0,
} from './types.ts';
import { Rng } from './rng.ts';

export interface Tile {
  x: number; y: number; r: number; c: number;
  hp: number; maxHp: number; kind: number; pu: number; alive: boolean;
}
export interface Ball { x: number; y: number; vx: number; vy: number; ttl: number; stuck: boolean; dead: boolean }
export interface Token { x: number; y: number; type: number }
export type State = 'play' | 'won' | 'lost';

const MAX_TICKS = TPS * 60 * 10;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export class Sim {
  readonly level: LevelDef;
  readonly rng: Rng;
  tiles: Tile[] = [];
  private grid: Int32Array = new Int32Array(ROWS * COLS).fill(-1);
  aliveCount = 0;
  balls: Ball[] = [];
  tokens: Token[] = [];
  events: GameEvent[] = [];
  log: InputLog = [];
  tick = 0;
  state: State = 'play';
  score = 0;
  combo = 0;
  bestCombo = 0;
  mostBalls = 1;
  lives: number;
  livesLost = 0;
  stars = 0;
  bonus = 0;
  bowlX = W / 2;
  waiting = true;
  wide = 0; wideT = 0; pierceT = 0; echoT = 0; netT = 0;
  drift = 0;
  private lastX = W / 2;
  private lastL = 0;

  constructor(level: LevelDef) {
    this.level = level;
    this.rng = new Rng(level.seed);
    this.lives = level.lives;
    for (const d of level.tiles) {
      const t: Tile = {
        c: d.c, r: d.r, x: X0 + d.c * DX + (d.r & 1 ? DX / 2 : 0), y: Y0 + d.r * DY,
        hp: d.hp, maxHp: d.hp, kind: d.kind, pu: d.pu, alive: true,
      };
      this.grid[d.r * COLS + d.c] = this.tiles.length;
      this.tiles.push(t);
    }
    this.aliveCount = this.tiles.length;
    this.resetLife();
  }

  get bowlW(): number { return this.level.bowlW * (1 + this.wide); }
  get speed(): number { return this.level.speed; }
  get seconds(): number { return this.tick / TPS; }

  private resetLife(): void {
    this.balls = [{ x: this.bowlX, y: BOWL_Y - BALL_R - 1, vx: 0, vy: 0, ttl: 0, stuck: true, dead: false }];
    this.tokens = [];
    this.wide = 0; this.wideT = 0; this.pierceT = 0; this.echoT = 0; this.netT = 0;
    this.waiting = true;
    this.combo = 0;
  }

  step(inp: Input): void {
    if (this.state !== 'play') return;
    this.tick++;
    const x = Math.round(inp.x * 2) / 2;
    const l = inp.launch ? 1 : 0;
    if (x !== this.lastX || l !== this.lastL) {
      this.log.push([this.tick, x, l]);
      this.lastX = x; this.lastL = l;
    }
    this.events.length = 0;

    // timers
    if (this.wideT > 0 && --this.wideT === 0) this.wide = 0;
    if (this.pierceT > 0) this.pierceT--;
    if (this.echoT > 0) this.echoT--;
    if (this.netT > 0) this.netT--;

    // drift of the whole picture (triangle wave smoothed with a cubic)
    const lv = this.level;
    if (lv.driftAmp > 0) {
      const ph = (this.tick % lv.driftTicks) / lv.driftTicks;
      const tri = ph < 0.5 ? ph * 4 - 1 : 3 - ph * 4;
      this.drift = lv.driftAmp * (1.5 * tri - 0.5 * tri * tri * tri);
    }

    // bowl follows the pointer with a speed limit
    const bw = this.bowlW;
    const target = clamp(x, bw / 2, W - bw / 2);
    const maxMove = 2000 * DT;
    this.bowlX += clamp(target - this.bowlX, -maxMove, maxMove);

    if (this.waiting && l) {
      this.waiting = false;
      const b = this.balls[0];
      b.stuck = false;
      const dx = this.rng.range(-0.25, 0.25);
      b.vx = this.speed * dx;
      b.vy = -this.speed * Math.sqrt(1 - dx * dx);
      this.events.push({ t: 'launch', x: b.x, y: b.y });
    }

    const pierce = this.pierceT > 0;
    const n0 = this.balls.length;
    for (let i = 0; i < n0; i++) {
      const b = this.balls[i];
      if (b.dead) continue;
      if (b.stuck) { b.x = this.bowlX; continue; }
      if (b.ttl > 0 && --b.ttl === 0) { b.dead = true; continue; }
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      else if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y < PLAY_TOP + BALL_R) { b.y = PLAY_TOP + BALL_R; b.vy = Math.abs(b.vy); }

      if (b.vy > 0 && b.y + BALL_R >= BOWL_Y && b.y < BOWL_Y + 8 && Math.abs(b.x - this.bowlX) <= bw / 2 + BALL_R) {
        const hit = clamp((b.x - this.bowlX) / (bw / 2 + BALL_R), -1, 1);
        const dx = hit * 0.93;
        b.vx = this.speed * dx;
        b.vy = -this.speed * Math.sqrt(1 - dx * dx);
        b.y = BOWL_Y - BALL_R;
        if (b.ttl === 0) this.combo = 0;
        this.events.push({ t: 'bowl', x: b.x, y: BOWL_Y });
      }
      if (this.netT > 0 && b.vy > 0 && b.y + BALL_R >= BOWL_Y + 26) {
        b.vy = -Math.abs(b.vy);
        b.y = BOWL_Y + 26 - BALL_R;
      }
      if (b.y > H + 10) { b.dead = true; continue; }
      this.collide(b, pierce);
    }

    // falling tokens
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const t = this.tokens[i];
      t.y += 150 * DT;
      if (t.y >= BOWL_Y - 8 && t.y <= BOWL_Y + 16 && Math.abs(t.x - this.bowlX) <= bw / 2 + 10) {
        this.apply(t.type);
        this.score += 50;
        this.events.push({ t: 'token', x: t.x, y: t.y, n: t.type });
        this.tokens.splice(i, 1);
      } else if (t.y > H + 20) this.tokens.splice(i, 1);
    }

    this.balls = this.balls.filter((b) => !b.dead);
    if (this.balls.length > this.mostBalls) this.mostBalls = this.balls.length;

    if (this.aliveCount === 0) { this.win(); return; }
    if (!this.waiting && !this.balls.some((b) => b.ttl === 0)) this.loseLife();
    if (this.tick >= MAX_TICKS && this.state === 'play') this.state = 'lost';
  }

  private apply(type: number): void {
    if (type === 1) { this.wide = Math.min(1, this.wide + 0.4); this.wideT = 12 * TPS; }
    else if (type === 2) this.pierceT = 6 * TPS;
    else if (type === 3) this.echoT = 8 * TPS;
    else if (type === 4) this.netT = 7 * TPS;
    else if (type === 5) {
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 0.45;
        this.spawn(this.bowlX + (i - 1) * 10, BOWL_Y - BALL_R - 2, dx, -Math.sqrt(1 - dx * dx), 0);
      }
    }
  }

  private spawn(x: number, y: number, dx: number, dy: number, ttl: number): Ball | null {
    if (this.balls.length >= MAX_BALLS) return null;
    const b: Ball = { x, y, vx: dx * this.speed, vy: dy * this.speed, ttl, stuck: false, dead: false };
    this.normalize(b);
    this.balls.push(b);
    return b;
  }

  private randomDir(): [number, number] {
    const dx = this.rng.range(-1, 1);
    const dy = this.rng.range(-1, 1);
    const len = Math.sqrt(dx * dx + dy * dy);
    return len < 0.2 ? [0, -1] : [dx / len, dy / len];
  }

  private normalize(b: Ball): void {
    const sp = this.speed;
    const cur = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (cur < 1e-6) { b.vx = 0; b.vy = -sp; return; }
    const k = sp / cur;
    b.vx *= k; b.vy *= k;
    const minV = 0.24 * sp;
    if (Math.abs(b.vy) < minV) {
      b.vy = (b.vy < 0 || b.vy === 0 ? -1 : 1) * minV;
      b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(sp * sp - b.vy * b.vy);
    }
  }

  private collide(b: Ball, pierce: boolean): void {
    const row0 = Math.round((b.y - Y0) / DY);
    const lim = TILE_RC + BALL_R;
    let best = -1;
    let bd = 1e9;
    for (let r = row0 - 1; r <= row0 + 1; r++) {
      if (r < 0 || r >= ROWS) continue;
      const off = r & 1 ? DX / 2 : 0;
      const c0 = Math.round((b.x - this.drift - X0 - off) / DX);
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (c < 0 || c >= COLS) continue;
        const id = this.grid[r * COLS + c];
        if (id < 0) continue;
        const t = this.tiles[id];
        if (!t.alive) continue;
        const dx = b.x - (t.x + this.drift);
        const dy = b.y - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < lim * lim && d2 < bd) { bd = d2; best = id; }
      }
    }
    if (best < 0) return;
    const t = this.tiles[best];
    const tx = t.x + this.drift;
    if (!pierce) {
      const d = Math.sqrt(bd) || 1e-6;
      const nx = (b.x - tx) / d;
      const ny = (b.y - t.y) / d;
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
      b.x = tx + nx * lim;
      b.y = t.y + ny * lim;
      this.normalize(b);
      t.hp -= 1;
    } else t.hp = 0;

    if (t.hp > 0) { this.score += 2; this.events.push({ t: 'hit', x: tx, y: t.y }); return; }

    t.alive = false;
    this.aliveCount--;
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    const mult = 1 + Math.min(this.combo, 50) * 0.04;
    this.score += Math.round(10 * t.maxHp * mult);
    this.events.push({ t: 'break', x: tx, y: t.y, n: t.kind });
    if (t.kind >= 2) {
      this.score += 25 * t.kind;
      for (let i = 0; i < t.kind - 1; i++) {
        const [dx, dy] = this.randomDir();
        this.spawn(tx, t.y, dx, dy, 0);
      }
      this.events.push({ t: 'prism', x: tx, y: t.y, n: t.kind });
    }
    if (this.echoT > 0 && b.ttl === 0) {
      const [dx, dy] = this.randomDir();
      this.spawn(b.x, b.y, dx, dy, 5 * TPS);
    }
    if (t.pu > 0) this.tokens.push({ x: tx, y: t.y, type: t.pu });
  }

  private loseLife(): void {
    this.lives--;
    this.livesLost++;
    this.events.push({ t: 'life', x: this.bowlX, y: BOWL_Y });
    if (this.lives <= 0) {
      this.state = 'lost';
      this.balls = [];
      this.events.push({ t: 'lose', x: this.bowlX, y: BOWL_Y });
    } else this.resetLife();
  }

  private win(): void {
    this.state = 'won';
    const timeBonus = Math.max(0, Math.round((this.level.par - this.seconds) * 40));
    this.bonus = timeBonus + this.lives * 500;
    this.score += this.bonus;
    this.stars = this.livesLost === 0 ? 3 : this.livesLost === 1 ? 2 : 1;
    this.events.push({ t: 'win', x: W / 2, y: 300 });
  }
}

/** Re-run a recorded input log from scratch. A server uses this to verify scores. */
export function replay(level: LevelDef, log: InputLog): Sim {
  const s = new Sim(level);
  let i = 0;
  let cur: Input = { x: W / 2, launch: false };
  while (s.state === 'play') {
    while (i < log.length && log[i][0] === s.tick + 1) {
      cur = { x: log[i][1], launch: log[i][2] === 1 };
      i++;
    }
    s.step(cur);
  }
  return s;
}
