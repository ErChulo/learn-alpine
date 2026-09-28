/* =============================================================================
 * runner — parent-side workshop. Each exercise (and free workshop "cell") owns
 * one of these. It compiles the learner's markup into a sandboxed iframe
 * (srcdoc), talks to the harness over postMessage, and reports results.
 *
 * Why an iframe + postMessage instead of live DOM injection?
 *  - learner CSS/JS stays isolated from the course UI,
 *  - it keeps working from file://, from GitHub Pages, and inside a
 *    sandboxed preview iframe where window access to child documents is denied.
 * ========================================================================== */

import { esc } from './utils.js'

const HARNESS = () => window.__LA_HARNESS_SRC || ''

const BASE_CSS = `
  :root { color-scheme: dark; }
  body { margin: 0; padding: 14px; background: #0b111f; color: #e9eefb;
         font: 15px/1.65 'Lexend', system-ui, sans-serif; letter-spacing:.01em; word-spacing:.06em; }
  h1,h2,h3,h4 { line-height:1.3; margin:.2em 0 .5em; }
  p { margin:.4em 0; }
  button, input, select, textarea { font: inherit; color:#e9eefb; background:#16203a; border:1px solid #253253;
      border-radius:8px; padding:7px 10px; min-height:34px; }
  button { cursor:pointer; }
  button:hover { background:#23325a; }
  table { border-collapse:collapse; }
  th, td { border-bottom:1px solid #1d2845; padding:5px 8px; text-align:left; }
  th { color:#c3cee5; font-weight:600; font-size:.85em; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; background:#0b1223; border:1px solid #1d2845;
      border-radius:5px; padding:0 5px; }
  pre { background:#080d19; border:1px solid #253253; border-radius:8px; padding:10px; overflow:auto; }
  ul, ol { padding-left:1.2rem; margin:.3em 0; }
  hr { border:0; border-top:1px solid #1d2845; margin:1rem 0; }
  .muted { color:#8f9cba; }
  [x-cloak] { display:none !important; }
  a { color:#7dd3fc; }
`

let cellSeq = 0
const live = new Set()

export class Workshop {
  /**
   * @param {object} o
   * @param {string} o.host        element that receives the iframe
   * @param {string} o.starter     initial markup
   * @param {'provided'|'raw'} o.mode
   * @param {string} o.vendor      path prefix for vendored alpine builds (raw mode)
   */
  constructor({ host, starter = '', mode = 'provided', vendor = './vendor/alpine' }) {
    this.id = `cell-${++cellSeq}`
    this.host = host
    this.mode = mode
    this.vendor = vendor
    this.iframe = null
    this.ready = false
    this.pending = new Map()
    this.logs = []
    this.submissions = 0
    this.source = starter
    live.add(this)
    this._boot()
  }

  /* ----------------------------------------------------------------- build */
  srcdoc(code) {
    const harness = HARNESS()
    const opts = JSON.stringify({ mode: this.mode, vendor: this.vendor })
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${BASE_CSS}</style>
<script>window.__LA_OPTS = ${opts};</script>
<script>${harness}</script>
</head><body>
${code}
<script>window.__LA && window.__LA.start && window.__LA.start();</script>
</body></html>`
  }

  _boot(code) {
    if (this.iframe) { this.iframe.remove(); this.iframe = null }
    this.ready = false
    const f = document.createElement('iframe')
    f.className = 'preview-frame'
    f.title = 'Exercise preview'
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals')
    f.srcdoc = this.srcdoc(code !== undefined ? code : this.source)
    this.host.replaceChildren(f)
    this.iframe = f
    this._ready = new Promise(res => { this._resolveReady = res })
    window.addEventListener('message', this._onMessage = (ev) => this._handle(ev))
  }

  _handle(ev) {
    const m = ev.data
    if (!m || m.la !== 1) return
    if (ev.source !== this.iframe?.contentWindow) return
    if (m.type === 'hello') return
    if (m.type === 'ready') {
      this.ready = true
      this.alpineVersion = m.version
      this._resolveReady && this._resolveReady(m)
      return
    }
    if (m.type === 'error') { this.logs.push({ kind: 'error', line: m.message }); return }
    if (m.type === 'fallback') { this.fallbackNotice = m.message; return }
    if (m.type === 'logs') {
      this.logs = m.logs || []
      const p = this.pending.get(m.id); if (p) { p.resolve(m.logs); this.pending.delete(m.id) }
      return
    }
    if (m.type === 'result') {
      this.logs = m.logs || this.logs
      const p = this.pending.get(m.id)
      if (p) { p.resolve(m.results); this.pending.delete(m.id) }
    }
  }

  /** Rebuild the sandbox with the given markup (a fresh page). */
  reload(code) {
    if (typeof code === 'string') this.source = code
    this._boot()
    return this.waitReady()
  }

  waitReady(ms = 4000) {
    return Promise.race([
      this._ready || Promise.resolve({}),
      new Promise(r => setTimeout(() => r({ timeout: true }), ms))
    ])
  }

  /** Send a batch of checks; returns [{id, taskId, status, detail}]. */
  async run(checks, { source = this.source } = {}) {
    await this.waitReady()
    const miss = (why) => checks.map(c => ({ id: c.id, taskId: c.taskId, status: 'fail', detail: why }))
    if (!this.iframe?.contentWindow) return miss('the sandbox is gone — press “restart preview”')
    const id = this.id + ':' + Math.random().toString(36).slice(2)
    const p = new Promise(res => this.pending.set(id, { resolve: res }))
    try {
      // Alpine hands us reactive proxies; structured-clone them into plain data
      // so postMessage can never fail with "could not be cloned".
      const payload = JSON.parse(JSON.stringify({ la: 1, type: 'run', id, checks, source }))
      this.iframe.contentWindow.postMessage(payload, '*')
    } catch (e) {
      return miss('could not reach the sandbox: ' + e.message)
    }
    const timeout = new Promise(res => setTimeout(() => res(null), 5000))
    const out = await Promise.race([p, timeout])
    return out || miss('the sandbox did not answer — look for a JavaScript error in your code')
  }

  errorSummary() {
    const errs = this.logs.filter(l => l.kind !== 'console.warn')
    return errs.length ? errs.slice(-3).map(l => l.line).join(' · ') : ''
  }

  destroy() {
    if (this._onMessage) window.removeEventListener('message', this._onMessage)
    this.iframe?.remove()
    live.delete(this)
  }

  /** The router calls this before swapping views, so no sandbox is orphaned. */
  static destroyAll() {
    for (const w of Array.from(live)) w.destroy()
  }
}

/** Split a check spec into the two submission phases used for persistence. */
export function phases(checks) {
  const one = [], two = []
  for (const c of checks) (c.phase === 2 ? two : one).push(c)
  return [one, two]
}
