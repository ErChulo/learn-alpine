/* Module 10 — global state with Alpine.store.
 * Matches: /globals/alpine-store, /magics/store */

import { triangle, chainLadder, credibility, buhlmann, sq } from './data.js'

const cl = chainLadder(triangle)
const bl = buhlmann(credibility)
const TOTAL = Number(cl.totalIBNR.toFixed(1))
const CELLS = [
  { name: 'Motor', ibnr: Number(cl.ibnr[0].toFixed(1)) },
  { name: 'Property', ibnr: Number(cl.ibnr[2].toFixed(1)) },
  { name: 'Marine', ibnr: Number(cl.ibnr[4].toFixed(1)) }
]
const K_STD = 112.5, K_PRU = 800, EXPOSURE = 200
const Z_STD = EXPOSURE / (EXPOSURE + K_STD)
const Z_PRU = EXPOSURE / (EXPOSURE + K_PRU)

export default {
  id: 'm10',
  num: 10,
  title: 'Global state',
  blurb: 'Alpine.store: one source of truth shared by every component on the page.',
  goal: 'Lift state out of a single component when several widgets must agree — and keep it reactive everywhere.',
  intro: `\`Alpine.store('name', {...})\` registers a **single reactive object** for the whole page. Any component reaches it with \`$store.name\`, reads it like ordinary data, and mutating it re-renders *every* component that read it.\n\nStores answer "three widgets, one number": a toolbar's filter, a table's selection, a ledger total. Register them in \`alpine:init\` (script-tag pages) or before \`Alpine.start()\` (bundles). Stores may carry getters, methods and an \`init()\` that runs at registration.`,
  skills: ['Alpine.store', '$store', 'shared state'],
  docRefs: [
    { label: 'Alpine.store', url: 'https://alpinejs.dev/globals/alpine-store' },
    { label: '$store', url: 'https://alpinejs.dev/magics/store' }
  ],
  mastery: [
    'Register a store (state, getters, methods, `init()`) in `alpine:init`',
    'Read `$store` from several independent components and keep them in step',
    'Mutate through store methods instead of scattering writes through markup',
    'Decide when a store beats dispatching events up the tree'
  ],
  units: [
    {
      id: 's1',
      title: 'One store, two widgets',
      objective: 'Register a store and read it from unrelated components.',
      brief: `A store is registered before the page initialises and then behaves like any other Alpine data object — except that every component shares the *same* proxy, so a change made in one place is instantly visible in the others.\n\nThe point to exploit: the toolbar and the table never talk to each other. They both talk to the store.`,
      example: {
        code: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('filters', { q: '' })
  })
</script>

<div x-data><input x-model="$store.filters.q"></div>
<div x-data><span x-text="$store.filters.q"></span></div>`,
        note: 'In a bundled app you would write the same registration between the imports and `Alpine.start()`.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('filters', { q: '' })
  })
</script>

<div x-data>
  <input data-testid="q" x-model="$store.filters.q" placeholder="filter">
</div>
<div x-data>
  <p>query: <b data-testid="mirror" x-text="$store.filters.q || 'none'"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('filters', {
      q: '',
      get words() { return this.q.trim() ? this.q.trim().split(' ').filter(Boolean) : [] }
    })
  })
</script>

<div x-data>
  <input data-testid="q" x-model="$store.filters.q" placeholder="filter">
  <button data-testid="clear" @click="$store.filters.q = ''">clear</button>
</div>
<div x-data>
  <p>query: <b data-testid="mirror" x-text="$store.filters.q || 'none'"></b>
     · terms: <span data-testid="terms" x-text="$store.filters.words.length"></span></p>
</div>
<div x-data>
  <p>third widget: <span data-testid="mirror2" x-text="$store.filters.q || 'none'"></span></p>
</div>`,
      hints: [
        'The registration must happen inside `alpine:init` — a bare `Alpine.store(...)` in the body would run too late for the initial render.',
        'Two *separate* `x-data` components read the same store property.',
        '`x-model` may target a store directly: `x-model="$store.filters.q"`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$store',
          text: 'Typing `marine grain` into the filter must make the mirror, the third widget and the derived term count agree (2 words), across three separate components.',
          checks: [
            { kind: 'text', selector: '[data-testid="mirror"]', value: 'none' },
            { kind: 'text', selector: '[data-testid="mirror"]', value: 'marine grain', do: [{ type: '[data-testid="q"]', value: 'marine grain' }] },
            { kind: 'text', selector: '[data-testid="mirror2"]', value: 'marine grain' },
            { kind: 'text', selector: '[data-testid="terms"]', value: '2' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.store',
          text: '`clear` must empty the store: both widgets fall back to `none`, the term count drops to 0 and the input is emptied.',
          checks: [
            { kind: 'text', selector: '[data-testid="mirror"]', value: 'none', do: [{ type: '[data-testid="q"]', value: 'xtra' }, { click: '[data-testid="clear"]' }] },
            { kind: 'prop', selector: '[data-testid="q"]', prop: 'value', value: '' },
            { kind: 'text', selector: '[data-testid="terms"]', value: '0' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Getters and methods on the store',
      objective: 'Keep derived values and mutations inside the store.',
      brief: `A store can hold getters (\`get total() { … }\`) and methods. Components then read and call rather than compute: the rules live in one place, so two widgets cannot disagree about them.\n\nIt also makes the store testable in isolation — it is plain JavaScript that happens to be reactive.`,
      example: {
        code: `Alpine.store('ledger', {
  rows: [],
  get total() { return this.rows.reduce((n, r) => n + r.ibnr, 0) },
  add(name, ibnr) { this.rows.push({ name, ibnr }) }
})`,
        note: 'A getter recomputes only when something it read has changed.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('ledger', {
      rows: [],
      get total() { return this.rows.reduce((n, r) => n + r.ibnr, 0) },
      add(name, ibnr) { this.rows.push({ name, ibnr }) }
    })
  })
</script>

<div x-data>
  <ul><template x-for="(r, i) in $store.ledger.rows" :key="i"><li data-testid="row" x-text="r.name + ' ' + r.ibnr.toFixed(1)"></li></template></ul>
  <p>total: <b data-testid="total" x-text="$store.ledger.total.toFixed(1)"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('ledger', {
      rows: [],
      get total() { return this.rows.reduce((n, r) => n + r.ibnr, 0) },
      add(name, ibnr) { this.rows.push({ name, ibnr }) },
      clear() { this.rows = [] }
    })
  })
</script>

<div x-data>
  <button data-testid="addA" @click="$store.ledger.add('Motor', ${CELLS[0].ibnr})">add motor</button>
  <button data-testid="addB" @click="$store.ledger.add('Property', ${CELLS[1].ibnr})">add property</button>
  <button data-testid="clear" @click="$store.ledger.clear()">clear ledger</button>
  <ul><template x-for="(r, i) in $store.ledger.rows" :key="i"><li data-testid="row" x-text="r.name + ' ' + r.ibnr.toFixed(1)"></li></template></ul>
  <p>total: <b data-testid="total" x-text="$store.ledger.total.toFixed(1)"></b></p>
</div>
<div x-data>
  <p>second widget: <b data-testid="count" x-text="$store.ledger.rows.length"></b> line(s), total <span data-testid="total2" x-text="$store.ledger.total.toFixed(1)"></span></p>
</div>`,
      hints: [
        'Rows live in the store: `$store.ledger.rows`.',
        'The total comes from the store getter — never recomputed in markup.',
        `Adding both cells must total ${Number((CELLS[0].ibnr + CELLS[1].ibnr).toFixed(1))}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.store',
          text: `Adding Motor (${CELLS[0].ibnr}) and Property (${CELLS[1].ibnr}) must render two lines and a total of ${Number((CELLS[0].ibnr + CELLS[1].ibnr).toFixed(1))} in both widgets.`,
          checks: [
            { kind: 'count', selector: '[data-testid="row"]', value: 0 },
            { kind: 'count', selector: '[data-testid="row"]', value: 2, do: [{ click: '[data-testid="addA"]' }, { click: '[data-testid="addB"]' }] },
            { kind: 'textNumber', selector: '[data-testid="total"]', value: Number((CELLS[0].ibnr + CELLS[1].ibnr).toFixed(1)), tol: 0.05 },
            { kind: 'text', selector: '[data-testid="count"]', value: '2' },
            { kind: 'textNumber', selector: '[data-testid="total2"]', value: Number((CELLS[0].ibnr + CELLS[1].ibnr).toFixed(1)), tol: 0.05 }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.store',
          text: '`clear` must empty the store through the store method, and the second widget must follow it to 0 lines and a total of 0.0.',
          checks: [
            { kind: 'count', selector: '[data-testid="row"]', value: 0, do: [{ click: '[data-testid="addA"]' }, { click: '[data-testid="clear"]' }] },
            { kind: 'text', selector: '[data-testid="count"]', value: '0' },
            { kind: 'text', selector: '[data-testid="total2"]', value: '0.0' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'init(), hydration and deep state',
      objective: 'Seed a store on registration and mutate nested state correctly.',
      brief: `Stores may define \`init()\`, called by Alpine the moment the store is registered — the place to hydrate from storage or from server-rendered data.\n\nNested objects are reactive as well, but you must either assign to a property or use an array method; you cannot mutate a plain (non-reactive) copy and expect a render.`,
      example: {
        code: `Alpine.store('basis', {
  rate: 0.045, name: 'standard', seeded: 'no',
  init() { this.seeded = 'yes' }
})`,
        note: 'A store\'s `init()` runs once, at registration, not per component.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    // a placeholder store so the page renders before you write the real one
    Alpine.store('basis', { rate: 0, name: 'unset', seededByInit: 'no' })
  })
</script>

<div x-data>
  <p>rate: <b data-testid="rate" x-text="$store.basis.rate.toFixed(3)"></b> · basis <span data-testid="basis" x-text="$store.basis.name"></span></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('basis', {
      rate: 0.045,
      name: 'standard',
      seededByInit: 'no',
      init() { this.seededByInit = 'yes' }
    })
  })
</script>

<div x-data>
  <p>rate: <b data-testid="rate" x-text="$store.basis.rate.toFixed(3)"></b> · basis <span data-testid="basis" x-text="$store.basis.name"></span></p>
  <button data-testid="bump" @click="$store.basis.rate = + ($store.basis.rate + 0.005).toFixed(3)">+5bp</button>
  <button data-testid="name" @click="$store.basis.name = 'prudent'">prudent basis</button>
  <p class="muted">seeded at registration: <span data-testid="seeded" x-text="$store.basis.seededByInit"></span></p>
</div>
<div x-data>
  <p>second widget: <span data-testid="rate2" x-text="$store.basis.rate.toFixed(3)"></span> on the <span data-testid="basis2" x-text="$store.basis.name"></span> basis</p>
</div>`,
      hints: [
        'Register `basis` with `rate: 0.045`, `name: \'standard\'` and an `init()` that flips `seededByInit`.',
        'Mutate nested state by assignment: `$store.basis.rate = …`.',
        'Every widget that read the property re-renders — no events required.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.store',
          text: 'The store\'s `init()` must have run at registration (`seeded` reads `yes`) and both widgets must read rate 0.045 on the standard basis.',
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: '0.045' },
            { kind: 'text', selector: '[data-testid="seeded"]', value: 'yes' },
            { kind: 'text', selector: '[data-testid="rate2"]', value: '0.045' },
            { kind: 'text', selector: '[data-testid="basis2"]', value: 'standard' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.store',
          text: '`+5bp` must move both widgets in step (0.05 exactly), and `prudent basis` must change the name everywhere.',
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: '0.050', do: [{ click: '[data-testid="bump"]' }] },
            { kind: 'text', selector: '[data-testid="rate2"]', value: '0.050' },
            { kind: 'text', selector: '[data-testid="basis"]', value: 'prudent', do: [{ click: '[data-testid="name"]' }] },
            { kind: 'text', selector: '[data-testid="basis2"]', value: 'prudent' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a shared IBNR ledger',
      objective: 'Three reserving cells feed one store; a fourth widget reads the roll-up.',
      scenario: `Three reserving cells contribute to one balance. Chain-ladder IBNR by accident year: ${cl.ibnr.map((v, i) => `${triangle.years[i]} ${v.toFixed(1)}`).join(' · ')}. The cells are Motor (${CELLS[0].ibnr}), Property (${CELLS[1].ibnr}) and Marine (${CELLS[2].ibnr}) — together ${Number((CELLS[0].ibnr + CELLS[1].ibnr + CELLS[2].ibnr).toFixed(1))}. Each cell has its own component with "add to ledger" and an amend input for its own figure; a fourth component shows every contribution and the running total.`,
      brief: `Write the store registration yourself, in \`alpine:init\`, with \`lines\` (array of \`{ name, value }\`), a \`total\` getter, and \`add(name, value)\`, \`amend(name, value)\`, \`clear()\`. Markup: three \`data-testid="add"\` buttons plus three \`data-testid="amend"\` inputs (in the order Motor, Property, Marine), one \`data-testid="line"\` per ledger row reading \`Motor 130.1\`, a \`data-testid="total"\` and a \`data-testid="clear"\`.`,
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('ibnr', { lines: [], get total() { return 0 }, add() {}, amend() {}, clear() {} })
  })
</script>

<div x-data="{ cells: ${sq(CELLS)} }">
  <template x-for="(c, i) in cells" :key="c.name">
    <div class="row">
      <b x-text="c.name"></b>
      <button data-testid="add">add to ledger</button>
      <input data-testid="amend" type="number" step="10">
    </div>
  </template>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('ibnr', {
      lines: [],
      get total() { return this.lines.reduce((n, l) => n + l.value, 0) },
      add(name, value) {
        const hit = this.lines.find(l => l.name === name)
        if (hit) hit.value = value
        else this.lines.push({ name, value })
      },
      amend(name, value) {
        const hit = this.lines.find(l => l.name === name)
        if (hit) hit.value = value
      },
      clear() { this.lines = [] }
    })
  })
</script>

<div x-data="{ cells: ${sq(CELLS)} }">
  <template x-for="(c, i) in cells" :key="c.name">
    <div data-testid="cell" class="row">
      <b x-text="c.name"></b>
      <button data-testid="add" @click="$store.ibnr.add(c.name, c.ibnr)">add to ledger</button>
      <input data-testid="amend" type="number" step="10" :value="c.ibnr" @change="$store.ibnr.amend(c.name, + $event.target.value)">
    </div>
  </template>
</div>
<div x-data>
  <button data-testid="clear" @click="$store.ibnr.clear()">clear ledger</button>
  <ul><template x-for="(l, i) in $store.ibnr.lines" :key="i"><li data-testid="line" x-text="l.name + ' ' + l.value.toFixed(1)"></li></template></ul>
  <p>ledger total: <b data-testid="total" x-text="$store.ibnr.total.toFixed(1)"></b></p>
</div>`,
      hints: [
        'The `amend` input is bound with `:value` + `@change` — the store owns the number, the input only reports it.',
        'Guard against duplicate lines: `add` should update an existing name rather than push a second row.',
        `Adding all three cells must total ${Number((CELLS[0].ibnr + CELLS[1].ibnr + CELLS[2].ibnr).toFixed(1))}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: '$store',
          text: `Adding Property (${CELLS[1].ibnr}) must render one line reading \`Property ${CELLS[1].ibnr.toFixed(1)}\` and set the total to ${CELLS[1].ibnr}.`,
          checks: [
            { kind: 'count', selector: '[data-testid="line"]', value: 1, do: [{ click: '[data-testid="add"]', nth: 1 }] },
            { kind: 'text', selector: '[data-testid="line"]', value: `Property ${CELLS[1].ibnr.toFixed(1)}` },
            { kind: 'textNumber', selector: '[data-testid="total"]', value: CELLS[1].ibnr, tol: 0.05 }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.store',
          text: `Adding all three must total ${Number((CELLS[0].ibnr + CELLS[1].ibnr + CELLS[2].ibnr).toFixed(1))} with three lines in the order Motor, Property, Marine.`,
          checks: [
            { kind: 'listLong', selector: '[data-testid="line"]', value: 3, do: [{ click: '[data-testid="clear"]' }, { click: '[data-testid="add"]', nth: 0 }, { click: '[data-testid="add"]', nth: 1 }, { click: '[data-testid="add"]', nth: 2 }] },
            { kind: 'list', selector: '[data-testid="line"]', values: [`Motor ${CELLS[0].ibnr.toFixed(1)}`, `Property ${CELLS[1].ibnr.toFixed(1)}`, `Marine ${CELLS[2].ibnr.toFixed(1)}`] },
            { kind: 'textNumber', selector: '[data-testid="total"]', value: Number((CELLS[0].ibnr + CELLS[1].ibnr + CELLS[2].ibnr).toFixed(1)), tol: 0.08 }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.store',
          text: `Amending Marine to 500 must rewrite that line (not add a second one) and move the total to 500; \`clear\` must then empty the ledger.`,
          checks: [
            { kind: 'count', selector: '[data-testid="line"]', value: 1, do: [{ click: '[data-testid="clear"]' }, { click: '[data-testid="add"]', nth: 2 }] },
            { kind: 'text', selector: '[data-testid="line"]', value: 'Marine 500.0', do: [{ type: '[data-testid="amend"]', nth: 2, value: '500' }] },
            { kind: 'textNumber', selector: '[data-testid="total"]', value: 500, tol: 0.05 },
            { kind: 'count', selector: '[data-testid="line"]', value: 0, do: [{ click: '[data-testid="clear"]' }] },
            { kind: 'text', selector: '[data-testid="total"]', value: '0.0' }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — one basis, three widgets',
      objective: 'Prove store sharing with a header, a credibility widget and a reserving widget.',
      scenario: `Bühlmann credibility on the current book: μ = ${bl.mu.toFixed(2)}, k = ${bl.k}, and the Clinic A exposure of ${EXPOSURE} gives Z = ${Z_STD.toFixed(2)} (credible premium ${bl.groups[0].credible.toFixed(2)}). Moving to a *prudent* basis raises k to ${K_PRU} — same exposure, less credibility — and haircuts the selected IBNR by 10 %. Three separate components must follow the same store: a header, a credibility widget and a reserving widget.`,
      brief: `Store name \`view\`, registered in \`alpine:init\`: \`basis\` (\`standard\` or \`prudent\`), \`exposure\` (${EXPOSURE}), \`k\` (${K_STD} standard, ${K_PRU} prudent), getters \`Z = exposure / (exposure + k)\`, \`ibnrTotal\` (${TOTAL} standard, 90 % of it prudent) and a \`setBasis(name)\` method. Elements: \`data-testid="standard"\` and \`data-testid="prudent"\` buttons, \`data-testid="basis"\`, \`data-testid="k"\`, \`data-testid="z"\`, \`data-testid="ibnr"\`.`,
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('view', { basis: 'standard' })
  })
</script>

<div x-data>
  <p>header: <b data-testid="basis" x-text="$store.view.basis"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('view', {
      basis: 'standard',
      exposure: ${EXPOSURE},
      get k() { return this.basis === 'standard' ? ${K_STD} : ${K_PRU} },
      get Z() { return this.exposure / (this.exposure + this.k) },
      get ibnrTotal() { return this.basis === 'standard' ? ${TOTAL} : ${TOTAL} * 0.9 },
      setBasis(name) { this.basis = name }
    })
  })
</script>

<div x-data>
  <button data-testid="standard" @click="$store.view.setBasis('standard')">standard basis</button>
  <button data-testid="prudent" @click="$store.view.setBasis('prudent')">prudent basis</button>
  <p>header: <b data-testid="basis" x-text="$store.view.basis"></b> · k = <span data-testid="k" x-text="$store.view.k"></span></p>
</div>
<div x-data>
  <p>credibility: Z = <b data-testid="z" x-text="$store.view.Z.toFixed(4)"></b> on exposure <span x-text="$store.view.exposure"></span></p>
</div>
<div x-data>
  <p>selected IBNR: <b data-testid="ibnr" x-text="$store.view.ibnrTotal.toFixed(1)"></b></p>
</div>`,
      hints: [
        'One store, three components: none of them talks to another.',
        '`setBasis` changes only `basis` — `k`, `Z` and `ibnrTotal` are getters that read it.',
        `Standard: k = ${K_STD}, Z = ${Z_STD.toFixed(4)}, IBNR ${TOTAL}. Prudent: k = ${K_PRU}, Z = ${Z_PRU.toFixed(4)}, IBNR ${(TOTAL * 0.9).toFixed(1)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: '$store',
          text: `On the standard basis all three widgets agree: basis \`standard\`, k = ${K_STD}, Z = ${Z_STD.toFixed(4)} and IBNR ${TOTAL}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: 'standard' },
            { kind: 'text', selector: '[data-testid="k"]', value: String(K_STD) },
            { kind: 'text', selector: '[data-testid="z"]', value: Z_STD.toFixed(4) },
            { kind: 'textNumber', selector: '[data-testid="ibnr"]', value: TOTAL, tol: 0.05 }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.store',
          text: `Switching to the prudent basis moves every widget: k = ${K_PRU}, Z = ${Z_PRU.toFixed(4)}, IBNR ${(TOTAL * 0.9).toFixed(1)}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: 'prudent', do: [{ click: '[data-testid="prudent"]' }] },
            { kind: 'text', selector: '[data-testid="k"]', value: String(K_PRU) },
            { kind: 'text', selector: '[data-testid="z"]', value: Z_PRU.toFixed(4) },
            { kind: 'textNumber', selector: '[data-testid="ibnr"]', value: Number((TOTAL * 0.9).toFixed(1)), tol: 0.06 }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.store',
          text: 'Switching back must restore the standard numbers exactly — the store is the only source of truth.',
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: 'standard', do: [{ click: '[data-testid="prudent"]' }, { click: '[data-testid="standard"]' }] },
            { kind: 'text', selector: '[data-testid="z"]', value: Z_STD.toFixed(4) },
            { kind: 'textNumber', selector: '[data-testid="ibnr"]', value: TOTAL, tol: 0.05 }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'Alpine.store',
      q: 'Where must `Alpine.store(...)` be registered so the initial markup can read `$store`?',
      options: [
        'Anywhere on the page — stores resolve lazily',
        'In an `alpine:init` listener, or before `Alpine.start()` in a bundle',
        'In the `x-init` of the first component',
        'After `alpine:initialized`'
      ],
      answer: 1,
      why: 'The store must exist before the tree is walked, because `$store` is resolved while components initialise.',
      distractors: {
        0: 'A missing store throws during init — lazily-creating stores is not a thing.',
        2: 'By then the first component has already rendered.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: '$store',
      q: 'Two components read `$store.filters.q`. Component A sets it to `"marine"`. What happens in B?',
      options: [
        'Nothing until B re-reads the store',
        'B re-renders, because the store is reactive and B depends on `q`',
        'Only if B also declares `x-effect`',
        'B keeps the old value: stores are one-directional'
      ],
      answer: 1,
      why: 'A store is a shared reactive object: every component that read a property is subscribed to it.',
      distractors: { 3: 'One-directional describes `x-model` on a component prop, not a store.' }
    },
    {
      id: 'q3',
      type: 'multi',
      skill: 'Alpine.store',
      q: 'Which are good reasons to reach for a store?',
      options: [
        'Three sibling widgets must show the same filter',
        'A row deep in a table must move the toolbar',
        'One component\'s throwaway UI state (is this dropdown open?)',
        'Session data seeded once and read everywhere'
      ],
      answers: [0, 1, 3],
      why: 'Stores earn their keep when the state belongs to the page rather than to one component.',
      distractors: { 2: 'A dropdown\'s own open/closed state belongs in that dropdown — globalising it helps nobody.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'Alpine.store',
      q: 'What does `init()` do on a store?',
      options: [
        'Nothing — stores have no lifecycle',
        'It runs once, when the store is registered',
        'It runs before every read of `$store`',
        'It runs when the first component reads the store'
      ],
      answer: 1,
      why: '`init()` is called at registration — the natural place to hydrate from storage or SSR data.',
      distractors: { 3: 'It does not wait for a reader.' }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'Alpine.store',
      q: 'A store holds `rows: []`. Which mutation re-renders a component that read `$store.x.rows.length`?',
      options: [
        '`$store.x.rows.push(row)`',
        '`$store.x.rows = [...$store.x.rows, row]`',
        'Both of the above',
        'Neither — arrays need `$watch`'
      ],
      answer: 2,
      why: 'Alpine\'s reactivity tracks array methods and reference replacement alike, including `.length`.',
      distractors: { 3: 'No `$watch` needed: the proxy reports the change.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: '$store',
      q: 'Which magic reads a registered store inside a component? Answer with the `$` name.',
      accept: ['$store'],
      why: '`$store` — e.g. `$store.view.Z`, or `$store.ibnr.add(...)` for methods.'
    }
  ]
}
