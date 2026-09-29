/* =============================================================================
 * workbench — the Alpine component that powers every step/exercise cell:
 * editor + isolated preview + auto-checked task list + hints + solution.
 *
 * The component is deliberately written with plain Alpine idioms (x-data via
 * Alpine.data, $refs, $watch, $dispatch, x-model) because the course should
 * dogfood what it teaches.
 * ========================================================================== */

import { Workshop, phases } from '../lib/runner.js'

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
    expanded: false,
    live: true,
    _auto: null,
    _loadedCode: null,

    init() {
      this.cfg = JSON.parse(this.$el.dataset.cfg)
      const saved = this.$store.course.engine.getDraft(this.cfg.unitKey)
      this.code = saved ?? this.cfg.starter ?? ''
      this.dirty = !!saved && saved !== this.cfg.starter
      this.$el.__wb = this   // test hook used by tests/e2e.mjs
      this._loadedCode = this.code
      this.ws = new Workshop({
        host: this.$refs.host,
        starter: this.code,
        mode: this.cfg.mode || 'provided',
        vendor: './vendor/alpine'
      })
      this.ws.waitReady().then(r => {
        if (r && r.timeout) this.msg = 'The sandbox is slow to start — check for JavaScript errors in your code.'
      })
      // persistence of the draft, and — just as important — a preview that
      // actually follows what the learner types
      this.$watch('code', v => {
        this.$store.course.engine.setDraft(this.cfg.unitKey, v)
        clearTimeout(this._auto)
        if (!this.live) return
        this._auto = setTimeout(() => {
          if (this.running) return
          this.applyPreview()
        }, 500)
      })
    },

    /** Every check, with a deterministic id, tagged with the task it belongs to. */
    get allChecks() {
      return (this.cfg.tasks || []).flatMap(t =>
        (t.checks || []).map((c, i) => ({ ...c, taskId: t.id, id: `${t.id}-c${i + 1}`, phase: c.phase ?? t.phase ?? 1 })))
    },

    get lineCount() { return (this.code.match(/\n/g) || []).length + 1 },
    get passCount() { return (this.cfg.tasks || []).filter(t => this.results[t.id]?.status === 'pass').length },
    get taskCount() { return (this.cfg.tasks || []).length },

    /** Rebuild the preview and remember exactly which code it is running. */
    applyPreview(code = this.code) {
      this._loadedCode = code
      return this.ws.reload(code)
    },

    /** Load a snippet from the workshop preset picker. */
    loadPreset(code) {
      this.code = code
      this.applyPreview(code)
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
      this.msg = 'Running your page in the sandbox…'
      this.msgKind = ''
      try {
        const [p1, p2] = phases(this.allChecks)
        // Never test a stale page: if the editor moved ahead of the preview
        // (live preview paused, or a keystroke inside the debounce window),
        // rebuild it first. If it is already current, do not reload — reloading
        // would restart effects and corrupt counters the learner is watching.
        if (this._loadedCode !== this.code) await this.applyPreview()
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
        else if (passes && !fails) this.msg = `All ${passes} check${passes > 1 ? 's' : ''} passed. ${this.encouragement()}`
        else if (fails && passes) this.msg = `${passes} of ${passes + fails} passed. The ones that failed are marked ✗ on the left, each with what the sandbox actually saw.`
        else this.msg = 'Nothing passed yet — start with the first failing check on the left; it says exactly what the sandbox looked for.'
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
      this.applyPreview()
      this.msg = 'Sandbox reloaded with your current code.'
      this.msgKind = ''
    },

    toggleLive() {
      this.live = !this.live
      if (this.live) this.applyPreview()
      this.msg = this.live
        ? 'Live preview is on: the right-hand page follows what you type.'
        : 'Live preview paused — the page will not reset while you click around. Press "restart preview" when you want it rebuilt.'
      this.msgKind = ''
    },

    resetToStarter() {
      this.code = this.cfg.starter || ''
      this.results = {}
      this.applyPreview()
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
        this.applyPreview()
        this.msg = 'A worked solution is in the editor. Change it, break it, learn from it.'
        this.msgKind = ''
      }
    },
    get hintList() { return (this.cfg.hints || []).slice(0, this.hintsShown) },
    get remainingHints() { return (this.cfg.hints || []).length - this.hintsShown }
  }))
}
