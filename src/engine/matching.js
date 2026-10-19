// Detección de combinaciones: matches lineales (>=3), cuadros 2×2, jugadas
// posibles, y `findGroups` (qué se rompe y qué power-ups se crean). Verbatim.
import { S, I } from '../state.js';
import { N } from '../config.js';

export function hasMatches () {
  const grid = S.grid;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const g = grid[r][c]; if (!g || g.type < 0) continue; const t = g.type;
    if (c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) return true;
    if (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t) return true;
  }
  return false;
}

export function hasSquare () {
  const grid = S.grid;
  for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
    const g = grid[r][c]; if (!g || g.type < 0) continue; const t = g.type;
    if (grid[r][c + 1].type === t && grid[r + 1][c].type === t && grid[r + 1][c + 1].type === t) return true;
  }
  return false;
}

export function hasMoves () {
  const grid = S.grid;
  const test = (r1, c1, r2, c2) => {
    const a = grid[r1][c1].type, b = grid[r2][c2].type;
    // poderes garantizan jugada
    if (grid[r1][c1].power || grid[r2][c2].power) return true;
    grid[r1][c1].type = b; grid[r2][c2].type = a;
    const found = hasMatches() || hasSquare();
    grid[r1][c1].type = a; grid[r2][c2].type = b;
    return found;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (c < N - 1 && test(r, c, r, c + 1)) return true;
    if (r < N - 1 && test(r, c, r + 1, c)) return true;
  }
  return false;
}

// Busca runs >=3 y decide creación de poderes. Devuelve {clear:Set, creations:[{idx,power}]}
export function findGroups (swap) {
  const grid = S.grid;
  const runsH = [], runsV = [];
  for (let r = 0; r < N; r++) {
    let s = 0;
    for (let c = 1; c <= N; c++) {
      const same = c < N && grid[r][c] && grid[r][c - 1] && grid[r][c].type === grid[r][c - 1].type && grid[r][c].type >= 0;
      if (same) continue;
      const len = c - s;
      if (len >= 3) { const cells = []; for (let k = s; k < c; k++) cells.push(I(r, k)); runsH.push({ cells, len, dir: 'H' }); }
      s = c;
    }
  }
  for (let c = 0; c < N; c++) {
    let s = 0;
    for (let r = 1; r <= N; r++) {
      const same = r < N && grid[r][c] && grid[r - 1][c] && grid[r][c].type === grid[r - 1][c].type && grid[r][c].type >= 0;
      if (same) continue;
      const len = r - s;
      if (len >= 3) { const cells = []; for (let k = s; k < r; k++) cells.push(I(k, c)); runsV.push({ cells, len, dir: 'V' }); }
      s = r;
    }
  }

  const clear = new Set();
  runsH.forEach(rn => rn.cells.forEach(i => clear.add(i)));
  runsV.forEach(rn => rn.cells.forEach(i => clear.add(i)));

  const swapIdx = new Set();
  if (swap) { swapIdx.add(I(swap.a.r, swap.a.c)); swapIdx.add(I(swap.b.r, swap.b.c)); }
  const pickPivot = cells => { for (const i of cells) if (swapIdx.has(i)) return i; return cells[cells.length >> 1]; };

  // Cuadros 2×2 del mismo color que NO estén dentro de un run lineal.
  const squares = [];
  for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
    const g = grid[r][c]; if (!g || g.type < 0) continue; const t = g.type;
    if (grid[r][c + 1].type === t && grid[r + 1][c].type === t && grid[r + 1][c + 1].type === t) {
      const sq = [I(r, c), I(r, c + 1), I(r + 1, c), I(r + 1, c + 1)];
      if (!sq.some(i => clear.has(i))) squares.push(sq);
    }
  }
  if (clear.size === 0 && squares.length === 0) return { clear, creations: [] };

  const inH = new Set(), inV = new Set();
  runsH.forEach(rn => rn.cells.forEach(i => inH.add(i)));
  runsV.forEach(rn => rn.cells.forEach(i => inV.add(i)));

  const creations = [], used = new Set();
  // Bombas: intersección de run H y run V (forma L/T/+)
  for (const i of clear) {
    if (inH.has(i) && inV.has(i) && !used.has(i)) { creations.push({ idx: i, power: 'bomb' }); used.add(i); }
  }
  // Estrella: run recto de 5+
  [...runsH, ...runsV].forEach(rn => {
    if (rn.len >= 5 && !rn.cells.some(i => used.has(i))) {
      const p = pickPivot(rn.cells); creations.push({ idx: p, power: 'star' }); used.add(p);
    }
  });
  // Línea (rayo): run recto de 4
  [...runsH, ...runsV].forEach(rn => {
    if (rn.len === 4 && !rn.cells.some(i => used.has(i))) {
      const p = pickPivot(rn.cells); creations.push({ idx: p, power: rn.dir === 'H' ? 'lineH' : 'lineV' }); used.add(p);
    }
  });
  // Cometa: cuadrado 2×2
  squares.forEach(sq => {
    sq.forEach(i => clear.add(i));
    if (!sq.some(i => used.has(i))) {
      const p = sq.find(i => swapIdx.has(i)); const piv = p != null ? p : sq[0];
      creations.push({ idx: piv, power: 'comet' }); used.add(piv);
    }
  });

  creations.forEach(cr => clear.delete(cr.idx)); // los pivotes se transforman, no se eliminan
  return { clear, creations };
}
