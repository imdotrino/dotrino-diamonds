// Generación procedural del tablero de un nivel (determinista por def.rng) y conteo
// de objetivos. Verbatim del juego original.
import { S, gem, def as levelDefNow } from '../state.js';
import { N } from '../config.js';
import { hasMatches, hasMoves } from './matching.js';

/** Llena S.grid con el tablero del nivel actual (determinista por su rng). */
export function generateLevel () {
  const def = levelDefNow();
  const C = def.colors, rng = def.rng;
  /** @type {import('../types.js').Gem[][]} */
  let grid;
  do {
    S.grid = grid = [];
    for (let r = 0; r < N; r++) {
      /** @type {import('../types.js').Gem[]} */
      const row = [];
      for (let c = 0; c < N; c++) {
        let t;
        do { t = (rng() * C) | 0; }
        while ((c >= 2 && row[c - 1].type === t && row[c - 2].type === t) ||
               (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t));
        row.push(gem(r, c, t));
      }
      grid.push(row);
    }
  } while (hasMatches() || !hasMoves());

  // Diamantes duros
  let n = def.hard, guard = 0;
  while (n > 0 && guard++ < 800) {
    const r = (rng() * N) | 0, c = (rng() * N) | 0, g = grid[r][c];
    if (g.hpMax === 1 && !g.power) {
      const hp = def.reinforced && rng() < 0.45 ? 3 : 2;
      g.hp = hp; g.hpMax = hp;
      if (def.type === 'break') g.isTarget = true;
      n--;
    }
  }
}

/** @returns {number} */
export function countTargets () {
  let n = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.grid[r][c]?.isTarget) n++;
  return n;
}
