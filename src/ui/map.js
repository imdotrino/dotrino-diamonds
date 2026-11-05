// Vista de mapa de mundos (lienzo navegable con pan), conmutación de vistas y HUD
// flotante del mundo. Verbatim del juego original.
import { $ } from '../dom.js';
import { S, prog } from '../state.js';
import { LEVELS_PER_WORLD, worldOfLevel, worldInfo, reqWorld, reqLevel, worldFeature } from '../config.js';
import { totalStars } from '../progress.js';
import { tr } from '../i18n.js';
import { startLevel } from '../levels.js';

/** @typedef {import('../types.js').MapButton} MapButton */
/** @typedef {import('../state.js').Point} Point */

/** @param {'map' | 'game'} v */
export function showView (v) {
  S.view = v;
  $('mapView').classList.toggle('active', v === 'map');
  $('gameView').classList.toggle('active', v === 'game');
  $('btnMapTop').style.display = v === 'game' ? '' : 'none';
  $('btnGlossary').style.display = v === 'map' ? '' : 'none';
}

export function goToMap () { $('endModal').classList.remove('open'); showView('map'); renderMap(); }

// --- Mapa navegable (pan) ---
const SVGNS = 'http://www.w3.org/2000/svg';

export function renderMap () {
  const vp = $('mapViewport'), canvasEl = $('mapWorld'), svg = $('mapSvg');
  const p = prog();
  const mapDim = S.mapDim;
  mapDim.vw = vp.clientWidth || window.innerWidth;
  mapDim.vh = vp.clientHeight || (window.innerHeight - 120);
  const centerX = Math.max(mapDim.vw, 320) / 2;
  const amp = Math.min(centerX - 60, 120);

  Array.from(canvasEl.querySelectorAll('.level-node,.portal')).forEach(e => e.remove());
  S.mapStops = [];

  const tot = totalStars();
  const maxW = worldOfLevel(p.max) + 1;

  for (let w = 1; w <= maxW; w++) {
    if (w > 1) {
      const rm = reqWorld(w);
      S.mapStops.push({ type: 'portal', w, isOpen: tot >= rm, req: rm, tot, x: 0, y: 0 });   // x/y: abajo
    }
    for (let k = 1; k <= LEVELS_PER_WORLD; k++) {
      const n = (w - 1) * LEVELS_PER_WORLD + k;
      const req = reqLevel(n);
      const unlocked = n <= p.max && tot >= req;
      S.mapStops.push({ type: 'level', w, k, n, req, unlocked, isCurrent: n === p.max, x: 0, y: 0 });
    }
  }

  // Camino siempre ASCENDENTE: el nivel 1 (o=0) queda abajo y cada parada
  // siguiente sube. La X serpentea según el orden real.
  const lastO = S.mapStops.length - 1;
  S.mapStops.forEach((s, o) => {
    s.x = centerX + amp * Math.sin(o * 0.7);
    s.y = 90 + (lastO - o) * 118;
  });
  mapDim.w = Math.max(mapDim.vw, 320);
  mapDim.h = (lastO >= 0 ? 90 + lastO * 118 : 0) + 140;
  canvasEl.style.width = mapDim.w + 'px';
  canvasEl.style.height = mapDim.h + 'px';

  svg.setAttribute('width', String(mapDim.w));
  svg.setAttribute('height', String(mapDim.h));
  svg.innerHTML = '';
  for (let i = 1; i < S.mapStops.length; i++) {
    const a = S.mapStops[i - 1], b = S.mapStops[i];
    const d = 'M ' + a.x + ' ' + a.y + ' C ' + a.x + ' ' + ((a.y + b.y) / 2) + ', ' + b.x + ' ' + ((a.y + b.y) / 2) + ', ' + b.x + ' ' + b.y;
    const tint = worldInfo(b.w).tint;
    const seg = document.createElementNS(SVGNS, 'path');
    seg.setAttribute('d', d);
    seg.setAttribute('fill', 'none');
    const on = (b.type === 'level' ? b.unlocked : b.isOpen);
    seg.setAttribute('stroke', on ? tint : 'rgba(148,163,184,.25)');
    seg.setAttribute('stroke-width', on ? '7' : '5');
    seg.setAttribute('stroke-linecap', 'round');
    seg.setAttribute('stroke-dasharray', on ? 'none' : '2 12');
    seg.setAttribute('opacity', on ? '0.55' : '0.5');
    svg.appendChild(seg);
  }

  S.mapCurrentXY = null;
  S.mapStops.forEach(s => {
    const tint = worldInfo(s.w).tint;
    if (s.type === 'portal') {
      const el = /** @type {MapButton} */ (document.createElement('button'));
      el.className = 'portal' + (s.isOpen ? '' : ' locked');
      el.style.setProperty('--tint', tint);
      el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
      const info = worldInfo(s.w);
      if (s.isOpen) {
        el.innerHTML = '<span class="pn">' + tr('portal') + '</span><span class="pw">' + info.name + '</span>';
        el._action = () => startLevel((s.w - 1) * LEVELS_PER_WORLD + 1);
      } else {
        el.innerHTML = '<span class="pn">' + tr('portal') + '</span><span class="plock">🔒 ★' + s.tot + '/' + s.req + '</span>';
      }
      canvasEl.appendChild(el);
    } else {
      const stars = p.stars[s.n] || 0;
      const el = /** @type {MapButton} */ (document.createElement('button'));
      el.className = 'level-node' + (s.unlocked ? '' : ' locked') + (s.isCurrent && s.unlocked ? ' current' : '');
      el.style.setProperty('--tint', tint);
      el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
      if (s.unlocked) {
        el.innerHTML = '<span class="nn">' + s.k + '</span><span class="ne">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>';
        el._action = () => startLevel(s.n);
      } else if (s.n <= p.max) {
        el.innerHTML = '<span class="nn">🔒</span><span class="ne">★ ' + tot + '/' + s.req + '</span>';
      } else {
        el.innerHTML = '🔒';
      }
      canvasEl.appendChild(el);
      if (s.isCurrent) S.mapCurrentXY = { x: s.x, y: s.y };
    }
  });

  if (!S.mapCurrentXY && S.mapStops.length) S.mapCurrentXY = { x: S.mapStops[0].x, y: S.mapStops[0].y };

  initMapPan();
  centerOn(S.mapCurrentXY, false);
  updateMapHud();
}

// ---- Pan ----
function clampOff () {
  const mapDim = S.mapDim, mapOff = S.mapOff;
  const minX = Math.min(0, mapDim.vw - mapDim.w), maxX = 0;
  const minY = Math.min(0, mapDim.vh - mapDim.h), maxY = 0;
  if (mapDim.w <= mapDim.vw) mapOff.x = (mapDim.vw - mapDim.w) / 2;
  else mapOff.x = Math.max(minX, Math.min(maxX, mapOff.x));
  mapOff.y = Math.max(minY, Math.min(maxY, mapOff.y));
}
function applyPan () {
  clampOff();
  $('mapWorld').style.transform = 'translate(' + S.mapOff.x + 'px,' + S.mapOff.y + 'px)';
}
/**
 * @param {Point | null} xy
 * @param {boolean} smooth
 */
function centerOn (xy, smooth) {
  if (!xy) return;
  S.mapOff.x = S.mapDim.vw / 2 - xy.x;
  S.mapOff.y = S.mapDim.vh / 2 - xy.y;
  const canvasEl = $('mapWorld');
  canvasEl.style.transition = smooth ? 'transform .35s ease' : 'none';
  applyPan();
  if (smooth) setTimeout(() => { canvasEl.style.transition = 'none'; }, 360);
}
function updateMapHud () {
  const cy = -S.mapOff.y + S.mapDim.vh / 2;
  let best = S.mapStops[0], bd = Infinity;
  for (const s of S.mapStops) { const d = Math.abs(s.y - cy); if (d < bd) { bd = d; best = s; } }
  if (!best) return;
  const info = worldInfo(best.w), tot = totalStars();
  const hud = $('mapHud');
  hud.style.setProperty('--tint', info.tint);
  hud.innerHTML =
    '<div><div class="mh-num">' + tr('world') + ' ' + best.w + '</div>' +
    '<div class="mh-name">' + info.name + '</div>' +
    '<div class="mh-feat">' + worldFeature(info) + '</div></div>' +
    '<div class="mh-stars">★ ' + tot + '</div>';
}

function initMapPan () {
  if (S.mapPanInit) return;
  S.mapPanInit = true;
  const vp = $('mapViewport');
  vp.addEventListener('pointerdown', e => {
    S.panStart = { x: e.clientX, y: e.clientY };
    S.panBase = { x: S.mapOff.x, y: S.mapOff.y };
    S.panMoved = false;
    vp.classList.add('dragging');
    $('mapWorld').style.transition = 'none';
    try { vp.setPointerCapture(e.pointerId); } catch (err) {}
  });
  vp.addEventListener('pointermove', e => {
    const start = S.panStart, base = S.panBase;
    if (!start) return;
    if (!base) throw new Error('diamonds: map pan without a base');   // se ponen juntos en pointerdown
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) {
      S.panMoved = true;
      const h = $('mapHint'); if (h) h.style.opacity = '0';
    }
    S.mapOff.x = base.x + dx; S.mapOff.y = base.y + dy;
    applyPan();
    updateMapHud();
  });
  const onEnd = (/** @type {PointerEvent} */ e) => {
    const wasTap = S.panStart && !S.panMoved;
    S.panStart = null; vp.classList.remove('dragging');
    if (wasTap && e && typeof e.clientX === 'number') {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const node = /** @type {MapButton | null} */ (t && t.closest && t.closest('.level-node, .portal'));
      if (node && node._action) node._action();
    }
  };
  vp.addEventListener('pointerup', onEnd);
  vp.addEventListener('pointercancel', () => { S.panStart = null; vp.classList.remove('dragging'); });
  $('mapRecenter').addEventListener('click', () => centerOn(S.mapCurrentXY, true));
}
