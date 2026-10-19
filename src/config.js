// Configuración y matemática de mundos/niveles (pura, salvo worldFeature que mira el
// idioma). Verbatim del juego original.
import { getLang } from './i18n.js';

export const N = 8;                 // tablero N×N
export const POINTS_PER_GEM = 12;          // puntos por gema eliminada
export const LEVELS_PER_WORLD = 10;
export const PROG_KEY = 'diamonds_prog';

// Paleta de gemas (claro arriba, oscuro abajo => aspecto de diamante)
export const COLORS = [
  ['#fda4af', '#e11d48'], // rojo
  ['#fdba74', '#ea580c'], // naranja
  ['#fde047', '#ca8a04'], // amarillo
  ['#86efac', '#16a34a'], // verde
  ['#7dd3fc', '#0284c7'], // azul
  ['#d8b4fe', '#9333ea']  // violeta
];

// Mundos: cada uno añade una mecánica. Más allá del último se repite "Caos"
// y la dificultad sigue escalando por fórmula.
export const WORLDS = [
  { name: 'Cristal',  tint: '#22d3ee', feat: 'Combina y crea poderes',              featEn: 'Match and create power-ups' },
  { name: 'Escarcha', tint: '#7dd3fc', feat: 'Diamantes duros (2 golpes)',          featEn: 'Hard diamonds (2 hits)' },
  { name: 'Prisma',   tint: '#d8b4fe', feat: 'Un color más',                        featEn: 'One more color' },
  { name: 'Roca',     tint: '#a8a29e', feat: 'Diamantes reforzados (3 golpes)',     featEn: 'Reinforced diamonds (3 hits)' },
  { name: 'Tormenta', tint: '#fbbf24', feat: 'Menos movimientos, más objetivos',    featEn: 'Fewer moves, more targets' },
  { name: 'Caos',     tint: '#fb7185', feat: 'Todo combinado',                       featEn: 'Everything combined' },
];

export const worldFeature = info => (getLang() === 'en' && info.featEn) ? info.featEn : info.feat;
export const worldOfLevel = n => Math.floor((n - 1) / LEVELS_PER_WORLD) + 1;
export const levelInWorld = n => ((n - 1) % LEVELS_PER_WORLD) + 1;
export const worldInfo = w => WORLDS[Math.min(w - 1, WORLDS.length - 1)];

// Estrellas necesarias para entrar al mundo w (puerta del nivel 1).
export function reqWorld (w) { return w <= 1 ? 0 : Math.floor((w - 1) * LEVELS_PER_WORLD * 3 * 0.45); }
// Estrellas que exige el nivel n (0 = ninguna). Puerta de mundo (em=1) y
// nivel "jefe" al final de cada mundo (em=último).
export function reqLevel (n) {
  const w = worldOfLevel(n), em = levelInWorld(n);
  if (em === 1) return reqWorld(w);
  if (em === LEVELS_PER_WORLD) return reqWorld(w) + Math.round(LEVELS_PER_WORLD * 1.5);
  return 0;
}

// Mecánicas desbloqueadas por mundo (incremental).
export function features (w) {
  return {
    colors: w >= 3 ? 6 : 5,   // Prisma añade el 6º color
    hard: w >= 2,             // Escarcha: diamantes de 2 golpes
    reinforced: w >= 4,        // Roca: pueden ser de 3 golpes
  };
}
