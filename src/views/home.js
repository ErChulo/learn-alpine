/* =============================================================================
 * views/home — the dashboard: where you are, what the score means, where next.
 * ========================================================================== */

import { modules, stats } from '../content/index.js'
import { esc, mini } from '../lib/utils.js'

const CIRC = 314.16 // 2πr, r = 50

export function gaugeHTML() {
  return `
  <div class="gauge">
    <svg viewBox="0 0 120 120" width="190" height="190" aria-hidden="true">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5eead4"/><stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient>
      </defs>
      <circle class="track" cx="60" cy="60" r="50"></circle>
      <circle class="val" cx="60" cy="60" r="50"
              :stroke-dasharray="${CIRC}"
              :stroke-dashoffset="${CIRC} * (1 - ($store.course.score.mastery || 0) / 100)"></circle>
    </svg>
    <div class="lbl">
      <b x-text="Math.round($store.course.score.mastery || 0)"></b>
      <span>mastery / 100</span>
    </div>
  </div>`
}

function breakdown() {
  const bar = (label, weight, expr, hint) => `
    <div style="margin-bottom:10px">
      <div class="row" style="justify-content:space-between">
        <span class="tiny"><b>${label}</b> · weight ${weight}%</span>
        <span class="tiny muted" x-text="${expr.text}"></span>
      </div>
      <div class="bar"><span :style="'width:' + (100 * (${expr.part} || 0)) + '%'"></span></div>
      <div class="tiny muted" style="margin-top:3px">${hint}</div>
    </div>`
  return `
  <div>
    ${bar('Checked work', 45, { part: '$store.course.score.exercisePart', text: "($store.course.score.tasksPass||0) + ' / ' + ($store.course.score.taskTotal||0) + ' tasks'" }, 'Every task you pass in the guided steps and exercises.')}
    ${bar('Quiz credit', 40, { part: '$store.course.score.quizPart', text: "($store.course.score.quizCredit||0).toFixed(1) + ' / ' + ($store.course.score.quizTotal||0)" }, 'First-try correct = 1 point, corrected = 0.5 point.')}
    ${bar('Curriculum coverage', 15, { part: '$store.course.score.coveragePart', text: "($store.course.score.modulesCovered||0) + ' / ' + ($store.course.score.modTotal||0) + ' modules'" }, 'Modules where you have done at least 80 % of the items.')}
  </div>`
}

function moduleCard(m) {
  return `
  <a class="card" href="#/m/${m.id}" style="text-decoration:none;color:inherit;display:block">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <span class="chip">Module ${String(m.num).padStart(2, '0')}</span>
      <span class="chip" :class="$store.course.modStats['${m.id}']?.pct === 100 ? 'accent' : ''">
        <span x-text="$store.course.modStats['${m.id}']?.pct || 0"></span>%
      </span>
    </div>
    <h3 style="margin:10px 0 4px">${esc(m.title)}</h3>
    <div class="tiny muted">${esc(m.blurb)}</div>
    <div class="bar" style="margin-top:12px"><span :style="'width:' + ($store.course.modStats['${m.id}']?.pct || 0) + '%'"></span></div>
    <div class="row tiny muted" style="margin-top:8px;justify-content:space-between">
      <span>${m.units.reduce((n, u) => n + u.tasks.length, 0)} tasks · ${m.quiz.length} quiz</span>
      <span x-show="$store.course.modStats['${m.id}']?.complete">✓ complete</span>
    </div>
  </a>`
}

export function renderHome() {
  return `
  <div class="stack">
    <div class="card" style="background:linear-gradient(160deg,#132043,#101a30)">
      <div class="grid two" style="align-items:center;gap:22px">
        <div>
          <span class="chip accent">Alpine.js 3.17.4 · complete curriculum</span>
          <h1 style="margin:12px 0 6px;font-size:2rem">Learn Alpine by solving actuarial, statistical and geometric problems.</h1>
          <p style="max-width:60ch">
            Eighteen modules take you from <code>x-data</code> to writing your own directives, plugins and reactivity.
            Every step ends in a task that is <b>auto-checked in a live sandbox</b>, and every module ends in quiz items
            written to be argued with. Nothing is uploaded anywhere: the whole course runs in this page.
          </p>
          <div class="row">
            <a class="btn-primary btn" href="#/path">Start the study path →</a>
            <a class="btn" href="#/m/${modules[0].id}">Jump into Module 1</a>
            <a class="btn btn-ghost" href="#/cheatsheet">Cheatsheet</a>
          </div>
          <div class="row tiny muted" style="margin-top:14px">
            <span class="chip">${stats.moduleCount} modules</span>
            <span class="chip">${stats.lessonCount} lessons</span>
            <span class="chip">${stats.taskCount} auto-checked tasks</span>
            <span class="chip">${stats.quizCount} quiz items</span>
            <span class="chip">0 network calls</span>
          </div>
        </div>
        <div class="row" style="justify-content:center;gap:24px">
          ${gaugeHTML()}
        </div>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <div class="card-head">
          <h3>How your mastery score is built</h3>
          <div style="flex:1"></div>
          <span class="badge-lvl" x-text="'Level: ' + $store.course.score.level.name"></span>
        </div>
        ${breakdown()}
        <p class="tiny muted" x-text="$store.course.score.level.note" style="margin-bottom:0"></p>
      </div>

      <div class="card">
        <h3>Pick up where you left off</h3>
        <p class="muted" id="continue-note">The fastest way to move the needle is the next unfinished module.</p>
        <div class="row">
          <a class="btn-primary btn" :href="'#/m/' + $store.course.nextId()">
            Continue with <span x-text="$store.course.nextTitle()"></span> →
          </a>
        </div>
        <hr>
        <h4>How to use this course</h4>
        <ol class="tiny" style="margin-bottom:0">
          <li>Read the two or three sentences of theory — that is all the theory there is.</li>
          <li>Write the markup in the sandbox until the preview does what the task says.</li>
          <li>Press <b>Check my work</b>. Failing output tells you exactly what the sandbox saw.</li>
          <li>Answer the quiz items on the first try; they are designed so that half-remembering fails.</li>
          <li>Anything unclear? The official docs page for the feature is linked in every module.</li>
        </ol>
      </div>
    </div>

    <h2>The curriculum</h2>
    <div class="grid three">
      ${modules.map(moduleCard).join('')}
    </div>

    <div class="card">
      <h3>Built to be read by every brain</h3>
      <p class="tiny">
        Dark by default with low-glare panels, no italics anywhere, wide word and letter spacing, 1.75+ line height,
        short line lengths, never colour-alone signals (every state also carries a symbol, a label or a number),
        44px minimum hit targets and a visible focus ring on everything.
        The <b>Aa</b> button in the toolbar cycles Lexend → Atkinson Hyperlegible → OpenDyslexic,
        <b>A−/A+</b> resizes text, <b>⇕ space</b> widens word spacing and <b>▭ ruler</b> adds a line-follower.
        All of it is remembered by your browser, and all of it is switchable from the keyboard.
      </p>
    </div>

    <div class="footer">
      <p class="tiny muted">
        Datasets used throughout: a Gompertz–Makeham teaching life table, a five-year loss-development triangle,
        a Bühlmann credibility study, a bond pricing set, and a compound-Poisson (λ = 200, Gamma severity) aggregate model.
        Every expected answer in the exercises is computed from those same assumptions, so the numbers can never drift.
      </p>
    </div>
  </div>`
}
