// HUD del juego (marcador), combo flotante y aplicación del idioma a la UI.
// Verbatim del juego original.
import { $ } from '../dom.js';
import { S } from '../state.js';
import { tr, getLang } from '../i18n.js';
import { renderMap } from './map.js';

export function updateHUD () {
  const def = S.def;
  $('hudLevel').textContent = def.w + '·' + def.em;
  $('moves').textContent = Math.max(0, S.moves);
  $('score').textContent = S.score;
  const ov = $('objVal');
  if (def.type === 'points') { $('objLbl').textContent = tr('goal'); ov.textContent = S.score + '/' + def.targetPoints; ov.classList.remove('break'); }
  else { $('objLbl').textContent = tr('break'); ov.textContent = Math.max(0, S.targetsLeft) + ' 💎'; ov.classList.add('break'); }
}

export function showCombo (n) {
  const el = $('combo');
  el.textContent = tr('combo')(n);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

export function applyLang () {
  const LANG = getLang();
  document.documentElement.lang = LANG;
  $('btnMapTop').textContent = tr('map');
  $('btnMap2').textContent = tr('map');
  $('mapRecenter').textContent = tr('currentLevel');
  $('bookTxt').textContent = tr('guide');
  $('mapHint').textContent = tr('hint');
  $('glossaryTitle').textContent = tr('guideTitle');
  $('lblLevel').textContent = tr('lvl');
  $('lblMoves').textContent = tr('mov');
  $('lblPoints').textContent = tr('points');
  $('btnNext').textContent = tr('next');
  $('btnRetry').textContent = tr('retry');
  $('btnEndless').textContent = tr('endless');
  $('btnShare').textContent = tr('share');
  $('btnMapModal').textContent = tr('goToMap');
  S.glossaryReady = false;                 // forzar reconstrucción del glosario
  if (S.def) updateHUD();
  if (S.view === 'map') { try { renderMap(); } catch (e) {} }
}
