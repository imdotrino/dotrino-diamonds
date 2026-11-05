// Cobertura de los power-ups al detonar, color de sus haces, encolado de FX y
// expansión en cadena de la detonación. Verbatim del juego original.
import { S, I, at } from '../state.js';
import { N } from '../config.js';

/** @typedef {import('../types.js').Gem} Gem */
/** @typedef {import('../types.js').Power} Power */

// Cobertura de un poder al detonar.
/**
 * Casillas que cubre el poder de la gema g (en la casilla i) al detonar.
 * @param {number} i
 * @param {Gem} g
 * @returns {number[]}
 */
export function blast (i, g) {
  const grid = S.grid;
  /** @type {number[]} */
  const out = [];
  const r = (i / N) | 0, c = i % N;
  if (g.power === 'lineH') { for (let cc = 0; cc < N; cc++) out.push(I(r, cc)); }
  else if (g.power === 'lineV') { for (let rr = 0; rr < N; rr++) out.push(I(rr, c)); }
  else if (g.power === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(I(rr, cc));
    }
  } else if (g.power === 'star') {
    const col = g.targetColor != null ? g.targetColor : g.type;
    for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) { const x = grid[rr][cc]; if (x && x.type === col) out.push(I(rr, cc)); }
  } else if (g.power === 'comet') {
    // Dispara a 3 celdas: prioriza objetivos; si no, gemas al azar. Cada
    // impacto salpica a sus vecinos ortogonales.
    /** @type {number[]} */
    const objs = [];
    /** @type {number[]} */
    const pool = [];
    for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) {
      const x = grid[rr][cc]; if (!x || x.type < 0) continue;
      if (rr === r && cc === c) continue;
      (x.isTarget ? objs : pool).push(I(rr, cc));
    }
    const source = objs.length ? objs.concat(pool) : pool;
    const arr = source.slice();
    /** @type {number[]} */
    const picks = [];
    for (let k = 0; k < 3 && arr.length; k++) picks.push(arr.splice((Math.random() * arr.length) | 0, 1)[0]);
    out.push(i);
    picks.forEach(p => {
      out.push(p); const pr = (p / N) | 0, pc = p % N;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        const rr = pr + dr, cc = pc + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(I(rr, cc));
      });
    });
  }
  return out;
}

// Color del haz según el poder.
/** @type {Record<Power, string>} */
export const BEAM_COLOR = { lineH: '#a5f3fc', lineV: '#a5f3fc', bomb: '#fde68a', star: '#ffffff', comet: '#bae6fd' };

// Encola los haces/ondas que dibuja un poder al activarse en (r,c).
/**
 * @param {number} i
 * @param {Gem} g
 * @param {number[]} covered casillas que cubre (blast)
 */
export function queueBeams (i, g, covered) {
  const r = (i / N) | 0, c = i % N, col = (g.power && BEAM_COLOR[g.power]) || '#ffffff';
  if (g.power === 'lineH') { S.fxBeams.push({ k: 'beam', r0: r, c0: c, r1: r, c1: 0, col }); S.fxBeams.push({ k: 'beam', r0: r, c0: c, r1: r, c1: N - 1, col }); }
  else if (g.power === 'lineV') { S.fxBeams.push({ k: 'beam', r0: r, c0: c, r1: 0, c1: c, col }); S.fxBeams.push({ k: 'beam', r0: r, c0: c, r1: N - 1, c1: c, col }); }
  else if (g.power === 'bomb') { S.fxBeams.push({ k: 'ring', r, c, col }); }
  else { // estrella / cometa: un haz a cada celda afectada
    let n = 0;
    for (const t of covered) { if (t === i || n++ > 30) continue; S.fxBeams.push({ k: 'beam', r0: r, c0: c, r1: (t / N) | 0, c1: t % N, col }); }
  }
}

// Expande un conjunto inicial activando poderes en cadena.
/**
 * @param {Iterable<number>} initial
 * @param {Set<number> | null} protect casillas que no se detonan (pivotes de power-ups nuevos)
 * @returns {Set<number>}
 */
export function collectDetonation (initial, protect) {
  /** @type {Set<number>} */
  const out = new Set();
  /** @type {Set<number>} */
  const act = new Set();
  const stack = [...initial];
  while (stack.length) {
    const i = /** @type {number} */ (stack.pop());   // stack no está vacío
    if (protect && protect.has(i)) continue;
    const g = at(i); if (!g || g.type < 0) { out.add(i); continue; }
    out.add(i);
    if (g.power && !act.has(i)) {
      act.add(i);
      const b = blast(i, g);
      queueBeams(i, g, b);
      for (const x of b) if (!out.has(x)) stack.push(x);
    }
  }
  return out;
}
