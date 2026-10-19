// Flujo de nivel: chequeo de victoria/derrota, estrellas, inicio de nivel, modo
// libre (endless), pantalla de fin y compartir. Verbatim del juego original salvo
// el fallback de compartir, que usa toast (no window.prompt: §5 sin prompts).
import { $ } from './dom.js';
import { S } from './state.js';
import { levelDef } from './rng.js';
import { generateLevel, countTargets } from './engine/levelgen.js';
import { hasMoves } from './engine/matching.js';
import { recover } from './engine/resolve.js';
import { isUnlocked, saveProgress } from './progress.js';
import { showView } from './ui/map.js';
import { updateHUD } from './ui/hud.js';
import { measure } from './render.js';
import { tr } from './i18n.js';
import { beep, endChime } from './audio.js';

export function checkResult () {
  if (S.endless) return null;   // en modo libre el nivel nunca termina
  if (S.def.type === 'points' && S.score >= S.def.targetPoints) return 'win';
  if (S.def.type === 'break' && S.targetsLeft <= 0) return 'win';
  if (S.moves <= 0) return 'lose';
  return null;
}

export function starsEarned () {
  if (S.def.type === 'points') { const r = S.score / S.def.targetPoints; return r >= 1.6 ? 3 : r >= 1.2 ? 2 : 1; }
  const r = S.moves / S.def.moves; return r >= 0.5 ? 3 : r >= 0.25 ? 2 : 1;
}

export function startLevel (n) {
  if (!isUnlocked(n)) { beep(300, 0.18, 0.3); return; }
  S.def = levelDef(n);
  S.score = 0; S.moves = S.def.moves; S.sel = null; S.status = 'idle'; S.endless = false;
  generateLevel();
  S.targetsLeft = countTargets();
  showView('game');
  measure();
  updateHUD();
}

// Continúa el tablero actual sin límite de movimientos (modo libre).
export async function enterEndless () {
  $('endModal').classList.remove('open');
  S.endless = true;
  S.moves = Infinity;
  S.status = 'idle';
  updateHUD();
  if (!hasMoves()) await recover();
  S.status = 'idle';
}

export function toast (txt, ms = 1800) {
  let t = $('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#0f172a;color:#e2e8f0;border:1px solid #334155;padding:10px 18px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.4);transition:opacity .25s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = txt;
  t.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.opacity = '0'; }, ms);
}

export async function shareLevel () {
  if (!S.endShare) return;
  const url = 'https://diamonds.dotrino.com/';
  const msgs = tr('shareMsgs');
  const pick = msgs[Math.floor(Math.random() * msgs.length)];
  const text = pick(S.endShare.level, S.endShare.starsEarned, url);
  try {
    if (navigator.share) { await navigator.share({ title: 'Diamonds', text: text, url }); return; }
  } catch (_) { return; /* el usuario canceló el diálogo nativo */ }
  try {
    await navigator.clipboard.writeText(text);
    toast(tr('copied'));
  } catch (_) {
    toast(text);   // sin Web Share ni portapapeles: mostramos el texto (sin window.prompt, §5)
  }
}

export function levelCompleted () {
  const def = S.def;
  const e = starsEarned();
  S.prog.stars[def.n] = Math.max(S.prog.stars[def.n] || 0, e);
  S.prog.max = Math.max(S.prog.max, def.n + 1);
  saveProgress();
  $('endTitle').textContent = tr('cleared');
  paintStars(e);
  $('endMsg').textContent = def.type === 'points' ? tr('pointsN')(S.score) : tr('movesLeft')(Math.max(0, S.moves));
  S.endShare = { level: def.n, starsEarned: e };
  $('btnNext').style.display = ''; $('btnRetry').style.display = 'none';
  $('btnEndless').style.display = '';
  $('btnShare').style.display = '';
  $('endModal').classList.add('open');
  endChime();
}
export function levelFailed () {
  const def = S.def;
  $('endTitle').textContent = tr('noMoves');
  paintStars(0);
  $('endMsg').textContent = def.type === 'points'
    ? tr('missingPoints')(Math.max(0, def.targetPoints - S.score))
    : tr('diamondsLeft')(Math.max(0, S.targetsLeft));
  $('btnNext').style.display = 'none'; $('btnRetry').style.display = '';
  $('btnEndless').style.display = '';
  $('btnShare').style.display = 'none';
  $('endModal').classList.add('open');
  beep(300, 0.25, 0.35);
}
export function finishIfDone () {
  const r = checkResult();
  if (r === 'win') levelCompleted();
  else if (r === 'lose') levelFailed();
}

export function paintStars (e) {
  let h = '';
  for (let i = 0; i < 3; i++) h += '<span class="' + (i < e ? 'on' : 'off') + '">★</span>';
  $('endStars').innerHTML = h;
}
