/* =============================================================================
 * app.js — the course application: Alpine setup, stores, components, router.
 *
 * The bundle is built to a classic script (see scripts/build.mjs) so index.html
 * works when opened straight from disk, from a static host, or from a sandboxed
 * preview iframe. Alpine itself is imported here in its module form and started
 * manually, which is the npm/bundler installation path the course teaches.
 * ========================================================================== */

import Alpine from 'alpinejs'
import mask from '@alpinejs/mask'
import intersect from '@alpinejs/intersect'
import persist from '@alpinejs/persist'
import resize from '@alpinejs/resize'
import collapse from '@alpinejs/collapse'
import focus from '@alpinejs/focus'
import morph from '@alpinejs/morph'
import anchor from '@alpinejs/anchor'
import sort from '@alpinejs/sort'

import { createCourseStore } from './store.js'
import { modules, byId, stats } from './content/index.js'
import { storage } from './lib/storage.js'
import { download, clamp } from './lib/utils.js'
import { Workshop } from './lib/runner.js'

import registerWorkbench from './components/workbench.js'
import registerQuizItem from './components/quiz-item.js'
import registerQuizBattery from './components/quiz-battery.js'
import registerCheatsheet from './components/cheatsheet.js'
import { registerLifeCalc, registerTriangleCalc, registerCredCalc, registerBondCalc, registerVarSim, registerStatsTool } from './components/tools.js'

import { renderHome } from './views/home.js'
import { renderPath } from './views/path.js'
import { renderModule } from './views/module.js'
import { renderQuiz } from './views/quiz.js'
import { renderWorkshop } from './views/workshop.js'
import { renderCalculator } from './views/calculator.js'
import { renderCheatsheet } from './views/cheatsheet.js'
import { renderInsights } from './views/insights.js'
import { renderSettings } from './views/settings.js'

/* ------------------------------------------------------------------- Alpine */
const PLUGINS = [mask, intersect, persist, resize, collapse, focus, morph, anchor, sort]
PLUGINS.forEach(p => Alpine.plugin(p))

createCourseStore(Alpine)
registerWorkbench(Alpine)
registerQuizItem(Alpine)
registerQuizBattery(Alpine)
registerCheatsheet(Alpine)
registerLifeCalc(Alpine)
registerTriangleCalc(Alpine)
registerCredCalc(Alpine)
registerBondCalc(Alpine)
registerVarSim(Alpine)
registerStatsTool(Alpine)

/* --------------------------------------------------------------- shell data */
const SIZES = ['s', 'm', 'l', 'xl']

Alpine.data('shell', () => ({
  navOpen: false,
  route: { name: 'home' },
  rulerY: 0,

  get prefs() { return this.$store.course.prefs },
  get mastery() { return Math.round(this.$store.course.score.mastery || 0) },
  get level() { return this.$store.course.score.level?.name || 'Novice' },
  get stats() { return stats },
  get scorePct() { return Math.round(100 * (this.$store.course.score.exercisePart || 0)) },
  get storageOK() { return this.$store.course.storageOK },
  get storageLabel() { return this.$store.course.persistent ? 'progress saved in this browser' : 'memory only — not saved' },
  get storeKind() { return this.$store.course.persistent ? 'accent' : 'warn' },
  get fontLabel() { return this.$store.course.fontLabel() },

  get pageTitle() {
    const r = this.route
    if (r.name === 'module') {
      const m = byId(r.id)
      return m ? `Module ${String(m.num).padStart(2, '0')} · ${m.title}` : 'Module'
    }
    return {
      home: 'Dashboard', path: 'Study path', quiz: 'Quiz battery', workshop: 'Free workshop',
      calculator: 'Actuarial toolkit', cheatsheet: 'Cheatsheet', insights: 'Insights & data', settings: 'Readability & storage'
    }[r.name] || 'learn-alpine'
  },

  /* ------------------------------------------------------------- lifecycle */
  boot() {
    this.route = parseRoute()
    this.render()
    window.addEventListener('hashchange', () => {
      this.route = parseRoute()
      this.render()
      this.navOpen = false
    })
    window.addEventListener('pointermove', e => { if (this.prefs.ruler) this.rulerY = e.clientY - 21 })
    window.addEventListener('keydown', e => {
      if (!e.altKey) return
      if (e.key === 'ArrowRight') this.step(1)
      if (e.key === 'ArrowLeft') this.step(-1)
    })
    this.$store.course.refresh()
  },

  /** Alt+←/→ walks the curriculum. */
  step(delta) {
    const i = modules.findIndex(m => m.id === this.route.id)
    const j = clamp((i < 0 ? 0 : i) + delta, 0, modules.length - 1)
    location.hash = '#/m/' + modules[j].id
  },

  setSize(d) { this.$store.course.setSize(d) },
  cycleFont() { this.$store.course.cycleFont() },

  /** Readability preferences are applied to <html>, so CSS variables cascade. */
  applyPrefs() {
    const p = this.$store.course.prefs
    const html = document.documentElement
    html.dataset.font = p.font
    html.dataset.size = SIZES[clamp(p.size, 1, 4) - 1]
    html.dataset.spacing = p.spacing
    html.dataset.plain = p.plain ? 'on' : 'off'
  },

  /* ----------------------------------------------------------------- views */
  render() {
    const view = this.$refs.view
    if (!view) return
    Workshop.destroyAll()
    const r = this.route
    let html = ''
    if (r.name === 'module') {
      const m = byId(r.id)
      if (m) {
        const i = modules.findIndex(x => x.id === m.id)
        html = renderModule(m, modules[i + 1] || null)
      } else {
        html = `<div class="card"><h2>No such module</h2><p>That link does not match a module. <a href="#/">Back to the dashboard</a>.</p></div>`
      }
    } else {
      html = ({
        home: renderHome,
        path: renderPath,
        quiz: renderQuiz,
        workshop: renderWorkshop,
        calculator: renderCalculator,
        cheatsheet: renderCheatsheet,
        insights: renderInsights,
        settings: renderSettings
      }[r.name] || renderHome)()
    }
    view.innerHTML = html
    Alpine.initTree(view)
    window.scrollTo({ top: 0, behavior: 'auto' })
    document.title = `${this.pageTitle} · learn-alpine`
  },

  /* ------------------------------------------------------- data portability */
  exportProgress() {
    download(`learn-alpine-progress-${new Date().toISOString().slice(0, 10)}.json`, this.$store.course.engine.export())
    this.$store.course.toast('Progress exported as JSON.', 'good')
  },
  async importProgress(ev) {
    const file = ev.target.files && ev.target.files[0]
    if (!file) return
    try {
      this.$store.course.engine.import(await file.text())
      this.$store.course.refresh()
      this.$store.course.toast('Progress imported.', 'good')
      this.render()
    } catch (err) {
      this.$store.course.toast('That file could not be read: ' + err.message, 'bad')
    }
  },
  bytes() {
    let n = 0
    try { for (const k in localStorage) if (k.startsWith('learn-alpine')) n += (localStorage[k] || '').length } catch (e) {}
    return n
  }
}))

/* ------------------------------------------------- insights view component */
Alpine.data('insights', () => ({
  get skills() { return this.$store.course.engine.skillStats() },
  get runs() { return Object.values(this.$store.course.engine.data.runs).reduce((n, r) => n + (r.attempts || 0), 0) },
  get started() { return Object.keys(this.$store.course.engine.data.modules).length },
  get completed() { return Object.values(this.$store.course.engine.data.modules).filter(m => m.completedAt).length },
  get lastAt() { const l = this.$store.course.engine.data.last; return l ? new Date(l.at).toLocaleString() : '—' },
  get drafts() { return Object.keys(this.$store.course.engine.data.drafts).length },
  get storageKind() { return this.$store.course.persistent ? 'localStorage' : 'in-memory (sandboxed window)' },
  get bytes() { try { return (storage.getItem('learn-alpine.progress.v1') || '').length } catch (e) { return 0 } },
  correctQuiz() { return Object.values(this.$store.course.engine.data.quiz).filter(q => q.ok).length },
  exportProgress() {
    download(`learn-alpine-progress-${new Date().toISOString().slice(0, 10)}.json`, this.$store.course.engine.export())
    this.$store.course.toast('Progress exported as JSON.', 'good')
  },
  async importProgress(ev) {
    const file = ev.target.files && ev.target.files[0]
    if (!file) return
    try {
      this.$store.course.engine.import(await file.text())
      this.$store.course.refresh()
      this.$store.course.toast('Progress imported.', 'good')
      location.reload()
    } catch (err) {
      this.$store.course.toast('That file could not be read: ' + err.message, 'bad')
    }
  }
}))

/* ------------------------------------------------------------- hash router */
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '').trim()
  if (!h) return { name: 'home' }
  const [name, id] = h.split('/')
  const known = ['home', 'path', 'module', 'quiz', 'workshop', 'calculator', 'cheatsheet', 'insights', 'settings']
  if (name === 'm') return { name: 'module', id }
  return known.includes(name) ? { name, id } : { name: 'home' }
}

/* --------------------------------------------------------------- bootstrap */
window.Alpine = Alpine
Alpine.start()
