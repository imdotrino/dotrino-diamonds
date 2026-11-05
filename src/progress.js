// Progreso del jugador (niveles desbloqueados + estrellas) y reglas de desbloqueo.
// localStorage es la cache rápida y sincrónica del juego; el store.dotrino.com es
// el respaldo durable (§4). Las estrellas-bonus por referidos cuentan para el
// desbloqueo (ver referrals.js).
import { PROG_KEY, reqLevel } from './config.js';
import { S, prog } from './state.js';
import { loadDoc, saveDoc, PROGRESS_THREAD } from './store.js';
import { referralBonusStars, consumedBonusStars } from './referrals.js';

/** @returns {import('./types.js').Prog} */
export function loadProgress () {
  try { const d = JSON.parse(/** @type {string} */ (localStorage.getItem(PROG_KEY))); if (d && d.stars) return { max: d.max || 1, stars: d.stars || {} }; } catch {}
  return { max: 1, stars: {} };
}
export function saveProgress () {
  try { localStorage.setItem(PROG_KEY, JSON.stringify(S.prog)); } catch {}
  saveDoc(PROGRESS_THREAD, S.prog).catch(() => {});   // respaldo durable best-effort
}

// Trae el progreso del store y lo FUSIONA con el local (gana el mayor avance).
// Devuelve true si cambió algo. Best-effort: si no hay store, no hace nada.
/** @returns {Promise<boolean>} */
export async function syncProgressFromStore () {
  /** @type {Partial<import('./types.js').Prog> | null} */
  let remote = null;
  // Lo guardó saveProgress(); abajo se comprueba que traiga `stars`.
  try { remote = /** @type {Partial<import('./types.js').Prog> | null} */ (await loadDoc(PROGRESS_THREAD)); } catch {}
  if (!remote || !remote.stars) return false;
  const p = prog();
  let changed = false;
  if ((remote.max || 1) > p.max) { p.max = /** @type {number} */ (remote.max); changed = true; }
  for (const k in remote.stars) {
    const v = remote.stars[k] || 0;
    if (v > (p.stars[k] || 0)) { p.stars[k] = v; changed = true; }
  }
  if (changed) { try { localStorage.setItem(PROG_KEY, JSON.stringify(S.prog)); } catch {} }
  return changed;
}

// Estrellas totales = mejores por nivel + bonus por referidos (que abren tu link)
// + bonus por links consumidos (los que tú abriste de otros).
/** @returns {number} */
export function totalStars () {
  const p = prog();
  let s = 0; for (const k in p.stars) s += p.stars[k] || 0;
  return s + referralBonusStars() + consumedBonusStars();
}
// Un nivel es jugable si llegó la progresión y se reúnen las estrellas.
/** @param {number} n @returns {boolean} */
export function isUnlocked (n) { return n <= prog().max && totalStars() >= reqLevel(n); }
