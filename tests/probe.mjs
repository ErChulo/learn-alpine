/* =============================================================================
 * probe.mjs — a single-cell debugger for authoring content.
 *
 *   node tests/probe.mjs m06 s2            # run the published solution
 *   node tests/probe.mjs m06 s2 --starter  # run the starter instead
 *   node tests/probe.mjs m06 e1            # the exercise cell
 *
 * Prints the code, then every check's verdict and detail, then anything the
 * sandbox logged. Use it when tests/e2e.mjs reports "t2=fail" without saying why.
 * ========================================================================== */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { readFileSync } from 'node:fs'

const [, , mod, unit, ...rest] = process.argv
if (!mod || !unit) { console.error('usage: node tests/probe.mjs <module> <unit> [--starter]'); process.exit(2) }
const useStarter = rest.includes('--starter')
const fileArg = rest.find(r => r.startsWith('--file='))
const evalArg = rest.find(r => r.startsWith('--evalfile='))
const evalSrc = evalArg ? readFileSync(evalArg.split('=')[1], 'utf8') : null
const codeOverride = fileArg ? readFileSync(fileArg.split('=')[1], 'utf8') : null
const PORT = Number(process.env.PROBE_PORT || 5198)

const server = spawn('node', ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' })
await sleep(600)

const browser = await chromium.launch()
const page = await browser.newPage()
const logs = []
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`))

await page.goto(`http://127.0.0.1:${PORT}/#/m/${mod}`, { waitUntil: 'load' })
await page.waitForFunction(() => !!document.querySelector('.workbook'), null, { timeout: 20000 })

const started = await page.evaluate(async ({ unit, useStarter, codeOverride }) => {
  const cells = [...document.querySelectorAll('.workbook')]
  const el = cells.find(el => { const c = el.__wb && el.__wb.cfg; return c && (c.unitId === unit || c.unitKey === `${c.moduleId}.${unit}`) })
  if (!el) return { error: `no cell for unit "${unit}" (${cells.length} cells on the page)` }
  const wb = el.__wb
  const code = codeOverride || (useStarter ? wb.cfg.starter : wb.cfg.solution)
  wb.code = code
  await wb.ws.reload(code)
  return { code, mode: wb.cfg.mode || 'provided', tasks: (wb.cfg.tasks || []).length }
}, { unit, useStarter, codeOverride })
if (started.error) { console.error(started.error); await browser.close(); server.kill(); process.exit(1) }

console.log(`\n▸ ${mod}.${unit}  (${started.tasks} task(s), mode ${started.mode})\n${'-'.repeat(70)}`)
console.log(started.code)
console.log('-'.repeat(70))

if (evalSrc) {
  const result = await page.evaluate(async ({ unit, src }) => {
    const cells = [...document.querySelectorAll('.workbook')]
    const el = cells.find(el => el.__wb && el.__wb.cfg.unitId === unit)
    const wb = el.__wb
    await wb.ws.reload(wb.code)
    const doc = wb.ws.iframe.contentDocument
    const win = wb.ws.iframe.contentWindow
    const fn = new Function('doc', 'win', 'wb', `return (async () => { ${src} })()`)
    try { return { ok: true, value: await fn(doc, win, wb) } } catch (e) { return { ok: false, err: e.message } }
  }, { unit, src: evalSrc })
  console.log('\n=== eval ===')
  console.log(JSON.stringify(result, null, 1))
  await browser.close(); server.kill(); process.exit(0)
}

const out = await page.evaluate(async ({ unit }) => {
  const cells = [...document.querySelectorAll('.workbook')]
  const el = cells.find(el => { const c = el.__wb && el.__wb.cfg; return c && c.unitId === unit })
  const wb = el.__wb
  const all = wb.allChecks
  const p1 = all.filter(c => (c.phase || 1) === 1)
  const p2 = all.filter(c => (c.phase || 1) === 2)
  let res = p1.length ? await wb.ws.run(p1, { source: wb.code }) : []
  if (p2.length) { await wb.ws.reload(wb.code); res = res.concat(await wb.ws.run(p2, { source: wb.code })) }
  return res
}, { unit })

if (rest.includes('--trace')) {
  const specs = await page.evaluate(({ unit }) => {
    const cells = [...document.querySelectorAll('.workbook')]
    const wb = cells.find(el => el.__wb && el.__wb.cfg.unitId === unit).__wb
    return wb.allChecks.map(c => JSON.parse(JSON.stringify(c)))
  }, { unit })
  const trace = await page.evaluate(async ({ unit, specs }) => {
    const cells = [...document.querySelectorAll('.workbook')]
    const wb = cells.find(el => el.__wb && el.__wb.cfg.unitId === unit).__wb
    await wb.ws.reload(wb.code)
    const rows = []
    for (const spec of specs) {
      const [res] = await wb.ws.run([{ ...spec, id: 'probe', taskId: 'probe' }], { source: wb.code })
      const doc = wb.ws.iframe && wb.ws.iframe.contentDocument
      const dump = []
      if (doc) {
        const sels = [spec.selector, ...(spec.do || []).map(a => a.click || a.type || a.key || a.el || a.dispatch || a.set).filter(Boolean)]
        for (const sel of sels) {
          try {
            const els = [...doc.querySelectorAll(sel)]
            dump.push(`${sel} → ${els.length ? els.slice(0, 3).map(e => (e.outerHTML || '').replace(/\s+/g, ' ').slice(0, 220)).join('  ⏐  ') : 'NO MATCH'}`)
          } catch (e) { dump.push(sel + ' → ' + e.message) }
        }
      }
      let extra = null
      if (doc) {
        try {
          const probeEl = doc.querySelector(spec.selector || 'body')
          const root = probeEl && (probeEl.closest('[x-data]') || probeEl.parentElement)
          extra = {
            root_html: root ? root.outerHTML.replace(/\s+/g, ' ').slice(0, 160) : null,
            root_isShown: root ? String(root._x_isShown) : null,
            root_ow: root ? root.offsetWidth : null,
            root_oh: root ? root.offsetHeight : null,
            win_alpine: doc.defaultView ? String(!!doc.defaultView.Alpine) : null,
            doc_hasListener: null
          }
        } catch (e) { extra = { err: e.message } }
      }
      rows.push({ check: `${spec.taskId}/${spec.kind} ${spec.selector || ''} ${spec.nth !== undefined ? '#' + spec.nth : ''}`, verdict: res.status, detail: res.detail, dump, extra })
    }
    return rows
  }, { unit, specs })
  console.log('\n=== trace ===')
  for (const r of trace) {
    console.log(`  ${r.verdict === 'pass' ? '✓' : '✗'} ${r.check} — ${r.detail}`)
    for (const d of r.dump) console.log(`      ${d}`)
    if (r.extra) console.log('      · ' + JSON.stringify(r.extra))
  }
}

if (!out.length) console.log('\n(no checks were returned — is the sandbox alive?)')
for (const r of out) {
  const mark = r.status === 'pass' ? '✓' : r.status === 'skip' ? '·' : '✗'
  console.log(`  ${mark} ${r.taskId}/${r.id || ''} ${r.kind || ''} — ${r.detail}`)
}
if (logs.length) { console.log('\nsandbox logs:'); for (const l of logs.slice(0, 12)) console.log('  ' + l) }

await browser.close()
server.kill()
