/* =============================================================================
 * pages.mjs (test) — proves the course works when it is NOT served from the
 * domain root, which is exactly what https://<user>.github.io/learn-alpine/
 * does. It copies the publishable files into a temp folder one level down,
 * serves that folder, and drives the app through the subpath.
 *
 *   node tests/pages.mjs [--port=5193]
 * ========================================================================== */

import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, mkdir, rm, cp, stat } from 'node:fs/promises'
import { join, dirname, extname, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = '/tmp/learn-alpine-pages'          // served folder (the "repo")
const SUB = 'learn-alpine'                      // the subpath GitHub Pages uses
const PORT = Number((process.argv.find(a => a.startsWith('--port=')) || '').slice(7) || 5193)

let pass = 0, fail = 0
const failures = []
const check = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${label}`) } else {
    fail++; failures.push(`${label}${extra ? ' — ' + extra : ''}`)
    console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`)
  }
}

/* --------------------------------------------------- a "deployed" copy ---- */
const SHIP = ['index.html', 'styles.css', 'assets', 'fonts', 'vendor', 'learn-alpine.html', '.nojekyll', 'LICENSE']
await rm(SITE, { recursive: true, force: true })
await mkdir(join(SITE, SUB), { recursive: true })
for (const item of SHIP) {
  const from = join(root, item)
  if (!(await stat(from).catch(() => null))) continue
  await cp(from, join(SITE, SUB, item), { recursive: true })
}
console.log(`\n▸ serving ${SITE}/${SUB} (a subpath, like GitHub Pages)`)

/* ------------------------------------------------------------- server ----- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain' }
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
    let path = decodeURIComponent(url.pathname)
    if (path.endsWith('/')) path += 'index.html'
    const target = resolve(join(SITE, normalize(path)))
    if (!target.startsWith(SITE)) { res.writeHead(403).end('forbidden'); return }
    const body = await readFile(target)
    res.writeHead(200, { 'content-type': TYPES[extname(target)] || 'application/octet-stream' }).end(body)
  } catch (e) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
  }
})
await new Promise(r => server.listen(PORT, '127.0.0.1', r))

const BASE = `http://127.0.0.1:${PORT}/${SUB}`
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
const missing = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
page.on('response', r => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`) })

try {
  /* --------------------------------------------------------- dashboard ---- */
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForSelector('.gauge svg', { timeout: 20000 })
  check(await page.locator('.nav a[href^="#/m/"]').count() === 18, 'the dashboard loads from a subpath')
  check(await page.locator('.brand svg.logo').isVisible(), 'the inlined logo renders')

  /* a real module, through the subpath, with real fonts */
  await page.goto(BASE + '/#/m/m05', { waitUntil: 'load' })
  await page.waitForFunction(() => {
    const h = document.querySelector('#view h1')
    return !!h && !/^\s*Loading/.test(h.textContent)
  }, null, { timeout: 20000 })
  await page.evaluate(() => document.querySelectorAll('button.step-head').forEach(b => {
    if (b.getAttribute('aria-expanded') !== 'true') b.click()
  }))
  await page.waitForTimeout(300)
  const cells = await page.evaluate(async () => {
    const out = []
    for (const cell of document.querySelectorAll('.workbook')) {
      const wb = cell.__wb
      if (!wb || !wb.cfg.solution) continue
      wb.code = wb.cfg.solution
      wb.results = {}
      await wb.ws.reload(wb.code)
      await wb.run()
      out.push({ unit: wb.cfg.unitKey, tasks: wb.cfg.tasks.map(t => `${t.id}=${wb.results[t.id]?.status}`) })
    }
    return out
  })
  for (const c of cells) check(c.tasks.every(t => t.endsWith('=pass')), `${c.unit} runs from the subpath`, c.tasks.join(' '))

  /* fonts must actually resolve — a missing woff2 would show up as a 404 */
  const fontOk = await page.evaluate(async () => {
    try { await document.fonts.ready } catch (e) { /* older browsers */ }
    return Array.from(document.fonts).some(f => f.status === 'loaded')
  })
  check(fontOk, 'the reading fonts load from ./fonts/')

  /* reference + quiz, then a hard look at the network log */
  await page.goto(BASE + '/#/cheatsheet', { waitUntil: 'load' })
  await page.waitForSelector('table.data tbody tr', { timeout: 15000 })
  check(await page.locator('table.data tbody tr').count() >= 100, 'the cheatsheet renders from the subpath')

  const bad = missing.filter(u => !/favicon/.test(u))
  check(bad.length === 0, 'every asset resolves under the subpath (no 404s)', bad.slice(0, 4).join(' | '))
  check(errors.length === 0, 'no console errors from the subpath deployment', errors.slice(0, 3).join(' | '))
} catch (e) {
  fail++
  failures.push('harness error: ' + e.message)
  console.log('\nFAIL (harness error) — ' + e.message)
} finally {
  await browser.close()
  server.close()
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} assertions passed, ${fail} failed`)
if (failures.length) console.log('\nFailures:\n' + failures.map(f => '  · ' + f).join('\n'))
process.exit(fail === 0 ? 0 : 1)
