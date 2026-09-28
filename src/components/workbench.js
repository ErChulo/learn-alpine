/* =============================================================================
 * workbench — the Alpine component that powers every step/exercise cell:
 * editor + isolated preview + auto-checked task list + hints + solution.
 *
 * The component is deliberately written with plain Alpine idioms (x-data via
 * Alpine.data, $refs, $watch, $dispatch, x-model) because the course should
 * dogfood what it teaches.
 * ========================================================================== */

import { Workshop, phases } from '../lib/runner.js'
import { debounce } from '../lib/utils.js'

export default function registerWorkbench(Alpine) {
  Alpine.data('workbench', () => ({
    cfg: null,
    code: '',
    results: {},
    running: false,
    msg: '',
    msgKind: '',
    hintsShown: 0,
    solutionShown: false,
    tab: 'split',
    ws: null,
    dirty: false,

    init() {
      this.cfg = JSON.parse(this.$el.dataset.cfg)
      const saved = this.$store.course.engine.getDraft(this.cfg.unitKey)
      this.code = saved ?? this.cfg.starter ?? ''
      this.dirty = !!saved && saved !== this.cfg.starter
      this.$el.__wb = this   // test hook used by tests/e2e.mjs
      this.ws = new Workshop({
        host: this.$refs.host,
        starter: this.code,
        mode: this.cfg.mode || 'provided',
        vendor: './vendor/alpine'
      })
      this.ws.waitReady().then(r => {
        if (r && r.timeout) this.msg = 'The sandbox is slow to start — check for JavaScript errors in your code.'
      })
      this.$watch('code', debounce(v => this.$store.course.engine.setDraft(this.cfg.unitKey, v), 500))
    },

    /** Every check, with a deterministic id, tagged with the task it belongs to. */
    get allChecks() {
      return (this.cfg.tasks || []).flatMap(t =>
        (t.checks || []).map((c, i) => ({ ...c, taskId: t.id, id: `${t.id}-c${i + 1}`, phase: c.phase ?? t.phase ?? 1 })))
    },

    get passCount() { return (this.cfg.tasks || []).filter(t => this.results[t.id]?.status === 'pass').length },
    get taskCount() { return (this.cfg.tasks || []).length },

    /** Load a snippet from the workshop preset picker. */
    loadPreset(code) {
      this.code = code
      this.ws.reload(code)
      this.msg = 'Preset loaded into the editor — edit it and watch the preview.'
      this.msgKind = ''
    },

    async run() {
      if (this.running) return
      if (!this.allChecks.length) {
        this.msg = 'This is a free workshop cell: nothing is checked here, the preview is your feedback.'
        this.msgKind = ''
        return
      }
      this.running = true
      this.msg = 'Running your code…'
      this.msgKind = ''
      try {
        const [p1, p2] = phases(this.allChecks)
        let out = p1.length ? await this.ws.run(p1, { source: this.code }) : []
        if (p2.length) {
          // Phase 2 runs in a *fresh* page so that $persist / localStorage
          // round-trips are tested honestly (a reload, not a no-op).
          await this.ws.reload(this.code)
          out = out.concat(await this.ws.run(p2, { source: this.code }))
        }
        const { status, detail, taskId } = this.collect(out)
        this.results = status
        const fails = Object.values(status).filter(r => r.status === 'fail').length
        const passes = Object.values(status).filter(r => r.status === 'pass').length
        const skips = Object.values(status).filter(r => r.status === 'skip').length

        this.$store.course.engine.recordRun(this.cfg.moduleId, this.cfg.unitId)
        for (const t of this.cfg.tasks) {
          const r = status[t.id]
          if (r) this.$store.course.engine.recordTask(this.cfg.moduleId, this.cfg.unitId, t.id, r.status, r.detail)
        }
        this.$store.course.refresh()

        if (skips && !passes && !fails) this.msg = 'Not verifiable in this window (no storage access). Run the project locally for this check.'
        else if (passes && !fails) this.msg = `All ${passes} task${passes > 1 ? 's' : ''} passed. ${this.encouragement()}`
        else if (fails && passes) this.msg = `${passes} passed, ${fails} to go. Read the failing lines below.`
        else this.msg = 'Not yet — each failing task tells you what the sandbox actually saw.'
        this.msgKind = fails ? 'err' : (passes ? 'ok' : '')
        const err = this.ws.errorSummary()
        if (err) this.msg += '  ⚠ ' + err
      } catch (e) {
        this.msg = 'Something went wrong while checking: ' + e.message
        this.msgKind = 'err'
      } finally {
        this.running = false
      }
    },

    /** Collapse the sandbox results into one verdict per task. */
    collect(out) {
      const byTask = {}
      for (const r of out) {
        const t = byTask[r.taskId] || (byTask[r.taskId] = { pass: 0, fail: 0, skip: 0, details: [] })
        t[r.status] = (t[r.status] || 0) + 1
        if (r.detail && r.status !== 'pass') t.details.push(r.detail)
      }
      const res = {}
      for (const [taskId, t] of Object.entries(byTask)) {
        const status = t.fail ? 'fail' : (t.pass ? 'pass' : 'skip')
        res[taskId] = { status, detail: t.fail ? t.details.slice(0, 2).join(' · ') : (status === 'pass' ? '' : 'skipped') }
      }
      return { status: res }
    },

    encouragement() {
      const s = this.$store.course.score
      return s.level ? s.level.note : ''
    },

    reloadSandbox() {
      this.ws.reload(this.code)
      this.msg = 'Sandbox reloaded with your current code.'
      this.msgKind = ''
    },

    resetToStarter() {
      this.code = this.cfg.starter || ''
      this.results = {}
      this.ws.reload(this.code)
      this.msg = 'Back to the starting markup.'
      this.msgKind = ''
    },

    /** Two soft spaces on Tab, so indentation does not fight the browser. */
    insertTab(e) {
      const t = e.target, s = t.selectionStart, en = t.selectionEnd
      this.code = this.code.slice(0, s) + '  ' + this.code.slice(en)
      this.$nextTick(() => { t.selectionStart = t.selectionEnd = s + 2 })
    },

    revealHint() { if (this.hintsShown < (this.cfg.hints || []).length) this.hintsShown++ },
    toggleSolution() {
      this.solutionShown = !this.solutionShown
      if (this.solutionShown && this.cfg.solution) {
        this.code = this.cfg.solution
        this.ws.reload(this.code)
        this.msg = 'A worked solution is in the editor. Change it, break it, learn from it.'
        this.msgKind = ''
      }
    },
    get hintList() { return (this.cfg.hints || []).slice(0, this.hintsShown) },
    get remainingHints() { return (this.cfg.hints || []).length - this.hintsShown }
  }))
}
