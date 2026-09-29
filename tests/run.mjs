/* =============================================================================
 * run.mjs — fast, browser-free checks on the course itself.
 *
 *   1. content integrity   ids, shapes, quiz answers, every check kind exists
 *   2. actuarial maths     identities that must hold (A_x = 1 − d·ä_x, …)
 *   3. reference coverage  the whole Alpine 3.17 surface is present and mapped
 *   4. curriculum quality 每 module has steps, real exercises and a quiz
 *
 *   node tests/run.mjs
 * ========================================================================== */

import { modules, stats } from '../src/content/index.js'
import { reference } from '../src/content/reference.js'
import { checkKinds, CUSTOM } from '../src/lib/checks.js'
import * as data from '../src/content/data.js'

let pass = 0, fail = 0
const failures = []
const ok = (cond, label, extra = '') => {
  if (cond) { pass++ }
  else { fail++; failures.push(`${label}${extra ? ' — ' + extra : ''}`); console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`) }
}
const group = name => console.log(`\n▸ ${name}`)

/* ------------------------------------------------------------ 1. structure */
group('content integrity')
const ACTION_KEYS = ['click', 'dblclick', 'hover', 'focus', 'blur', 'type', 'set', 'select', 'key', 'scrollIntoView', 'dispatch', 'resize', 'drag', 'mark', 'wait']
const needValue = ['text', 'textNumber', 'textMatch', 'textHas', 'textNotHas', 'count', 'countAtLeast', 'countAtMost', 'listLong', 'listUnique', 'attr', 'attrHas', 'klass', 'noKlass', 'styleIs', 'htmlHas', 'code', 'noCode', 'storage', 'storageGone', 'prop', 'list', 'listSet', 'listHas']

ok(modules.length === 18, 'the curriculum has 18 modules', `got ${modules.length}`)
ok(modules.every((m, i) => m.num === i + 1), 'module numbers are 1..18 in order')
ok(new Set(modules.map(m => m.id)).size === 18, 'module ids are unique')

for (const m of modules) {
  const where = m.id
  ok(!!m.title && !!m.blurb && !!m.goal && !!m.intro, `${where}: has title, blurb, goal and intro`)
  ok(Array.isArray(m.skills) && m.skills.length > 0, `${where}: declares skills`)
  ok(Array.isArray(m.docRefs) && m.docRefs.length > 0, `${where}: links to the official docs`)
  ok(Array.isArray(m.mastery) && m.mastery.length >= 3, `${where}: has ≥3 finish-line statements`)
  ok(m.units.length >= 3, `${where}: has ≥3 units`, `got ${m.units.length}`)
  ok(m.units.filter(u => u.kind === 'exercise').length >= 2, `${where}: has ≥2 real exercises`,
    `got ${m.units.filter(u => u.kind === 'exercise').length}`)
  ok(m.quiz.length >= 4, `${where}: quiz has ≥4 items`, `got ${m.quiz.length}`)
  ok(new Set(m.units.map(u => u.id)).size === m.units.length, `${where}: unit ids unique`)
  ok(new Set(m.quiz.map(q => q.id)).size === m.quiz.length, `${where}: quiz ids unique`)

  for (const u of m.units) {
    const at = `${where}.${u.id}`
    ok(u.tasks.length >= 1, `${at}: has at least one checked task`)
    ok(!!u.title && !!u.objective && !!u.brief, `${at}: has title, objective and brief`)
    ok(!!u.starter && !!u.solution, `${at}: has a starter and a worked solution`)
    ok(new Set(u.tasks.map(t => t.id)).size === u.tasks.length, `${at}: task ids unique`)
    ok((u.hints || []).length >= 2, `${at}: offers at least two hints`)
    for (const t of u.tasks) {
      ok(!!t.text && t.text.length > 20, `${at}.${t.id}: task text is a real instruction`)
      ok(!!t.skill, `${at}.${t.id}: tagged with a skill`)
      ok(Array.isArray(t.checks) && t.checks.length >= 1, `${at}.${t.id}: has checks`)
      for (const c of t.checks || []) {
        ok(checkKinds.includes(c.kind) || (c.kind === 'custom' && CUSTOM[c.name]) || CUSTOM[c.kind],
          `${at}.${t.id}: check kind "${c.kind}"${c.name ? '/' + c.name : ''} exists`)
        if (needValue.includes(c.kind) && c.value === undefined && c.pattern === undefined && !['list', 'listSet', 'listHas'].includes(c.kind)) {
          ok(false, `${at}.${t.id}: "${c.kind}" needs a value or pattern`)
        }
        for (const key of ['pattern', 'value']) {
          if (key === 'pattern' && typeof c.pattern === 'string' && ['code', 'noCode', 'textMatch'].includes(c.kind)) {
            try { new RegExp(c.pattern, c.flags || ''); ok(true, '') } catch (e) { ok(false, `${at}.${t.id}: regex /${c.pattern}/ does not compile`) }
          }
        }
        if (c.kind === 'textNumber') ok(Number.isFinite(c.value), `${at}.${t.id}: textNumber value is finite`)
        for (const a of c.do || []) {
          const keys = Object.keys(a)
          ok(keys.some(k => ACTION_KEYS.includes(k)), `${at}.${t.id}: action ${JSON.stringify(a)} is known`)
          if ('dispatch' in a) ok(!!a.event, `${at}.${t.id}: dispatch action names its event`)
          if ('drag' in a) ok(!!a.to, `${at}.${t.id}: drag action names its target`)
          if ('type' in a) ok(a.value !== undefined, `${at}.${t.id}: type action needs a value`)
        }
      }
    }
  }

  /* markup lint: an x-data attribute cut short by a stray quote silently kills
     the whole component, so every x-data expression must compile. */
  for (const u of m.units) {
    const at = `${where}.${u.id}`
    for (const [field, src] of [['starter', u.starter], ['solution', u.solution]]) {
      if (typeof src !== 'string') continue
      for (const re of [/x-data\s*=\s*"([^"]*)"/g, /x-data\s*=\s*'([^']*)'/g]) {
        let hit
        while ((hit = re.exec(src))) {
          const expr = hit[1]
          try { new Function('return ' + expr); ok(true, '') }
          catch (e) {
            ok(false, `${at}: ${field} x-data expression does not compile`,
              `${JSON.stringify(expr.slice(-48))} — ${e.message}`)
          }
        }
      }
    }
  }

  for (const q of m.quiz) {
    const at = `${where}.${q.id}`
    ok(['mc', 'multi', 'short'].includes(q.type), `${at}: known quiz type`)
    ok(!!q.q && !!q.why && q.why.length > 40, `${at}: has a question and a real rationale`)
    if (q.type === 'mc') {
      ok(Array.isArray(q.options) && q.options.length >= 3 && q.options.length <= 5, `${at}: 3–5 options`)
      ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${at}: answer index in range`)
      ok(Object.keys(q.distractors || {}).length >= 1, `${at}: explains at least one distractor`)
      ok(!(q.distractors || {})[q.answer], `${at}: does not explain the correct option as a distractor`)
    }
    if (q.type === 'multi') {
      ok(Array.isArray(q.answers) && q.answers.length >= 2, `${at}: multi has ≥2 correct options`)
      ok(q.answers.every(i => i >= 0 && i < q.options.length), `${at}: answers in range`)
    }
    if (q.type === 'short') {
      ok(Array.isArray(q.accept) && q.accept.length >= 1, `${at}: short answer lists acceptable forms`)
    }
  }
}

/* ------------------------------------------------------ 2. actuarial maths */
group('actuarial and statistical maths')
const L = data.life
const closeTo = (a, b, tol, what) => ok(Math.abs(a - b) <= tol, what, `|${a} − ${b}| = ${Math.abs(a - b).toExponential(2)}`)

for (const [x, n] of [[0, 1], [40, 20], [65, 30], [90, 15]]) {
  closeTo(L.p(x, n), L.lx(x + n) / L.lx(x), 1e-12, `ₙpₓ identity at x=${x}, n=${n}`)
  closeTo(L.q(x, n) + L.p(x, n), 1, 1e-12, `q + p = 1 at x=${x}, n=${n}`)
}
for (const i of [0.02, 0.045, 0.07]) {
  const d = i / (1 + i)
  for (const x of [35, 55, 75]) {
    closeTo(L.A(x, i), 1 - d * L.aDue(x, i), 1e-10, `Aₓ = 1 − d·äₓ at x=${x}, i=${i}`)
    closeTo(L.AEndow(x, 20, i), L.ATerm(x, 20, i) + L.D(x + 20, i) / L.D(x, i), 1e-10, `Aₓ:ₙ = A¹ₓ:ₙ + ₙEₓ at x=${x}`)
    // recursion: äₓ:ₙ = äₓ:₁ + ᵥpₓ · äₓ₊₁:ₙ₋₁
    closeTo(L.aDueTemp(x, 20, i), 1 + L.p(x, 1) * Math.pow(1 + i, -1) * L.aDueTemp(x + 1, 19, i), 1e-9, `äₓ:ₙ recursion at x=${x}, i=${i}`)
    // the reserve at issue must be zero
    closeTo(L.reserve(x, 0, i), 0, 1e-12, `V₀ = 0 at x=${x}, i=${i}`)
  }
}
ok(L.aDue(60, 0.05) > L.aDue(60, 0.08), 'a higher interest rate lowers the annuity-due')
// A whole-life policy at 60 is worth far more than one year of cover (it pays
// whenever death occurs) and far less than the full sum assured.
ok(L.A(60, 0.05) > L.qx(60) && L.A(60, 0.05) < 1, 'whole-life insurance at 60 sits between the first-year cover and the sum assured')

const cl = data.chainLadder(data.triangle)
const handFactors = [1.4648117839607201, 1.2433628318584071, 1.1036789297658863, 1.0530120481927711, 1.024390243902439]
cl.factors.forEach((f, i) => closeTo(f, handFactors[i], 1e-6, `development factor ${i + 1} matches the hand calculation`))
checkNote('IBNR is positive for every accident year', cl.ibnr.every(v => v >= 0), () => `ibnr: ${cl.ibnr.map(v => v.toFixed(1)).join(', ')}`)

const bf = data.bornhuetterFerguson(data.triangle, 0.65, [1500, 1560, 1620, 1690, 1750])
checkNote('BF ultimate ≥ latest diagonal', bf.ultimates.every((u, k) => u >= cl.latest[k]), () => `${bf.ultimates.map(v => v.toFixed(0))}`)

const bm2 = data.bondMath(data.bond)
closeTo(bm2.price, bm2.disc.reduce((a, b) => a + b, 0), 1e-9, 'bond price = Σ discounted cash flows')
closeTo(bm2.modified, bm2.macaulay / 1.052, 1e-12, 'modified duration = Macaulay / (1 + y)')
ok(bm2.convexity > 0 && bm2.modified > 0, 'duration and convexity are positive')

const mm = data.moments(data.returns)
closeTo(mm.mean, data.returns.reduce((a, b) => a + b, 0) / data.returns.length, 1e-12, 'sample mean')
ok(Math.abs(mm.sd - data.returns.reduce((a, b) => a + (b - mm.mean) ** 2, 0) ** 0.5 / Math.sqrt(data.returns.length - 1)) < 1e-12, 'sample standard deviation')

const ig = data.informationGeometry
closeTo(ig.D_kl, 0.049857, 1e-6, 'KL divergence between Bernoulli(0.25) and Bernoulli(0.40)')
closeTo(ig.fisher(0.3, 40), 190.476, 1e-3, 'Fisher information n/(p(1−p)) at p=0.3, n=40')
ok(ig.mle(12, 40) === 0.3, 'the MLE of a Bernoulli rate is the sample proportion')

const am = data.aggregateMoments()
closeTo(am.expectedAggregate, 300000, 1e-6, 'compound Poisson mean = λ·μ = 300,000')
ok(am.varianceAggregate > am.expectedAggregate, 'the aggregate variance exceeds the mean (contagion)')

const gm = data.geomMath
closeTo(gm.hyp, 5, 1e-12, '3-4-5 triangle hypotenuse')
closeTo(gm.inradius, 1, 1e-12, '3-4-5 triangle inradius = (a+b−c)/2')
closeTo(gm.scalene.area, 16.0595, 1e-3, 'scalene area via ½ab·sin C')
closeTo(gm.circle.sagitta, 10 - 8, 1e-12, 'circle sagitta r − √(r² − (c/2)²)')

function checkNote(label, cond, detail) { if (!cond) ok(false, label, detail ? detail() : '') ; else pass++ }

/* ----------------------------------------------------- 3. reference surface */
group('reference coverage')
const needed = [
  // directives
  'x-data', 'x-text', 'x-html', 'x-bind', 'x-cloak', 'x-ignore', 'x-show', 'x-if', 'x-for', 'x-teleport',
  'x-init', 'x-effect', 'x-on', 'x-model', 'x-modelable', 'x-mask', 'x-ref', 'x-id', 'x-collapse', 'x-trap',
  'x-anchor', 'x-resize', 'x-sort', 'x-intersect', 'x-transition',
  // magics
  '$el', '$refs', '$store', '$data', '$root', '$id', '$watch', '$dispatch', '$nextTick', '$persist',
  '$anchor', '$width/$height (plugin)', '$item / $position (plugin)', '$event', '$now / custom magics',
  // globals
  'Alpine.data()', 'Alpine.store()', 'Alpine.bind()', 'Alpine.directive()', 'Alpine.magic()', 'Alpine.plugin()',
  'Alpine.reactive()', 'Alpine.effect()', 'Alpine.raw()', 'Alpine.release()', 'Alpine.morph()',
  'Alpine.deferInit()', 'Alpine.interceptInit()', 'Alpine.start() / plugin()', 'Alpine.closestDataStack()',
  'Alpine.addScopeToNode()',
  // lifecycle events
  'alpine:init', 'alpine:initialized', 'Custom events',
  // modifiers
  '.prevent / .stop', '.outside', '.window / .document', '.once', '.debounce / .throttle', '.self / .camel / .dot',
  'Key modifiers', 'Mouse modifiers', '.passive'
]
const refNames = reference.map(r => r.n)
for (const token of needed) ok(refNames.includes(token), `reference documents ${token}`)
ok(reference.length >= 100, 'the reference has ≥100 rows', `got ${reference.length}`)
for (const r of reference) {
  ok(modules.some(m => m.num === r.m), `reference row "${r.n}" points at a real module (m${r.m})`)
  ok(/^https:\/\/alpinejs\.dev\//.test(r.u), `reference row "${r.n}" links to alpinejs.dev`)
}

/* ------------------------------------------------------- 4. curriculum shape */
group('curriculum shape')
const skills = new Set(modules.flatMap(m => m.units.flatMap(u => u.tasks.map(t => t.skill))))
ok(skills.size >= 40, `tasks cover at least 40 distinct skills (${skills.size})`)
const quizSkills = new Set(modules.flatMap(m => m.quiz.map(q => q.skill).filter(Boolean)))
ok(quizSkills.size >= 20, `quiz items cover at least 20 distinct skills (${quizSkills.size})`)
ok(stats.taskCount >= 190, `at least 190 auto-checked tasks (${stats.taskCount})`)
ok(stats.quizCount >= 95, `at least 95 quiz items (${stats.quizCount})`)
ok(modules.every(m => m.units.some(u => u.example) || m.units.every(u => u.brief.length > 200)), 'every module teaches before it tests')

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} assertions passed, ${fail} failed`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures.slice(0, 40)) console.log('  · ' + f)
  if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`)
}
process.exit(fail === 0 ? 0 : 1)
