/* =============================================================================
 * checks.js — the assertion engine.
 *
 * It runs INSIDE the exercise sandbox (a sandboxed iframe) against that
 * document, and is also importable from Node for unit tests. A "check" is a
 * plain object:
 *
 *   { id, kind, selector, nth?, values?, value?, tol?, pattern?, flags?,
 *     name?, prop?, key?, do?: [ {click:'…'}, {wait:200}, … ],
 *     settle?: 300, skipIf?: 'noStorage' }
 *
 * Checks may act on the sandbox first (`do`) so that we assert *behaviour*, not
 * just markup. Every check is independent: the parent runner re-runs the whole
 * sandbox for each submission, and actions inside one check are replayed in
 * order within that check only.
 * ========================================================================== */

import { norm, num } from './utils.js'

/* --------------------------------------------------------------- selectors */

function pick(ctx, selector, nth = 0) {
  if (!selector) return null
  const sel = selector.startsWith('@') ? `[data-testid="${selector.slice(1)}"]` : selector
  const all = Array.from(ctx.doc.querySelectorAll(sel))
  return all[nth] || null
}

function pickAll(ctx, selector) {
  if (!selector) return []
  const sel = selector.startsWith('@') ? `[data-testid="${selector.slice(1)}"]` : selector
  return Array.from(ctx.doc.querySelectorAll(sel))
}

const texts = (ctx, selector) => pickAll(ctx, selector).map(el => norm(el.textContent))

const state = { marked: new WeakMap() }

/* ----------------------------------------------------------------- actions */

const raf = win => new Promise(r => win.requestAnimationFrame(() => win.requestAnimationFrame(r)))

async function act(ctx, a) {
  const { doc, win } = ctx
  if ('wait' in a) { await new Promise(r => win.setTimeout(r, a.wait)); return }
  if ('mark' in a) { pickAll(ctx, a.mark).forEach(el => { el.__la_marked = true }); return }

  const el = pick(ctx, a.el || a.click || a.type || a.select || a.focus || a.blur || a.hover ||
                       a.key || a.scrollIntoView || a.dispatch || a.resize || a.drag || a.set, a.nth)
  const target = 'drag' in a ? pick(ctx, a.drag, a.nth) : el

  if ('click' in a || 'dblclick' in a) {
    if (!el) return
    const type = 'dblclick' in a ? 'dblclick' : 'click'
    // A real click toggles checkboxes and radios; a synthetic MouseEvent does
    // not, so do it by hand or x-model never sees a change.
    // A real click on a checkbox/radio lets the browser flip `checked` and then
    // fires `change` — which is what x-model listens to. A synthetic MouseEvent
    // does not perform the default action, so do it by hand and skip the click
    // (x-model also watches click internally and would toggle twice).
    if (el instanceof win.HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      if (el.type === 'checkbox') el.checked = !el.checked
      else el.checked = true
      el.dispatchEvent(new win.Event('input', { bubbles: true }))
      el.dispatchEvent(new win.Event('change', { bubbles: true }))
      await raf(win); return
    }
    el.dispatchEvent(new win.MouseEvent(type, { bubbles: true, cancelable: true, view: win, button: 0 }))
    await raf(win); return
  }
  if ('hover' in a) {
    if (!el) return
    el.dispatchEvent(new win.MouseEvent('mouseover', { bubbles: true, cancelable: true, view: win }))
    el.dispatchEvent(new win.MouseEvent('mouseenter', { bubbles: false, cancelable: true, view: win }))
    el.dispatchEvent(new win.MouseEvent('mousemove', { bubbles: true, cancelable: true, view: win }))
    await raf(win); return
  }
  if ('focus' in a) { if (el) { el.focus(); await raf(win) } return }
  if ('blur' in a) { if (el) { el.blur(); await raf(win) } return }
  if ('set' in a) {
    if (!el) return
    if (el.type === 'checkbox' || el.type === 'radio') { el.checked = !!a.checked; if (a.value !== undefined) el.value = a.value }
    else el.value = a.value
    await raf(win); return
  }
  if ('type' in a) {
    if (!el) return
    const setter = el instanceof win.HTMLTextAreaElement
      ? Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set
      : el instanceof win.HTMLSelectElement
        ? Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, 'value').set
        : Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
    setter.call(el, a.value)
    if (el.type === 'checkbox' || el.type === 'radio') { el.checked = !!a.checked }
    el.dispatchEvent(new win.Event('input', { bubbles: true }))
    el.dispatchEvent(new win.Event('change', { bubbles: true }))
    await raf(win); return
  }
  if ('select' in a) {
    if (!el) return
    el.value = a.select
    el.dispatchEvent(new win.Event('change', { bubbles: true }))
    el.dispatchEvent(new win.Event('input', { bubbles: true }))
    await raf(win); return
  }
  if ('key' in a) {
    if (!el) return
    const init = { key: a.key, code: a.key, bubbles: true, cancelable: true, view: win }
    el.dispatchEvent(new win.KeyboardEvent('keydown', init))
    if (a.key.length === 1) { el.dispatchEvent(new win.KeyboardEvent('keypress', init)) }
    el.dispatchEvent(new win.KeyboardEvent('keyup', init))
    await raf(win); return
  }
  if ('scrollIntoView' in a) {
    if (!el) return
    el.scrollIntoView({ block: 'center' })
    await raf(win); await new Promise(r => win.setTimeout(r, 120)); return
  }
  if ('dispatch' in a) {
    if (!el) return
    // Real input/change events are plain Events; x-model reads `valueAsNumber` off
    // them. Only reach for a CustomEvent when the check carries a `detail`.
    const ev = a.detail !== undefined
      ? new win.CustomEvent(a.event || 'event', { bubbles: true, cancelable: true, detail: a.detail })
      : new win.Event(a.event || 'event', { bubbles: true, cancelable: true })
    el.dispatchEvent(ev)
    await raf(win); return
  }
  if ('resize' in a) {
    if (!el) return
    if (a.width) el.style.width = a.width + 'px'
    if (a.height) el.style.height = a.height + 'px'
    el.dispatchEvent(new win.Event('resize', { bubbles: false }))
    const RS = win.ResizeObserver
    if (RS) { await new Promise(r => win.setTimeout(r, 160)) }
    await raf(win); return
  }
  if ('drag' in a) {
    await syntheticDrag(ctx, target, pick(ctx, a.to))
    return
  }
}

/** Emulates the mouse sequence SortableJS listens to (x-sort). */
async function syntheticDrag(ctx, from, to) {
  if (!from || !to) return
  const { win, doc } = ctx
  const fb = from.getBoundingClientRect(), tb = to.getBoundingClientRect()
  const sx = fb.left + Math.min(20, fb.width / 2), sy = fb.top + fb.height / 2
  const ex = tb.left + tb.width / 2, ey = tb.top + tb.height / 2
  const ev = (type, x, y, target, buttons = 1) => (target || doc).dispatchEvent(
    new win.MouseEvent(type, { bubbles: true, cancelable: true, view: win, button: 0, buttons, clientX: x, clientY: y })
  )
  ev('mousedown', sx, sy, from)
  await raf(win)
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    const x = sx + ((ex - sx) * i) / steps
    const y = sy + ((ey - sy) * i) / steps
    ev('mousemove', x, y, doc, 1)
    await raf(win)
  }
  ev('mouseup', ex, ey, doc, 0)
  await new Promise(r => win.setTimeout(r, 220))
}

/** Is the element or one of its own ancestors display:none / visibility:hidden? */
function concealed(el, win) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = win.getComputedStyle(n)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return true
  }
  return false
}

/* ------------------------------------------------------------------ checks */

const CHECKS = {
  exists: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    return [!!el, el ? `found ${describe(ctx, c.selector)}` : `nothing matches ${c.selector}`]
  },
  notExists: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    return [!el, el ? `${c.selector} is still in the DOM` : 'correctly absent']
  },
  count: (c, ctx) => {
    const n = pickAll(ctx, c.selector).length
    return [n === c.value, `${n} match(es) for ${c.selector}, expected ${c.value}`]
  },
  countAtLeast: (c, ctx) => {
    const n = pickAll(ctx, c.selector).length
    return [n >= c.value, `${n} match(es), expected at least ${c.value}`]
  },
  countAtMost: (c, ctx) => {
    const n = pickAll(ctx, c.selector).length
    return [n <= c.value, `${n} match(es), expected at most ${c.value}`]
  },

  text: (c, ctx) => {
    const t = texts(ctx, c.selector)[c.nth || 0]
    if (t === undefined) return [false, `nothing matches ${c.selector}`]
    return [t === norm(c.value), t === norm(c.value) ? `"${t}"` : `read "${t}", expected "${norm(c.value)}"`]
  },
  textNumber: (c, ctx) => {
    const t = texts(ctx, c.selector)[c.nth || 0]
    if (t === undefined) return [false, `nothing matches ${c.selector}`]
    const got = num(t)
    if (!Number.isFinite(got)) return [false, `could not read a number out of "${t}"`]
    const tol = c.tol ?? 1e-6
    const ok = Math.abs(got - c.value) <= tol
    return [ok, ok ? `${got}` : `read ${got}, expected ${c.value} (±${tol})`]
  },
  textMatch: (c, ctx) => {
    const t = texts(ctx, c.selector)[c.nth || 0]
    if (t === undefined) return [false, `nothing matches ${c.selector}`]
    const re = new RegExp(c.pattern, c.flags || 'i')
    return [re.test(t), re.test(t) ? `"${t}"` : `"${t}" does not match /${c.pattern}/${c.flags || 'i'}`]
  },
  textHas: (c, ctx) => {
    const t = texts(ctx, c.selector)[c.nth || 0]
    if (t === undefined) return [false, `nothing matches ${c.selector}`]
    const ok = t.toLowerCase().includes(norm(c.value).toLowerCase())
    return [ok, ok ? `"${t}"` : `"${t}" does not contain "${c.value}"`]
  },
  textNotHas: (c, ctx) => {
    const t = texts(ctx, c.selector)[c.nth || 0]
    if (t === undefined) return [false, `nothing matches ${c.selector}`]
    const ok = !t.toLowerCase().includes(norm(c.value).toLowerCase())
    return [ok, ok ? 'correctly absent' : `"${t}" still contains "${c.value}"`]
  },

  list: (c, ctx) => {
    const got = texts(ctx, c.selector)
    const want = c.values.map(norm)
    const ok = got.length === want.length && got.every((v, i) => v === want[i])
    return [ok, ok ? `${got.length} items in order` : `read [${got.join(' | ')}], expected [${want.join(' | ')}]`]
  },
  listSet: (c, ctx) => {
    const got = texts(ctx, c.selector).slice().sort()
    const want = c.values.map(norm).slice().sort()
    const ok = got.length === want.length && got.every((v, i) => v === want[i])
    return [ok, ok ? `same ${got.length} items (any order)` : `read [${got.join(' | ')}], expected the same items as [${want.join(' | ')}]`]
  },
  listHas: (c, ctx) => {
    const got = texts(ctx, c.selector).map(s => s.toLowerCase())
    const missing = c.values.filter(v => !got.includes(norm(v).toLowerCase()))
    return [!missing.length, missing.length ? `missing: ${missing.join(', ')}` : `all ${c.values.length} expected values rendered`]
  },
  listLong: (c, ctx) => {
    const got = texts(ctx, c.selector)
    return [got.length === c.value, `${got.length} rendered, expected ${c.value}`]
  },
  listUnique: (c, ctx) => {
    const n = new Set(texts(ctx, c.selector)).size
    return [n === c.value, `${n} distinct values, expected ${c.value}`]
  },

  attr: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const got = el.getAttribute(c.name)
    const ok = norm(got) === norm(c.value)
    return [ok, ok ? `${c.name}="${got}"` : `${c.name}="${got}", expected "${c.value}"`]
  },
  attrHas: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const got = String(el.getAttribute(c.name) ?? '')
    const ok = got.toLowerCase().includes(norm(c.value).toLowerCase())
    return [ok, ok ? `${c.name} contains "${c.value}"` : `${c.name}="${got}" does not contain "${c.value}"`]
  },
  attrGone: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const ok = !el.hasAttribute(c.name)
    return [ok, ok ? `${c.name} removed` : `attribute ${c.name} is still there`]
  },
  prop: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const got = el[c.prop ?? 'value']
    const ok = c.value === undefined ? !!got : String(got) === String(c.value)
    return [ok, ok ? `${c.prop ?? 'value'}=${got}` : `${c.prop ?? 'value'}="${got}", expected "${c.value}"`]
  },
  klass: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    return [el.classList.contains(c.value), el.classList.contains(c.value) ? 'class present' : `class "${c.value}" missing (has: ${el.className || '—'})`]
  },
  noKlass: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    return [!el.classList.contains(c.value), el.classList.contains(c.value) ? `class "${c.value}" is still applied` : 'class removed']
  },
  /** Computed style, numeric: strictly between lo and hi (mid-flight transition state). */
  styleBetween: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const raw = ctx.win.getComputedStyle(el)[c.prop]
    const v = parseFloat(raw)
    if (!Number.isFinite(v)) return [false, `${c.prop} is "${raw}" — not a number to compare`]
    const ok = v > (c.lo ?? -Infinity) && v < (c.hi ?? Infinity)
    return [ok, ok ? `${c.prop} = ${Math.round(v * 1000) / 1000} (between ${c.lo} and ${c.hi})` : `${c.prop} = ${Math.round(v * 1000) / 1000}, expected between ${c.lo} and ${c.hi}`]
  },
  /** Computed style matched against a regex (transform matrices, transform-origin, …). */
  styleMatch: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const raw = String(ctx.win.getComputedStyle(el)[c.prop])
    const re = new RegExp(c.pattern, c.flags || '')
    const ok = re.test(raw)
    return [ok, ok ? `${c.prop} = ${raw} matches` : `${c.prop} = "${raw}" does not match /${c.pattern}/`]
  },
  styleIs: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const got = String(ctx.win.getComputedStyle(el)[c.prop])
    const want = String(c.value)
    const g = got.replace(/\s/g, ''), w = want.replace(/\s/g, '')
    // Numeric-with-unit values compare with a small tolerance ("87.076%" ≈ "87.08%")
    const gn = parseFloat(g), wn = parseFloat(w)
    const unit = s => s.replace(/^-?[\d.]+/, '')
    const ok = g === w ||
      (Number.isFinite(gn) && Number.isFinite(wn) && unit(g) === unit(w) && Math.abs(gn - wn) <= (c.tol ?? 0.02))
    return [ok, ok ? `${c.prop}: ${got}` : `${c.prop} is "${got}", expected "${c.value}"`]
  },
  shown: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const ok = !concealed(el, ctx.win)
    return [ok, ok ? 'visible' : 'element is hidden']
  },
  hidden: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [true, 'element not in the DOM at all (also counts as hidden)']
    const ok = concealed(el, ctx.win)
    return [ok, ok ? 'hidden' : 'element is still visible']
  },
  focused: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const active = ctx.doc.activeElement
    const ok = active === el || (active && el.contains(active))
    return [ok, ok ? 'has focus' : `focus is on ${active ? (active.tagName.toLowerCase() + (active.id ? '#' + active.id : '')) : 'nothing'}`]
  },

  htmlHas: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const ok = el.innerHTML.toLowerCase().includes(c.value.toLowerCase())
    return [ok, ok ? `markup contains ${c.value}` : `innerHTML is "${el.innerHTML.slice(0, 120)}"`]
  },

  /* --- checks on the code the learner wrote (installation, ordering, CSP) --- */
  code: (c, ctx) => {
    const re = new RegExp(c.pattern, c.flags || '');
    const ok = re.test(ctx.source || '')
    return [ok, ok ? 'matches' : `your code must match /${c.pattern}/${c.flags || ''}`]
  },
  noCode: (c, ctx) => {
    const re = new RegExp(c.pattern, c.flags || '');
    const ok = !re.test(ctx.source || '')
    return [ok, ok ? 'correctly absent' : `your code must NOT contain /${c.pattern}/`]
  },

  /* -------------------------------------------- storage (persist / $persist) */
  storage: (c, ctx) => {
    const ls = ctx.ls
    if (!ls) return [false, 'storage-unavailable']
    const v = ls.getItem(c.name)
    if (c.value === undefined) return [v !== null, v === null ? `no key "${c.name}" in storage` : `"${c.name}" = ${v}`]
    const ok = norm(v) === norm(c.value)
    return [ok, ok ? `"${c.name}" = ${v}` : `"${c.name}" = ${v}, expected ${c.value} (keys are usually prefixed "_x_")`]
  },
  storageGone: (c, ctx) => {
    const ls = ctx.ls
    if (!ls) return [false, 'storage-unavailable']
    const ok = ls.getItem(c.name) === null
    return [ok, ok ? 'key removed' : `"${c.name}" is still in storage`]
  },

  /* ------------------------------------------------------- named edge cases */
  custom: (c, ctx) => {
    const fn = CUSTOM[c.name]
    if (!fn) return [false, `unknown custom check "${c.name}"`]
    return fn(c, ctx)
  }
}

/** Shared geometry for x-anchor checks: is `selector` below/above its reference (`of`)? */
function orientation(c, ctx, want) {
  const ref = pick(ctx, c.of)
  const el = pick(ctx, c.selector, c.nth)
  if (!ref) return [false, `nothing matches the reference ${c.of}`]
  if (!el) return [false, `nothing matches ${c.selector}`]
  const r = ref.getBoundingClientRect(), b = el.getBoundingClientRect()
  if (!b.height && !b.width) return [false, 'the anchored element has no size — is it still hidden?']
  const sharesColumn = b.left <= r.right && b.right >= r.left
  const isBelow = b.top >= r.bottom - 2
  const isAbove = b.bottom <= r.top + 2
  const ok = sharesColumn && (want === 'below' ? isBelow : want === 'above' ? isAbove : (isBelow || isAbove))
  const how = isBelow ? `below (${Math.round(b.top - r.bottom)}px gap)` : isAbove ? `above (${Math.round(r.top - b.bottom)}px gap)` : 'overlapping the trigger'
  return [ok, ok
    ? `laid out ${how}`
    : `the element is ${how}; expected it ${want} the trigger`]
}

const CUSTOM = {
  /** Authoring aid: dump the live state around a check (focus, scroll lock, visibility). */

  below: (c, ctx) => orientation(c, ctx, 'below'),
  above: (c, ctx) => orientation(c, ctx, 'above'),
  /** Either directly above or directly below the reference — for placements that may legitimately flip. */
  stacked: (c, ctx) => orientation(c, ctx, 'stacked'),
  /** .no-style anchoring: the learner applied position + coordinates in their own x-bind:style. */
  styledByHand: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    if (concealed(el, ctx.win)) return [false, 'the anchored element is not visible yet — open it first']
    const pos = el.style.position, top = el.style.top, left = el.style.left
    const px = v => /^-?[\d.]+px$/.test(v)
    const ok = (pos === 'absolute' || pos === 'fixed') && px(top) && px(left)
    return [ok, ok
      ? `your expression applied position:${pos}, top:${top}, left:${left}`
      : `inline style is position:${pos || 'unset'}, top:${top || 'unset'}, left:${left || 'unset'} — with .no-style you must apply the coordinates yourself`]
  },
  /** The $anchor readout must describe where the anchored element really sits. */
  anchorMatches: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    const out = pick(ctx, c.readout)
    if (!el) return [false, `nothing matches ${c.selector}`]
    if (!out) return [false, `nothing matches the readout ${c.readout}`]
    const m = /x=(-?\d+)\s*y=(-?\d+)/.exec(out.textContent.replace(/\s+/g, ' '))
    if (!m) return [false, `the readout "${out.textContent.trim()}" is not "x=… y=…"`]
    const x = Number(m[1]), y = Number(m[2])
    const parent = el.offsetParent || ctx.doc.body
    const pr = parent.getBoundingClientRect(), r = el.getBoundingClientRect()
    const dx = Math.abs(r.left - pr.left - x), dy = Math.abs(r.top - pr.top - y)
    const ok = dx <= 4 && dy <= 4
    return [ok, ok
      ? `readout x=${x} y=${y} matches where the element actually sits`
      : `readout says x=${x} y=${y} but the element sits ${Math.round(r.left - pr.left)},${Math.round(r.top - pr.top)} from its offset parent`]
  },
  /** Nodes marked with {mark:'sel'} earlier: still the *same* DOM nodes? (x-for :key, morph) */
  marked: (c, ctx) => {
    const all = pickAll(ctx, c.selector)
    if (!all.length) return [false, `nothing matches ${c.selector}`]
    const kept = all.filter(el => el.__la_marked).length
    const ok = c.value === undefined ? kept === all.length : kept === c.value
    return [ok, ok ? `${kept}/${all.length} original DOM nodes preserved` : `only ${kept}/${all.length} original DOM nodes were preserved (Alpine re-created the rest — check your :key / x-morph)`]
  },
  /** Text of the element that currently has focus (for $el / $refs exercises). */
  focusedText: (c, ctx) => {
    const a = ctx.doc.activeElement
    if (!a) return [false, 'nothing has focus']
    const ok = norm(a.textContent).toLowerCase().includes(norm(c.value).toLowerCase())
    return [ok, ok ? `focused: "${norm(a.textContent)}"` : `focus is on "${norm(a.textContent)}", expected something containing "${c.value}"`]
  },
  /** Count of elements matching `selector` that are still keyboard-reachable. */
  tabbableOutside: (c, ctx) => {
    const all = pickAll(ctx, c.selector).filter(el => {
      if (el.hasAttribute('inert') || el.closest('[inert]')) return false
      if (el.tabIndex < 0) return false
      if (el.disabled) return false
      return true
    })
    return [all.length === 0, all.length ? `${all.length} element(s) outside the trap are still tabbable` : 'everything outside the focus trap is inert']
  },
  /** $persist round-trip: storage key exists AND the rendered value survived. */
  storageAny: (c, ctx) => {
    const ls = ctx.ls
    if (!ls) return [false, 'storage-unavailable']
    const keys = Object.keys(ls).filter(k => k.includes(c.value))
    return [keys.length > 0, keys.length ? `persisted as ${keys.join(', ')}` : `no storage key containing "${c.value}"`]
  },
  /** The sandbox document's title (proves x-effect really ran). */
  docTitle: (c, ctx) => {
    const got = ctx.doc.title
    const ok = norm(got) === norm(c.value)
    return [ok, ok ? `document.title = "${got}"` : `document.title is "${got}", expected "${c.value}"`]
  },
  /** Attribute `name` of element A must equal attribute `name2` of element B. */
  attrMatch: (c, ctx) => {
    const a = pick(ctx, c.selector, c.nth)
    const b = pick(ctx, c.selector2, c.nth2 ?? 0)
    if (!a || !b) return [false, `could not find ${!a ? c.selector : c.selector2}`]
    const av = a.getAttribute(c.attr)
    const bv = b.getAttribute(c.attr2 || c.attr)
    const ok = !!av && !!bv && av === bv
    return [ok, ok ? `${c.attr}="${av}" matches ${c.attr2 || c.attr}="${bv}"` : `${c.attr}="${av}" vs ${c.attr2 || c.attr}="${bv}" — they must be identical`]
  },
  /** Two elements must render different text (uniqueness proofs: $id, keys). */
  /** Two elements must render exactly the same text (for "did it move?" proofs). */
  sameText: (c, ctx) => {
    const a = pick(ctx, c.selector, c.nth)
    const b = pick(ctx, c.selector2, c.nth2 ?? 0)
    if (!a || !b) return [false, `could not find ${!a ? c.selector : c.selector2}`]
    const av = norm(a.textContent), bv = norm(b.textContent)
    const ok = !!av && av === bv
    return [ok, ok ? `both render "${av}"` : `"${av}" vs "${bv}" — they must match`]
  },
  differentText: (c, ctx) => {
    const a = pick(ctx, c.selector, c.nth)
    const b = pick(ctx, c.selector2, c.nth2 ?? 0)
    if (!a || !b) return [false, `could not find ${!a ? c.selector : c.selector2}`]
    const av = norm(a.textContent), bv = norm(b.textContent)
    const ok = !!av && !!bv && av !== bv
    return [ok, ok ? `"${av}" ≠ "${bv}"` : `both render "${av}" — they must differ`]
  },
  /** Two elements must carry the same attribute value ($id / x-id wiring). */
  sameAttr: (c, ctx) => {
    const a = pick(ctx, c.selector, c.nth), b = pick(ctx, c.selector2, 0)
    if (!a || !b) return [false, `could not find ${!a ? c.selector : c.selector2}`]
    const av = a.getAttribute(c.name), bv = b.getAttribute(c.name)
    const ok = !!av && av === bv
    return [ok, ok ? `${c.name}="${av}" matches on both` : `${c.name}: "${av}" vs "${bv}" (they must be identical, and non-empty)`]
  },
  /** SVG/geometry: does the arc path reflect a fraction of the circle? */
  svgProgress: (c, ctx) => {
    const el = pick(ctx, c.selector, c.nth)
    if (!el) return [false, `nothing matches ${c.selector}`]
    const len = parseFloat(el.getTotalLength ? el.getTotalLength() : NaN)
    const dash = parseFloat(ctx.win.getComputedStyle(el).strokeDasharray) || 0
    const off = parseFloat(ctx.win.getComputedStyle(el).strokeDashoffset) || 0
    const frac = len ? (len - off) / len : NaN
    const ok = Number.isFinite(frac) && Math.abs(frac - c.value) <= (c.tol ?? 0.02)
    return [ok, ok ? `arc drawn at ${frac.toFixed(3)} of the circle` : `arc fraction is ${Number.isFinite(frac) ? frac.toFixed(3) : 'not measurable'}, expected ${c.value}`]
  }
}

function describe(ctx, selector) {
  const n = pickAll(ctx, selector).length
  return `${n} element(s) matching ${selector}`
}

/* --------------------------------------------------------------- the runner */

export async function runChecks(ctx, specs, { settle = 40 } = {}) {
  const out = []
  for (const c of specs) {
    let status = 'fail', detail = ''
    try {
      if (c.skipIf === 'noStorage' && !ctx.ls) {
        out.push({ id: c.id, taskId: c.taskId, status: 'skip', detail: 'storage is unavailable in this window' })
        continue
      }
      if (Array.isArray(c.do)) { for (const a of c.do) await act(ctx, a) }
      if (settle) await new Promise(r => ctx.win.setTimeout(r, settle))
      const fn = CHECKS[c.kind] || CUSTOM[c.kind]
      if (!fn) { status = 'fail'; detail = `unknown check kind "${c.kind}"` }
      else {
        const [ok, why] = fn(c, ctx)
        if (why === 'storage-unavailable') { out.push({ id: c.id, taskId: c.taskId, status: 'skip', detail: 'storage is unavailable in this window' }); continue }
        status = ok ? 'pass' : 'fail'; detail = why
      }
    } catch (err) {
      status = 'fail'; detail = `check errored: ${err && err.message ? err.message : err}`
    }
    out.push({ id: c.id, taskId: c.taskId, status, detail })
  }
  return out
}

export const checkKinds = Object.keys(CHECKS)
export { CUSTOM }
