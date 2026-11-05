// Formas de datos de Diamonds que se repiten entre el motor, el render, el mapa y
// el almacén. Solo tipos (JSDoc): este módulo no exporta nada en tiempo de ejecución.

/** @typedef {'lineH' | 'lineV' | 'bomb' | 'star' | 'comet'} Power */

/**
 * Una gema del tablero.
 * @typedef {object} Gem
 * @property {number} type          color (índice en COLORS)
 * @property {number} hp            golpes que le quedan
 * @property {number} hpMax
 * @property {Power | null} power
 * @property {boolean} isTarget     objetivo del nivel (romper)
 * @property {number | null} targetColor  color que borra una estrella
 * @property {number} dr            fila dibujada (se anima)
 * @property {number} dc            columna dibujada (se anima)
 * @property {number} scale
 * @property {number} charge        luz de "carga" antes de explotar (0..1)
 */

/** Tablero N×N; una casilla queda vacía (null) mientras cae lo de arriba. @typedef {Array<Array<Gem | null>>} Board */

/** @typedef {{ r: number, c: number }} Pos */

/** Intercambio que hizo el jugador. @typedef {{ a: Pos, b: Pos }} Swap */

/** Power-up que nace en una casilla al combinar. @typedef {{ idx: number, power: Power }} Creation */

/** Lo que una gema anima. @typedef {'dr' | 'dc' | 'scale' | 'charge'} TweenKey */

/**
 * @typedef {object} Tween
 * @property {Gem} obj
 * @property {Partial<Record<TweenKey, number>>} props  valores finales
 * @property {Partial<Record<TweenKey, number>>} from   valores de partida
 * @property {number} dur   ms
 * @property {number} t     ms transcurridos
 * @property {(t: number) => number} ease
 * @property {() => void} done
 */

/**
 * Efecto visual en curso (partícula, haz, onda o destello).
 * @typedef {{ kind: 'shard', x: number, y: number, vx: number, vy: number, rot: number, vr: number, size: number, color: string, t: number, dur: number }
 *   | { kind: 'flash', x: number, y: number, r: number, t: number, dur: number }
 *   | { kind: 'beam', x0: number, y0: number, x1: number, y1: number, color: string, t: number, dur: number }
 *   | { kind: 'ring', x: number, y: number, r: number, color: string, t: number, dur: number }} Fx
 */

/**
 * Haz u onda encolado por la detonación en curso (en casillas, no en píxeles).
 * @typedef {{ k: 'beam', r0: number, c0: number, r1: number, c1: number, col: string }
 *   | { k: 'ring', r: number, c: number, col: string }} FxBeam
 */

/**
 * Mundo del mapa.
 * @typedef {{ name: string, tint: string, feat: string, featEn: string }} WorldInfo
 */

/**
 * Definición determinista de un nivel.
 * @typedef {object} LevelDef
 * @property {number} n       nivel global (1-based)
 * @property {number} w       mundo
 * @property {number} em      nivel dentro del mundo
 * @property {'break' | 'points'} type
 * @property {number} moves
 * @property {number} colors
 * @property {number} hard    diamantes duros
 * @property {boolean} reinforced
 * @property {number} targetPoints
 * @property {() => number} rng
 * @property {WorldInfo} info
 */

/** Progreso: nivel máximo abierto y mejores estrellas por nivel. @typedef {{ max: number, stars: Record<string, number> }} Prog */

/**
 * Parada del camino del mapa: un portal de mundo o un nivel, con su posición.
 * @typedef {({ type: 'portal', w: number, isOpen: boolean, req: number, tot: number }
 *   | { type: 'level', w: number, k: number, n: number, req: number, unlocked: boolean, isCurrent: boolean })
 *   & { x: number, y: number }} MapStop
 */

/** Botón del mapa con la acción que dispara un toque (sin arrastre). @typedef {HTMLButtonElement & { _action?: () => void }} MapButton */

export {};
