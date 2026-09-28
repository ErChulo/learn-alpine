/* =============================================================================
 * serve.mjs — a zero-dependency static server bound to 0.0.0.0 so the course
 * works both locally and behind a sandbox preview proxy.
 *   node scripts/serve.mjs [port]
 * ========================================================================== */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const port = Number(process.env.PORT || process.argv[2] || 5173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    let path = decodeURIComponent(url.pathname)
    if (path.endsWith('/')) path += 'index.html'
    const target = resolve(join(root, normalize(path)))
    if (!target.startsWith(root)) { res.writeHead(403).end('forbidden'); return }
    const info = await stat(target).catch(() => null)
    const file = info && info.isDirectory() ? join(target, 'index.html') : target
    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    })
    res.end(body)
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 — ' + req.url)
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`learn-alpine served on http://0.0.0.0:${port}  (root: ${root})`)
})
