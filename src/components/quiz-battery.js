/* =============================================================================
 * quizBattery — filtering and shuffle state for the consolidated quiz view.
 * ========================================================================== */

export default function registerQuizBattery(Alpine) {
  Alpine.data('quizBattery', () => ({
    cfg: { pool: [] },
    mode: 'todo',
    moduleFilter: '',
    order: [],
    modes: [
      { id: 'todo', label: 'unanswered' },
      { id: 'missed', label: 'missed' },
      { id: 'all', label: 'all' }
    ],

    init() {
      this.cfg = JSON.parse(this.$el.dataset.cfg)
      this.order = this.cfg.pool.map(p => p.key)
      // Keep the view reactive to the store, which every quizItem writes to.
      this.$watch('$store.course.score.mastery', () => {})
    },

    statusOf(key) { return this.$store.course.engine.data.quiz[key] },

    get moduleOptions() {
      const seen = new Map()
      for (const p of this.cfg.pool) if (!seen.has(p.moduleId)) seen.set(p.moduleId, { id: p.moduleId, label: `Module ${p.moduleNum} · ${p.moduleTitle}` })
      return Array.from(seen.values())
    },

    get visible() {
      return this.order
        .map(k => this.cfg.pool.find(p => p.key === k))
        .filter(Boolean)
        .filter(p => !this.moduleFilter || p.moduleId === this.moduleFilter)
        .filter(p => {
          const st = this.statusOf(p.key)
          if (this.mode === 'todo') return !(st && st.ok)
          if (this.mode === 'missed') return st && st.attempts && !st.ok
          return true
        })
    },

    get correctCount() { return this.cfg.pool.filter(p => this.statusOf(p.key)?.ok).length },
    get pctCorrect() { return this.cfg.pool.length ? Math.round((this.correctCount / this.cfg.pool.length) * 100) : 0 },
    get credit() {
      return this.cfg.pool.reduce((n, p) => {
        const st = this.statusOf(p.key)
        return n + (st && st.ok ? (st.firstOk ? 1 : 0.5) : 0)
      }, 0)
    },
    get weakest() {
      return this.$store.course.engine.skillStats().filter(s => s.pct < 100).slice(0, 3).map(s => `${s.skill} (${s.pct}%)`)
    },
    get weakestText() { return this.weakest.join(' · ') || '—' },

    shuffle() {
      for (let i = this.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this.order[i], this.order[j]] = [this.order[j], this.order[i]]
      }
      this.$store.course.toast('Battery reshuffled.')
    }
  }))
}
