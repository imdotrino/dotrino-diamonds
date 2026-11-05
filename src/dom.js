// Helper de acceso al DOM por id (igual que el `$` del juego original).
// Sin el elemento no hay pantalla que pintar: se dice cuál falta en vez de leer `null`.
/**
 * @param {string} id
 * @returns {HTMLElement}
 */
export const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error('diamonds: #' + id + ' not found');
  return el;
};
