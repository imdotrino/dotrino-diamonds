import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'

// base './' → rutas relativas, para servir bajo el subdominio diamonds.dotrino.com
// (y también bajo el mirror dotrino.github.io/diamonds/). Los assets PWA viven
// en public/ y se copian tal cual a la raíz de dist/.
// <meta name="commit"> con el hash del commit del build (CONVENCIONES-APPS §3).
function commitMeta () {
  let hash = 'dev'
  try { hash = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* sin git */ }
  return {
    name: 'commit-meta',
    transformIndexHtml: (html) =>
      html.replace('</head>', `  <meta name="commit" content="${hash}" />
  </head>`),
  }
}

export default defineConfig({
  plugins: [commitMeta()],
  base: './',
  server: { port: 3300, host: true }
})
