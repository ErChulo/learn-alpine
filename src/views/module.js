/* =============================================================================
 * views/module — one curriculum module: objective, guided steps, exercises,
 * quiz and the finish line.
 * ========================================================================== */

import { workbench, quizItem, theory, example, callout } from './partials.js'
import { esc, mini } from '../lib/utils.js'

const wbCfg = (mod, u) => ({
  unitKey: `${mod.id}.${u.id}`,
  moduleId: mod.id,
  unitId: u.id,
  starter: u.starter || '',
  solution: u.solution || '',
  mode: u.mode || 'provided',
  hints: (u.hints || []).map(h => mini(h)),
  tasks: u.tasks.map(t => ({ id: t.id, text: t.text, checks: t.checks, skill: t.skill, phase: t.phase }))
})

function docsBlock(mod) {
  if (!mod.docRefs || !mod.docRefs.length) return ''
  return `<div class="row" style="margin-top:10px">
    <span class="tiny muted">Official reading for this module:</span>
    ${mod.docRefs.map(d => `<a class="chip info" href="${d.url}" target="_blank" rel="noreferrer">${esc(d.label)} ↗</a>`).join('')}
  </div>`
}

function progressCard(mod) {
  return `
  <div class="card">
    <div class="card-head">
      <h3>Your progress in this module</h3>
      <div style="flex:1"></div>
      <span class="chip" :class="$store.course.modStats['${mod.id}']?.pct === 100 ? 'accent' : ''">
        <span x-text="$store.course.modStats['${mod.id}']?.pct || 0"></span>%
      </span>
    </div>
    <div class="bar"><span :style="'width:' + ($store.course.modStats['${mod.id}']?.pct || 0) + '%'"></span></div>
    <div class="row" style="margin-top:12px">
      <span class="tiny muted"
            x-text="($store.course.modStats['${mod.id}']?.tasksPass || 0) + ' of ' + ${mod.units.reduce((n, u) => n + u.tasks.length, 0)} + ' tasks passed · ' +
                   ($store.course.modStats['${mod.id}']?.quizPass || 0) + ' of ' + ${mod.quiz.length} + ' quiz items correct'"></span>
      <div style="flex:1"></div>
      <button class="btn-sm" @click="$store.course.complete('${mod.id}', !$store.course.modStats['${mod.id}']?.complete)">
        <span x-text="$store.course.modStats['${mod.id}']?.complete ? '↺ un-mark complete' : '✓ mark module complete'"></span>
      </button>
    </div>
    ${docsBlock(mod)}
  </div>`
}

function stepCard(mod, u, i) {
  return `
  <section class="step" x-data="{ open: ${i === 0} }">
    <button class="step-head" type="button" @click="open = ! open" :aria-expanded="open">
      <span class="sn">${String(i + 1).padStart(2, '0')}</span>
      <span class="st">${esc(u.title)}</span>
      <span class="chip" :class="$store.course.unitDone('${mod.id}', '${u.id}') ? 'accent' : ''">
        <span x-text="$store.course.unitPct('${mod.id}', '${u.id}')"></span>
      </span>
      <span class="chev" :class="open ? 'open' : ''">▾</span>
    </button>
    <div class="sb stack sb-fold" :class="open ? '' : 'folded'">
      ${u.objective ? `<p class="tiny" style="margin:0"><span class="chip info" style="margin-right:6px">objective</span>${mini(u.objective)}</p>` : ''}
      ${theory(u)}
      ${u.bullets ? `<ul>${u.bullets.map(b => `<li>${mini(b)}</li>`).join('')}</ul>` : ''}
      ${u.example ? example(u) : ''}
      ${(u.tips || []).map(t => callout(t.kind || 'info', t.title, t.body)).join('')}
      ${u.tasks && u.tasks.length ? workbench(wbCfg(mod, u)) : ''}
    </div>
  </section>`
}

function exerciseCard(mod, u, i) {
  return `
  <div class="card">
    <div class="card-head">
      <span class="chip accent">Exercise ${i + 1}</span>
      <h3 style="flex:1">${esc(u.title)}</h3>
      <span class="chip" :class="$store.course.unitDone('${mod.id}', '${u.id}') ? 'accent' : ''">
        <span x-text="$store.course.unitPct('${mod.id}', '${u.id}')"></span>
      </span>
    </div>
    ${u.scenario ? `<div class="callout info"><div class="cal-head"><span>◆</span><span>The brief</span></div><p style="margin:0">${mini(u.scenario)}</p></div>` : ''}
    ${u.objective ? `<p class="tiny muted">Objective: ${mini(u.objective)}</p>` : ''}
    ${u.bullets ? `<ul>${u.bullets.map(b => `<li>${mini(b)}</li>`).join('')}</ul>` : ''}
    ${u.example ? example(u) : ''}
    ${(u.tips || []).map(t => callout(t.kind || 'info', t.title, t.body)).join('')}
    ${workbench(wbCfg(mod, u))}
  </div>`
}

function finishCard(mod, next) {
  return `
  <div class="card" style="background:#101a30">
    <h3>Finish line</h3>
    <p>You own this module when you can do all of the following <b>without looking at the solution</b>:</p>
    <ul>${(mod.mastery || []).map(m => `<li>${mini(m)}</li>`).join('')}</ul>
    <div class="row">
      <button class="btn-primary" @click="$store.course.complete('${mod.id}')">Mark module ${mod.num} complete</button>
      ${next ? `<a class="btn" href="#/m/${next.id}">Next: ${esc(next.title)} →</a>` : `<a class="btn" href="#/insights">See your mastery breakdown →</a>`}
    </div>
  </div>`
}

export function renderModule(mod, next) {
  const steps = mod.units.filter(u => u.kind !== 'exercise')
  const exercises = mod.units.filter(u => u.kind === 'exercise')
  return `
  <div class="stack">
    <div>
      <div class="crumb">Module ${mod.num} of 18 · ${esc(mod.blurb)}</div>
      <h1>${esc(mod.title)}</h1>
      <p style="font-size:1.06rem"><b>Goal · </b>${mini(mod.goal)}</p>
    </div>

    ${mod.intro ? `<div class="card">${mod.intro.split('\n\n').map(p => `<p>${mini(p)}</p>`).join('')}</div>` : ''}
    ${progressCard(mod)}

    ${steps.length ? `<h2>Guided steps</h2><p class="muted tiny">Each step is short on purpose: a few lines of theory, then a checked task that forces you to write the syntax yourself. Press <b>Check my work</b> when you think a task is done — the sandbox tells you exactly what it saw.</p>${steps.map((u, i) => stepCard(mod, u, i)).join('')}` : ''}

    ${exercises.length ? `<h2>Exercises</h2><p class="muted tiny">Real problems from actuarial, statistical and geometric practice. They are harder than the steps: you get a scenario, a dataset and a spec, not a recipe.</p>${exercises.map((u, i) => exerciseCard(mod, u, i)).join('')}` : ''}

    <h2>Quiz</h2>
    <p class="muted tiny">${mod.quiz.length} items. First submission counts in full, a corrected answer counts half — guessing is expensive, understanding is cheap.</p>
    ${mod.quiz.map((q, i) => quizItem(q, mod.id, i)).join('')}

    ${finishCard(mod, next)}
  </div>`
}
