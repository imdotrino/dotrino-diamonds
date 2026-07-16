// Cableado de <dotrino-topbar> (§5 + §6.1). El componente compartido es el dueño
// del header y del modal "Mi perfil": la app solo le pasa los pilares que ya
// maneja (identidad del vault + reputación) por propiedad JS, y el tema.
// El idioma lo manda ÉL: nos llega de vuelta por el evento 'dotrino-lang'.
import { getIdentity } from '../identity.js';
import { getReputation } from '../reputation.js';
import { setLang } from '../i18n.js';
import { aplicarIdioma } from './hud.js';

/** Tema del modal de perfil, acorde a la paleta oscura de Diamonds. */
const PROFILE_THEME = {
  '--ccp-bg': '#0b1220', '--ccp-bg-2': '#111c33', '--ccp-bg-3': '#16233d', '--ccp-bg-4': '#1c2b48',
  '--ccp-border': 'rgba(148,163,184,.22)', '--ccp-text': '#e2e8f0', '--ccp-muted': '#94a3b8',
  '--ccp-accent': '#22d3ee', '--ccp-accent-2': '#0891b2', '--ccp-accent-text': '#06283d',
  '--ccp-gold': '#fbbf24', '--ccp-derived': '#d9a441',
  '--ccp-online': '#34d399', '--ccp-affinity': '#38bdf8',
  '--ccp-input-bg': '#0f1a2e', '--ccp-radius': '14px',
};

export const topbar = () => document.querySelector('dotrino-topbar');

/**
 * Enchufa identidad + reputación al topbar (para el botón/modal de perfil) y
 * hace del evento 'dotrino-lang' la fuente de verdad del idioma de la app.
 * Best-effort: sin vault, el juego sigue jugándose igual (solo no hay perfil).
 */
export function initTopbar () {
  const tb = topbar();
  if (!tb) return;

  tb.profileTheme = PROFILE_THEME;

  // El topbar persiste el idioma en 'dotrino.lang' y avisa; la app se re-pinta.
  tb.addEventListener('dotrino-lang', (e) => {
    const l = e.detail && e.detail.lang;
    if (l !== 'es' && l !== 'en') return;
    setLang(l);
    aplicarIdioma();
    // <dotrino-install> vive en el light DOM: el lang se le pasa a mano.
    tb.querySelector('dotrino-install')?.setAttribute('lang', l);
  });
  tb.querySelector('dotrino-install')?.setAttribute('lang', document.documentElement.lang || 'es');

  getIdentity().then(async (id) => {
    if (!id) return;                    // sin vault: el botón no abre nada
    tb.identity = id;
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
  const aplicar = () => tb.shadowRoot.querySelector('dotrino-support')?.setAttribute('share-url', link);
  aplicar();
  new MutationObserver(aplicar).observe(tb.shadowRoot, { childList: true });
}
