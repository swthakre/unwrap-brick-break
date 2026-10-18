import { BOWL_Y, DT, H, W, Input } from '../core/types.ts';
import { Sim } from '../core/sim.ts';
import { LEVELS, WORLD_NAMES } from '../levels.ts';
import * as S from './store.ts';
import * as A from './audio.ts';
import { Fx, drawGame, drawThumb, INK, PAL, STAR_COL } from './render.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const sv = S.load();
A.setSound(sv.sound);

// ---------- navigation ----------
let screen = 'home';
let backTo: Record<string, string> = { guide: 'settings' };
function show(name: string) {
  document.querySelectorAll('.screen').forEach((e) => e.classList.toggle('on', e.id === name));
  screen = name;
  if (name === 'home') renderHome();
  else if (name === 'gallery') renderGallery();
  else if (name === 'board') renderBoard('mine');
  else if (name === 'settings') renderSettings();
  if (name !== 'play') running = false;
  A.sfx('tap');
}
void backTo;
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest('[data-go]') as HTMLElement | null;
  if (t) { A.unlock(); show(t.dataset.go!); }
});

// ---------- home ----------
function starSvg(on: boolean, size = 13) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${on ? STAR_COL : '#D5DBE5'}"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>`;
}
function renderHome() {
  $('hname').textContent = sv.nick;
  $('av').textContent = sv.nick.slice(0, 1).toUpperCase();
  $('hsub').textContent = `${S.totalStars(sv)} of 150 stars`;
  $('htotal').textContent = fmt(S.totalScore(sv));
  const n = S.nextStage(sv);
  $('playSub').textContent = `${n + 1} · ${LEVELS[n].name}`;
  const d = S.dailyStage();
  $('dailySub').textContent = `${LEVELS[d].name} · today's best ${fmt(sv.daily[S.todayKey()] ?? 0)}`;
  drawHero(LEVELS[n]);
}
function drawHero(lv: (typeof LEVELS)[number]) {
  const c = $<HTMLCanvasElement>('heroCv');
  const r = c.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.max(10, Math.round(r.width * dpr)); c.height = Math.max(10, Math.round(r.height * dpr));
  drawThumb(c, lv, 'done', dpr * 2);
  const g = c.getContext('2d')!;
  g.fillStyle = INK;
  g.beginPath(); g.arc(c.width * 0.5, c.height * 0.86, 3.5 * dpr, 0, 6.283); g.fill();
  g.strokeStyle = INK; g.lineWidth = 5 * dpr; g.lineCap = 'round';
  g.beginPath(); g.moveTo(c.width * 0.5 - 40 * dpr, c.height * 0.94); g.quadraticCurveTo(c.width * 0.5, c.height * 0.94 + 12 * dpr, c.width * 0.5 + 40 * dpr, c.height * 0.94); g.stroke();
}
$('playBtn').onclick = () => { A.unlock(); start(S.nextStage(sv), 'stage'); };
$('dailyBtn').onclick = () => { A.unlock(); start(S.dailyStage(), 'daily'); };
window.addEventListener('resize', () => { if (screen === 'home') renderHome(); if (screen === 'play') fit(); });

// ---------- gallery ----------
function renderGallery() {
  const body = $('galBody');
  body.innerHTML = '';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let cleared = 0;
  for (let w = 0; w < 5; w++) {
    const sec = document.createElement('div'); sec.className = 'world';
    let done = 0;
    for (let i = w * 10; i < w * 10 + 10; i++) if (sv.stars[i] > 0) done++;
    cleared += done;
    sec.innerHTML = `<h2>${WORLD_NAMES[w]}<span>${LEVELS[w * 10].tier} · ${done}/10</span></h2>`;
    const grid = document.createElement('div'); grid.className = 'grid';
    for (let i = w * 10; i < w * 10 + 10; i++) {
      const lv = LEVELS[i];
      const open = S.unlocked(sv, i);
      const st = sv.stars[i];
      const card = document.createElement('button');
      card.className = 'card' + (open ? '' : ' lock') + (i % 10 === 9 ? ' boss' : '');
      card.setAttribute('aria-label', `Stage ${i + 1} ${lv.name}${open ? '' : ', locked'}`);
      const cv = document.createElement('canvas');
      cv.width = Math.round(150 * dpr); cv.height = Math.round(123 * dpr);
      card.appendChild(cv);
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = `${i + 1}  ${lv.name}`;
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = open
        ? `<span class="stars">${[1, 2, 3].map((k) => starSvg(st >= k)).join('')}</span><span class="mono">${sv.best[i] ? fmt(sv.best[i]) : ''}</span>`
        : '<span>Locked</span>';
      card.append(nm, meta);
      drawThumb(cv, lv, st > 0 ? 'done' : open ? 'open' : 'locked', dpr);
      card.onclick = () => { if (open) { A.unlock(); start(i, 'stage'); } };
      grid.appendChild(card);
    }
    sec.appendChild(grid); body.appendChild(sec);
  }
  $('galCount').textContent = `${cleared}/50`;
}

// ---------- scores ----------
function renderBoard(tab: string) {
  document.querySelectorAll('#board .tabs button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.tab === tab));
  const body = $('boardBody');
  $('meName').textContent = sv.nick;
  $('meTotal').textContent = fmt(S.totalScore(sv));
  if (tab === 'mine') {
    const rows = sv.best.map((b, i) => ({ b, i })).filter((r) => r.b > 0).sort((a, b) => b.b - a.b).slice(0, 12);
    body.innerHTML = rows.length
      ? '<div class="list">' + rows.map((r, k) => `<div class="li"><span class="rk mono">${k + 1}</span><span class="nm">${LEVELS[r.i].name}<span class="muted small"> · stage ${r.i + 1}</span></span><span class="sc mono">${fmt(r.b)}</span></div>`).join('') + '</div>'
      : '<div class="note"><b>No scores yet</b>Clear a stage and your best runs will show up here.</div>';
  } else if (tab === 'global') {
    body.innerHTML = '<div class="note"><b>Global ranking is not live yet</b>This build runs fully on your device, so there is no real world ranking to show and none is faked. When the online release ships, every score is re-played on the server from your recorded moves before it counts, which keeps the table fair.</div>' +
      `<div class="note"><b>Ready for it</b>This device already records each run as a compact move log (${'~'}a few KB) that the server will verify.</div>`;
  } else {
    const k = S.todayKey();
    body.innerHTML = `<div class="note"><b>Today: ${LEVELS[S.dailyStage()].name}</b>Everyone gets the same shape each day (UTC). Your best today: <span class="mono">${fmt(sv.daily[k] ?? 0)}</span>. The shared daily table arrives with the online release.</div>`;
  }
}
document.querySelectorAll('#board .tabs button').forEach((b) => ((b as HTMLElement).onclick = () => renderBoard((b as HTMLElement).dataset.tab!)));

// ---------- settings ----------
function renderSettings() {
  ($('nick') as HTMLInputElement).value = sv.nick;
  ($('optSound') as HTMLInputElement).checked = sv.sound;
  ($('optHaptics') as HTMLInputElement).checked = sv.haptics;
  ($('optUnlock') as HTMLInputElement).checked = sv.unlockAll;
  $('resetBtn').textContent = 'Reset progress on this device';
}
$('nickSave').onclick = () => {
  const n = S.cleanNick(($('nick') as HTMLInputElement).value);
  const m = $('nickMsg');
  if (!n) { m.textContent = 'Use 3 to 14 letters, numbers, spaces, dots or underscores.'; m.style.color = '#B93A2E'; return; }
  sv.nick = n; S.save(); m.textContent = 'Saved.'; m.style.color = '#5E6577';
};
$('optSound').onchange = (e) => { sv.sound = (e.target as HTMLInputElement).checked; A.setSound(sv.sound); S.save(); };
$('optHaptics').onchange = (e) => { sv.haptics = (e.target as HTMLInputElement).checked; S.save(); };
$('optUnlock').onchange = (e) => { sv.unlockAll = (e.target as HTMLInputElement).checked; S.save(); };
$('licBtn').onclick = () => { const l = $('lic'); l.hidden = !l.hidden; };
let resetArm = 0;
$('resetBtn').onclick = () => {
  if (!resetArm || Date.now() - resetArm > 4000) { resetArm = Date.now(); $('resetBtn').textContent = 'Tap again to erase all progress'; return; }
  S.reset(); Object.assign(sv, S.load()); resetArm = 0; renderSettings(); $('resetBtn').textContent = 'Progress erased';
};

// ---------- gameplay ----------
let sim: Sim | null = null;
let idx = 0;
let mode: 'stage' | 'daily' = 'stage';
let running = false, paused = false, finished = false, endAt = 0, endStart = 0;
const fx = new Fx();
const inp: Input = { x: W / 2, launch: false };
let down = false, pending = false, offset = 0;
const cv = $<HTMLCanvasElement>('cv');
const ctx = cv.getContext('2d')!;
const stage = $('stage');
let scale = 1, dpr = 1;

function fit() {
  const host = $('play');
  const aw = host.clientWidth, ah = host.clientHeight;
  const k = Math.min(aw / W, ah / H);
  const w = Math.floor(W * k), h = Math.floor(H * k);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.setProperty('--u', String(w / W));
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = (w * dpr) / W;
}

function start(i: number, m: 'stage' | 'daily') {
  idx = i; mode = m;
  sim = new Sim(LEVELS[i]);
  fx.parts.length = 0;
  inp.x = W / 2; inp.launch = false; down = false; pending = false;
  paused = false; finished = false; endAt = 0; endStart = 0;
  $('pause').classList.remove('on'); $('result').classList.remove('on');
  document.querySelectorAll('.screen').forEach((e) => e.classList.toggle('on', e.id === 'play'));
  screen = 'play';
  fit();
  $('hn').textContent = `${i + 1} · ${LEVELS[i].name.toUpperCase()}`;
  $('lives').innerHTML = '<i></i><i></i><i></i>';
  $('hint').textContent = !sv.seenHint ? 'Drag to steer the bowl. Tap to launch. Break coral prisms to split your ball.' : '';
  running = true; last = performance.now(); acc = 0;
}
function toLogical(clientX: number) {
  const r = stage.getBoundingClientRect();
  return ((clientX - r.left) / r.width) * W;
}
stage.addEventListener('pointerdown', (e) => {
  if (!sim || paused || finished) return;
  if ((e.target as HTMLElement).closest('#pbtn') || (e.target as HTMLElement).closest('.ov')) return;
  A.unlock();
  stage.setPointerCapture(e.pointerId);
  down = true;
  const px = toLogical(e.clientX);
  offset = e.pointerType === 'mouse' ? 0 : sim.bowlX - px;
  inp.x = px + offset;
  if (sim.waiting) { pending = true; sv.seenHint = true; S.save(); $('hint').textContent = ''; }
});
stage.addEventListener('pointermove', (e) => {
  if (!sim || paused) return;
  if (down || e.pointerType === 'mouse') inp.x = toLogical(e.clientX) + (down ? offset : 0);
});
const up = () => { down = false; };
stage.addEventListener('pointerup', up);
stage.addEventListener('pointercancel', up);
const keys = new Set<string>();
window.addEventListener('keydown', (e) => {
  if (screen !== 'play') return;
  if (e.key === 'Escape') { setPause(!paused); return; }
  if (e.key === ' ') { pending = true; e.preventDefault(); }
  keys.add(e.key);
});
window.addEventListener('keyup', (e) => keys.delete(e.key));
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play' && !finished) setPause(true); });

function setPause(v: boolean) {
  if (!sim || finished) return;
  paused = v;
  $('pause').classList.toggle('on', v);
}
$('pbtn').onclick = () => setPause(true);
$('bResume').onclick = () => setPause(false);
$('bRestart').onclick = () => start(idx, mode);
$('bQuit').onclick = () => show('gallery');

let last = 0, acc = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  if (!running || !sim) return;
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!paused) {
    if (keys.has('ArrowLeft') || keys.has('a')) inp.x = Math.max(0, sim.bowlX - 7);
    if (keys.has('ArrowRight') || keys.has('d')) inp.x = Math.min(W, sim.bowlX + 7);
    acc += dt;
    let steps = 0;
    while (acc >= DT && steps < 12) {
      acc -= DT; steps++;
      inp.launch = down || pending;
      if ((sim.state as string) !== 'play') break;
      sim.step(inp);
      pending = false;
      for (const ev of sim.events) onEvent(ev);
    }
    fx.update(dt);
    if (sim.state !== 'play' && !finished) {
      if (!endAt) { endStart = now; endAt = now + (sim.state === 'won' ? 2600 : 900); }
      else if (now >= endAt) finish();
    }
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawGame(ctx, sim, fx, now, endAt ? now - endStart : 0);
  hud();
}
requestAnimationFrame(frame);

function onEvent(ev: import('../core/types.ts').GameEvent) {
  const sm = sim!;
  fx.add(ev, sm.level.world, false);
  if (ev.t === 'break') A.sfx('break', sm.combo);
  else if (ev.t === 'hit') A.sfx('hit');
  else if (ev.t === 'prism') { A.sfx('prism'); A.buzz(12, sv.haptics); }
  else if (ev.t === 'token') { A.sfx('token'); A.buzz(15, sv.haptics); }
  else if (ev.t === 'bowl') A.sfx('bowl');
  else if (ev.t === 'launch') A.sfx('launch');
  else if (ev.t === 'life') { A.sfx('life'); A.buzz(40, sv.haptics); }
  else if (ev.t === 'lose') A.sfx('lose');
  else if (ev.t === 'win') A.sfx('win');
}

let hs = '', hb = '', hl = -1, hp = '';
function hud() {
  const s = sim!;
  if (!s.waiting && $('hint').textContent) $('hint').textContent = '';
  const a = fmt(s.score);
  if (a !== hs) { hs = a; $('hs').textContent = a; }
  const b = s.balls.length > 1 ? `${s.balls.length} balls` : '';
  if (b !== hb) { hb = b; $('balls').textContent = b; }
  if (s.lives !== hl) {
    hl = s.lives;
    $('lives').innerHTML = [0, 1, 2].map((i) => `<i class="${i < s.lives ? '' : 'off'}"></i>`).join('');
  }
  const p: string[] = [];
  if (s.wideT > 0) p.push('WIDE'); if (s.pierceT > 0) p.push('PIERCE'); if (s.echoT > 0) p.push('ECHO'); if (s.netT > 0) p.push('NET');
  const ps = p.join('|');
  if (ps !== hp) { hp = ps; $('pills').innerHTML = p.map((x) => `<span class="pill">${x}</span>`).join(''); }
}

function finish() {
  const s = sim!;
  finished = true;
  const won = s.state === 'won';
  const total = s.tiles.length;
  const prev = sv.best[idx];
  let isBest = false;
  if (won) {
    sv.stars[idx] = Math.max(sv.stars[idx], s.stars);
    if (s.score > prev) { sv.best[idx] = s.score; isBest = prev > 0; }
    if (mode === 'daily') { const k = S.todayKey(); if (s.score > (sv.daily[k] ?? 0)) sv.daily[k] = s.score; }
    S.save();
  }
  $('rTitle').textContent = won ? 'Unwrapped' : 'Out of lives';
  $('rStars').innerHTML = won ? [1, 2, 3].map((k) => starSvg(s.stars >= k, 40)).join('') : '';
  $('rScore').textContent = fmt(s.score);
  $('rBest').textContent = won && isBest ? 'NEW PERSONAL BEST' : '';
  const rows: Array<[string, string]> = won
    ? [['Tiles and combos', fmt(s.score - s.bonus)], ['Time and lives bonus', fmt(s.bonus)], ['Best combo', String(s.bestCombo)], ['Most balls at once', String(s.mostBalls)], ['Time', s.seconds.toFixed(0) + ' s']]
    : [['Picture revealed', Math.round(((total - s.tiles.filter((t) => t.alive).length) / total) * 100) + '%'], ['Best combo', String(s.bestCombo)], ['Most balls at once', String(s.mostBalls)]];
  $('rBk').innerHTML = rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  const hasNext = won && mode === 'stage' && idx < 49;
  const nx = $('rNext'); nx.textContent = hasNext ? 'Next stage' : won ? 'Gallery' : 'Try again';
  nx.onclick = () => (hasNext ? start(idx + 1, 'stage') : won ? show('gallery') : start(idx, mode));
  $('rRetry').style.display = won ? '' : 'none';
  $('rRetry').onclick = () => start(idx, mode);
  $('rGal').onclick = () => show('gallery');
  $('result').classList.add('on');
}

// test hooks (used by the headless run, harmless in production)
(window as any).__unwrap = { start, show, get sim() { return sim; }, sv, fit, bowlY: BOWL_Y, PAL };

renderHome();
