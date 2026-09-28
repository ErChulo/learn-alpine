/* =============================================================================
 * Course assembly. Every module lives in its own file so the curriculum is easy
 * to review, diff and extend. A module is the unit of progress.
 *
 * module = {
 *   id, num, title, blurb, goal, intro, skills[], docRefs[],
 *   units: [ { id, kind:'step'|'exercise', title, objective, brief, scenario?,
 *              starter, solution, mode?, hints[], tasks:[{id,text,checks[],skill?}],
 *              example?{code,note}, diagram? } ],
 *   quiz:  [ { id, type:'mc'|'multi'|'short', q, options?[], answer?,
 *              answers?[], accept?[], why, distractors?{}, skill? } ]
 * }
 * ========================================================================== */

import m01 from './01-foundations.js'
import m02 from './02-state.js'
import m03 from './03-text-html-bind.js'
import m04 from './04-show-if.js'
import m05 from './05-loops.js'
import m06 from './06-events.js'
import m07 from './07-forms.js'
import m08 from './08-effects.js'
import m09 from './09-handles.js'
import m10 from './10-store.js'
import m11 from './11-components.js'
import m12 from './12-plugins-persist.js'
import m13 from './13-stub.js'
import m14 from './14-stub.js'
import m15 from './15-stub.js'
import m16 from './16-stub.js'
import m17 from './17-stub.js'
import m18 from './18-stub.js'

const raw = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13, m14, m15, m16, m17, m18]








/** Normalise: guarantee ids, mark kinds, flatten to `units`. */
export const modules = raw
  .slice()
  .sort((a, b) => a.num - b.num)
  .map((m, i) => {
    const units = (m.units || []).map((u, j) => ({
      kind: 'step',
      ...u,
      id: u.id || `s${j + 1}`,
      tasks: (u.tasks || []).map((t, k) => ({ ...t, id: t.id || `t${k + 1}` }))
    }))
    return { ...m, id: m.id || `m${String(i + 1).padStart(2, '0')}`, units }
  })

export const stats = (() => {
  let taskCount = 0, exerciseCount = 0, quizCount = 0, stepCount = 0
  for (const m of modules) {
    for (const u of m.units) {
      taskCount += u.tasks.length
      if (u.kind === 'exercise') exerciseCount++; else stepCount++
    }
    quizCount += m.quiz.length
  }
  return { taskCount, exerciseCount, quizCount, stepCount, lessonCount: exerciseCount + stepCount, moduleCount: modules.length }
})()

export const byId = id => modules.find(m => m.id === id)

/** Flat quiz pool for the mixed "quiz battery". */
export const quizPool = modules.flatMap(m => m.quiz.map(q => ({ ...q, moduleId: m.id, moduleTitle: m.title, moduleNum: m.num })))
