/* =============================================================================
 * standalone.mjs (test) — verifies the single-file build actually works when it
 * is opened straight from disk: file://, no server, no vendor/ folder.
 *
 *   node tests/standalone.mjs [--headed]
 * ========================================================================== */

import { chromium } from 'playwright'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { stat } from 'node:fs/promises'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const argFile = process.argv.find(a => a.startsWith('--file='))
const FILE = argFile ? argFile.slice('--file='.length) : join(root, 'learn-alpine.html')

let pass = 0, fail = 0
const failures = []
const check = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${label}`) } else {
    fail++; failures.push(`${label}${extra ? ' — ' + extra : ''}`)
    console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`)
  }
}

const info = await stat(FILE).catch(() => null)
if (!info) {
  console.error('learn-alpine.html is missing — run `node scripts/standalone.mjs` first.')
  process.exit(1)
}
console.log(`\n▸ opening ${(info.size / 1024 / 1024).toFixed(1)} MB single file from file://`)

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('pageerror: ' + e.message))

try {
  await page.goto(pathToFileURL(FILE).href, { waitUntil: 'load' })

  /* ------------------------------------------------------------ dashboard */
  console.log('\n▸ dashboard')
  await page.waitForSelector('.gauge svg', { timeout: 20000 })
  check(await page.locator('.nav a[href^="#/m/"]').count() === 18, 'the sidebar lists all 18 modules')
  check(await page.locator('a.card[href^="#/m/"]').count() === 18, 'the dashboard grid lists 18 modules')
  check(await page.locator('text=mastery / 100').first().isVisible(), 'the mastery gauge renders')

  /* ------------------------------------- an ordinary module (bundled Alpine) */
  console.log('\n▸ m02 (sandbox uses the bundled Alpine)')
  await page.goto(pathToFileURL(FILE).href + '#/m/m02', { waitUntil: 'load' })
  await page.waitForFunction(() => {
    const h = document.querySelector('#view h1')
    return !!h && !/^\s*Loading/.test(h.textContent)
  }, null, { timeout: 20000 })
  await page.evaluate(() => document.querySelectorAll('button.step-head').forEach(b => {
    if (b.getAttribute('aria-expanded') !== 'true') b.click()
  }))
  await page.waitForTimeout(300)
  const ordinary = await page.evaluate(async () => {
    const out = []
    for (const cell of document.querySelectorAll('.workbook')) {
      const wb = cell.__wb
      if (!wb || !wb.cfg.solution) continue
      wb.code = wb.cfg.solution
      wb.results = {}
      await wb.ws.reload(wb.code)
      await wb.run()
      out.push({ unit: wb.cfg.unitKey, tasks: wb.cfg.tasks.map(t => `${t.id}=${wb.results[t.id]?.status}`), alpine: wb.ws.alpineVersion })
    }
    return out
  })
  for (const r of ordinary) {
    check(r.tasks.every(t => t.endsWith('=pass')), `${r.unit} passes offline`, r.tasks.join(' '))
  }

  /* --------------------- the raw-mode lesson: <script src="./vendor/…"> tags */
  console.log('\n▸ m01 (raw mode: the lesson loads Alpine itself)')
  await page.goto(pathToFileURL(FILE).href + '#/m/m01', { waitUntil: 'load' })
  await page.waitForFunction(() => {
    const h = document.querySelector('#view h1')
    return !!h && !/^\s*Loading/.test(h.textContent)
  }, null, { timeout: 20000 })
  await page.evaluate(() => document.querySelectorAll('button.step-head').forEach(b => {
    if (b.getAttribute('aria-expanded') !== 'true') b.click()
  }))
  await page.waitForTimeout(300)
  const raw = await page.evaluate(async () => {
    const out = []
    for (const cell of document.querySelectorAll('.workbook')) {
      const wb = cell.__wb
      if (!wb || !wb.cfg.solution) continue
      wb.code = wb.cfg.solution
      wb.results = {}
      await wb.ws.reload(wb.code)
      await wb.run()
      out.push({
        unit: wb.cfg.unitKey,
        mode: wb.cfg.mode,
        notice: wb.ws.fallbackNotice || '',
        tasks: wb.cfg.tasks.map(t => `${t.id}=${wb.results[t.id]?.status}`),
        detail: wb.cfg.tasks.map(t => `${t.id}: ${wb.results[t.id]?.detail || 'ok'}`)
      })
    }
    return out
  })
  for (const r of raw) {
    check(r.tasks.every(t => t.endsWith('=pass')), `${r.unit} (${r.mode}) passes offline`, r.detail.join(' | '))
  }
  console.log(`  ${raw.some(r => r.notice) ? '✓' : '·'} fallback notice: ${(raw.find(r => r.notice) || {}).notice || '(the vendor files resolved)'}`)

  /* ----------------------------------------------------------- quiz battery */
  console.log('\n▸ quiz + reference')
  await page.goto(pathToFileURL(FILE).href + '#/cheatsheet', { waitUntil: 'load' })
  await page.waitForSelector('table.data tbody tr', { timeout: 15000 })
  const rows = await page.locator('table.data tbody tr').count()
  check(rows >= 100, `the cheatsheet renders its full table (${rows} rows)`)
  await page.fill('input[type=search]', '$persist')
  await page.waitForTimeout(250)
  const filtered = await page.locator('table.data tbody tr').count()
  check(filtered > 0 && filtered < rows, `the cheatsheet search filters (${filtered} rows for "$persist")`)
  await page.goto(pathToFileURL(FILE).href + '#/calculator', { waitUntil: 'load' })
  await page.waitForTimeout(600)
  check(await page.locator('#view').count() > 0, 'the actuarial toolkit renders')

  await page.goto(pathToFileURL(FILE).href + '#/quiz', { waitUntil: 'load' })
  await page.waitForTimeout(800)
  const quizItems = await page.locator('.q').count()
  check(quizItems > 0, `the quiz battery renders (${quizItems} items on the first page)`)
  const scored = await page.evaluate(async () => {
    let right = 0, total = 0
    for (const el of document.querySelectorAll('.q')) {
      const qi = el.__qi
      if (!qi || !qi.cfg) continue
      qi.state = ''
      if (qi.cfg.type === 'mc') { qi.pick = qi.cfg.answer; qi.submit() }
      else if (qi.cfg.type === 'multi') { qi.multi = {}; qi.cfg.answers.forEach(i => { qi.multi[i] = true }); qi.submit() }
      else { qi.text = qi.cfg.accept[0]; qi.submit() }
      total++
      if (qi.state === 'right') right++
    }
    return { right, total }
  })
  check(scored.total > 0 && scored.right === scored.total, `every marked answer scores (${scored.right}/${scored.total})`)

  /* ----------------------------------------------------------- storage truth */
  const st = await page.evaluate(() => ({
    persistent: !!window.localStorage,
    stored: Object.keys(window.localStorage || {}).filter(k => k.startsWith('learn-alpine')).length
  }))
  console.log(`  ${st.persistent ? '✓' : '·'} localStorage from file://: ${st.persistent ? 'available' : 'blocked (progress would live in memory)'} — ${st.stored} learn-alpine key(s)`)

  // m01's raw-mode lesson deliberately points at ./vendor/alpine/… — in a
  // single-file distribution those paths do not exist, and the sandbox falls
  // back to the inlined copies. That 404 is part of the lesson, not a defect.
  const realErrors = errors.filter(e => !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(e))
  check(realErrors.length === 0, 'no unexpected console errors anywhere in the run', realErrors.slice(0, 3).join(' | '))
} catch (e) {
  fail++
  failures.push('harness error: ' + e.message)
  console.log('\nFAIL (harness error) — ' + e.message)
} finally {
  await browser.close()
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} assertions passed, ${fail} failed`)
if (failures.length) console.log('\nFailures:\n' + failures.map(f => '  · ' + f).join('\n'))
process.exit(fail === 0 ? 0 : 1)
