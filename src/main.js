// Punto de entrada de Diamonds (Vite). Inicializa el estado (canvas, progreso,
// nivel), engancha la interacción y los listeners de UI, arranca el loop, registra
// el Service Worker y cablea la navegación "volver" unificada del ecosistema.
import '@dotrino/theme/theme.css'
import './main.css';

// OJO con el orden: i18n va ANTES del topbar. Su módulo migra la preferencia de
// idioma vieja a la clave del ecosistema ('dotrino.lang'), que es la que lee el
// topbar al registrarse; al revés, el idioma elegido se perdería.
import './i18n.js';
// Barra superior estándar del ecosistema (§5): marca + volver + idioma + perfil
// (§6.1) + moneda de support en UN componente. No se re-arma el header a mano.
import '@dotrino/topbar';
// Botón "Instalar App" (PWA) unificado: solo importar registra <dotrino-install>.
import '@dotrino/install';
// Navegación "volver" unificada: captura el botón físico de Android / gesto de
// iOS / atrás del navegador. El chevron y el controlador los instala el topbar.
import { createBackNav, getBackNav } from '@dotrino/nav';

import { $ } from './dom.js';
import { S } from './state.js';
import { levelDef } from './rng.js';
import { loadProgress } from './progress.js';
import { loop } from './loop.js';
import { registerInput } from './input.js';
import { measure } from './render.js';
import { showView, renderMap, goToMap } from './ui/map.js';
import { openGlossary } from './ui/glossary.js';
import { initTopbar, setShareUrl } from './ui/topbar.js';
import { startLevel, enterEndless, shareLevel } from './levels.js';
import { syncProgressFromStore } from './progress.js';
import { handleInviteHash, startReferrals, onReferralsChange, inviteLink } from './referrals.js';

/* ===================== Init estado ===================== */
S.cv = $('board');
S.ctx = S.cv.getContext('2d');
S.prog = loadProgress();
S.def = levelDef(1);

registerInput();

/* ===================== Topbar ===================== */
// Identidad + reputación al topbar (botón y modal "Mi perfil", §6.1) y el
// idioma pasa a mandarlo él (evento 'dotrino-lang').
initTopbar();

/* ===================== Eventos UI ===================== */
$('btnMapTop').addEventListener('click', goToMap);
$('btnMap2').addEventListener('click', goToMap);
$('btnGlossary').addEventListener('click', openGlossary);
$('btnGlossaryClose').addEventListener('click', () => $('modalGlossary').classList.remove('open'));
$('modalGlossary').addEventListener('click', e => { if (e.target === $('modalGlossary')) $('modalGlossary').classList.remove('open'); });
$('btnMapModal').addEventListener('click', goToMap);
$('btnNext').addEventListener('click', () => { $('endModal').classList.remove('open'); startLevel(S.def.n + 1); });
$('btnRetry').addEventListener('click', () => { $('endModal').classList.remove('open'); startLevel(S.def.n); });
$('btnEndless').addEventListener('click', enterEndless);
$('btnShare').addEventListener('click', shareLevel);

window.addEventListener('resize', () => { if (S.view === 'game') measure(); else if (S.view === 'map') renderMap(); });

/* ===================== Arranque ===================== */
showView('map');
renderMap();
requestAnimationFrame(loop);

/* ===================== PWA ===================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ===================== Ecosistema: store + referidos ===================== */
// Si abriste un enlace de invitación (#i=...), avisar al invitador (best-effort).
handleInviteHash().catch(() => {});

// Progreso durable: fusionar lo que haya en el store con lo local y re-pintar.
syncProgressFromStore().then(ch => { if (ch && S.view === 'map') renderMap(); }).catch(() => {});

// Referidos: escuchar acuses y, al cambiar el contador, re-pintar el mapa (las
// estrellas-bonus desbloquean mundos). El enlace de invitación se enchufa al
// share de la moneda de support una vez que hay identidad.
onReferralsChange(() => { if (S.view === 'map') renderMap(); });
startReferrals().catch(() => {});
inviteLink().then(link => { if (link) setShareUrl(link); }).catch(() => {});

/* ===================== Navegación "volver" ===================== */
// chevron del header + botón físico de Android / gesto iOS / atrás del navegador →
// cierra modal, vuelve del juego al mapa; si no hay nada → dotrino.com.
// El topbar ya instaló el controlador al registrarse (con el mismo `home` por
// defecto): reusamos ESE. Crear otro dejaría dos trampas de popstate compitiendo.
const nav = getBackNav() || createBackNav();
// Capa por modal (se abren/cierran con la clase `abierto`).
const bindModal = (id) => {
  const el = document.getElementById(id); if (!el) return;
  let handle = null;
  const sync = () => {
    const open = el.classList.contains('open');
    if (open && !handle) handle = nav.open(() => el.classList.remove('open'));
    else if (!open && handle) { const h = handle; handle = null; h.close(); }
  };
  new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['class'] });
  sync();
};
['modalGlossary', 'endModal'].forEach(bindModal);
// Vista de juego como "página" sobre el mapa: volver regresa al mapa.
const vj = document.getElementById('gameView');
if (vj) {
  let vh = null;
  const syncV = () => {
    const on = vj.classList.contains('active');
    if (on && !vh) vh = nav.open(() => document.getElementById('btnMapTop')?.click());
    else if (!on && vh) { const h = vh; vh = null; h.close(); }
  };
  new MutationObserver(syncV).observe(vj, { attributes: true, attributeFilter: ['class'] });
  syncV();
}

// Si el almacén no abre, la partida sigue pero NO se guarda: se dice (store.js, sin repliegue).
import('./store.js').then(({ onStoreProblem }) => onStoreProblem(async () => {
  const [{ toast }, { tr }] = await Promise.all([import('./levels.js'), import('./i18n.js')]);
  toast('⚠ ' + tr('storeProblem'), 8000);
}));
