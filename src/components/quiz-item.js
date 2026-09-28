/* =============================================================================
 * quizItem — one multiple-choice / multi-select / numeric-short-answer item.
 * First-try answers score 1, corrected answers score 0.5 (see lib/engine.js).
 * ========================================================================== */

import { mini, norm, num, esc } from '../lib/utils.js'

export default function registerQuizItem(Alpine) {
  Alpine.data('quizItem', () => ({
    cfg: null,
    question: '',
    optHtml: [],
    pick: null,
    multi: {},
    text: '',
    revealed: false,
    state: '',
    attempts: 0,
    letters: ['A', 'B', 'C', 'D', 'E', 'F'],

    init() {
      this.cfg = JSON.parse(this.$el.dataset.q)
      this.question = mini(this.cfg.q)
      this.optHtml = this.cfg.options.map(o => mini(o))
      const st = this.$store.course.engine.data.quiz[this.cfg.key]
      if (st && st.ok) { this.state = 'right'; this.revealed = true; this.attempts = st.attempts || 1 }
      else if (st && st.attempts) { this.attempts = st.attempts }
    },

    get label() { return this.cfg.type === 'multi' ? 'Multi-select' : this.cfg.type === 'short' ? 'Short answer' : 'One correct answer' },
    get isMulti() { return this.cfg.type === 'multi' },

    choose(i) { if (this.state !== 'right') this.pick = i },
    toggle(i) { if (this.state !== 'right') this.multi[i] = !this.multi[i] },

    checkShort() {
      const given = norm(this.text)
      if (!given) return false
      if (this.cfg.accept.some(a => norm(a).toLowerCase() === given.toLowerCase())) return true
      if (typeof this.cfg.answer === 'number') {
        const got = num(given)
        if (!Number.isFinite(got)) return false
        const tol = this.cfg.tol ?? 1e-6
        return Math.abs(got - this.cfg.answer) <= tol
      }
      return false
    },

    submit() {
      if (this.state === 'right') return
      let ok = false
      if (this.cfg.type === 'mc') {
        if (this.pick === null) return
        ok = this.pick === this.cfg.answer
      } else if (this.cfg.type === 'multi') {
        const chosen = Object.keys(this.multi).filter(k => this.multi[k]).map(Number).sort()
        const want = this.cfg.answers.slice().sort()
        if (!chosen.length) return
        ok = chosen.length === want.length && chosen.every((c, i) => c === want[i])
      } else {
        ok = this.checkShort()
      }
      const first = this.attempts === 0
      this.attempts++
      this.revealed = true
      this.state = ok ? 'right' : 'wrong'
      this.$store.course.engine.answerQuiz(this.cfg.key, ok, first)
      this.$store.course.refresh()
      if (ok) this.$store.course.toast('Correct. ' + (first ? 'Full credit.' : 'Half credit — you got there on a second attempt.'), 'good')
    },

    get feedback() {
      const why = mini(this.cfg.why || '')
      const chosen = this.cfg.type === 'mc' ? [this.pick] : Object.keys(this.multi).filter(k => this.multi[k]).map(Number)
      const notes = chosen
        .filter(i => this.cfg.distractors[i])
        .map(i => `<b>${this.letters[i] ?? i}:</b> ${mini(this.cfg.distractors[i])}`)
      return why + (notes.length && this.state !== 'right' ? `<br><br>${notes.join('<br>')}` : '')
    },

    next() {
      const sib = this.$el.nextElementSibling
      if (sib) { sib.scrollIntoView({ behavior: 'smooth', block: 'center' }); const f = sib.querySelector('button, input'); f && f.focus({ preventScroll: true }) }
    }
  }))
}
