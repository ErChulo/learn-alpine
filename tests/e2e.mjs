/* =============================================================================
 * e2e.mjs — the test that matters: it drives the real app in a real browser,
 * loads every published solution into every sandbox, and asserts that all of
 * that exercise's checks pass.
 *
 *   node tests/e2e.mjs            all modules
 *   node tests/e2e.mjs m01 m02    selected modules
 *   HEADED=1 node tests/e2e.mjs   watch it happen
 * ========================================================================== */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 5199)
const BASE = `http://127.0.0.1:${PORT}`
const only = process.argv.slice(2).filter(a => /^m\d\d$/.test(a))

let pass = 0, fail = 0
const failures = []
const check = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; failures.push(`${label}${extra ? ' — ' + extra : ''}`); console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`) }
}

const server = spawn(process.execPath, [join(root, 'scripts/serve.mjs'), String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 700))

const browser = await chromium.launch({ headless: !process.env.HEADED })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

const consoleErrors = []
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message + ' :: ' + String(e.stack || '').split('\n').slice(1, 4).join(' | ')))

try {
  /* ------------------------------------------------------------ dashboard */
  console.log('\n▸ dashboard')
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForSelector('.gauge svg', { timeout: 15000 })
  const moduleLinks = await page.locator('.nav a[href^="#/m/"]').count()
  check(moduleLinks === 18, 'the sidebar lists 18 modules', `saw ${moduleLinks}`)
  const cards = await page.locator('a.card[href^="#/m/"]').count()
  check(cards === 18, 'the dashboard grid lists 18 modules', `saw ${cards}`)
  check(await page.locator('text=mastery / 100').first().isVisible(), 'the mastery gauge renders')

  /* --------------------------------------------------------------- modules */
  const ids = only.length ? only : Array.from({ length: 18 }, (_, i) => 'm' + String(i + 1).padStart(2, '0'))
  for (const id of ids) {
    console.log(`\n▸ ${id}`)
    await page.goto(`${BASE}/#/m/${id}`, { waitUntil: 'load' })
    // the hash change happens after load; wait for the module heading
    await page.waitForFunction(() => {
      const h = document.querySelector('#view h1')
      return !!h && !/^\s*Loading/.test(h.textContent)
    }, null, { timeout: 15000 })
    const cells = await page.locator('.workbook').count()
    const quizItems = await page.locator('.q').count()
    console.log(`  ${cells} workbench cell(s), ${quizItems} quiz item(s)`)
    if (!cells) { console.log('  (stub — nothing to verify)'); continue }

    // Open every fold (a closed step has zero layout) and work through the
    // cells one at a time, keeping the sandbox in the viewport — some checks
    // depend on real visibility (x-intersect) and on real layout.
    await page.evaluate(() => {
      document.querySelectorAll('button.step-head').forEach(b => {
        if (b.getAttribute('aria-expanded') !== 'true') b.click()
      })
    })
    await page.waitForTimeout(200)
    const cellCount = await page.locator('.workbook').count()
    const results = []
    for (let i = 0; i < cellCount; i++) {
      await page.evaluate((idx) => {
        const cell = document.querySelectorAll('.workbook')[idx]
        const frame = cell && cell.querySelector('iframe')
        if (frame) frame.scrollIntoView({ block: 'center' })
        else if (cell) cell.scrollIntoView({ block: 'center' })
      }, i)
      await page.waitForTimeout(150)
      const r = await page.evaluate(async (idx) => {
        const cell = document.querySelectorAll('.workbook')[idx]
        const wb = cell && cell.__wb
        if (!wb || !wb.cfg.solution) return null
        wb.code = wb.cfg.solution
        wb.results = {}
        await wb.ws.reload(wb.code)
        await wb.run()
        return {
          unit: wb.cfg.unitKey,
          quiet: wb.ws.fallbackNotice || '',
          tasks: wb.cfg.tasks.map(t => ({ id: t.id, status: wb.results[t.id]?.status, detail: wb.results[t.id]?.detail }))
        }
      }, i)
      if (r) results.push(r)
    }

    for (const r of results) {
      const bad = r.tasks.filter(t => t.status !== 'pass')
      check(bad.length === 0, `${r.unit}: published solution passes ${r.tasks.length} task(s)`,
        bad.map(b => `${b.id}=${b.status} (${b.detail})`).join(' | '))
    }

    // Quiz items: click the correct answers and confirm they score.
    if (quizItems) {
      const quiz = await page.evaluate(async () => {
        const out = []
        for (const el of document.querySelectorAll('.q')) {
          const qi = el.__qi
          if (!qi || !qi.cfg) continue
          qi.state = ''
          qi.revealed = false
          qi.attempts = qi.attempts || 0
          if (qi.cfg.type === 'mc') { qi.pick = qi.cfg.answer; qi.submit() }
          else if (qi.cfg.type === 'multi') { qi.multi = {}; qi.cfg.answers.forEach(i => { qi.multi[i] = true }); qi.submit() }
          else { qi.text = qi.cfg.accept[0]; qi.submit() }
          out.push({ key: qi.cfg.key, state: qi.state })
        }
        return out
      })
      const wrong = quiz.filter(q => q.state !== 'right')
      check(wrong.length === 0, `${id}: the marked correct answers score`, wrong.map(w => w.key).join(', '))
    }
  }

  /* --------------------------------------------------------------- routes */
  console.log('\n▸ every route renders')
  for (const route of ['path', 'workshop', 'calculator', 'cheatsheet', 'insights', 'settings']) {
    const before = consoleErrors.length
    await page.goto(`${BASE}/#/${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(700)
    const text = await page.locator('#view').innerText().catch(() => '')
    const chunk = await page.evaluate(() => {
      const h = document.querySelector('#view h1, #view h2')
      return h ? h.textContent.trim() : ''
    })
    check(chunk.length > 2 && text.length > 60 && consoleErrors.length === before,
      `#/${route} renders ("${chunk.slice(0, 40)}")`,
      consoleErrors.slice(before).slice(0, 2).join(' | '))
  }

  /* ---------------------------------------------------------- quiz battery */
  console.log('\n▸ quiz battery')
  await page.goto(`${BASE}/#/quiz`, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  // The default filter is "still to do" — the module loop above has just marked
  // every item correct, so switch to "all" before counting.
  await page.click('.pill-tabs button:has-text("all")')
  await page.waitForTimeout(400)
  const battery = await page.locator('.q').count()
  check(battery > 40, `the quiz battery lists every item (${battery} rendered)`)
  if (battery) {
    const scored = await page.evaluate(() => {
      let right = 0, total = 0
      for (const el of document.querySelectorAll('.q')) {
        const qi = el.__qi
        if (!qi || !qi.cfg) continue
        qi.state = ''
        qi.revealed = false
        if (qi.cfg.type === 'mc') { qi.pick = qi.cfg.answer; qi.submit() }
        else if (qi.cfg.type === 'multi') { qi.multi = {}; qi.cfg.answers.forEach(i => { qi.multi[i] = true }); qi.submit() }
        else { qi.text = qi.cfg.accept[0]; qi.submit() }
        total++
        if (qi.state === 'right') right++
      }
      return { right, total }
    })
    check(scored.total > 40 && scored.right === scored.total, `every battery item marks its correct answer (${scored.right}/${scored.total})`)
  }

  /* ------------------------------------------------------------ cheatsheet */
  console.log('\n▸ cheatsheet')
  await page.goto(`${BASE}/#/cheatsheet`, { waitUntil: 'load' })
  await page.waitForSelector('table.data tbody tr', { timeout: 15000 })
  const rows = await page.locator('table.data tbody tr').count()
  check(rows >= 100, `the cheatsheet lists the full surface (${rows} rows)`)
  await page.fill('input[type=search]', '$persist')
  await page.waitForTimeout(250)
  const filtered = await page.locator('table.data tbody tr').count()
  check(filtered > 0 && filtered < rows, `search filters the table (${filtered} rows for "$persist")`)

  /* ------------------------------------------------------------- toolkit */
  console.log('\n▸ actuarial toolkit')
  await page.goto(`${BASE}/#/calculator`, { waitUntil: 'load' })
  await page.waitForSelector('[x-data="lifeCalc"]', { timeout: 15000 })
  await page.waitForTimeout(600)
  const calc = await page.evaluate(() => {
    const el = document.querySelector('[x-data="lifeCalc"]')
    const d = Alpine.$data(el)
    return { aDue: d.aDue, Aterm: d.Aterm, Aendow: d.Aendow, price: d.singlePremium }
  })
  check(calc.aDue > 10 && calc.aDue < 14, `life calculator annuity-due plausible (${calc.aDue?.toFixed(4)})`)
  check(calc.Aendow > calc.Aterm, `endowment insurance exceeds term insurance (${calc.Aendow?.toFixed(4)} > ${calc.Aterm?.toFixed(4)})`)
  const sim = await page.evaluate(async () => {
    const el = document.querySelector('[x-data="varSim"]')
    const d = Alpine.$data(el)
    d.trials = 2000
    d.run()
    return { var99: d.var99, expected: d.expected, sd: d.sd }
  })
  check(sim.var99 > sim.expected, `Monte Carlo VaR exceeds the mean (${Math.round(sim.var99)} > ${Math.round(sim.expected)})`)

  /* ------------------------------------------------------------ score flow */
  console.log('\n▸ scoring')
  // start from an empty slate so the score movement is unambiguous
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.evaluate(() => { try { localStorage.clear() } catch (e) {} })
  await page.reload({ waitUntil: 'load' })
  await page.goto(`${BASE}/#/m/m01`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelectorAll('.workbook').length > 0)
  const before = await page.evaluate(() => Alpine.store('course').score.mastery)
  await page.evaluate(async () => {
    const wb = document.querySelector('.workbook').__wb
    wb.code = wb.cfg.solution
    await wb.ws.reload(wb.code)
    await wb.run()
  })
  const after = await page.evaluate(() => Alpine.store('course').score.mastery)
  check(after > before, `passing tasks raises mastery (${before} → ${after})`)

  /* -------------------------------------------------------- no console noise */
  const noisy = consoleErrors.filter(t => !/favicon|404 \(Not Found\)/i.test(t))
  check(noisy.length === 0, 'no uncaught console errors during the run', noisy.slice(0, 3).join(' | '))
} catch (err) {
  fail++
  failures.push('harness error: ' + err.message)
  console.error('\n✗ ' + err.stack)
} finally {
  await browser.close()
  server.kill()
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} assertions passed, ${fail} failed`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log('  · ' + f)
}
process.exit(fail === 0 ? 0 : 1)
