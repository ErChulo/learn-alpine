/* =============================================================================
 * partials — shared HTML renderers for the course views.
 * Everything is returned as a string and handed to Alpine.initTree().
 * ========================================================================== */

import { esc, jsonAttr, highlight, mini } from '../lib/utils.js'

export const plainMini = mini

export function theory(u) {
  if (!u.brief) return ''
  return `<div class="stack">${u.brief.split('\n\n').map(p => `<p>${mini(p)}</p>`).join('')}</div>`
}

export function example(u) {
  if (!u.example) return ''
  return `
    <div class="card" style="background:#101a30;margin:12px 0">
      <div class="row" style="justify-content:space-between">
        <b class="tiny">Worked example — read it, then do it yourself</b>
      </div>
      <pre><code>${highlight(u.example.code)}</code></pre>
      ${u.example.note ? `<p class="tiny muted" style="margin:0">${mini(u.example.note)}</p>` : ''}
    </div>`
}

export function callout(kind, title, body) {
  return `<div class="callout ${kind}">
    <div class="cal-head"><span>${kind === 'warn' ? '⚠' : kind === 'good' ? '✓' : 'i'}</span><span>${esc(title)}</span></div>
    <p>${mini(body)}</p>
  </div>`
}

/** The checklist of tasks for one workbench cell. */
export function taskList() {
  return `
  <ul class="tasks">
    <template x-for="t in cfg.tasks" :key="t.id">
      <li>
        <span class="mark" :class="results[t.id] ? results[t.id].status : 'todo'"
              x-text="results[t.id]?.status === 'pass' ? '✓' : results[t.id]?.status === 'fail' ? '✗' : results[t.id]?.status === 'skip' ? '–' : '·'"></span>
        <div>
          <div class="task-text" x-html="t.html"></div>
          <div class="task-detail" x-show="results[t.id] && results[t.id].detail"
               :class="results[t.id]?.status === 'fail' ? 'bad' : 'good'"
               x-text="results[t.id]?.detail"></div>
        </div>
      </li>
    </template>
  </ul>`
}

/**
 * The full workbook cell. `cfg` is passed through a data-attribute so the
 * markup stays free of fragile nested quoting.
 */
export function workbench(cfg) {
  const c = { ...cfg }
  c.tasks = (c.tasks || []).map(t => ({ id: t.id, html: mini(t.text), checks: t.checks, skill: t.skill, phase: t.phase }))
  return `
  <div class="workbook" x-data="workbench" data-cfg='${jsonAttr(c)}' x-cloak>
    <div class="wb-toolbar">
      <button class="btn-primary" @click="run()" :disabled="running">
        <span x-text="running ? 'Checking…' : 'Check my work'"></span>
      </button>
      <button class="btn-sm" @click="reloadSandbox()" title="Start the preview page again with the current code">↻ restart preview</button>
      <button class="btn-sm" @click="resetToStarter()">reset starter</button>
      <button class="btn-sm" @click="revealHint()" x-show="remainingHints > 0">
        <span x-text="'hint (' + remainingHints + ' left)'"></span>
      </button>
      <button class="btn-sm" @click="toggleSolution()" x-text="solutionShown ? 'hide solution' : 'worked solution'"></button>
      <div style="flex:1"></div>
      <span class="chip" :class="passCount === taskCount && taskCount ? 'accent' : ''">
        <span x-text="passCount + '/' + taskCount"></span> tasks passed
      </span>
    </div>

    <div class="wb-split">
      <div class="editor">
        <label class="field" style="margin:0">
          <span>Your markup — edit freely, nothing is submitted anywhere</span>
          <textarea x-model="code" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off"
                    aria-label="Exercise code editor" @keydown.tab.prevent="insertTab($event)"></textarea>
        </label>
      </div>
      <div>
        <div class="tiny muted" style="margin-bottom:6px">Preview — a real, isolated page running Alpine 3.17.4</div>
        <div x-ref="host"></div>
      </div>
    </div>

    <div class="run-msg" :class="msgKind" x-text="msg || 'Edit the preview above, then press Check my work.'"></div>

    <template x-if="hintList.length">
      <div class="callout info">
        <div class="cal-head"><span>?</span><span>Hints you have opened</span></div>
        <ul style="margin-bottom:0">
          <template x-for="(h, i) in hintList" :key="i">
            <li x-html="h"></li>
          </template>
        </ul>
      </div>
    </template>

    ${taskList()}
  </div>`
}

/** One quiz item. */
export function quizItem(q, moduleId, index) {
  const cfg = {
    key: `${moduleId}.${q.id}`,
    type: q.type,
    q: q.q,
    options: q.options || [],
    answer: typeof q.answer === 'number' ? q.answer : null,
    answers: q.answers || [],
    accept: q.accept || [],
    why: q.why,
    distractors: q.distractors || {},
    skill: q.skill || ''
  }
  return `
  <div class="q" x-data="quizItem" data-q='${jsonAttr(cfg)}' x-cloak>
    <div class="qhead">
      <span class="chip" x-text="label"></span>
      <span class="chip" x-show="isMulti">choose several</span>
      <span class="tiny muted" x-text="cfg.skill"></span>
      <div style="flex:1"></div>
      <span class="chip accent" x-show="state === 'right'">✓ correct</span>
      <span class="chip warn" x-show="state === 'wrong'">try again</span>
    </div>
    <div class="qtext" x-html="question"></div>

    <div class="opts" x-show="cfg.type === 'mc'">
      <template x-for="(o, i) in cfg.options" :key="i">
        <button class="opt" @click="choose(i)" :class="{ sel: pick === i, right: revealed && i === cfg.answer, wrong: revealed && pick === i && i !== cfg.answer }"
                :aria-pressed="pick === i">
          <span class="letter" x-text="letters[i]"></span>
          <span x-html="optHtml[i]"></span>
        </button>
      </template>
    </div>

    <div class="opts" x-show="isMulti">
      <template x-for="(o, i) in cfg.options" :key="i">
        <button class="opt" @click="toggle(i)" :class="{ sel: multi[i], right: revealed && cfg.answers.includes(i), wrong: revealed && multi[i] && !cfg.answers.includes(i) }"
                :aria-pressed="!!multi[i]">
          <span class="letter" x-text="multi[i] ? '☑' : '☐'"></span>
          <span x-html="optHtml[i]"></span>
        </button>
      </template>
    </div>

    <div x-show="cfg.type === 'short'" class="row" style="align-items:flex-end">
      <label class="field" style="flex:1;margin:0">
        <span>Your answer — exact value, no units needed</span>
        <input x-model="text" @keydown.enter="submit()" :class="{ 'wrong': revealed && state !== 'right' }" placeholder="e.g. 0.0431">
      </label>
    </div>

    <div class="row" style="margin-top:12px">
      <button class="btn-primary" @click="submit()" :disabled="state === 'right'">
        <span x-text="attempts === 0 ? 'Submit answer' : 'Submit again'"></span>
      </button>
      <button class="btn-sm" x-show="state === 'right'" @click="next()">next item →</button>
    </div>

    <div class="explain" x-show="revealed" x-cloak>
      <b x-text="state === 'right' ? 'Correct — here is the full picture' : 'Why that is not right'"></b>
      <p class="why" x-html="feedback"></p>
    </div>
  </div>`
}
