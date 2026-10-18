import { Sim } from '../src/core/sim.ts';
import type { Input, LevelDef } from '../src/core/types.ts';
import { W } from '../src/core/types.ts';

/** A simple player: chases the lowest falling ball and adds a little aim noise from the tile layout. */
export function botInput(s: Sim, jitter: number): Input {
  let target = s.bowlX;
  let low = -1;
  for (const b of s.balls) {
    if (b.ttl === 0 && !b.stuck && b.vy > 0 && b.y > low) { low = b.y; target = b.x; }
  }
  // aim off-centre so the ball does not loop between the same two tiles
  target += jitter * Math.sin(s.tick / 37) * s.bowlW * 0.35;
  return { x: Math.max(0, Math.min(W, target)), launch: s.waiting };
}

export function playBot(level: LevelDef, jitter = 1, maxTicks = 120 * 60 * 6): Sim {
  const s = new Sim(level);
  while (s.state === 'play' && s.tick < maxTicks) s.step(botInput(s, jitter));
  return s;
}
