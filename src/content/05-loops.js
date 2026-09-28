/* Module 5 — x-for, keys and x-teleport.
 * Matches: /directives/for, /directives/teleport */

import { triangle, chainLadder, life, rnd, sq } from './data.js'

const cl = chainLadder(triangle)
const rows = triangle.rows
const claims = [
  { id: 'CL-318', insured: 'Halvorsen Shipping', incurred: 412, status: 'open' },
  { id: 'CL-322', insured: 'Meridian Grain', incurred: 187, status: 'open' },
  { id: 'CL-330', insured: 'Orinoco Rail', incurred: 953, status: 'closed' },
  { id: 'CL-341', insured: 'Casa Verde Foods', incurred: 268, status: 'open' }
]

export default {
  id: 'm05',
  num: 5,
  title: 'Loops, keys and teleporting',
  blurb: 'x-for over arrays, objects and ranges — plus :key as an identity contract.',
  goal: 'Render data-driven tables and lists with x-for, keep DOM identity stable with :key, and move subtrees with x-teleport.',
  intro: `\`x-for\` lives on a \`<template>\` and repeats whatever is inside it. The expression is a JavaScript \`for…in\` header: \`item in items\`, \`(item, index) in items\`, \`(value, key, index) in object\`, or \`i in 12\` for a plain range.\n\nThe part that bites is **\`:key\`**. It is not decoration: it is the identity contract that tells Alpine which DOM node belongs to which data row. Get it right and your per-row state survives sorting and filtering; get it wrong and the browser happily moves the wrong input into the wrong row.`,
  skills: ['x-for', 'x-teleport', 'keys'],
  docRefs: [
    { label: 'x-for', url: 'https://alpinejs.dev/directives/for' },
    { label: 'x-teleport', url: 'https://alpinejs.dev/directives/teleport' }
  ],
  mastery: [
    'Loop over arrays, index-aware, and over objects',
    'Explain `:key` as identity and prove that DOM nodes are preserved across a reorder',
    'Nest loops to render a loss triangle with development factors',
    'Teleport a subtree to `<body>` while keeping the Alpine scope'
  ],
  units: [
    {
      id: 's1',
      title: 'The three shapes of x-for',
      objective: 'Loop with an index, over an object, and over a range.',
      brief: `Every \`x-for\` gets its own scope: the loop variable is available to everything inside the template. \`(item, index)\` gives you the position; \`(value, key, index) in obj\` walks an object's entries; and a number literal repeats N times with a **1-based** counter.`,
      example: {
        code: `<template x-for="(row, i) in rows" :key="row.id"> … </template>
<template x-for="(count, year) in byYear" :key="year"> … </template>
<template x-for="m in 12" :key="m"> month <span x-text="m"></span> </template>`,
        note: 'The range form counts 1..12, not 0..11 — a common off-by-one when generating month labels.'
      },
      starter: `<div x-data="{ ages: ${sq([45, 55, 65])}, bands: { young: 2, mid: 5, old: 3 } }">
  <button data-testid="add">add age 75</button>
</div>`,
      solution: `<div x-data="{ ages: ${sq([45, 55, 65])}, bands: { young: 2, mid: 5, old: 3 } }">
  <button data-testid="add" @click="ages.push(75)">add age 75</button>
  <ul>
    <template x-for="(age, i) in ages" :key="age">
      <li data-testid="age" x-text="(i + 1) + '. age ' + age"></li>
    </template>
  </ul>
  <ul>
    <template x-for="(count, band) in bands" :key="band">
      <li data-testid="band" x-text="band + ': ' + count"></li>
    </template>
  </ul>
  <ul>
    <template x-for="m in 3" :key="m">
      <li data-testid="range" x-text="'quarter ' + m"></li>
    </template>
  </ul>
</div>`,
      hints: [
        'Index form: `x-for="(age, i) in ages"` — the index starts at 0.',
        'Object form: `x-for="(count, band) in bands"` gives value first, key second.',
        'Range form: `x-for="m in 3"` renders 1, 2, 3.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-for',
          text: 'Render three lists: ages as `1. age 45`, `2. age 55`, `3. age 65` in elements marked `data-testid="age"`; the band object as `young: 2`, `mid: 5`, `old: 3` in `data-testid="band"`; and a quarter range as `quarter 1`, `quarter 2`, `quarter 3` in `data-testid="range"`.',
          checks: [
            { kind: 'list', selector: '[data-testid="age"]', values: ['1. age 45', '2. age 55', '3. age 65'] },
            { kind: 'listSet', selector: '[data-testid="band"]', values: ['young: 2', 'mid: 5', 'old: 3'] },
            { kind: 'list', selector: '[data-testid="range"]', values: ['quarter 1', 'quarter 2', 'quarter 3'] }
          ]
        },
        {
          id: 't2',
          skill: 'x-for',
          text: 'Add a fourth item to the ages array **from the markup** with a button (`data-testid="add"`) that pushes age 75, and the list must grow to four items ending with `4. age 75`.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="age"]', value: 4, do: [{ click: '[data-testid="add"]' }] },
            { kind: 'text', selector: '[data-testid="age"]', nth: 3, value: '4. age 75' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: ':key is identity, not an index',
      objective: 'Prove that keys keep DOM nodes (and their state) attached to the right row.',
      brief: `Alpine uses \`:key\` to decide whether the node already on screen *is* the node for this item. With a stable key, sorting the array moves the existing nodes; with \`index\` (or nothing) it re-labels them, which is how a half-typed note ends up in the wrong claim.\n\nYou will prove this with a DOM witness: the checker marks every list item's *node* and then, after your reorder runs, asks how many of those exact nodes are still there.`,
      example: {
        code: `<template x-for="c in claims" :key="c.id"> … </template>   <!-- stable -->
<template x-for="(c, i) in claims" :key="i"> … </template> <!-- position: nodes get reused, data does not follow -->`,
        note: 'Keys must be unique and stable: an id, a code, a composite string. Never the loop index.'
      },
      starter: `<div x-data="{ claims: ${sq(claims)}, sortDir: 1 }">
  <button data-testid="sort" @click="claims = claims.slice().sort((a, b) => sortDir * (b.incurred - a.incurred)), sortDir = -sortDir">sort by incurred</button>
  <ul>
    <template x-for="c in claims" :key="c.id">
      <li data-testid="claim">
        <b x-text="c.id"></b> <span x-text="c.insured"></span>
        <input placeholder="note" style="min-height:28px;padding:2px 6px">
      </li>
    </template>
  </ul>
</div>`,
      solution: `<div x-data="{ claims: ${sq(claims)}, sortDir: 1 }">
  <button data-testid="sort" @click="claims = claims.slice().sort((a, b) => sortDir * (b.incurred - a.incurred)), sortDir = -sortDir">sort by incurred</button>
  <ul>
    <template x-for="c in claims" :key="c.id">
      <li data-testid="claim">
        <b x-text="c.id"></b> <span x-text="c.insured"></span>
        <input data-testid="note" placeholder="note" style="min-height:28px;padding:2px 6px">
      </li>
    </template>
  </ul>
</div>`,
      hints: [
        '`:key="c.id"` — the claim reference, stable across sorts.',
        'The sort handler must create a new array (`claims.slice().sort(…)`) so Alpine sees a change.',
        'The check marks the `<li>` nodes *before* sorting and counts how many survived.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'keys',
          text: 'Sort the four claims by incurred (descending) with `data-testid="sort"`, keyed by claim id, so that after sorting the *same DOM nodes* are still in the list — 4 of 4 original nodes preserved.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="claim"]', value: 4 },
            { kind: 'custom', name: 'marked', selector: '[data-testid="claim"]', value: 4, do: [{ mark: '[data-testid="claim"]' }, { click: '[data-testid="sort"]' }, { wait: 60 }] },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 0, value: 'CL-330 Orinoco Rail' },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 3, value: 'CL-322 Meridian Grain' }
          ]
        },
        {
          id: 't2',
          skill: 'keys',
          text: 'Prove state follows the row: type a note into the first claim (`CL-330`), sort again, and the note must still be attached to the same claim — which only works because the key is the claim id.',
          checks: [
            { kind: 'prop', selector: '[data-testid="note"]', prop: 'value', value: 'reserve raised', do: [{ type: '[data-testid="note"]', value: 'reserve raised' }] },
            { kind: 'custom', name: 'marked', selector: '[data-testid="claim"]', value: 4, do: [{ mark: '[data-testid="claim"]' }, { click: '[data-testid="sort"]' }, { wait: 60 }] },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 3, value: 'CL-330 Orinoco Rail' },
            { kind: 'prop', selector: '[data-testid="note"]', nth: 3, prop: 'value', value: 'reserve raised' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Nested loops: a loss triangle',
      objective: 'Render a staggered table with nested x-for over rows and development lags.',
      brief: `A development triangle is jagged: accident year 2021 has six development lags, 2025 has two. Nested loops handle it — an outer loop over accident years, an inner loop over that row's cells — and \`:key\` on both levels keeps it stable.`,
      example: {
        code: `<template x-for="(row, ay) in rows" :key="ay">
  <tr>
    <td x-text="years[ay]"></td>
    <template x-for="(value, lag) in row" :key="lag">
      <td x-text="value"></td>
    </template>
  </tr>
</template>`,
        note: 'The inner keys are the development lag (0-based) — stable enough because a triangle never re-sorts its columns.'
      },
      starter: `<div x-data="{ years: ${JSON.stringify(triangle.years)}, rows: ${JSON.stringify(rows)} }">
  <table><tbody></tbody></table>
</div>`,
      solution: `<div x-data="{
  years: ${JSON.stringify(triangle.years)},
  rows: ${JSON.stringify(rows)},
  factors: ${JSON.stringify(cl.factors.map(f => Number(f.toFixed(4))))}
}">
  <table>
    <tbody>
      <template x-for="(row, ay) in rows" :key="years[ay]">
        <tr>
          <td x-text="years[ay]"></td>
          <template x-for="(value, lag) in row" :key="lag">
            <td class="cell" data-testid="cell" x-text="value"></td>
          </template>
        </tr>
      </template>
      <tr>
        <td>factor</td>
        <td>—</td>
        <template x-for="(f, i) in factors" :key="i">
          <td data-testid="factor" x-text="f.toFixed(4)"></td>
        </template>
      </tr>
    </tbody>
  </table>
</div>`,
      hints: [
        'Outer loop over rows, inner loop over the row itself.',
        'The factor row has one fewer cell than the widest accident year: that is why it starts with a dash.',
        'Use `x-text="value"` for cells and `x-text="f.toFixed(4)"` for the factors.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-for',
          text: 'Render the triangle: 20 cells marked `data-testid="cell"`, the first reading 100 and the last 217, with rows in accident-year order 2021 → 2025.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="cell"]', value: 20 },
            { kind: 'text', selector: '[data-testid="cell"]', nth: 0, value: '100' },
            { kind: 'text', selector: '[data-testid="cell"]', nth: 19, value: '217' }
          ]
        },
        {
          id: 't2',
          skill: 'x-for',
          text: `Add the development-factor row with the five volume-weighted factors (${cl.factors.map(f => f.toFixed(4)).join(', ')}) in elements marked \`data-testid="factor"\`.`,
          checks: [
            { kind: 'listLong', selector: '[data-testid="factor"]', value: 5 },
            { kind: 'textNumber', selector: '[data-testid="factor"]', nth: 0, value: Number(cl.factors[0].toFixed(4)), tol: 0.001 },
            { kind: 'textNumber', selector: '[data-testid="factor"]', nth: 4, value: Number(cl.factors[4].toFixed(4)), tol: 0.001 }
          ]
        }
      ]
    },
    {
      id: 's4',
      title: 'x-teleport',
      objective: 'Move a subtree to the end of `<body>` while keeping its component scope.',
      brief: `Modals, toasts and tooltips suffer from their ancestors: \`overflow: hidden\`, a low \`z-index\` stacking context, a transformed parent. **\`x-teleport\`** moves the subtree (inside a \`<template>\`) to a target specified by a CSS selector — most often \`body\` — and, crucially, the moved markup **keeps the Alpine scope it came from**, so it can still read and write the same data.`,
      example: {
        code: `<div x-data="{ open: false }">
  <button @click="open = true">open</button>
  <template x-teleport="body">
    <div x-show="open" class="modal">…</div>
  </template>
</div>`,
        note: 'Bindings inside the teleported subtree still see `open` — teleport moves DOM, not scope.'
      },
      starter: `<div x-data="{ open: false, message: 'Rate change approved' }">
  <button data-testid="open" @click="open = true">open the toast</button>
</div>`,
      solution: `<div x-data="{ open: false, message: 'Rate change approved' }">
  <button data-testid="open" @click="open = true">open the toast</button>
  <template x-teleport="#toast-host">
    <div data-testid="toast" x-show="open">
      <span x-text="message"></span>
      <button data-testid="close" @click="open = false">close</button>
    </div>
  </template>
</div>
<div id="toast-host"></div>`,
      hints: [
        'The teleport template must be inside a component that owns `open`.',
        'Teleport target: `body`, or any selector — here a `#toast-host` container you add yourself.',
        'Inside the teleported element you can still write `@click="open = false"`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-teleport',
          text: 'Teleport a toast (marked `data-testid="toast"`) into the `#toast-host` container. It must contain the message text, appear when the composite root is not its parent (it must live inside `#toast-host`, outside the component element), and be closable from inside with `data-testid="close"`.',
          checks: [
            { kind: 'exists', selector: '[data-testid="toast"]' },
            { kind: 'exists', selector: '#toast-host > [data-testid="toast"]' },
            { kind: 'notExists', selector: '[x-data] > [data-testid="toast"]' },
            { kind: 'hidden', selector: '[data-testid="toast"]' },
            { kind: 'shown', selector: '[data-testid="toast"]', do: [{ click: '[data-testid="open"]' }] },
            { kind: 'textHas', selector: '[data-testid="toast"]', value: 'Rate change approved' },
            { kind: 'hidden', selector: '[data-testid="toast"]', do: [{ click: '[data-testid="close"]' }] }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a reserving table with derived row totals',
      objective: 'Nest loops over a triangle and derive per-row summaries.',
      scenario: `The reserving actuary wants the standard view: accident years down, development lags across, the latest diagonal, the selected development factor applied forward, and the resulting IBNR per row. The chain-ladder computation is done for you in the numbers below — your job is the table and its derived columns.`,
      brief: `Use the triangle ${rows.map((r, i) => `${triangle.years[i]}: [${r.join(', ')}]`).join(' · ')}.
      Required: every row shows its year and its cells; a summary block marked \`data-testid="summary"\` lists \`year → IBNR\` for all five years using these IBNR values: ${cl.ibnr.map((v, i) => `${triangle.years[i]}=${v.toFixed(1)}`).join(', ')}. The total IBNR must appear in \`data-testid="total"\` (${cl.totalIBNR.toFixed(1)}).`,
      starter: `<div x-data="{ years: ${JSON.stringify(triangle.years)}, rows: ${JSON.stringify(rows)}, ibnr: ${JSON.stringify(cl.ibnr.map(v => Number(v.toFixed(1))))} }">
</div>`,
      solution: `<div x-data="{
  years: ${JSON.stringify(triangle.years)},
  rows: ${JSON.stringify(rows)},
  ibnr: ${JSON.stringify(cl.ibnr.map(v => Number(v.toFixed(1))))},
  get total() { return this.ibnr.reduce((a, b) => a + b, 0) }
}">
  <table>
    <tbody>
      <template x-for="(row, ay) in rows" :key="years[ay]">
        <tr>
          <td x-text="years[ay]"></td>
          <template x-for="(value, lag) in row" :key="lag">
            <td data-testid="cell" x-text="value"></td>
          </template>
        </tr>
      </template>
    </tbody>
  </table>
  <ul>
    <template x-for="(v, i) in ibnr" :key="i">
      <li data-testid="summary" x-text="years[i] + ' → ' + v.toFixed(1)"></li>
    </template>
  </ul>
  <p>total IBNR: <b data-testid="total" x-text="total.toFixed(1)"></b></p>
</div>`,
      hints: [
        'The row summary is a second loop over the IBNR array with the year taken from `years[i]`.',
        'The total can be a getter: `get total() { return this.ibnr.reduce((a, b) => a + b, 0) }`.',
        `Expected total: ${cl.totalIBNR.toFixed(1)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-for',
          text: 'Render the full triangle (20 cells) and the five-line summary of `year → IBNR`.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="cell"]', value: 20 },
            { kind: 'listLong', selector: '[data-testid="summary"]', value: 5 },
            { kind: 'text', selector: '[data-testid="summary"]', nth: 4, value: `2025 → ${cl.ibnr[4].toFixed(1)}` }
          ]
        },
        {
          id: 't2',
          skill: 'getters',
          text: `Show the total IBNR (${cl.totalIBNR.toFixed(1)}) in \`data-testid="total"\`, derived from the per-row values rather than typed in.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="total"]', value: Number(cl.totalIBNR.toFixed(1)), tol: 0.15 }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a losses list you can re-order without losing work',
      objective: 'Combine x-for, keys and a click-driven sort so per-row state survives.',
      scenario: `Three underwriters are triaging claims: each row carries a checkbox ("referred") and a severity. The list can be sorted by severity or by client name at any time, and the notes typed into a row must never jump to another row. This is the classic :key exam, with a business consequence.`,
      brief: `Claims: ${claims.map(c => `${c.id} ${c.insured} (${c.incurred}k, ${c.status})`).join(' · ')}.
      Render them keyed by id with a per-row checkbox marked \`data-testid="referred"\`; provide two sort buttons (\`data-testid="bySeverity"\` and \`data-testid="byName"\`) and a count of referred claims in \`data-testid="referredCount"\`.`,
      starter: `<div x-data="{ claims: ${sq(claims)}, referred: [] }">
</div>`,
      solution: `<div x-data="{
  claims: ${sq(claims)},
  referred: [],
  get referredCount() { return this.referred.length },
  bySeverity() { this.claims = this.claims.slice().sort((a, b) => b.incurred - a.incurred) },
  byName() { this.claims = this.claims.slice().sort((a, b) => a.insured.localeCompare(b.insured)) }
}">
  <div class="row">
    <button data-testid="bySeverity" @click="bySeverity()">severity ↓</button>
    <button data-testid="byName" @click="byName()">client A→Z</button>
    <span class="muted">referred: <b data-testid="referredCount" x-text="referredCount"></b></span>
  </div>
  <ul>
    <template x-for="c in claims" :key="c.id">
      <li data-testid="claim">
        <label>
          <input type="checkbox" data-testid="referred" :value="c.id" x-model="referred">
          <b x-text="c.id"></b> <span x-text="c.insured"></span>
        </label>
        <span class="muted" x-text="c.incurred + 'k · ' + c.status"></span>
      </li>
    </template>
  </ul>
</div>`,
      hints: [
        'Checkbox arrays: several checkboxes with the same `x-model="referred"` and distinct `:value` collect into one array.',
        'Sort with a copy so Alpine sees a new array: `this.claims = this.claims.slice().sort(…)`.',
        'The DOM witness: the checker marks the `<li>` nodes, then you re-sort, then it counts survivors — 4 out of 4 means your keys are right.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-model',
          text: 'Render the four claims with a referred checkbox each and a live count in `data-testid="referredCount"`: checking the first row must make the count read 1.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="claim"]', value: 4 },
            { kind: 'text', selector: '[data-testid="referredCount"]', value: '0' },
            { kind: 'text', selector: '[data-testid="referredCount"]', value: '1', do: [{ click: '[data-testid="referred"]' }] }
          ]
        },
        {
          id: 't2',
          skill: 'keys',
          text: 'Tick CL-322 as well (CL-318 is already ticked from the previous task), then sort by severity: the list must reorder while every original DOM row survives (keyed by claim id), and the ticks must stay on the *same claims*, not on the same positions.',
          checks: [
            { kind: 'custom', name: 'marked', selector: '[data-testid="claim"]', value: 4, do: [{ click: '[data-testid="referred"][value="CL-322"]' }, { mark: '[data-testid="claim"]' }, { click: '[data-testid="bySeverity"]' }, { wait: 60 }] },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 0, value: 'CL-330 Orinoco Rail 953k · closed' },
            { kind: 'text', selector: '[data-testid="referredCount"]', value: '2' },
            { kind: 'prop', selector: '[data-testid="referred"][value="CL-322"]', prop: 'checked', value: 'true' },
            { kind: 'prop', selector: '[data-testid="referred"][value="CL-318"]', prop: 'checked', value: 'true' },
            { kind: 'prop', selector: '[data-testid="referred"][value="CL-330"]', prop: 'checked', value: 'false' }
          ]
        },
        {
          id: 't3',
          skill: 'x-for',
          text: 'Sorting by client name must put Casa Verde Foods first and Orinoco Rail last, still with 4 of 4 original DOM rows.',
          checks: [
            { kind: 'custom', name: 'marked', selector: '[data-testid="claim"]', value: 4, do: [{ mark: '[data-testid="claim"]' }, { click: '[data-testid="byName"]' }, { wait: 60 }] },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 0, value: 'CL-341 Casa Verde Foods 268k · open' },
            { kind: 'text', selector: '[data-testid="claim"]', nth: 3, value: 'CL-330 Orinoco Rail 953k · closed' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-for',
      q: 'Where must `x-for` be declared?',
      options: [
        'On the element you want repeated',
        'On a `<template>` wrapping the repeated markup',
        'On the parent element, with the children repeated automatically',
        'On the `<body>` element'
      ],
      answer: 1,
      why: '`x-for` goes on a `<template>`; everything inside is cloned once per item.',
      distractors: {
        0: 'A directive on a live element cannot repeat it — templates are the mechanism.',
        2: 'There is no implicit repetition of children.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'keys',
      q: 'A list of claims is re-sorted, and the notes the user typed jump to the wrong rows. What is the most likely cause?',
      options: [
        'The sort mutated the array in place',
        '`:key` is the loop index (or missing), so Alpine re-labels existing nodes instead of moving them',
        'The notes are stored in the DOM, which Alpine does not track',
        '`x-for` cannot render sorted data'
      ],
      answer: 1,
      why: 'Position-based keys tell Alpine "this node is row 0" — after a sort, row 0 is a different claim, so the node is reused with new data while the typed value stays behind.',
      distractors: {
        0: 'Mutating in place can hide the bug, but the wrong list still updates. The identity problem is the key.',
        2: 'Untracked DOM is exactly why the key matters.',
        3: '`x-for` renders whatever order the array is in.'
      }
    },
    {
      id: 'q3',
      type: 'multi',
      skill: 'keys',
      q: 'Which values make a good `:key`?',
      options: [
        'A database id',
        'The array index',
        'A stable composite such as `claimId + policyYear`',
        '`Math.random()`'
      ],
      answers: [0, 2],
      why: 'Keys must be unique among siblings and stable across re-renders. Ids and stable composites qualify.',
      distractors: {
        1: 'Indices are positions, not identities: they change meaning the moment the list is sorted or filtered.',
        3: 'Random keys destroy and rebuild everything on every render. Never.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-for',
      q: 'What does `<template x-for="m in 12">` render?',
      options: [
        'Months 0 through 11',
        'Twelve items where `m` runs 1 through 12',
        'One item per key of the number 12',
        'Nothing: ranges need an array'
      ],
      answer: 1,
      why: 'A bare number repeats N times with a 1-based counter — handy for months and quarters.',
      distractors: {
        0: 'The range form starts at 1, unlike the index of an array.',
        2: 'Numbers are not iterated as objects.'
      }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'x-teleport',
      q: 'A modal rendered inside a card is being clipped by the card’s `overflow: hidden`. What is the idiomatic Alpine fix?',
      options: [
        'Raise the z-index of the modal',
        'Wrap it in `<template x-teleport="body">`',
        'Move the modal to the top of the HTML file by hand',
        'Use `position: fixed`'
      ],
      answer: 1,
      why: '`x-teleport` relocates the subtree (usually to `body`) where no ancestor can clip it, and the moved markup keeps its Alpine scope.',
      distractors: {
        0: 'Stacking does not help against `overflow: hidden`: the clip happens before stacking is considered.',
        2: 'Manual relocation breaks the scope and cannot be conditional.',
        3: '`position: fixed` is also defeated by a transformed ancestor, which is a common trap.'
      }
    },
    {
      id: 'q6',
      type: 'mc',
      skill: 'x-for',
      q: 'You loop over an object with `x-for="(value, key, index) in obj"`. What is the order of the arguments?',
      options: [
        'key, value, index',
        'value, key, index',
        'index, value, key',
        'value, index, key'
      ],
      answer: 1,
      why: 'Objects iterate like `Object.entries`: value first, then key, then the running index.',
      distractors: {
        0: 'That is the array-with-index intuition applied wrongly.',
        2: 'The index always comes last.'
      }
    }
  ]
}
