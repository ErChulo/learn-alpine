/* =============================================================================
 * views/insights — score anatomy, per-module and per-skill breakdown, data.
 * ========================================================================== */

import { modules } from '../content/index.js'
import { gaugeHTML } from './home.js'
import { esc } from '../lib/utils.js'

export function renderInsights() {
  return `
  <div class="stack" x-data="insights" x-cloak>
    <div>
      <div class="crumb">Insights &amp; data</div>
      <h1>Where you actually stand</h1>
      <p>
        Three numbers decide your mastery score, and each of them can be moved by a single afternoon of work.
        Below that, the skill table ranks your weakest Alpine features first — that is your study list.
      </p>
    </div>

    <div class="card">
      <div class="grid two" style="align-items:center">
        <div class="row" style="justify-content:center">${gaugeHTML()}</div>
        <div>
          <div class="row" style="justify-content:space-between">
            <h3 style="margin:0">Level</h3>
            <span class="badge-lvl" x-text="$store.course.score.level.name"></span>
          </div>
          <p class="muted" x-text="$store.course.score.level.note"></p>
          <dl class="kv">
            <dt>Checked work (45 %)</dt><dd x-text="Math.round(100 * ($store.course.score.exercisePart || 0)) + '%'"></dd>
            <dt>Quiz credit (40 %)</dt><dd x-text="Math.round(100 * ($store.course.score.quizPart || 0)) + '%'"></dd>
            <dt>Coverage (15 %)</dt><dd x-text="Math.round(100 * ($store.course.score.coveragePart || 0)) + '%'"></dd>
            <dt>Tasks passed</dt><dd x-text="($store.course.score.tasksPass || 0) + ' / ' + ($store.course.score.taskTotal || 0)"></dd>
            <dt>Quiz items correct</dt><dd x-text="correctQuiz() + ' / ' + ($store.course.score.quizTotal || 0)"></dd>
            <dt>Modules ≥80 %</dt><dd x-text="($store.course.score.modulesCovered || 0) + ' / ' + ($store.course.score.modTotal || 0)"></dd>
          </dl>
          <div class="row" style="margin-top:10px">
            <a class="btn-primary btn" :href="'#/m/' + $store.course.nextId()">Study next: <span x-text="$store.course.nextTitle()"></span> →</a>
            <a class="btn" href="#/quiz">Quiz battery</a>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Per-module detail</h3>
      <div style="overflow:auto">
        <table class="data">
          <thead><tr><th>#</th><th>Module</th><th class="num">tasks</th><th class="num">quiz</th><th class="num">done</th><th style="min-width:180px">progress</th><th>status</th></tr></thead>
          <tbody>
            ${modules.map(m => `
              <tr>
                <td>${String(m.num).padStart(2, '0')}</td>
                <td><a href="#/m/${m.id}">${esc(m.title)}</a></td>
                <td class="num" x-text="($store.course.modStats['${m.id}']?.tasksPass || 0) + '/' + ($store.course.modStats['${m.id}']?.tasks || 0)"></td>
                <td class="num" x-text="($store.course.modStats['${m.id}']?.quizPass || 0) + '/' + ($store.course.modStats['${m.id}']?.quiz || 0)"></td>
                <td class="num" x-text="($store.course.modStats['${m.id}']?.pct || 0) + '%'"></td>
                <td><div class="bar"><span :style="'width:' + ($store.course.modStats['${m.id}']?.pct || 0) + '%'"></span></div></td>
                <td class="tiny" x-text="$store.course.modStats['${m.id}']?.complete ? '✓ complete' : ($store.course.modStats['${m.id}']?.started ? 'in progress' : 'not started')"></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Feature-by-feature mastery <span class="tiny muted">(weakest first — this is your revision order)</span></h3>
      <div style="overflow:auto">
        <table class="data">
          <thead><tr><th>Feature</th><th class="num">items done</th><th style="min-width:200px">mastery</th><th class="num">%</th></tr></thead>
          <tbody>
            <template x-for="s in skills" :key="s.skill">
              <tr>
                <td x-text="s.skill"></td>
                <td class="num" x-text="s.done + '/' + s.total"></td>
                <td><div class="bar" :class="s.pct >= 80 ? 'good' : s.pct >= 40 ? '' : 'bad'"><span :style="'width:' + s.pct + '%'"></span></div></td>
                <td class="num" x-text="s.pct + '%'"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Activity</h3>
        <dl class="kv">
          <dt>Sandbox runs (all exercises)</dt><dd x-text="runs"></dd>
          <dt>Modules started</dt><dd x-text="started"></dd>
          <dt>Modules completed</dt><dd x-text="completed"></dd>
          <dt>Last worked on</dt><dd x-text="lastAt"></dd>
          <dt>Drafts kept for you</dt><dd x-text="drafts"></dd>
        </dl>
        <hr>
        <h4>Your study loop, measured</h4>
        <p class="tiny muted">
          A run that passes every task on the first attempt is worth more than five that pass slowly —
          but only the first submission counts in the score, so re-running to chase a pass costs nothing.
        </p>
      </div>

      <div class="card">
        <h3>Your data</h3>
        <p class="tiny">
          Progress lives in this browser only. Export it before switching machines, or import a friend's
          file to see how the scoring behaves when a course is fully finished.
        </p>
        <div class="row">
          <button class="btn" @click="exportProgress()">⤓ export .json</button>
          <label class="btn" style="cursor:pointer">
            ⤒ import .json
            <input type="file" accept="application/json" @change="importProgress($event)" style="display:none">
          </label>
          <button class="btn-danger" @click="$dispatch('open-reset')">reset everything</button>
        </div>
        <hr>
        <dl class="kv">
          <dt>Storage backend</dt><dd x-text="storageKind"></dd>
          <dt>Bytes stored</dt><dd x-text="bytes + ' B'"></dd>
          <dt>Mastery formula</dt><dd>45/40/15</dd>
        </dl>
        <p class="tiny muted" x-show="!$store.course.storageOK">
          This window blocks storage (sandboxed preview). Everything still works, but nothing survives a reload —
          run the project locally to keep your progress.
        </p>
      </div>
    </div>
  </div>`
}
