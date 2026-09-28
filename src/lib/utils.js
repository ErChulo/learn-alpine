/* =============================================================================
 * utils — tiny, dependency-free helpers shared by the app and the sandbox.
 * ========================================================================== */

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Single-quoted JS string safe to drop inside an HTML attribute. */
export const attr = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/'/g, '\\u0027').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ')

/** JSON that is safe inside a single-quoted HTML attribute. */
export const jsonAttr = o => JSON.stringify(o ?? null)
  .replace(/&/g, '&amp;').replace(/'/g, '\\u0027').replace(/</g, '&lt;')

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
export const uid = () => Math.random().toString(36).slice(2, 9)
export const nowISO = () => new Date().toISOString()

/** Round to n decimals without float dust (0.30000000000000004 → 0.3). */
export function rnd(x, n = 4) {
  const f = Math.pow(10, n)
  return Math.round((Number(x) + Number.EPSILON) * f) / f
}

export const sum = a => a.reduce((x, y) => x + y, 0)

/** Normalise text for comparison: collapse whitespace, unify minus/en-space. */
export function norm(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Parse the first number out of a string: "₤1,234.50" → 1234.5 */
export function num(s) {
  const m = String(s ?? '').replace(/\u00a0/g, ' ').match(/-?\d[\d\s,._']*\d|\d/)
  if (!m) return NaN
  let raw = m[0].replace(/[\s'_]/g, '')
  // European style 1.234,56 → 1234.56
  if (/,\d{2}$/.test(raw) && /\./.test(raw)) raw = raw.replace(/\./g, '').replace(',', '.')
  else raw = raw.replace(/,/g, '')
  return parseFloat(raw)
}

/** Money/percent/life-table formatting used across the actuarial exercises. */
export const fmt = {
  money: (x, c = 'USD', d = 2) => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: d }).format(x) }
    catch { return String(rnd(x, d)) }
  },
  num: (x, d = 3) => Number.isFinite(x) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(x) : String(x),
  pct: (x, d = 2) => `${rnd(x * 100, d)}%`,
  yrs: (x, d = 2) => `${rnd(x, d)} yr`,
  signed: (x, d = 3) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(rnd(x, d))}`
}

export function debounce(fn, ms = 250) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

/** Deterministic PRNG (mulberry32) so generated actuarial data is reproducible. */
export function rng(seed = 42) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Simple markdown-lite for theory text: `code`, **bold**, [text](url), _accent_. */
export function mini(src) {
  let s = esc(src)
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, c) => `<strong>${c}</strong>`)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noreferrer">${t}</a>`)
  s = s.replace(/^\s*[-*]\s+(.*)$/gm, '· $1')
  return s
}

/** Very small HTML highlighter for Alpine markup (tags / attributes / strings). */
export function highlight(code) {
  let s = esc(code)
  s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-cmt">$1</span>')
  s = s.replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="tok-tag">$2</span>')
  s = s.replace(/(\s)([a-zA-Z_:][\w:.-]*)(=)/g, '$1<span class="tok-attr">$2</span>$3')
  s = s.replace(/("(?:[^"&]|&(?!quot;))*")/g, '<span class="tok-str">$1</span>')
  s = s.replace(/('[^'\n]*')/g, m => '<span class="tok-str">' + m + '</span>')
  return s
}

/** Download a text file from the browser. */
export function download(name, text, mime = 'application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = name
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 0)
}
