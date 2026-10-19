// Cableado de <dotrino-topbar> (§5 + §6.1). El componente compartido es el dueño
// del header y del modal "Mi perfil": la app solo le pasa los pilares que ya
// maneja (identidad del vault + reputación) por propiedad JS.
// El idioma lo manda ÉL: nos llega de vuelta por el evento 'dotrino-lang'.
import { getIdentity } from '../identity.js';
import { getReputation } from '../reputation.js';
import { setLang } from '../i18n.js';
import { applyLang } from './hud.js';

export const topbar = () => document.querySelector('dotrino-topbar');

/**
 * Enchufa identidad + reputación al topbar (para el botón/modal de perfil) y
 * hace del evento 'dotrino-lang' la fuente de verdad del idioma de la app.
 * Best-effort: sin vault, el juego sigue jugándose igual (solo no hay perfil).
 */
export function initTopbar () {
  const tb = topbar();
  if (!tb) return;

  // El topbar persiste el idioma en 'dotrino.lang' y avisa; la app se re-pinta.
  tb.addEventListener('dotrino-lang', (e) => {
    const l = e.detail && e.detail.lang;
    if (l !== 'es' && l !== 'en') return;
    setLang(l);
    applyLang();
    // <dotrino-install> vive en el light DOM: el lang se le pasa a mano.
    tb.querySelector('dotrino-install')?.setAttribute('lang', l);
  });
  tb.querySelector('dotrino-install')?.setAttribute('lang', document.documentElement.lang || 'es');

  getIdentity().then(async (id) => {
    if (!id) return;                    // sin vault: el botón no abre nada
    tb.identity = id;
    // El estado del respaldo en la bóveda, en el botón de perfil (topbar ≥ 0.13).
    import('../store.js').then(m => m.storeHandle()).then(s => { if (s) tb.store = s; }).catch(() => {});
    tb.reputation = await getReputation();
  }).catch(() => {});
}

/**
 * Enchufa el enlace de invitación al "compartir" de la moneda de support.
 * La moneda vive en el shadow DOM del topbar y éste la RECREA en cada render
 * (avatar del perfil, cambio de idioma), así que hay que re-aplicar el atributo.
 */
export function setShareUrl (link) {
  const tb = topbar();
  if (!tb || !tb.shadowRoot || !link) return;
  const apply = () => tb.shadowRoot.querySelector('dotrino-support')?.setAttribute('share-url', link);
  apply();
  new MutationObserver(apply).observe(tb.shadowRoot, { childList: true });
}
