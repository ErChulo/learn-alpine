/* =============================================================================
 * store — one Alpine.store('course') holds everything the views need to read:
 * the curriculum, your progress, the score breakdown and your readability
 * preferences. Components never talk to each other; they talk to the store.
 * ========================================================================== */

import { modules, stats } from './content/index.js'
import { Engine, levelFor } from './lib/engine.js'
import { storage, persistent } from './lib/storage.js'
import { clamp, uid } from './lib/utils.js'

const PREF_KEY = 'learn-alpine.prefs.v1'
const DEFAULT_PREFS = { font: 'lexend', size: 2, spacing: 'normal', plain: false, ruler: false }

function loadPrefs() {
  try {
    const raw = storage.getItem(PREF_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS }
  } catch (e) { return { ...DEFAULT_PREFS } }
}

export function createCourseStore(Alpine) {
  const engine = new Engine(modules)

  Alpine.store('course', {
    engine,
    modules,
    stats,
    prefs: loadPrefs(),
    score: {},
    modStats: {},
    toasts: [],
    persistent,
    storageOK: persistent,

    init() {
      this.refresh()
    },

    /** Recompute everything derived from progress. Call after any record*(). */
    refresh() {
      this.score = engine.score()
      this.modStats = engine.allModuleStats()
    },

    savePrefs() {
      try { storage.setItem(PREF_KEY, JSON.stringify(this.prefs)) } catch (e) { /* memory mode */ }
    },

    fontLabel() {
      return { lexend: 'Lexend', atkinson: 'Atkinson', opendyslexic: 'Dyslexic' }[this.prefs.font] || 'Lexend'
    },

    cycleFont() {
      const order = ['lexend', 'atkinson', 'opendyslexic']
      this.prefs.font = order[(order.indexOf(this.prefs.font) + 1) % order.length]
      this.savePrefs()
      this.toast('Reading font: ' + this.fontLabel())
    },

    setSize(delta) {
      this.prefs.size = clamp(this.prefs.size + delta, 1, 4)
      this.savePrefs()
    },

    /** "2/3 tasks" for a unit — used by every checklist header. */
    unitPct(moduleId, unitId) {
      const m = this.modules.find(x => x.id === moduleId)
      const u = m && m.units.find(x => x.id === unitId)
      if (!u) return '0/0'
      let pass = 0
      for (const t of u.tasks) {
        const st = engine.data.tasks[engine.taskKey(moduleId, unitId, t.id)]
        if (st && st.pass) pass++
      }
      return `${pass}/${u.tasks.length}`
    },

    unitDone(moduleId, unitId) {
      const m = this.modules.find(x => x.id === moduleId)
      const u = m && m.units.find(x => x.id === unitId)
      if (!u || !u.tasks.length) return false
      return u.tasks.every(t => engine.data.tasks[engine.taskKey(moduleId, unitId, t.id)]?.pass)
    },

    /* --- "continue where you left off" helpers (used by the dashboard) ------ */
    nextId() { return (engine.next() || this.modules[0]).id },
    nextTitle() { return (engine.next() || this.modules[0]).title },

    complete(moduleId, on = true) {
      engine.completeModule(moduleId, on)
      this.refresh()
      const m = this.modules.find(x => x.id === moduleId)
      this.toast(on ? `Module ${m.num} marked complete. ${this.score.level.name} — ${this.score.level.note}` : 'Module marked as still in progress.', on ? 'good' : '')
    },

    reset() {
      engine.reset()
      this.refresh()
      this.toast('Progress cleared. The curriculum is yours again.')
    },

    toast(text, kind = '') {
      const t = { id: uid(), text, kind }
      this.toasts.push(t)
      setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id) }, 4200)
    }
  })
}
