// Tweens y easings; los recoge el loop principal (loop.js). `wait` es un sleep
// por Promise usado por la resolución de cascadas.
import { S } from './state.js';

/** @typedef {import('./types.js').Gem} Gem */
/** @typedef {import('./types.js').TweenKey} TweenKey */

/**
 * Anima propiedades numéricas de una gema; resuelve al terminar.
 * @param {Gem} obj
 * @param {Partial<Record<TweenKey, number>>} props valores finales
 * @param {number} dur ms
 * @param {(t: number) => number} [ease]
 * @returns {Promise<void>}
 */
export function tween (obj, props, dur, ease) {
  /** @type {Partial<Record<TweenKey, number>>} */
  const from = {}; for (const k in props) from[/** @type {TweenKey} */ (k)] = obj[/** @type {TweenKey} */ (k)];
  return new Promise(res => S.tweens.push({ obj, props, from, dur, t: 0, ease: ease || easeOutQuad, done: res }));
}
/** @param {number} t */
export function easeOutQuad (t) { return 1 - (1 - t) * (1 - t); }
/** @param {number} t */
export function easeInQuad (t) { return t * t; }
/** @param {number} t */
export function easeOutBack (t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

export const wait = (/** @type {number} */ ms) => /** @type {Promise<void>} */ (new Promise(res => setTimeout(res, ms)));
