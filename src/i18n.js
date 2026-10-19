// i18n (es / en). Mismas cadenas y lógica que el juego original; el `tr()` cae a
// español si falta una clave. `applyLang()` (que toca el DOM y re-renderiza)
// vive en ui/hud.js para no acoplar este módulo a la UI.
// El idioma lo manda <dotrino-topbar>, que lo persiste en 'dotrino.lang' (clave
// común del ecosistema). Leemos ESA clave para resolver igual que él en el primer
// render; los cambios llegan por el evento 'dotrino-lang' (ver main.js).
export const LANG_KEY = 'dotrino.lang';
const LEGACY_LANG_KEY = 'diamonds_lang';

// Migración única de la preferencia propia a la clave del ecosistema: si no lo
// hiciéramos, a quien ya había elegido idioma se le resetearía al del navegador.
// Debe correr ANTES de que el topbar se registre (main.js importa i18n primero).
(() => {
  try {
    const legacy = localStorage.getItem(LEGACY_LANG_KEY);
    if ((legacy === 'es' || legacy === 'en') && !localStorage.getItem(LANG_KEY)) {
      localStorage.setItem(LANG_KEY, legacy);
    }
    if (legacy != null) localStorage.removeItem(LEGACY_LANG_KEY);
  } catch (e) {}
})();

let LANG = (() => {
  let s = null;
  try { s = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (s === 'es' || s === 'en') return s;
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
})();

export const STR = {
  es: {
    storeProblem: 'No se pudo abrir tu almacén: esta partida no se guardará.',
    map: '← Mapa', currentLevel: '◎ Nivel actual', guide: 'Guía',
    hint: 'Arrastra para explorar el mapa', portal: 'Portal',
    guideTitle: 'Guía del juego',
    world: 'Mundo', lvl: 'Nivel', obj: 'Objetivo', goal: 'Meta', break: 'Romper', free: 'Libre',
    mov: 'Mov.', points: 'Puntos',
    cleared: '¡Nivel superado!', noMoves: 'Sin movimientos',
    next: 'Siguiente nivel', retry: 'Reintentar',
    endless: '∞ Seguir sin límite', goToMap: 'Ir al mapa',
    share: 'Compartir', copied: 'Texto copiado',
    shareMsgs: [
      (l, e, u) => '💎 Acabo de superar el nivel ' + l + ' en Diamonds con ' + e + ' ⭐. ¿Me superas? 😏 ' + u,
      (l, e, u) => '🚀 Llegué al nivel ' + l + ' en Diamonds. A ver si me alcanzas 👀 ' + u,
      (l, e, u) => '🏆 Nivel ' + l + ' completado en Diamonds. No creo que me ganes 😎 ' + u,
      (l, e, u) => '💎🔥 Voy por el nivel ' + l + ' de Diamonds. ¿Tú dónde andas? 🤔 ' + u,
      (l, e, u) => '⭐ ' + e + ' estrellas en el nivel ' + l + ' de Diamonds. Tu turno 😜 ' + u,
    ],
    pointsN: n => 'Puntos: ' + n, movesLeft: n => 'Movimientos restantes: ' + n,
    missingPoints: n => 'Te faltaron ' + n + ' puntos', diamondsLeft: n => 'Quedaban ' + n + ' diamantes',
    combo: n => '¡Combo ×' + n + '!',
    // glosario
    gPlay: 'Cómo jugar', gDiam: 'Diamantes',
    gPow: 'Power-ups (se crean al combinar)', gComb: 'Combinaciones (intercambia dos power-ups)',
    gMatchT: 'Combina', gMatchD: 'Toca una gema y una vecina (o desliza) para intercambiarlas.', gMatchH: 'Alinea 3 o más del mismo color para romperlas.',
    gCascT: 'Cascadas', gCascD: 'Al caer pueden formarse nuevas líneas.', gCascH: 'Cada reacción en cadena multiplica los puntos (¡combo!).',
    gObjT: 'Objetivo del nivel', gObjD: 'Meta de puntos, o romper todos los diamantes objetivo.', gObjH: 'Lo ves arriba en el marcador.',
    gStarsT: 'Estrellas', gStarsD: '1 a 3 según lo holgado que ganes. ', gStarsH: 'Abren mundos y portales en el mapa.',
    gHardT: 'Diamante duro', gHardD: 'Necesita 2 golpes para romperse (muestra grietas).', gHardH: 'Combínalo dos veces.',
    gRefT: 'Diamante reforzado', gRefD: 'Aguanta 3 golpes. Aparece en mundos avanzados.',
    gLineT: 'Rayo', gLineD: 'Se crea con 4 en línea.', gLineH: 'Al activarlo limpia toda la fila o la columna.',
    gBombT: 'Bomba', gBombD: 'Se crea con una forma de L o T.', gBombH: 'Estalla en un área de 3×3.',
    gStarT: 'Estrella', gStarD: 'Se crea con 5 en línea.', gStarH: 'Elimina todos los diamantes de un color.',
    gCometT: 'Cometa', gCometD: 'Se crea con un cuadrado 2×2.', gCometH: 'Dispara a 3 celdas (prioriza objetivos) con salpicadura.',
    gTrigger: 'Para activar un power-up, intercámbialo con una gema vecina.',
    gC1T: 'Rayo + Rayo', gC1D: 'Cruz: limpia una fila y una columna completas.',
    gC2T: 'Rayo + Bomba', gC2D: 'Banda: 3 filas y 3 columnas.',
    gC3T: 'Bomba + Bomba', gC3D: 'Explosión enorme de 5×5.',
    gC4T: 'Rayo/Bomba + Cometa', gC4D: 'Varios disparos a zonas del tablero.',
    gC5T: 'Cometa + Cometa', gC5D: '6 estallidos repartidos.',
    gC6T: 'Estrella + Rayo/Bomba', gC6D: 'Convierte cada gema de un color en rayo o bomba.',
    gC7T: 'Estrella + Estrella', gC7D: '¡Arrasa todo el tablero!',
  },
  en: {
    storeProblem: 'Could not open your storage: this game will not be saved.',
    map: '← Map', currentLevel: '◎ Current level', guide: 'Guide',
    hint: 'Drag to explore the map', portal: 'Portal',
    guideTitle: 'Game guide',
    world: 'World', lvl: 'Level', obj: 'Goal', goal: 'Goal', break: 'Break', free: 'Free',
    mov: 'Moves', points: 'Points',
    cleared: 'Level cleared!', noMoves: 'Out of moves',
    next: 'Next level', retry: 'Retry',
    endless: '∞ Keep playing', goToMap: 'Go to map',
    share: 'Share', copied: 'Text copied',
    shareMsgs: [
      (l, e, u) => '💎 Just cleared level ' + l + ' in Diamonds with ' + e + ' ⭐. Can you beat me? 😏 ' + u,
      (l, e, u) => '🚀 Reached level ' + l + ' in Diamonds. Catch up if you can 👀 ' + u,
      (l, e, u) => '🏆 Level ' + l + ' done in Diamonds. Bet you can\'t beat me 😎 ' + u,
      (l, e, u) => '💎🔥 I\'m on level ' + l + ' of Diamonds. Where are you? 🤔 ' + u,
      (l, e, u) => '⭐ ' + e + ' stars on level ' + l + ' of Diamonds. Your turn 😜 ' + u,
    ],
    pointsN: n => 'Points: ' + n, movesLeft: n => 'Moves left: ' + n,
    missingPoints: n => 'You needed ' + n + ' more points', diamondsLeft: n => n + ' diamonds left',
    combo: n => 'Combo ×' + n + '!',
    gPlay: 'How to play', gDiam: 'Diamonds',
    gPow: 'Power-ups (created by matching)', gComb: 'Combos (swap two power-ups)',
    gMatchT: 'Match', gMatchD: 'Tap a gem and a neighbor (or swipe) to swap them.', gMatchH: 'Line up 3 or more of the same color to clear them.',
    gCascT: 'Cascades', gCascD: 'New lines may form as gems fall.', gCascH: 'Each chain reaction multiplies your points (combo!).',
    gObjT: 'Level goal', gObjD: 'Reach a points target, or break all target diamonds.', gObjH: 'Shown at the top scoreboard.',
    gStarsT: 'Stars', gStarsD: '1 to 3 based on how well you win. ', gStarsH: 'They unlock worlds and portals on the map.',
    gHardT: 'Hard diamond', gHardD: 'Takes 2 hits to break (shows cracks).', gHardH: 'Match it twice.',
    gRefT: 'Reinforced diamond', gRefD: 'Takes 3 hits. Appears in later worlds.',
    gLineT: 'Lightning', gLineD: 'Created with 4 in a row.', gLineH: 'Clears the whole row or column.',
    gBombT: 'Bomb', gBombD: 'Created with an L or T shape.', gBombH: 'Blasts a 3×3 area.',
    gStarT: 'Star', gStarD: 'Created with 5 in a row.', gStarH: 'Removes all diamonds of one color.',
    gCometT: 'Comet', gCometD: 'Created with a 2×2 square.', gCometH: 'Fires at 3 cells (targets first) with splash.',
    gTrigger: 'To trigger a power-up, swap it with an adjacent gem.',
    gC1T: 'Lightning + Lightning', gC1D: 'Cross: clears a full row and column.',
    gC2T: 'Lightning + Bomb', gC2D: 'Band: 3 rows and 3 columns.',
    gC3T: 'Bomb + Bomb', gC3D: 'Huge 5×5 blast.',
    gC4T: 'Lightning/Bomb + Comet', gC4D: 'Several shots across the board.',
    gC5T: 'Comet + Comet', gC5D: '6 scattered blasts.',
    gC6T: 'Star + Lightning/Bomb', gC6D: 'Turns every gem of a color into lightning or bomb.',
    gC7T: 'Star + Star', gC7D: 'Wipes the whole board!',
  },
};

export const tr = k => { const v = (STR[LANG] || STR.es)[k]; return v != null ? v : (STR.es[k] != null ? STR.es[k] : k); };
export const getLang = () => LANG;
// El topbar ya persiste en 'dotrino.lang' al cambiar; aquí solo sincronizamos el
// valor en memoria (y lo dejamos escrito por si el evento llegara de otra fuente).
export function setLang (l) { LANG = l; try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {} }
