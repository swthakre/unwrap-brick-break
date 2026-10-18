# Unwrap: Brick Break

A calm, modern brick-breaker for phones. Every stage is a hidden picture made of hex tiles. Steer a curved bowl, split your ball with coral prisms, and break the tiles to unwrap the picture underneath.

> Status: playable web prototype (v0.1). Backend, global leaderboard and store builds are not started. Trademark clearance for the name is **not complete** (see `docs/PLAN.md`).

## Features

- 50 stages in 5 worlds (Garden, Sky, Ocean, City, Cosmos), a boss shape every 10th stage
- Ball multiplication: coral prisms split a ball into 2, 3 or 5
- Five power-ups: Wide bowl, Pierce, Echo, Net, Triple (+3 balls)
- Combo scoring, time and lives bonus, 1 to 3 stars per stage
- Hidden picture revealed as tiles break, with a reveal moment on clear
- Daily shape (same stage for everyone each UTC day)
- Local progress and personal bests, no account, no tracking
- Global leaderboard: **not live yet**, designed for server-side replay verification

## Project layout

```
src/core/       Deterministic simulation (120 Hz, no trig, seeded RNG) and replay()
src/game/       Canvas renderer, UI logic, audio (WebAudio), local storage
src/levels*.ts  The 50 baked stages (levels.data.json is generated)
scripts/        Level generator (SDF shapes), HTML shell, single-file build
tests/          Engine tests and a bot that plays every stage
docs/PLAN.md    Research, legal checklist, architecture, security plan
```

## Getting started

Requires Node 20+.

```bash
npm install
npm test            # engine tests, including replay determinism
npm run typecheck
npm run levels      # regenerate src/levels.data.json (only if you change stages)
npm run build       # writes dist/index.html (standalone) and dist/artifact.html
```

Open `dist/index.html` in a browser. Drag to steer the bowl, tap or press Space to launch, Esc to pause.

## How scoring stays verifiable

The simulation uses only `+ - * /` and `sqrt`, a fixed 120 Hz step and a seeded RNG. A run is just a log of `[tick, x, launch]` inputs, so a server can re-play it with `replay(level, log)` and get the identical score. This is the foundation for the planned anti-cheat.

## Roadmap

1. Tune difficulty with real play-testing, add a finisher for slow endgames
2. Token icons, tile damage cues, hand-made artwork per stage
3. Backend: auth (Apple and Google), run tickets, server replay, leaderboards, account deletion
4. Store packaging (Capacitor), privacy policy, data safety form, closed test on Google Play
5. Security audit of release builds

## Legal notes

- All art, shapes and sounds are generated in code. Fonts: Manrope and JetBrains Mono (SIL OFL 1.1) loaded from Google Fonts.
- Game rules are not copyrightable but look and feel is; this game deliberately differs from reference brick-breakers.
- Name and trademark clearance (classes 9, 28, 41) must be completed before store submission.

## Licence

Not yet chosen. All rights reserved until the owner adds a licence.
