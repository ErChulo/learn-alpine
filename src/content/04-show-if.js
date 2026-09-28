/* Module 4 — conditional rendering: x-show vs x-if.
 * Matches: /directives/show, /directives/if */

import { life, triangle, chainLadder, rnd, sq } from './data.js'

const AGES = [45, 55, 65]
const WHOLE = AGES.map(a => Number(life.aDue(a, 0.045).toFixed(4)))
const TEMP = AGES.map(a => Number(life.aDueTemp(a, 15, 0.045).toFixed(4)))
const GAP = Number((WHOLE[0] - TEMP[0]).toFixed(4))
const CHEAP = AGES[TEMP.indexOf(Math.min(...TEMP))]

const cl = chainLadder(triangle)
const lr = 0.72            // a loss ratio that breaches a 0.70 threshold
const threshold = 0.70
const worstAy = triangle.years[cl.latest.indexOf(Math.max(...cl.latest))]

export default {
  id: 'm04',
  num: 4,
  title: 'Showing, hiding and removing things',
  blurb: 'x-show keeps the DOM, x-if builds it, and the trade-off decides your app.',
  goal: 'Choose deliberately between hiding an element and removing it — and be able to explain the state consequences of each.',
  intro: `Two directives, one decision. **\`x-show\`** flips \`display: none\`; the element (and its state, focus, inputs, children) stays right where it is. **\`x-if\`** adds and removes the element entirely, so anything living inside it is destroyed and rebuilt.\n\nThe cost is the other way round: \`x-show\` is cheap to toggle but the element is always in the DOM, and \`x-if\` costs a teardown/rebuild every time it flips but keeps the DOM clean and the memory small.`,
  skills: ['x-show', 'x-if'],
  docRefs: [
    { label: 'x-show', url: 'https://alpinejs.dev/directives/show' },
    { label: 'x-if', url: 'https://alpinejs.dev/directives/if' }
  ],
  mastery: [
    'Toggle a panel with `x-show` and prove the DOM element survives',
    'Remove a panel with `x-if` and prove a form field inside it forgets its value',
    'Pick the right one for a heavy table versus a cheap tooltip, and justify the choice',
    'Use nested `x-if` for a data-driven branch (best rate, largest accident year)'
  ],
  units: [
    {
      id: 's1',
      title: 'x-show: hiding without losing anything',
      objective: 'Hide a panel and prove that nothing inside it is destroyed.',
      brief: `\`x-show\` writes \`display: none\` (inline style) when the expression is falsy, and removes it when truthy. Because the element never leaves the document, a half-finished input keeps its text, an open \`<details>\` stays open, and any child component keeps its state.`,
      starter: `<div x-data="{ open: true, note: '' }">
  <button data-testid="toggle" @click="open = ! open">toggle notes</button>
  <section data-testid="panel" x-show="open">
    <input type="text" x-model="note" placeholder="underwriting note">
  </section>
</div>`,
      solution: `<div x-data="{ open: true, note: '' }">
  <button data-testid="toggle" @click="open = ! open">toggle notes</button>
  <section data-testid="panel" x-show="open">
    <input type="text" data-testid="input" x-model="note" placeholder="underwriting note">
  </section>
</div>`,
      hints: [
        'The toggle is a one-liner: `@click="open = ! open"`.',
        'The check looks at the computed `display` of the panel, so the element must carry `data-testid="panel"`.',
        'Type into the input, hide the panel, show it again — the text is still there. That is the whole point of `x-show`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-show',
          text: 'Mark the section `data-testid="panel"`, put the input inside it with `data-testid="input"` and bound to `note` with `x-model`. Clicking `data-testid="toggle"` must hide the panel (and clicking again must show it).',
          checks: [
            { kind: 'shown', selector: '[data-testid="panel"]' },
            { kind: 'hidden', selector: '[data-testid="panel"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'shown', selector: '[data-testid="panel"]', do: [{ click: '[data-testid="toggle"]' }] }
          ]
        },
        {
          id: 't2',
          skill: 'x-show',
          text: 'Prove the panel is only hidden, never destroyed: type `mortality review` into the input, hide the panel, and the input must **still hold its value** while it is invisible.',
          checks: [
            { kind: 'exists', selector: '[data-testid="panel"] input' },
            { kind: 'prop', selector: '[data-testid="input"]', prop: 'value', value: 'mortality review', do: [{ type: '[data-testid="input"]', value: 'mortality review' }] },
            { kind: 'hidden', selector: '[data-testid="panel"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'prop', selector: '[data-testid="input"]', prop: 'value', value: 'mortality review' },
            { kind: 'exists', selector: '[data-testid="panel"]' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'x-if: removing for real',
      objective: 'Rebuild a subtree conditionally and watch the state disappear.',
      brief: `\`x-if\` must sit on a \`<template>\` (templates are inert containers: everything inside is cloned into place when the condition becomes true, and removed when it becomes false). There is no \`x-else\`: for alternatives you use two templates with opposite conditions.\n\nBecause the subtree is destroyed, anything inside it is destroyed too: input values, scroll positions, child components and their \`x-init\`. That is a feature (a fresh form, every time) and a trap (a lost half-typed field).`,
      example: {
        code: `<template x-if="!rows.length">
  <p>No loss data loaded yet.</p>
</template>
<template x-if="rows.length">
  <table>…</table>
</template>`,
        note: 'Two templates, opposite conditions — that is the idiom that replaces an `else` branch.'
      },
      starter: `<div x-data="{ open: true }">
  <button data-testid="toggle" @click="open = ! open">toggle</button>
  <template x-if="open">
    <section data-testid="panel"><input data-testid="input" placeholder="transient field"></section>
  </template>
</div>`,
      solution: `<div x-data="{ open: true }">
  <button data-testid="toggle" @click="open = ! open">toggle</button>
  <template x-if="open">
    <section data-testid="panel"><input data-testid="input" placeholder="transient field"></section>
  </template>
  <template x-if="!open">
    <p data-testid="empty">No panel open.</p>
  </template>
  <p data-testid="state" x-text="open ? 'open' : 'closed'"></p>
</div>`,
      hints: [
        '`x-if` on anything other than a `<template>` will not work — that is a common first error.',
        'The alternative branch is a second template with the negated condition.',
        'Keep a status element bound to the same flag so you can see the state even when the subtree is gone.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-if',
          text: 'Rebuild the toggle with `x-if`: when `open` is false the panel must be **removed from the DOM** entirely (not merely hidden), and `data-testid="state"` must read `closed`.',
          checks: [
            { kind: 'exists', selector: '[data-testid="panel"]' },
            { kind: 'notExists', selector: '[data-testid="panel"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'text', selector: '[data-testid="state"]', value: 'closed' },
            { kind: 'exists', selector: '[data-testid="panel"]', do: [{ click: '[data-testid="toggle"]' }] }
          ]
        },
        {
          id: 't2',
          skill: 'x-if',
          text: 'Add the `else` idiom: a second template rendering `data-testid="empty"` with the text `No panel open.` while the panel is closed.',
          checks: [
            { kind: 'exists', selector: '[data-testid="empty"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'text', selector: '[data-testid="empty"]', value: 'No panel open.' },
            { kind: 'notExists', selector: '[data-testid="empty"]', do: [{ click: '[data-testid="toggle"]' }] }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Branching on data, not on a flag',
      objective: 'Build a two-way branch driven by a computed value.',
      brief: `Real conditions are rarely booleans: they are comparisons. \`x-if\` takes any expression, so the branching logic can live in a getter and the markup stays readable.

Annuity-due values at 4.5 %, whole life versus 15-year temporary, from (45), (55) and (65):

| age | ä whole life | äₓ:15 |
| --- | --- | --- |
| 45 | ${WHOLE[0]} | ${TEMP[0]} |
| 55 | ${WHOLE[1]} | ${TEMP[1]} |
| 65 | ${WHOLE[2]} | ${TEMP[2]} |

The *longevity gap* — how much extra the whole-life promise is worth at age 45 — is \`${GAP}\` years of payment.`,
      example: {
        code: `<p x-show="gap > 5">Longevity risk is material here.</p>
<template x-if="gap > 5"><p>Same condition, but the node is really there.</p></template>`,
        note: '`x-show` keeps a hidden node; `x-if` decides at build time. For a two-way branch, use two templates.'
      },
      starter: `<div x-data="{ whole: ${sq(WHOLE)}, temp: ${sq(TEMP)}, ages: ${sq(AGES)} }">
  <!-- gap branch + cheapest age -->
</div>`,
      solution: `<div x-data="{
  whole: ${sq(WHOLE)},
  temp: ${sq(TEMP)},
  ages: ${sq(AGES)},
  get gap() { return Number((this.whole[0] - this.temp[0]).toFixed(4)) },
  get cheapest() { return this.ages[this.temp.indexOf(Math.min(...this.temp))] }
}">
  <template x-if="gap > 5">
    <p data-testid="wide">Longevity gap of <b data-testid="gap" x-text="gap.toFixed(4)"></b> years — whole-life cover matters.</p>
  </template>
  <template x-if="gap <= 5">
    <p data-testid="narrow">Gap is small; the term cover is doing the work.</p>
  </template>
  <p>cheapest temporary annuity at age <b data-testid="best" x-text="cheapest"></b></p>
</div>`,
      hints: [
        'A getter `get gap() { return this.whole[0] - this.temp[0] }` keeps the condition legible.',
        'The two templates must cover the condition completely — one for `> 5`, one for `<= 5`.',
        `The gap is ${GAP}, so the "wide" branch is the live one — the other template must not produce a node.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-if',
          text: `Render \`data-testid="wide"\` only while the longevity gap exceeds 5 and \`data-testid="narrow"\` only while it does not. Exactly one of them may be in the DOM at any moment, and exactly one template may be present.`,
          checks: [
            { kind: 'exists', selector: '[data-testid="wide"]' },
            { kind: 'notExists', selector: '[data-testid="narrow"]' },
            { kind: 'count', selector: '[data-testid="wide"], [data-testid="narrow"]', value: 1 }
          ]
        },
        {
          id: 't2',
          skill: 'getters',
          text: `Show the gap itself in \`data-testid="gap"\` (4 dp, expected ${GAP}) and the age with the smallest temporary annuity in \`data-testid="best"\` (expected ${CHEAP}).`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="gap"]', value: GAP, tol: 0.0005 },
            { kind: 'text', selector: '[data-testid="best"]', value: String(CHEAP) }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — loss-ratio alert panel',
      objective: 'Decide between x-show and x-if for two panels with very different costs.',
      scenario: `An underwriting dashboard tracks a loss ratio that is currently ${rnd(lr, 2)} against a threshold of ${rnd(threshold, 2)}. Two panels exist: a one-line **alert banner** the user toggles all day, and a **100-row experience table** that is expensive to build and only interesting when someone asks for it.`,
      brief: `Markup requirements: the alert banner (marked \`data-testid="alert"\`) must be toggled cheaply and keep its DOM node; the heavy table (marked \`data-testid="heavy"\`) must not exist in the DOM until the user opens it, and must be removed again on close. Add \`data-testid="breach"\` showing \`BREACH\` when the loss ratio exceeds the threshold.`,
      starter: `<div x-data="{ lr: ${rnd(lr, 2)}, threshold: ${rnd(threshold, 2)}, showAlert: true, showTable: false }">
  <!-- alert banner, breach flag, heavy table -->
</div>`,
      solution: `<div x-data="{ lr: ${rnd(lr, 2)}, threshold: ${rnd(threshold, 2)}, showAlert: true, showTable: false, rows: ${JSON.stringify(triangle.rows.map((r, i) => [triangle.years[i], r[r.length - 1]]))} }">
  <p data-testid="breach" x-text="lr > threshold ? 'BREACH' : 'within appetite'"></p>

  <button data-testid="toggleAlert" @click="showAlert = ! showAlert">alert</button>
  <p data-testid="alert" x-show="showAlert" :class="{ warn: lr > threshold }">
    Loss ratio <b x-text="lr"></b> vs appetite <b x-text="threshold"></b>
  </p>

  <button data-testid="toggleTable" @click="showTable = ! showTable">experience table</button>
  <template x-if="showTable">
    <table data-testid="heavy">
      <tbody>
        <template x-for="r in rows" :key="r[0]">
          <tr><td x-text="r[0]"></td><td x-text="r[1]"></td></tr>
        </template>
      </tbody>
    </table>
  </template>
</div>`,
      hints: [
        'Alert banner: `x-show` — it is toggled constantly, and keeping the node means no rebuild cost.',
        'Heavy table: `x-if` on a `<template>` — it should not even exist until asked for.',
        'The breach flag is a ternary in `x-text`: `lr > threshold ? \'BREACH\' : \'within appetite\'`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-show',
          text: 'Show the breach flag (`data-testid="breach"` reading `BREACH`) and the alert banner (`data-testid="alert"`), which must survive hiding: after clicking `data-testid="toggleAlert"` the element must still be in the DOM but hidden.',
          checks: [
            { kind: 'text', selector: '[data-testid="breach"]', value: 'BREACH' },
            { kind: 'shown', selector: '[data-testid="alert"]' },
            { kind: 'hidden', selector: '[data-testid="alert"]', do: [{ click: '[data-testid="toggleAlert"]' }] },
            { kind: 'exists', selector: '[data-testid="alert"]' }
          ]
        },
        {
          id: 't2',
          skill: 'x-if',
          text: 'The heavy table (`data-testid="heavy"`) must be absent until `data-testid="toggleTable"` is clicked, then present with 5 accident-year rows, then absent again after a second click.',
          checks: [
            { kind: 'notExists', selector: '[data-testid="heavy"]' },
            { kind: 'exists', selector: '[data-testid="heavy"]', do: [{ click: '[data-testid="toggleTable"]' }] },
            { kind: 'count', selector: '[data-testid="heavy"] tr', value: 5 },
            { kind: 'notExists', selector: '[data-testid="heavy"]', do: [{ click: '[data-testid="toggleTable"]' }] }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — expandable mortality rows',
      objective: 'Combine x-for with a per-row x-if so a table can reveal detail on demand.',
      scenario: `A mortality table for ages 40–80 is shown as a summary list. Clicking a row must open a detail block *inside that row* showing qₓ, lₓ and dₓ; only one row needs to be open at a time, and the open row must be identified by age (not by index, which breaks the moment the table is sorted).`,
      brief: `Rows: ${[40, 50, 60, 70, 80].map(a => `${a} → q ${rnd(life.qx(a), 6)}`).join(' · ')} with l₄₀ = 100,000. Render the summary with \`x-for\`, open the detail with a nested \`x-if\` inside the row template, and show the detail for age 60 only after its row is clicked.`,
      starter: `<div x-data="{
  open: null,
  rows: [${[40, 50, 60, 70, 80].map(a => `{ x: ${a}, q: ${rnd(life.qx(a), 6)} }`).join(', ')}]
}">
</div>`,
      solution: `<div x-data="{
  open: null,
  rows: [${[40, 50, 60, 70, 80].map(a => `{ x: ${a}, q: ${rnd(life.qx(a), 6)} }`).join(', ')}],
  l0: 100000,
  get table() {
    let l = this.l0
    return this.rows.map(r => { const d = l * r.q; const row = { ...r, l, d }; l -= d; return row })
  }
}">
  <ul>
    <template x-for="r in table" :key="r.x">
      <li>
        <button data-testid="row" @click="open = (open === r.x ? null : r.x)">
          age <b x-text="r.x"></b> — <span x-text="(r.q * 100).toFixed(3) + '%'"></span>
        </button>
        <template x-if="open === r.x">
          <div data-testid="detail">
            l<sub>40</sub>-scaled l<sub>x</sub> = <b x-text="r.l.toFixed(0)"></b>,
            deaths = <b x-text="r.d.toFixed(0)"></b>
          </div>
        </template>
      </li>
    </template>
  </ul>
  <p data-testid="openAge" x-text="open ?? 'none'"></p>
</div>`,
      hints: [
        'A single `open` variable holding the *age* (not the index) is the robust pattern.',
        'Clicking the same row again should close it: `open = (open === r.x ? null : r.x)`.',
        'The detail block lives inside the `x-for` template, so it is created per row by a nested `x-if`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-for',
          text: 'Render five rows, each marked `data-testid="row"`, with no detail block visible initially.',
          checks: [
            { kind: 'count', selector: '[data-testid="row"]', value: 5 },
            { kind: 'notExists', selector: '[data-testid="detail"]' },
            { kind: 'text', selector: '[data-testid="row"]', nth: 2, value: 'age 60 — 1.260%' }
          ]
        },
        {
          id: 't2',
          skill: 'x-if',
          text: 'Clicking the third row (age 60) must create exactly one detail block containing `99252` (the derived l₆₀ on a 100,000 radix) and set `data-testid="openAge"` to `60`.',
          checks: [
            { kind: 'count', selector: '[data-testid="detail"]', value: 1, do: [{ click: '[data-testid="row"]', nth: 2 }] },
            { kind: 'textNumber', selector: '[data-testid="detail"] b', nth: 0, value: 99252, tol: 2 },
            { kind: 'text', selector: '[data-testid="openAge"]', value: '60' }
          ]
        },
        {
          id: 't3',
          skill: 'x-if',
          text: 'Clicking the same row again must remove the detail block entirely (not just hide it): after the previous step the row is open, so one more click closes it.',
          checks: [
            { kind: 'notExists', selector: '[data-testid="detail"]', do: [{ click: '[data-testid="row"]', nth: 2 }] },
            { kind: 'text', selector: '[data-testid="openAge"]', value: 'none' },
            { kind: 'exists', selector: '[data-testid="detail"]', do: [{ click: '[data-testid="row"]', nth: 2 }] }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-show',
      q: 'A user types half a policy number into a field inside a panel, then closes the panel with `x-show="open"`. What happens to the typed text?',
      options: [
        'It is lost, because the element is destroyed',
        'It is kept, because the element was only hidden',
        'It is kept only if you also used `x-model`',
        'It is cleared on the next `x-init`'
      ],
      answer: 1,
      why: '`x-show` never removes anything from the DOM: it toggles `display`. The input, its value and its focus history are untouched.',
      distractors: {
        0: 'That would be `x-if` on a `<template>`.',
        2: '`x-model` syncs the value to state, but plain inputs keep their value too — the element never went away.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'x-if',
      q: 'Which markup correctly renders a table only when `rows.length` is non-zero?',
      options: [
        '<table x-if="rows.length">…</table>',
        '<template x-if="rows.length"><table>…</table></template>',
        '<template x-show="rows.length"><table>…</table></template>',
        '<div x-if="rows.length"><table>…</table></div>'
      ],
      answer: 1,
      why: '`x-if` must live on a `<template>`, which is how Alpine adds and removes real DOM nodes.',
      distractors: {
        0: 'Directives on a real element will not give you conditional *removal*; Alpine expects a template for `x-if`.',
        2: '`x-show` hides but never removes — and it does not belong on a `<template>` either.',
        3: 'Same problem as A: `x-if` on a live element is not the supported pattern.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'x-if',
      q: 'You need an if/else. How is that expressed in Alpine?',
      options: [
        '`x-if` / `x-else`',
        '`x-if` / `x-else-if`',
        'Two `<template x-if>` blocks with opposite conditions',
        '`x-switch`'
      ],
      answer: 2,
      why: 'Alpine has no `x-else`: you write two templates with complementary conditions. A ternary inside the expression is the alternative when the branches are small.',
      distractors: {
        0: 'There is no `x-else` directive.',
        1: 'Nor `x-else-if`.'
      }
    },
    {
      id: 'q4',
      type: 'multi',
      skill: 'x-show',
      q: 'Which statements about the x-show / x-if trade-off are true?',
      options: [
        '`x-show` is cheaper to toggle because it only touches a style',
        '`x-if` keeps memory lower because the subtree genuinely leaves the DOM',
        '`x-if` preserves input values across toggles',
        '`x-show` works with `x-transition` directly, which is why the docs use it for dropdowns'
      ],
      answers: [0, 1, 3],
      why: 'Hide cheaply with `x-show` when the subtree is light and stateful; remove with `x-if` when the subtree is heavy, or must be rebuilt fresh.',
      distractors: { 2: '`x-if` destroys the subtree, so input values are gone — that is the classic surprise.' }
    },
    {
      id: 'q5',
      type: 'short',
      skill: 'x-if',
      q: 'Which attribute (not directive) is required as the immediate parent of an `x-if` expression? Answer with the tag name.',
      accept: ['template', '<template>'],
      why: '`<template>` — an inert container that Alpine clones into place or removes.'
    },
    {
      id: 'q6',
      type: 'mc',
      skill: 'x-show',
      q: 'A colleague writes `x-show="!loading \u0026\u0026 rows.length > 0"`. What is the cheapest improvement?',
      options: [
        'Split it into two nested `x-show` directives',
        'Move the logic into a getter so the condition has a name',
        'Rewrite it with `x-if`',
        'Nothing — that is idiomatic and readable'
      ],
      answer: 1,
      why: 'Condition logic in a getter (`get hasRows() { return !this.loading \u0026\u0026 this.rows.length > 0 }`) names the intent, is testable, and keeps the template skimmable.',
      distractors: {
        0: 'Nesting two directives makes the condition harder to read, not easier.',
        2: 'The choice of `x-show` vs `x-if` depends on cost, not on expression length.'
      }
    }
  ]
}
