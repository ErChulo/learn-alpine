/* =============================================================================
 * engine — progress bookkeeping, mastery scoring and level bands.
 *
 * Mastery (0–100) is a weighted blend, so you can see *why* the number moves:
 *   45 %  exercise & step tasks passed
 *   40 %  quiz credit (a first-try correct answer scores 1, a corrected one 0.5)
 *   15 %  curriculum coverage (modules brought to ≥ 80 % of their items)
 * ========================================================================== */

import { storage, persistent } from './storage.js'
import { nowISO } from './utils.js'

const KEY = 'learn-alpine.progress.v1'

export const LEVELS = [
  { min: 0, name: 'Novice', note: 'You are meeting the syntax.' },
  { min: 20, name: 'Apprentice', note: 'You can build small interactive components.' },
  { min: 40, name: 'Practitioner', note: 'You can ship forms, lists and state-heavy UI.' },
  { min: 60, name: 'Analyst', note: 'You can wire plugins, stores and async data flow.' },
  { min: 80, name: 'Actuary', note: 'You can extend Alpine and reason about reactivity.' },
  { min: 93, name: 'Fellow', note: 'Source-level command of Alpine 3.17. Teach it.' }
]

export const levelFor = pct => LEVELS.slice().reverse().find(l => pct >= l.min) || LEVELS[0]

const blank = () => ({
  v: 1, created: nowISO(), updated: nowISO(),
  tasks: {},      // "m02.e1.t2" → { pass, detail, at }
  runs: {},       // "m02.e1"     → { attempts, lastAt }
  quiz: {},       // "m02.q3"     → { ok, attempts, firstOk, at }
  modules: {},    // "m02"        → { startedAt, completedAt }
  drafts: {},     // "m02.s1"     → source code
  notes: '',      // free-workshop notes
  last: null      // { moduleId, unitId, at } — "continue where you left off"
})

export class Engine {
  constructor(content) {
    this.content = content
    this.data = this.load()
  }

  /* ---------------------------------------------------------------- load/save */
  load() {
    try {
      const raw = storage.getItem(KEY)
      if (!raw) return blank()
      const parsed = JSON.parse(raw)
      return Object.assign(blank(), parsed)
    } catch (e) { return blank() }
  }

  save() {
    this.data.updated = nowISO()
    try { storage.setItem(KEY, JSON.stringify(this.data)) } catch (e) { /* memory shim */ }
  }

  get persistent() { return persistent }

  reset() {
    this.data = blank()
    this.save()
  }

  /* ------------------------------------------------------------- recording -- */
  taskKey(modId, unitId, taskId) { return `${modId}.${unitId}.${taskId}` }

  recordTask(modId, unitId, taskId, status, detail = '') {
    const key = this.taskKey(modId, unitId, taskId)
    const prev = this.data.tasks[key] || {}
    const pass = status === 'pass'
    const skip = status === 'skip'
    this.data.tasks[key] = {
      pass: pass || !!prev.pass,      // a pass is never lost
      skipped: skip,
      detail: detail || prev.detail || '',
      at: nowISO()
    }
    this.touchModule(modId)
    this.save()
  }

  recordRun(modId, unitId) {
    const k = `${modId}.${unitId}`
    const r = this.data.runs[k] || { attempts: 0 }
    r.attempts++; r.lastAt = nowISO()
    this.data.runs[k] = r
    this.data.last = { moduleId: modId, unitId, at: nowISO() }
    this.save()
  }

  setDraft(unitKey, code) { this.data.drafts[unitKey] = code; this.save() }
  getDraft(unitKey) { return this.data.drafts[unitKey] }

  touchModule(modId) {
    const m = this.data.modules[modId] || (this.data.modules[modId] = { startedAt: nowISO() })
    m.startedAt = m.startedAt || nowISO()
    return m
  }

  completeModule(modId, on = true) {
    const m = this.touchModule(modId)
    m.completedAt = on ? nowISO() : null
    this.save()
  }

  /* -------------------------------------------------------------- quiz ----- */
  answerQuiz(qid, correct, isFirstAttempt) {
    const q = this.data.quiz[qid] || { attempts: 0 }
    q.attempts++
    q.ok = !!correct || !!q.ok
    if (isFirstAttempt) q.firstOk = !!correct
    if (!q.ok && !correct) q.firstOk = false
    q.at = nowISO()
    this.data.quiz[qid] = q
    this.save()
  }

  quizCredit() {
    let credit = 0
    for (const m of this.content) {
      for (const q of m.quiz) {
        const st = this.data.quiz[`${m.id}.${q.id}`]
        if (!st || !st.ok) continue
        credit += st.firstOk ? 1 : 0.5
      }
    }
    return credit
  }

  /* ------------------------------------------------------------- scoring --- */
  totals() {
    let tasks = 0, quiz = 0
    for (const m of this.content) {
      for (const u of m.units) tasks += u.tasks.length
      quiz += m.quiz.length
    }
    return { tasks, quiz, modules: this.content.length }
  }

  taskStats() {
    let pass = 0, attempted = 0
    for (const m of this.content) {
      for (const u of m.units) {
        for (const t of u.tasks) {
          const st = this.data.tasks[this.taskKey(m.id, u.id, t.id)]
          if (st && st.pass) pass++
          if (st && (st.detail || st.pass)) attempted++
        }
      }
    }
    return { pass, attempted, total: this.totals().tasks }
  }

  moduleStats(m) {
    let tasks = 0, pass = 0
    for (const u of m.units) {
      for (const t of u.tasks) {
        tasks++
        const st = this.data.tasks[this.taskKey(m.id, u.id, t.id)]
        if (st && st.pass) pass++
      }
    }
    let quizPass = 0
    for (const q of m.quiz) {
      const st = this.data.quiz[`${m.id}.${q.id}`]
      if (st && st.ok) quizPass++
    }
    const items = tasks + m.quiz.length
    const done = pass + quizPass
    return {
      tasks, tasksPass: pass, quiz: m.quiz.length, quizPass,
      items, done,
      pct: items ? Math.round((done / items) * 100) : 0,
      coverage: items ? done / items : 0,
      complete: !!this.data.modules[m.id]?.completedAt,
      started: !!this.data.modules[m.id]?.startedAt
    }
  }

  allModuleStats() {
    const out = {}
    for (const m of this.content) out[m.id] = this.moduleStats(m)
    return out
  }

  /** 0–100 mastery with its three components. */
  score() {
    const { tasks: taskTotal, quiz: quizTotal, modules: modTotal } = this.totals()
    const ex = this.taskStats()
    const exercisePart = taskTotal ? ex.pass / taskTotal : 0
    const quizPart = quizTotal ? this.quizCredit() / quizTotal : 0
    const stats = this.allModuleStats()
    const covered = this.content.filter(m => stats[m.id].coverage >= 0.8).length
    const coveragePart = modTotal ? covered / modTotal : 0
    const mastery = 45 * exercisePart + 40 * quizPart + 15 * coveragePart
    return {
      mastery: Math.round(mastery * 10) / 10,
      exercisePart, quizPart, coveragePart,
      tasksPass: ex.pass, taskTotal,
      quizCredit: this.quizCredit(), quizTotal,
      modulesCovered: covered, modTotal,
      level: levelFor(mastery)
    }
  }

  /** Mastery grouped by the Alpine feature each item teaches. */
  skillStats() {
    const acc = new Map()
    const bump = (skill, ok) => {
      if (!skill) return
      const s = acc.get(skill) || { skill, done: 0, total: 0 }
      s.total++; if (ok) s.done++
      acc.set(skill, s)
    }
    for (const m of this.content) {
      for (const u of m.units) {
        for (const t of u.tasks) {
          const st = this.data.tasks[this.taskKey(m.id, u.id, t.id)]
          bump(t.skill || u.skill || m.skills?.[0] || m.title, !!(st && st.pass))
        }
      }
      for (const q of m.quiz) {
        const st = this.data.quiz[`${m.id}.${q.id}`]
        bump(q.skill || m.skills?.[0] || m.title, !!(st && st.ok))
      }
    }
    return Array.from(acc.values()).map(s => ({ ...s, pct: Math.round((s.done / s.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
  }

  /** Where to send the learner next: weakest unfinished module, else the last one touched. */
  next() {
    const stats = this.allModuleStats()
    const started = this.content.filter(m => stats[m.id].started && !stats[m.id].complete)
    if (started.length) return started[Math.floor(Math.random() * started.length)]
    const untouched = this.content.find(m => stats[m.id].done === 0)
    if (untouched) return untouched
    const last = this.data.last && this.content.find(m => m.id === this.data.last.moduleId)
    return last || this.content[0]
  }

  /* ------------------------------------------------------------ portability  */
  export() { return JSON.stringify({ app: 'learn-alpine', exportedAt: nowISO(), ...this.data }, null, 2) }

  import(json) {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json
    if (!parsed || typeof parsed !== 'object' || !('tasks' in parsed)) throw new Error('Not a learn-alpine progress file')
    this.data = Object.assign(blank(), parsed)
    this.save()
    return true
  }
}
