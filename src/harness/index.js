/* =============================================================================
 * harness — the runtime injected into every exercise sandbox (a sandboxed
 * iframe). It owns a real Alpine 3.17.4 instance plus every official plugin,
 * exposes the assertion engine, and answers the parent app over postMessage.
 *
 * Message protocol (parent → sandbox)
 *   { la:1, type:'run',    id, checks:[…], source }   run assertions, reply results
 *   { la:1, type:'logs',   id }                       reply with captured errors
 *   { la:1, type:'echo',   id }                       liveness ping
 * sandbox → parent
 *   { la:1, type:'ready',  version, mode, alpine }
 *   { la:1, type:'result', id, results:[…] }
 *   { la:1, type:'logs',   id, logs:[…] }
 *   { la:1, type:'error',  message }
 *   { la:1, type:'fallback', message }
 * ========================================================================== */

import AlpineCore from 'alpinejs'
import mask from '@alpinejs/mask'
import intersect from '@alpinejs/intersect'
import persist from '@alpinejs/persist'
import resize from '@alpinejs/resize'
import collapse from '@alpinejs/collapse'
import focus from '@alpinejs/focus'
import morph from '@alpinejs/morph'
import anchor from '@alpinejs/anchor'
import sort from '@alpinejs/sort'
import { runChecks } from '../lib/checks.js'

const VERSION = '3.17.4'
const PLUGINS = { mask, intersect, persist, resize, collapse, focus, morph, anchor, sort }
const opts = window.__LA_OPTS || { mode: 'provided', vendor: './vendor/alpine' }
const parent = window.parent || window

const send = (msg) => { try { parent.postMessage({ la: 1, ...msg }, '*') } catch (e) { /* opaque parent */ } }

/* ------------------------------------------------------- error capture ----- */
const logs = []
function capture(kind, args) {
  const line = args.map(a => {
    if (a instanceof Error) return a.message
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }).join(' ')
  logs.push({ kind, line, at: Date.now() })
  if (logs.length > 60) logs.shift()
}
window.addEventListener('error', e => capture('error', [e.message || 'script error']))
window.addEventListener('unhandledrejection', e => capture('rejection', [e.reason && e.reason.message || e.reason]))
const _err = console.error.bind(console)
console.error = (...a) => { capture('console.error', a); _err(...a) }
const _warn = console.warn.bind(console)
console.warn = (...a) => { capture('console.warn', a); _warn(...a) }

/* -------------------------------------------------------------- bootstrap --- */
let started = false
let pluginsRegistered = false

function registerPlugins() {
  if (pluginsRegistered) return
  Object.values(PLUGINS).forEach(p => AlpineCore.plugin(p))
  pluginsRegistered = true
}

/**
 * Boots the sandbox exactly once.
 *  provided mode → we own Alpine: register the plugins, then start.
 *  raw mode      → the learner's own <script> tags own Alpine; if they loaded,
 *                  we touch nothing. If they did not, we degrade gracefully so
 *                  the preview still works and tell them so.
 */
function start({ force = false } = {}) {
  if (started) return
  started = true
  try {
    const learnerAlpine = window.Alpine && window.Alpine !== AlpineCore
    if (learnerAlpine && !force) {
      send({ type: 'ready', version: window.Alpine.version, mode: opts.mode, alpine: true, by: 'page' })
      return
    }
    registerPlugins()
    if (!window.Alpine) window.Alpine = AlpineCore
    try { window.Alpine.start() } catch (e) { capture('start', [e]) }
    afterInit(() => send({ type: 'ready', version: window.Alpine.version || VERSION, mode: opts.mode, alpine: true, by: force ? 'fallback' : 'harness' }))
  } catch (err) {
    capture('start', [err])
    send({ type: 'ready', version: VERSION, mode: opts.mode, alpine: false, message: String((err && err.message) || err) })
  }
}

/**
 * Runs `cb` once Alpine has finished initialising the page — *not* when
 * start() returns, which is before every element has been walked. Checks that
 * click a button two milliseconds after boot must not race the initialiser.
 */
function afterInit(cb) {
  let done = false
  const fire = () => { if (done) return; done = true; cb() }
  const cap = setTimeout(fire, 400)
  const listen = () => {
    document.addEventListener('alpine:initialized', () => { clearTimeout(cap); fire() }, { once: true })
  }
  if (window.Alpine && typeof window.Alpine.nextTick === 'function') {
    window.Alpine.nextTick(() => { listen(); setTimeout(fire, 300) })
  } else listen()
}

/** Load vendored plugin builds first, then the core (which self-starts). */
function injectFallback(done) {
  const files = ['mask.min.js', 'intersect.min.js', 'persist.min.js', 'resize.min.js', 'collapse.min.js',
                 'focus.min.js', 'morph.min.js', 'anchor.min.js', 'sort.min.js', 'cdn.min.js']
  let i = 0
  const next = () => {
    if (i >= files.length) return done()
    const s = document.createElement('script')
    s.src = opts.vendor + '/' + files[i++]
    s.onload = next
    s.onerror = next
    document.head.appendChild(s)
  }
  next()
}

window.__LA = {
  version: VERSION,
  Alpine: AlpineCore,
  plugins: PLUGINS,
  runChecks,
  logs,
  start: () => start()
}

if (opts.mode === 'raw') {
  // The page is expected to load Alpine itself. Give it a moment, then check.
  const kick = () => setTimeout(() => {
    if (window.Alpine && window.Alpine.version) start()
    else {
      send({ type: 'fallback', message: 'No Alpine found on the page: check your <script> tags (path, order, defer). The sandbox loaded its own copy so the preview still works.' })
      injectFallback(() => start({ force: true }))
    }
  }, 450)
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', kick)
  else kick()
} else {
  // Give the learner a live Alpine global, so their own <script> blocks can call
  // Alpine.data() / Alpine.store() / Alpine.magic() before initialisation.
  window.Alpine = AlpineCore
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => start())
  else start()
}

/* ------------------------------------------------------------------ channel -- */
async function ls0() {
  try { return window.localStorage } catch (e) { return null }
}

window.addEventListener('message', async (ev) => {
  const msg = ev.data
  if (!msg || msg.la !== 1) return

  if (msg.type === 'echo') return send({ type: 'echo', id: msg.id, version: VERSION })

  if (msg.type === 'logs') return send({ type: 'logs', id: msg.id, logs })

  if (msg.type === 'run') {
    const results = await runChecks(
      { doc: document, win: window, source: msg.source || '', ls: await ls0() },
      msg.checks || []
    )
    send({ type: 'result', id: msg.id, results, logs })
  }
})

send({ type: 'hello', version: VERSION, mode: opts.mode })
