# Unwrap: Brick Break. Research, plan and architecture

Name: **Unwrap: Brick Break** (chosen 18 Oct 2026 after Bloop Burst, Unveil, Reveali and Unmask). **Trademark clearance for Unwrap is not complete**: no exact-name mobile game was found in web searches, but IP India, USPTO, EUIPO and WIPO registers (classes 9, 28, 41) still need a manual or attorney check before store submission. Fallback names: Tessel, Splitscape. A ball-splitting game where each stage is a picture made of hex tiles, revealed as you break them. Status: playable web prototype built (deterministic engine, 50 baked stages, all screens); backend and store packaging not started.

## 1. What the reference is, and what we may and may not take

- The coddie.io entries ("Satisfying Brick Breaker" series by the uploader "sparrow") sit next to uploads that the same uploader labels "Fan Game". Treat the clip as a fan recreation of someone else's commercial game. That makes its code and art a double IP risk. We take nothing from it except the general idea.
- **Game rules and mechanics are not protected by copyright; expression is.** In Tetris Holding v. Xio (D.N.J. 2012) the court protected the visual look, piece design, colours and overall look and feel, but not the rules. A clone that copied only the look, without code, still lost.
- **Names are the other trap.** Atari has historically pushed iPhone "Breakout"-style games to be pulled or renamed. Do not use "Breakout", "Arkanoid", or anyone's product name in our title, icon or store text.
- **Apple guideline 4.1(c)** (added Nov 2025): you cannot use another developer's icon, brand or product name in your app's icon or name without approval. 4.1(a) asks for original ideas; 4.3(b) rejects apps indistinguishable from what is widely available.

### Uniqueness changes we are making (vs. the reference clip)
| Reference clip | Unveil (direction v3, 18 Oct 2026) |
|---|---|
| Dark screen, orange square bricks | Light cool-grey screen, indigo hexagon tiles, coral only for multipliers |
| Rectangular wall in a grey frame | Each stage is a picture made of hex tiles (planet, whale, kite, lighthouse); clearing it fills a 50-shape gallery |
| Ball enters through a floor gap and tunnel | Open shape, no frame; balls burrow anywhere, shapes drift and rotate in later worlds |
| Flat plate | Curved bowl that steers bounce angle and widens with power-ups |
| +3 / x3 pickups | Prism tiles hidden inside shapes (x2, x3, x5), Echo, Pierce, Hold, Safety net |
| Single board | 5 worlds (Garden, Sky, Ocean, City, Cosmos) x 10 shapes, boss shape every 10th, daily shared shape, seasons |

### Market research (Oct 2026)
| Game | Downloads / ratings | Hook |
|---|---|---|
| Bricks Breaker Quest (mobirix) | 100M+ Play, 4.3 | Touch to aim, many stages, ball types, offline, one-handed. Complaints: intrusive full-screen ads |
| Ballz (Ketchapp) | 4.3 from 71K iOS ratings | Numbered blocks, growing ball chain, endless, one-thumb |
| Brick Out (Puzzle1Studio) | 10M+ Play, 4.7 from 39K iOS ratings | Chain reactions, collectible balls, seasonal events, daily quests, ads only when chosen |
| Brick Breaker: Space Outlaw (SUPERBOX) | 10M+ Play, 4.1 | Paddle plus monsters and bosses. Complaints: forced ads |
| Balls Bricks Breaker 3 | 1M+ Play, 4.6 | Boss every 5 levels, ball skins |
| Ball x Pit (Devolver) | 2M+ copies (Aug 2026) | Breakout meets roguelite levelling and base building |

Takeaways: one-thumb control, visible progress and collections, bosses, daily and seasonal content, and fair (rewarded-only) ads drive retention; ad intrusiveness is the top complaint.

### REA
- REA (rea-agents 6.7.0) is MIT licensed and installed in the workspace. It is a development tool only; nothing from it ships in the app.
- REA's own disclaimer forbids using it to copy proprietary software or reproduce protected code and assets. We will use it only to measure the reference's *behaviour* (ball speed, spawn counts, timing) and to audit **our own** builds (APK/IPA inspection for leaked secrets, debug flags, unminified code).
- The workspace network blocks coddie.io, so REA's browser capture cannot reach it yet. Fix: allow the domain in claude.ai Settings > Capabilities, or skip it (not required to build).

## 2. Store and legal compliance checklist

- **Name and trademark (searched 18 Oct 2026, partial):**
  - "Bloop Burst": no matching trademark or app found in web searches. Superseded by the rename.
  - "Unveil": a Google Play game titled "Unveil: Daily Word Puzzle" already exists (package com.unveilgame.android). Same name, same Games category, so there is real risk of store rejection (Apple 4.1/4.3) or an infringement claim. Decide before spending on art: add a distinguishing second word, or choose another name (Tessel, Splitscape).
  - US register (via Justia mirror): many UNVEIL marks, none seen for mobile games, but one for board games (O'Driscoll, 2020) and others in related entertainment services; status and classes not confirmed. A lawyer should run a full clearance in classes 9, 28 and 41.
  - IP India, USPTO and EUIPO live searches could not be run from here (captcha or script-only sites). Run them by hand or via a trademark attorney.
  - Reserve the name in Play Console and App Store Connect only after clearance.
  - **Update, "Unveil: Brick Break" (18 Oct 2026):**
    - "Brick Break" is descriptive for this genre, so it gives almost no protection. It is also a Pokemon move name, which is irrelevant legally but floods search results.
    - Close US marks in the same genre: BRICK BREAKER HERO (Game Circus, registered 2016, class 41, online games) and BRICK BREAKER BALL (Shenzhen Qixunxinyou, registered 2019, class 9, game software; "BRICK BREAKER" disclaimed). "Brick Break" is one letter away from "Brick Breaker" and could draw objections even though the word is weak.
    - Domains: unveil.com (since 1997), unveilgame.com (2014) and brickbreak.com (2002) are already registered by others. unveilbrickbreak.com could not be checked.
    - No app or game named "Unveil: Brick Break" turned up in web searches. The existing "Unveil: Daily Word Puzzle" (Google Play) remains the main conflict.
    - Not searchable from here: IP India, EUIPO eSearch, TMview, WIPO Global Brand Database, App Store and Play search pages, Reddit. These need a manual check or an attorney.
    - **Alternatives checked 18 Oct 2026 (web, domains, partial US register only):**
      - Reveali: no app, game or trademark found. reveali.com registered since 2010. Looks like a misspelling of "Reveal", which has many game titles (Reveal! series), so it is weak and hard to spell.
      - Unmask: no mobile game with this exact name found. unmask.com registered since 2000. Related US marks exist (UNMASK THE FUN!, CARDS TO UNMASK, UNIMASK). Masked Singer games use the theme heavily.
      - Unwrap: no mobile game with this exact name found, but "Wrapping: Unboxing Puzzle Game" and many "unwrap" gift or unboxing apps exist. unwrap.com registered since 2000.
      - Direct register lookups for these three failed (the mirror returned unrelated results), so none is cleared.
    - Suggested safer alternatives if clearance fails: put a coined word first (for example "Tessel: Brick Break") and avoid "Unveil" alone.
- **Original assets only:** our own art and SFX (or CC0 with a provenance log). Fonts: Lilita One and Baloo 2 (SIL OFL). In-app "Open-source licences" screen for every dependency.
- **Accounts:** if accounts exist, in-app account deletion is mandatory on Apple (5.1.1(v)). Google Play also needs a web deletion link entered in the Data safety form, and deletion of all data declared there.
- **Login:** if we offer Google sign-in, Apple 4.8 requires an equivalent privacy-preserving login option (Sign in with Apple satisfies it). Guest play needs no account; leaderboard needs one.
- **Leaderboard nicknames are user-generated content:** word filter, report a player, block abusive users, published contact (Apple 1.2). Never display Game Center player IDs (4.5.5).
- **Monetisation:** no paid random loot boxes (if ever added, odds must be shown before purchase). Purchased coins must not expire; include Restore Purchases.
- **Audience:** rate 12+/Teen, do not enter the Kids category (it bans third-party ads and analytics). Age gate at first launch; under-13s play offline without leaderboard.
- **India DPDP Act and Rules 2025:** notice, consent, security safeguards, breach reporting and verifiable parental consent for children apply from 14 May 2027. Build them in now. Also GDPR-style privacy policy for EU/UK players.
- **Google Play new personal accounts** (created after 13 Nov 2023) need a closed test with at least 12 testers opted in for 14 continuous days before production access.

## 3. Architecture

**Client:** TypeScript + Phaser (MIT) for 2D rendering with WebGL particles, wrapped with Capacitor (MIT) to produce Android (AAB) and iOS (IPA) builds. One codebase, also playable on the web for testing.

**Deterministic core:** the physics and rules live in a pure TypeScript module with a fixed 120 Hz timestep, fixed-point maths and a seeded RNG. Same inputs give the same score on every device. This is the foundation of anti-cheat.

**Backend:** Supabase (Postgres, Auth with Apple and Google, Edge Functions). Clients never write scores directly.

**Score flow**
1. Client asks the server for a run ticket: stage id, server-issued seed, nonce, expiry.
2. Client plays, recording only input events (Bloop position samples, boost taps) against the seed.
3. Client gets a Play Integrity token (Android) or App Attest assertion (iOS) bound to a hash of the run.
4. Edge Function verifies the attestation, checks the ticket, re-simulates the run headlessly with the same core module, and accepts only the server-computed score.
5. Score lands in the leaderboard tables; ranks are computed server-side (global, country, friends, daily, season).

**Data model (minimal):** players (id, nickname, country code, age band, consent flags), runs (ticket, stage, seed, score, verdict), leaderboard views. No email stored beyond what auth needs; no location beyond a self-selected country.

## 4. Security plan

- Row-level security on every table; only Edge Functions (service role, server side) can insert scores.
- No secrets in the app bundle; the anon key is public by design and limited by RLS.
- Server-authoritative scoring via replay re-simulation, plus Play Integrity / App Attest graded verdicts (allow, allow-unranked, deny), never cached.
- Rate limits per player and per device; reject impossible inputs (Bloop speed caps, run duration bounds).
- TLS everywhere; optional certificate pinning; release builds minified with source maps kept off device.
- Nickname filter and moderation queue; report and block.
- OWASP MASVS L1 as the baseline checklist; dependency scanning in CI; signing keys in Play App Signing and an offline backup.
- REA audit of our own release APK/IPA before each submission.

## 5. 50 stages and difficulty

| World | Stages | Tier | New mechanic |
|---|---|---|---|
| 1 Candy Caves | 1 to 10 | Chill | Split and Burst gates, Stretch |
| 2 Neon Reef | 11 to 20 | Spicy | Bottom-gap entry tunnels, moving rails, Echo Balls |
| 3 Glacier Glass | 21 to 30 | Spicy to Wild | 2-hit ice bricks, crystal deflectors, Fireball |
| 4 Volcano Vault | 31 to 40 | Wild | Lava bricks that regrow, timed walls, Magnet |
| 5 Cosmic Core | 41 to 50 | Insane | Portals, gravity wells, Laser eyes |

Each 10th stage is a boss wall. Difficulty knobs per stage: brick count and HP, ball speed, gate count, hazard density, Bloop base width, star thresholds. Stages are JSON (mask + palette + knobs) so new ones ship without code changes; the server stores each level's hash for replay checks.

## 6. Build phases

1. Core loop prototype (web-playable): Bloop, ball split, gates, Echo, 5 stages.
2. All 50 stages, worlds, stars, coins, boosts, audio and haptics.
3. Backend: auth, run tickets, replay verification, leaderboards, deletion.
4. Store packaging: icons, screenshots, privacy policy, data safety, IARC rating, closed test.

**Needed from the owner:** Apple Developer Program and Google Play Console accounts, a Mac or cloud CI for the iOS build, a Supabase project, and the trademark search result.
