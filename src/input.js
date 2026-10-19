// Interacción del jugador: detectar celda, seleccionar/deslizar para intercambiar,
// y resolver la jugada (poderes, olas naturales, combos). Verbatim del original.
// `registerInput()` engancha los listeners al canvas (se llama tras fijar S.cv).
import { S } from './state.js';
import { findGroups, hasMoves } from './engine/matching.js';
import { waveNatural, waveExplicit, swapEffect, collapse, recover } from './engine/resolve.js';
import { tween } from './tweens.js';
import { beep, vibrate } from './audio.js';
import { updateHUD } from './ui/hud.js';
import { checkResult, finishIfDone } from './levels.js';

function cellFromEvent (e) {
  const N = 8;
  const rect = S.cv.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / rect.width * N);
  const r = Math.floor((e.clientY - rect.top) / rect.height * N);
  if (r < 0 || r >= N || c < 0 || c >= N) return null;
  return { r, c };
}
const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function animateSwap (a, b) {
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  return Promise.all([tween(ga, { dr: b.r, dc: b.c }, 140), tween(gb, { dr: a.r, dc: a.c }, 140)]);
}
function swapCells (a, b) {
  const t = S.grid[a.r][a.c]; S.grid[a.r][a.c] = S.grid[b.r][b.c]; S.grid[b.r][b.c] = t;
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  ga.dr = a.r; ga.dc = a.c; gb.dr = b.r; gb.dc = b.c;
}

async function trySwap (a, b) {
  S.status = 'busy'; beep(440, 0.05, 0.15);
  await animateSwap(a, b); swapCells(a, b);
  const ga = S.grid[a.r][a.c], gb = S.grid[b.r][b.c];
  const hasPower = (ga && ga.power) || (gb && gb.power);
  const groups = findGroups({ a, b });
  if (groups.clear.size === 0 && groups.creations.length === 0 && !hasPower) {
    await animateSwap(a, b); swapCells(a, b); vibrate(30); S.status = 'idle'; return;
  }
  S.moves--; updateHUD();

  if (hasPower) {
    const set = swapEffect(a, b);
    await waveExplicit(set, 1);
    await collapse();
    let combo = 2;
    while (await waveNatural(null, combo)) { await collapse(); combo++; }
  } else {
    let combo = 1, swap = { a, b };
    while (await waveNatural(swap, combo)) { swap = null; await collapse(); combo++; }
  }

  if (checkResult() === null && !hasMoves()) await recover();
  S.status = 'idle';
  finishIfDone();
}

export function registerInput () {
  const cv = S.cv;
  cv.addEventListener('pointerdown', e => {
    if (S.status !== 'idle') return;
    e.preventDefault();
    S.downCell = cellFromEvent(e);
    if (!S.downCell) return;
    if (S.sel && adjacent(S.sel, S.downCell)) { const a = S.sel; S.sel = null; trySwap(a, S.downCell); }
    else S.sel = S.downCell;
  });
  cv.addEventListener('pointermove', e => {
    if (S.status !== 'idle' || !S.downCell) return;
    const cur = cellFromEvent(e);
    if (cur && adjacent(S.downCell, cur)) { const a = S.downCell; S.downCell = null; S.sel = null; trySwap(a, cur); }
  });
  cv.addEventListener('pointerup', () => { S.downCell = null; });
  cv.addEventListener('pointercancel', () => { S.downCell = null; });
}
