// Estado global mutable del juego (lo que en el index.html original eran `let`
// sueltos compartidos por todas las funciones). Los módulos importan `S` y leen/
// escriben sus propiedades; así se preserva el comportamiento sin reescribir la
// lógica. cv/ctx/def/prog se inicializan en main.js durante el arranque.
import { N } from './config.js';

/** @typedef {import('./types.js').Gem} Gem */
/** @typedef {import('./types.js').Board} Board */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./types.js').LevelDef} LevelDef */
/** @typedef {import('./types.js').Prog} Prog */
/** @typedef {import('./types.js').Tween} Tween */
/** @typedef {import('./types.js').Fx} Fx */
/** @typedef {import('./types.js').FxBeam} FxBeam */
/** @typedef {import('./types.js').MapStop} MapStop */
/** @typedef {{ x: number, y: number }} Point */

/**
 * @typedef {object} GameS
 * @property {number} cell          lado de una casilla, en píxeles del canvas
 * @property {number} dpr
 * @property {Board} grid
 * @property {'idle' | 'busy'} status
 * @property {Pos | null} sel
 * @property {number} score
 * @property {number} moves
 * @property {number} targetsLeft
 * @property {boolean} endless      modo libre: sin límite de movimientos
 * @property {LevelDef | null} def  levelDef(n) actual
 * @property {string} view          'map' | 'game'
 * @property {Tween[]} tweens
 * @property {Fx[]} fx
 * @property {number} nowMs
 * @property {FxBeam[]} fxBeams
 * @property {number} lastTs
 * @property {Prog | null} prog
 * @property {HTMLCanvasElement | null} cv
 * @property {CanvasRenderingContext2D | null} ctx
 * @property {{ level: number, starsEarned: number } | null} endShare
 * @property {boolean} glossaryReady
 * @property {Point} mapOff
 * @property {{ w: number, h: number, vw: number, vh: number }} mapDim
 * @property {MapStop[]} mapStops
 * @property {Point | null} mapCurrentXY
 * @property {boolean} mapPanInit
 * @property {Point | null} panStart
 * @property {Point | null} panBase
 * @property {boolean} panMoved
 * @property {Pos | null} downCell
 */

/** @type {GameS} */
export const S = {
  cell: 48, dpr: 1,
  grid: [],
  status: 'idle',         // 'idle' | 'busy'
  sel: null,
  score: 0, moves: 0, targetsLeft: 0,
  endless: false,         // modo libre: sin límite de movimientos
  def: null,              // levelDef(n) actual
  view: 'map',
  tweens: [],
  fx: [],                 // partículas / haces / ondas (efectos visuales)
  nowMs: 0,               // reloj para pulsos (palpitar)
  fxBeams: [],            // haces encolados por la detonación en curso
  lastTs: 0,
  prog: null,             // progreso { max, stars }
  cv: null, ctx: null,    // canvas + contexto 2d
  endShare: null,
  glossaryReady: false,
  // mapa
  mapOff: { x: 0, y: 0 },
  mapDim: { w: 0, h: 0, vw: 0, vh: 0 },
  mapStops: [],
  mapCurrentXY: null,
  mapPanInit: false,
  panStart: null, panBase: null, panMoved: false,
  downCell: null,
};

// Lo que main.js deja puesto al arrancar. Si falta, es un fallo de arranque y se dice.
/** @returns {{ cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D }} */
export function canvas () {
  if (!S.cv || !S.ctx) throw new Error('diamonds: canvas not ready');
  return { cv: S.cv, ctx: S.ctx };
}
/** @returns {LevelDef} */
export function def () {
  if (!S.def) throw new Error('diamonds: no level loaded');
  return S.def;
}
/** @returns {Prog} */
export function prog () {
  if (!S.prog) throw new Error('diamonds: progress not loaded');
  return S.prog;
}

// Índices del tablero.
export const I = (/** @type {number} */ r, /** @type {number} */ c) => r * N + c;
/** La gema de la casilla i (null si está vacía). */
export const at = (/** @type {number} */ i) => S.grid[(i / N) | 0][i % N];

/**
 * El tablero cuando está COMPLETO (sin huecos), que es como lo leen la búsqueda de
 * combinaciones y la generación. Con un hueco, lo dice en vez de leer `null.type`.
 * @returns {Gem[][]}
 */
export function fullGrid () {
  for (const row of S.grid) for (const g of row) if (!g) throw new Error('diamonds: board has an empty cell');
  return /** @type {Gem[][]} */ (S.grid);
}

/**
 * Fábrica de gemas.
 * @param {number} r
 * @param {number} c
 * @param {number} t color
 * @returns {Gem}
 */
export function gem (r, c, t) { return { type: t, hp: 1, hpMax: 1, power: null, isTarget: false, targetColor: null, dr: r, dc: c, scale: 1, charge: 0 }; }
