// Bakes the 50 stages into src/levels.data.json so every device (and the server) uses identical data.
import { writeFileSync } from 'node:fs';
import { COLS, DX, DY, ROWS, TPS, W, X0, Y0 } from '../src/core/types.ts';
import { Rng } from '../src/core/rng.ts';
import { STAGES, WORLDS } from './stages.ts';
import type { LevelDef, TileDef } from '../src/core/types.ts';

const CX = W / 2;
const CY = Y0 + (33 * DY) / 2;
const SCALE = 190;

const levels: LevelDef[] = STAGES.map((st, i) => {
  const id = i + 1;
  const w = Math.floor(i / 10);
  const k = i % 10;
  const boss = k === 9;
  const hpMax = Math.min(3, [1, 2, 2, 3, 3][w] + (boss && w > 0 ? 0 : 0));
  const cells: Array<{ c: number; r: number; d: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = X0 + c * DX + (r & 1 ? DX / 2 : 0);
      const y = Y0 + r * DY;
      const d = st.f((x - CX) / SCALE, (y - CY) / SCALE);
      if (d < 0) cells.push({ c, r, d });
    }
  }
  const rng = new Rng(id * 7919 + 13);
  const tiles: TileDef[] = cells.map((q) => ({
    c: q.c, r: q.r,
    hp: hpMax === 1 ? 1 : 1 + Math.min(hpMax - 1, Math.floor(-q.d / 0.17)),
    kind: 0, pu: 0,
  }));
  // prisms live in the interior so you have to dig for them
  const interior = tiles.map((t, idx) => idx).filter((idx) => -cells[idx].d > 0.06);
  const pool = interior.length >= 12 ? interior : tiles.map((_, idx) => idx);
  const pick = (): number => pool.splice(rng.int(pool.length), 1)[0];
  const n2 = Math.max(3, 8 - w), n3 = 2 + (w >= 2 ? 1 : 0), n5 = boss ? 2 : w >= 3 ? 1 : 0;
  for (let n = 0; n < n2 && pool.length; n++) tiles[pick()].kind = 2;
  for (let n = 0; n < n3 && pool.length; n++) tiles[pick()].kind = 3;
  for (let n = 0; n < n5 && pool.length; n++) tiles[pick()].kind = 5;
  // power-up drops on ordinary tiles: wide, pierce, echo, net, triple
  const weights = [1, 1, 2, 2, 3, 3, 4, 5, 5];
  const drops = Math.round(tiles.length * 0.045);
  const free = tiles.map((_, idx) => idx).filter((idx) => tiles[idx].kind === 0);
  for (let n = 0; n < drops && free.length; n++) {
    tiles[free.splice(rng.int(free.length), 1)[0]].pu = weights[rng.int(weights.length)];
  }
  const speed = Math.round(330 + i * 4.2);
  return {
    id, name: st.name, world: w, tier: WORLDS[w].tier, seed: id * 104729 + 7,
    speed,
    bowlW: Math.round((108 - i * 0.55) * 10) / 10,
    lives: 3,
    driftAmp: [0, 5, 8, 11, 14][w],
    driftTicks: Math.round((6 - w * 0.6) * TPS),
    par: Math.round(40 + tiles.length * 0.09 + i * 0.3),
    tiles,
  };
});

writeFileSync(new URL('../src/levels.data.json', import.meta.url), JSON.stringify(levels));

// ASCII preview of a few stages
for (const id of [1, 14, 25, 50]) {
  const lv = levels[id - 1];
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
  for (const t of lv.tiles) g[t.r][t.c] = t.kind ? String(t.kind) : t.hp > 1 ? '#' : '.';
  console.log(`\nStage ${id} ${lv.name}: ${lv.tiles.length} tiles`);
  console.log(g.map((row, r) => (r & 1 ? ' ' : '') + row.join(' ')).join('\n'));
}
console.log('\n' + levels.map((l) => `${l.id}:${l.name}=${l.tiles.length}`).join('  '));
