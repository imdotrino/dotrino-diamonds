// Resolución del tablero: aplicar la detonación (puntos/animaciones/objetivos),
// olas naturales y explícitas, efecto de combinar dos power-ups, gravedad (recta +
// diagonal) y recuperación cuando no hay movimientos. Verbatim del juego original.
import { S, I, at, gem } from '../state.js';
import { N, POINTS_PER_GEM, COLORS } from '../config.js';
import { tween, easeInQuad, easeOutQuad, easeOutBack, wait } from '../tweens.js';
import { spawnShards, spawnBeam, spawnRing } from '../fx.js';
import { findGroups, hasMoves } from './matching.js';
import { collectDetonation } from './blast.js';
import { beep, vibrate } from '../audio.js';
import { updateHUD, showCombo } from '../ui/hud.js';

export async function applyDetonation (detonated, combo, creations) {
  const cell = S.cell;
  creations.forEach(cr => { const g = at(cr.idx); if (g) { g.power = cr.power; g.hp = 1; g.hpMax = 1; } });
  const pivotSet = new Set(creations.map(c => c.idx));

  const removed = [], damaged = []; let objHit = 0;
  detonated.forEach(i => {
    const g = at(i); if (!g) return;
    if (pivotSet.has(i)) return;
    if (g.hp > 1) { g.hp--; damaged.push(g); return; }
    removed.push(i); if (g.isTarget) objHit++;
  });

  S.score += removed.length * POINTS_PER_GEM * combo + creations.length * 30;
  if (combo >= 2 && removed.length) showCombo(combo);
  updateHUD();
  beep(500 + combo * 70, 0.12, 0.3);
  vibrate(combo > 1 ? [20, 20, 30] : 35);

  // Haces/ondas de los poderes que fluyen sobre el área afectada
  if (S.fxBeams.length) {
    S.fxBeams.forEach(b => { if (b.k === 'beam') spawnBeam(b.r0, b.c0, b.r1, b.c1, b.col); else spawnRing(b.r, b.c, cell * 1.7, b.col); });
    S.fxBeams = [];
  }

  // 1) Luz palpitante de carga en las gemas por estallar
  removed.forEach(i => { const g = at(i); if (g) g.charge = 1; });
  if (removed.length) await wait(150);

  // 2) Estallido en pedazos
  const anims = [];
  removed.forEach(i => {
    const g = at(i); if (!g) return;
    const cx = (g.dc + 0.5) * cell, cy = (g.dr + 0.5) * cell;
    const [k1, k2] = g.power ? ['#ffffff', '#bae6fd'] : COLORS[g.type];
    spawnShards(cx, cy, k1, k2);
    anims.push(tween(g, { scale: 0, charge: 0 }, 130, easeInQuad));
  });
  damaged.forEach(g => { g.scale = 1; anims.push(tween(g, { scale: 0.62 }, 80, easeOutQuad).then(() => tween(g, { scale: 1 }, 150, easeOutBack))); });
  await Promise.all(anims);

  removed.forEach(i => { S.grid[(i / N) | 0][i % N] = null; });
  S.targetsLeft -= objHit;
  updateHUD();
}

export async function waveNatural (swap, combo) {
  const { clear, creations } = findGroups(swap);
  if (clear.size === 0 && creations.length === 0) return false;
  const protect = new Set(creations.map(c => c.idx));
  const detonated = collectDetonation(clear, protect);
  await applyDetonation(detonated, combo, creations);
  return true;
}

export async function waveExplicit (initial, combo) {
  const detonated = collectDetonation(initial, null);
  if (detonated.size === 0) return false;
  await applyDetonation(detonated, combo, []);
  return true;
}

// Efecto de intercambiar uno o dos poderes (combos).
export function swapEffect (a, b) {
  const grid = S.grid;
  const ia = I(a.r, a.c), ib = I(b.r, b.c);
  const ga = at(ia), gb = at(ib);
  const set = new Set([ia, ib]);
  const pa = ga && ga.power, pb = gb && gb.power;
  const add = i => { if (i >= 0 && i < N * N) set.add(i); };
  const row = r => { if (r < 0 || r >= N) return; for (let c = 0; c < N; c++) add(I(r, c)); };
  const col = c => { if (c < 0 || c >= N) return; for (let r = 0; r < N; r++) add(I(r, c)); };
  const area = (r, c, rad) => { for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) add(I(rr, cc)); } };
  const color = col0 => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.type === col0) add(I(r, c)); } };

  const eachColor = (col0, fn) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.type === col0) fn(r, c); } };
  const shots = (cnt, fn) => {
    const pool = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = grid[r][c]; if (g && g.type >= 0) pool.push([r, c]); }
    for (let k = 0; k < cnt && pool.length; k++) { const [r, c] = pool.splice((Math.random() * pool.length) | 0, 1)[0]; fn(r, c); }
  };

  if (pa && pb) {
    const has = p => pa === p || pb === p;
    if (has('star') && pa === pb) {
      for (let i = 0; i < N * N; i++) add(i);                              // estrella + estrella = todo el tablero
    } else if (has('star')) {
      const other = pa === 'star' ? gb : ga, col0 = other.type;
      if (other.power === 'bomb') eachColor(col0, (r, c) => area(r, c, 1)); // estrella + bomba = cada gema del color explota 3×3
      else if (other.power === 'comet') { color(col0); shots(6, (r, c) => area(r, c, 1)); } // estrella + cometa = borra el color + 6 disparos
      else { eachColor(col0, (r, c) => { row(r); col(c); }); color(col0); } // estrella + rayo = cada gema del color = cruz
    } else if (has('comet') && pa === pb) {
      shots(6, (r, c) => area(r, c, 1));                                    // cometa + cometa = 6 estallidos
    } else if (has('comet')) {
      const other = pa === 'comet' ? gb : ga;
      if (other.power === 'bomb') shots(3, (r, c) => area(r, c, 1));        // cometa + bomba = 3 estallidos 3×3
      else shots(3, (r, c) => { row(r); col(c); });                       // cometa + rayo = 3 cruces
    } else if (pa === 'bomb' && pb === 'bomb') {
      area(a.r, a.c, 2); area(b.r, b.c, 2);                                // bomba + bomba = 5×5
    } else if (has('bomb')) {
      for (let d = -1; d <= 1; d++) { row(a.r + d); col(a.c + d); }       // rayo + bomba = banda (3 filas + 3 col)
    } else {
      row(a.r); col(a.c);                                                 // rayo + rayo = cruz
    }
  } else {
    const pcell = pa ? ia : ib, pg = at(pcell), other = pa ? gb : ga;
    if (pg.power === 'star') pg.targetColor = other ? other.type : pg.type;  // estrella + normal = ese color
    // rayo/bomba/cometa + normal: la detonación expande desde pcell
  }
  return set;
}

// Asienta el tablero: gravedad recta + relleno; luego un paso diagonal donde la
// casilla de abajo está bloqueada. `refill` rellena arriba; `fixed` no se mueve.
export async function collapse (opts) {
  const refill = !opts || opts.refill !== false;
  const fixed = (opts && opts.fixed) || null;
  const movable = g => g && !(fixed && fixed.has(g));
  const grid = S.grid;

  let changed = true;
  while (changed) {
    changed = false;

    // 1) Gravedad recta + relleno, hasta asentar.
    let straight = true;
    while (straight) {
      straight = false;
      const tw = [];
      for (let r = N - 2; r >= 0; r--) for (let c = 0; c < N; c++) {
        const g = grid[r][c];
        if (movable(g) && !grid[r + 1][c]) {
          grid[r + 1][c] = g; grid[r][c] = null;
          tw.push(tween(g, { dr: r + 1 }, 90)); straight = true; changed = true;
        }
      }
      if (refill) for (let c = 0; c < N; c++) {
        if (!grid[0][c]) {
          const g = gem(0, c, (Math.random() * S.def.colors) | 0);
          g.dr = -1; grid[0][c] = g;
          tw.push(tween(g, { dr: 0 }, 110)); straight = true; changed = true;
        }
      }
      if (tw.length) await Promise.all(tw);
    }

    // 2) Un paso diagonal donde la casilla de abajo está bloqueada.
    const td = [];
    for (let r = N - 2; r >= 0; r--) for (let c = 0; c < N; c++) {
      const g = grid[r][c];
      if (!movable(g) || !grid[r + 1][c]) continue;   // libre abajo => lo maneja la recta
      const ops = [];
      if (c > 0 && !grid[r + 1][c - 1]) ops.push(c - 1);
      if (c < N - 1 && !grid[r + 1][c + 1]) ops.push(c + 1);
      if (!ops.length) continue;
      const nc = ops[(Math.random() * ops.length) | 0];  // prioridad al azar izq/der
      grid[r + 1][nc] = g; grid[r][c] = null;
      td.push(tween(g, { dr: r + 1, dc: nc }, 120)); changed = true;
    }
    if (td.length) await Promise.all(td);
  }
}

// Sin movimientos posibles: estallan los diamantes estándar; los especiales
// mantienen su posición. Se rellena por gravedad (con diagonal) alrededor de
// ellos y se resuelven las cascadas. Se repite hasta que vuelva a haber jugada.
export async function recover () {
  const grid = S.grid;
  S.status = 'busy';
  let guard = 0;
  while (!hasMoves() && guard++ < 30) {
    const rem = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const g = grid[r][c];
      if (g && g.type >= 0 && !g.power) rem.push(g);
    }
    if (!rem.length) break;                  // solo quedan especiales: nada que hacer
    rem.forEach(g => { g.charge = 1; });
    await wait(140);
    const anims = [];
    rem.forEach(g => {
      const cx = (g.dc + 0.5) * S.cell, cy = (g.dr + 0.5) * S.cell;
      spawnShards(cx, cy, ...COLORS[g.type]);
      anims.push(tween(g, { scale: 0, charge: 0 }, 130, easeInQuad));
    });
    await Promise.all(anims);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (rem.includes(grid[r][c])) grid[r][c] = null;

    const fixed = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] && grid[r][c].power) fixed.add(grid[r][c]);
    await collapse({ refill: true, fixed });

    // Caso especial: tras el rellenado, dejar caer TODO normalmente para que esos
    // especiales se asienten en los huecos que les queden debajo.
    await collapse();

    // Las gemas nuevas pueden formar combinaciones: resolverlas.
    let combo = 1;
    while (await waveNatural(null, combo)) { await collapse(); combo++; }
  }
}
