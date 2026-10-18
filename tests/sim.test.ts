import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.ts';
import { Sim, replay } from '../src/core/sim.ts';
import { playBot } from './bot.ts';
import { COLS, ROWS } from '../src/core/types.ts';

test('there are 50 stages with valid tiles', () => {
  assert.equal(LEVELS.length, 50);
  for (const lv of LEVELS) {
    assert.ok(lv.tiles.length >= 100, `${lv.name} too small`);
    const seen = new Set<number>();
    for (const t of lv.tiles) {
      assert.ok(t.c >= 0 && t.c < COLS && t.r >= 0 && t.r < ROWS);
      assert.ok(!seen.has(t.r * COLS + t.c), `${lv.name} duplicate tile`);
      seen.add(t.r * COLS + t.c);
    }
    assert.ok(lv.tiles.some((t) => t.kind >= 2), `${lv.name} has no prism`);
  }
});

test('difficulty rises across the 50 stages', () => {
  assert.ok(LEVELS[49].speed > LEVELS[0].speed + 150);
  assert.ok(LEVELS[49].bowlW < LEVELS[0].bowlW - 20);
  const hp = (i: number) => Math.max(...LEVELS[i].tiles.map((t) => t.hp));
  assert.equal(hp(0), 1);
  assert.equal(Math.max(...LEVELS.slice(30).map((_, i) => hp(30 + i))), 3);
});

test('same input log gives the same score (server replay)', () => {
  for (const id of [1, 14, 33, 50]) {
    const live = playBot(LEVELS[id - 1]);
    const again = replay(LEVELS[id - 1], live.log);
    assert.equal(again.score, live.score, `stage ${id}`);
    assert.equal(again.tick, live.tick);
    assert.equal(again.state, live.state);
  }
});

test('a prism multiplies balls', () => {
  const s = playBot(LEVELS[0], 1, 120 * 60);
  assert.ok(s.mostBalls > 1, 'no multiplication happened');
});

test('bot clears every stage or loses cleanly', () => {
  const rows: string[] = [];
  let wins = 0;
  for (const lv of LEVELS) {
    const s = playBot(lv);
    if (s.state === 'won') wins++;
    assert.notEqual(s.state, 'play', `${lv.name} never ended`);
    rows.push(`${String(lv.id).padStart(2)} ${lv.name.padEnd(14)} ${s.state.padEnd(4)} ${s.seconds.toFixed(0).padStart(4)}s score ${String(s.score).padStart(7)} balls ${String(s.mostBalls).padStart(3)} stars ${s.stars}`);
  }
  console.log(rows.join('\n'));
  assert.ok(wins >= 40, `bot only cleared ${wins}`);
});

test('inputs are logged compactly', () => {
  const s = playBot(LEVELS[0]);
  assert.ok(s.log.length <= s.tick);
});
