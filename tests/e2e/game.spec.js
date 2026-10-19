import { test, expect } from '@playwright/test'

// 1) UI: el mapa se renderiza, se entra a un nivel y el HUD es correcto.
test('mapa → entrar al nivel 1 → HUD', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.clear() } catch {} })
  await page.goto('/')

  // El mapa está activo y hay al menos un nodo de nivel jugable.
  await expect(page.locator('#mapView')).toHaveClass(/active/)
  const node = page.locator('.level-node:not(.locked)').first()
  await expect(node).toBeVisible()

  // Tocar el nodo entra al juego (la lógica de "tap" del pan dispara su acción).
  // force: el nodo "actual" pulsa (animación) y nunca es "estable" para Playwright.
  await node.click({ force: true })
  await expect(page.locator('#gameView')).toHaveClass(/active/)
  await expect(page.locator('#hudLevel')).toHaveText('1·1')
  await expect(page.locator('#moves')).toHaveText('30')
  // Nivel 1 es de puntos: objetivo 1120 (600+320+200 redondeado a 10).
  await expect(page.locator('#objVal')).toHaveText('0/1120')
})

// 2) Motor determinista: generación sin matches iniciales, con jugadas posibles,
//    e idéntica para el mismo nivel (mismo seed) en dos corridas.
test('generación determinista del nivel (sin matches, hay jugadas, reproducible)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const { S } = await import('/src/state.js')
    const { levelDef } = await import('/src/rng.js')
    const { generateLevel } = await import('/src/engine/levelgen.js')
    const { hasMatches, hasMoves } = await import('/src/engine/matching.js')

    const snapshot = () => S.grid.map(row => row.map(g => g.type))

    S.def = levelDef(1); generateLevel();
    const dims = [S.grid.length, S.grid[0].length]
    const noMatches = !hasMatches()
    const hasPlays = hasMoves()
    const g1 = snapshot()

    S.def = levelDef(1); generateLevel();
    const g2 = snapshot()

    return { dims, noMatches, hasPlays, same: JSON.stringify(g1) === JSON.stringify(g2) }
  })

  expect(r.dims).toEqual([8, 8])
  expect(r.noMatches).toBe(true)
  expect(r.hasPlays).toBe(true)
  expect(r.same).toBe(true)
})
