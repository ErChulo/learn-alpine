/* =============================================================================
 * views/quiz — the mixed quiz battery: filter, shuffle, drill your weak spots.
 * ========================================================================== */

import { quizPool } from '../content/index.js'
import { jsonAttr } from '../lib/utils.js'

export function renderQuiz() {
  const cfg = {
    pool: quizPool.map(q => ({
      key: `${q.moduleId}.${q.id}`,
      moduleId: q.moduleId,
      moduleTitle: q.moduleTitle,
      moduleNum: q.moduleNum,
      type: q.type,
      q: q.q,
      options: q.options || [],
      answer: typeof q.answer === 'number' ? q.answer : null,
      answers: q.answers || [],
      accept: q.accept || [],
      tol: q.tol,
      why: q.why,
      distractors: q.distractors || {},
      skill: q.skill || ''
    }))
  }
  return `
  <div x-data="quizBattery" data-cfg='${jsonAttr(cfg)}' x-cloak>
    <div class="stack">
      <div>
        <div class="crumb">Quiz battery — every item from all 18 modules</div>
        <h1>Quiz battery</h1>
        <p>
          ${quizPool.length} items. Use the filters to drill: <b>unanswered</b> to push forward,
          <b>missed</b> for spaced repetition on exactly the things you got wrong,
          or a single module when you want to prove you own it.
        </p>
      </div>

      <div class="card">
        <div class="row">
          <div class="pill-tabs" role="group" aria-label="Filter">
            <template x-for="m in modes" :key="m.id">
              <button @click="mode = m.id" :class="{ on: mode === m.id }" x-text="m.label"></button>
            </template>
          </div>
          <select x-model="moduleFilter" style="max-width:320px" aria-label="Module filter">
            <option value="">all modules</option>
            <template x-for="m in moduleOptions" :key="m.id">
              <option :value="m.id" x-text="m.label"></option>
            </template>
          </select>
          <button class="btn-sm" @click="shuffle()">↺ shuffle</button>
          <div style="flex:1"></div>
          <span class="chip accent"><span x-text="correctCount"></span>/<span x-text="cfg.pool.length"></span> correct</span>
          <span class="chip">credit <span x-text="credit.toFixed(1)"></span></span>
        </div>
        <div class="bar" style="margin-top:12px"><span :style="'width:' + pctCorrect + '%'"></span></div>
        <div class="row tiny muted" style="margin-top:8px">
          <span x-text="visible.length + ' item(s) in this view'"></span>
          <span x-show="weakest.length">· weakest features right now: <b x-text="weakestText"></b></span>
        </div>
      </div>

      <div class="card" x-show="!visible.length">
        <h3>Nothing left in this filter</h3>
        <p class="muted">Either you have already answered everything here (well done — switch to <b>missed</b> or <b>all</b>), or this module has no items.</p>
      </div>

      <template x-for="it in visible" :key="it.key">
        <div class="q" x-data="quizItem(JSON.stringify(it))" x-cloak></div>
      </template>

      <div class="card" style="background:#101a30">
        <h3>Scoring, plainly</h3>
        <ul class="tiny" style="margin-bottom:0">
          <li>A first-attempt correct answer is worth <b>1.0</b> quiz-credit point.</li>
          <li>A corrected answer is worth <b>0.5</b> — you still learn it, but the score remembers the wobble.</li>
          <li>Quiz credit is 40&nbsp;% of your mastery score; the rest is checked work (45&nbsp;%) and coverage (15&nbsp;%).</li>
          <li>Rationale appears after you submit, including why each wrong option you picked was wrong.</li>
        </ul>
      </div>
    </div>
  </div>`
}
