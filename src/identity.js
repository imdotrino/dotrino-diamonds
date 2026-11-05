// Singleton del vault de identidad id.dotrino.com. Best-effort: si no carga, el
// juego sigue jugándose offline (los referidos simplemente no se reportan).
import { Identity } from '@dotrino/identity';

/** @type {Promise<Identity | null> | null} */
let _idPromise = null;

/**
 * Instancia compartida de identidad (null si el vault no responde).
 * @returns {Promise<Identity | null>}
 */
export function getIdentity () {
  // Hook SOLO para E2E: si la página inyectó un vault de prueba, se usa ese.
  const testVault = /** @type {{ __TEST_VAULT_PROMISE__?: Promise<Identity | null> }} */ (globalThis).__TEST_VAULT_PROMISE__;
  if (testVault) { _idPromise = testVault; return _idPromise; }
  if (!_idPromise) {
    _idPromise = Identity.connect()
      .then(id => id)
      .catch(e => { console.warn('Identity vault unreachable:', e); return null; });
  }
  return _idPromise;
}
