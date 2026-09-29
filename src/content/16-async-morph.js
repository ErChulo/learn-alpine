/* Module 16 — async data, Alpine.morph and component extraction.
 * Matches: /advanced/async, /plugins/morph, /globals/alpine-data */

import { life, sq } from './data.js'

const AGES = [45, 50, 55, 60]
const TABLE = AGES.map(a => ({ age: a, qx: Number(life.qx(a).toFixed(5)), p10: Number(life.p(a, 10).toFixed(4)) }))
const QX = Object.fromEntries(TABLE.map(r => [r.age, r.qx]))
const RATES = [0.03, 0.045, 0.055]
const SCENARIOS = [
  RATES.map(r => Number(life.aDueTemp(45, 15, r).toFixed(4))),
  [0.035, 0.05, 0.06].map(r => Number(life.aDueTemp(45, 15, r).toFixed(4)))
]
const BASES = [
  { id: 'vbt', label: '2015 VBT', factor: 1 },
  { id: 'unisex', label: 'Unisex annuitant', factor: 1.14 }
]
const rowsFor = (factor, scale) => TABLE.map(r => ({ age: r.age, qx: Number((r.qx * factor).toFixed(5)), lx: Math.round(r.p10 * scale) }))
const ROWS_A = rowsFor(BASES[0].factor, 940000)
const ROWS_B = rowsFor(BASES[1].factor, 902000)

export default {
  id: 'm16',
  num: 16,
  title: 'Async data and morphing',
  blurb: 'await inside expressions, loading and error states, and Alpine.morph for refreshing markup without losing it.',
  goal: 'Load data asynchronously without hand-rolled spinners, and update markup while the user is still typing in it.',
  intro: `Alpine speaks \`await\`: expressions that return promises are awaited for you, so \`x-text="await label()"\` is legal — and an async function referenced without parentheses is detected and awaited too.\n\n**\`Alpine.morph(el, html)\`** takes existing markup plus new HTML and patches the difference *in place*: matching elements keep their DOM nodes, so an input keeps what the user typed, focus stays where it was, and Alpine state on a matched element is not thrown away. Options pair elements by a key attribute and let you observe the patch.\n\nBoth come together when a component is worth extracting: \`Alpine.data\` + \`alpine:init\` + one async load, used twice with different arguments.`,
  skills: ['async expressions', 'await in x-text', 'loading state', 'error state', 'Alpine.morph', 'morph key', 'Alpine.data extraction'],
  docRefs: [
    { label: 'Async', url: 'https://alpinejs.dev/advanced/async' },
    { label: 'Morph', url: 'https://alpinejs.dev/plugins/morph' },
    { label: 'Alpine.data', url: 'https://alpinejs.dev/globals/alpine-data' }
  ],
  mastery: [
    'Await promises directly in Alpine expressions, with and without parentheses',
    'Model loading, ready and failed states instead of hoping',
    'Patch markup with `Alpine.morph` while keeping node identity, input values and focus',
    'Extract an async component with `Alpine.data` and reuse it with different arguments'
  ],
  units: [
    {
      id: 's1',
      title: 'Async expressions',
      objective: 'Await a promise in the markup and show a real loading state.',
      brief: `Alpine awaits promises for you. Two forms are supported:\n\n\`\`\`html\n<span x-text="await rowLabel(50)"></span>   <!-- explicit await -->\n<span x-text="rowLabel"></span>            <!-- async function, no parentheses -->\n\`\`\`\n\nWhen the promise is pending the directive renders nothing new — so the *interesting* pattern is to keep a \`state\` flag beside the request and let \`x-init="await load()"\` drive it: \`idle → loading → ready\`, with \`failed\` and an error message when the promise rejects. Every async action should be able to end in a failure the user can see and retry.`,
      example: {
        code: `<div x-data="{ rows: [], state: 'loading', async load() { this.state = 'loading'; try { this.rows = await api(); this.state = 'ready' } catch (e) { this.state = 'failed' } } }" x-init="await load()">`,
        note: 'The state machine is the feature; the await is just syntax.'
      },
      starter: `<div x-data="{
  state: 'idle', qx: null, error: '', bomb: false,
  sleep(ms) { return new Promise(res => setTimeout(res, ms)) },
  async fetchAge(age) {
    await this.sleep(250)
    if (this.bomb) throw new Error('the mortality service is unavailable')
    return { age: age, qx: ${QX[50]} }
  }
}">
  <p>state <b data-testid="state" x-text="state"></b> · fetched qₓ <b data-testid="qx" x-text="qx === null ? '-' : qx"></b></p>
</div>`,
      solution: `<div x-data="{
  state: 'idle', qx: null, error: '', bomb: false,
  sleep(ms) { return new Promise(res => setTimeout(res, ms)) },
  async fetchAge(age) {
    await this.sleep(250)
    if (this.bomb) throw new Error('the mortality service is unavailable')
    return { age: age, qx: Number(( ${QX[50]} * (1 + (age - 50) / 400) ).toFixed(5)) }
  },
  async rowLabel(age) { const r = await this.fetchAge(age); return 'q' + r.age + ' = ' + r.qx },
  async label50() { return await this.rowLabel(50) },
  async load() {
    this.state = 'loading'; this.error = ''
    try { const r = await this.fetchAge(50); this.qx = r.qx; this.state = 'ready' }
    catch (e) { this.error = e.message; this.state = 'failed' }
  }
}" x-init="await load()">
  <p>
    state <b data-testid="state" x-text="state"></b> ·
    fetched qₓ <b data-testid="qx" x-text="qx === null ? '-' : qx"></b> ·
    awaited <b data-testid="labelAwait" x-text="await rowLabel(50)"></b> ·
    bare <b data-testid="labelBare" x-text="label50"></b>
  </p>
  <p data-testid="error" style="color:#ff9a9a" x-text="error"></p>
  <div class="row">
    <button data-testid="reload" @click="load()">reload from the service</button>
    <button data-testid="bomb" @click="bomb = !bomb">simulate an outage</button>
  </div>
</div>`,
      hints: [
        '`x-init="await load()"` is the whole initial-loading pattern: the flag flips to loading, the promise runs, the flag settles.',
        '`x-text="await rowLabel(50)"` is the explicit form; `x-text="label50"` is the paren-less form — Alpine notices the function is async and awaits it.',
        'Wrap the fetch in try/catch, keep the message in `error`, and let the user retry.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'await in x-text',
          text: `The awaited label must resolve to \`q50 = ${QX[50]}\` and the fetched qₓ must be on screen once the initial load settles.`,
          checks: [
            { kind: 'text', selector: '[data-testid="labelAwait"]', value: 'q50 = ' + QX[50], do: [{ wait: 500 }] },
            { kind: 'text', selector: '[data-testid="qx"]', value: String(QX[50]) },
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready' },
            { kind: 'code', pattern: 'await rowLabel\\(' }
          ]
        },
        {
          id: 't2',
          skill: 'async expressions',
          text: 'The paren-less method must resolve the same way — Alpine detects the async function and waits for it.',
          checks: [
            { kind: 'text', selector: '[data-testid="labelBare"]', value: 'q50 = ' + QX[50], do: [{ wait: 400 }] },
            { kind: 'code', pattern: 'x-text="label50"' }
          ]
        },
        {
          id: 't3',
          skill: 'loading state',
          text: 'A reload must pass through a visible `loading` state and land back on `ready`; an outage must land on `failed` with the message shown — never a silent blank.',
          checks: [
            { kind: 'text', selector: '[data-testid="state"]', value: 'loading', do: [{ click: '[data-testid="reload"]' }, { wait: 80 }] },
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready', do: [{ wait: 400 }] },
            { kind: 'text', selector: '[data-testid="state"]', value: 'failed', do: [{ click: '[data-testid="bomb"]' }, { click: '[data-testid="reload"]' }, { wait: 450 }] },
            { kind: 'textHas', selector: '[data-testid="error"]', value: 'unavailable' },
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready', do: [{ click: '[data-testid="bomb"]' }, { click: '[data-testid="reload"]' }, { wait: 450 }] }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Alpine.morph: new markup, same state',
      objective: 'Patch a region with new HTML and keep the nodes the user is using.',
      brief: `\`Alpine.morph(element, newHtml, options)\` walks the new HTML against the existing children and **patches** it: matching elements are updated in place rather than replaced. That is what makes it different from \`x-html\`, which throws the subtree away — and with it the text someone was typing, the focus, and any component state living inside.\n\nOptions: \`key\` (how to pair elements, defaulting to their \`key\` attribute), \`lookahead\`, and lifecycle hooks \`updating\`, \`updated\`, \`removing\`, \`removed\`, \`adding\`, \`added\`. The \`key\` attribute is the important one in practice: it tells the morph "these two are the same element" even when their position moved.`,
      example: {
        code: `Alpine.morph(this.$refs.panel, '<p>server said something new</p>', {
  updating(el, toEl) { /* called for every element being patched */ }
})`,
        note: 'A typed value survives only when the new markup does not set one — that is the deal morph makes.'
      },
      starter: `<div x-data="{ scenario: 0, morphs: 0, fixes: 0, refresh() {} }">
  <button data-testid="refresh" @click="refresh()">refresh from the server</button>
</div>`,
      solution: `<div x-data="{
  scenario: 0, morphs: 0, fixes: 0,
  scenarios: ${sq(SCENARIOS)},
  stamp() { return this.scenario > 0 ? 'Unisex annuitant, 5.0 %' : '2015 VBT, 4.5 %' },
  values() { return this.scenarios[Math.min(this.scenario, this.scenarios.length - 1)] },
  serverMarkup() {
    const vals = this.values()
    return '<div data-testid=quoteBody><div class=grid>'
      + vals.map((v, i) => '<span class=cell data-testid=cell key=r' + i + '>a-due ' + i + ': ' + v.toFixed(4) + '</span>').join('')
      + '</div><p data-testid=stamp>quoted on the ' + this.stamp() + ' basis</p>'
      + '<input data-testid=note class=inp placeholder=\\'reviewer note\\'>'
      + '<div data-testid=draft>draft note - left alone by the morph</div></div>'
  },
  refresh(root) {
    this.scenario++
    this.morphs++
    Alpine.morph(root.querySelector('[data-testid=quoteBody]'), this.serverMarkup(), {
      updating: (el, toEl) => { this.fixes++ }
    })
  }
}">
  <div class="row">
    <button data-testid="refresh" @click="refresh($root)">refresh from the server</button>
    <span class="muted">morphs <b data-testid="morphs" x-text="morphs"></b> · patched elements <b data-testid="fixes" x-text="fixes"></b></span>
  </div>

  <div data-testid="panel" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px"><div data-testid="quoteBody"><div class="grid"><span class="cell" data-testid="cell" key="r0">a-due 0: ${SCENARIOS[0][0].toFixed(4)}</span><span class="cell" data-testid="cell" key="r1">a-due 1: ${SCENARIOS[0][1].toFixed(4)}</span><span class="cell" data-testid="cell" key="r2">a-due 2: ${SCENARIOS[0][2].toFixed(4)}</span></div><p data-testid="stamp">quoted on the 2015 VBT, 4.5 % basis</p><input data-testid="note" class="inp" placeholder="reviewer note"><div data-testid="draft">draft note - left alone by the morph</div></div></div>
</div>`,
      hints: [
        'Morph pairs children *positionally*: the new markup must repeat the same wrapper and the same child sequence, whitespace included. Keep the generated HTML compact and the `quoteBody` block on one line so no stray text nodes break the alignment.',
        'Give every patched region a `key` attribute: it is how morph pairs elements between the old and new markup.',
        'Never write a `value` attribute into the new HTML for an input the user is typing in — a typed value cannot be merged.',
        'The `updating` hook fires per element the morph patches — a cheap way to see that it really ran. Look the region up with `$root.querySelector(...)`: morph patches attributes, so a `$refs` handle on a morphed element is not to be trusted.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.morph',
          text: `Refreshing must patch in place: the three cells keep their identity (not rebuilt) and show the new scenario values ${SCENARIOS[1].map(v => v.toFixed(4)).join(', ')}.`,
          checks: [
            { kind: 'code', pattern: 'Alpine\\.morph\\(' },
            { kind: 'code', pattern: 'key="r0"' },
            { kind: 'list', selector: '[data-testid="cell"]', values: SCENARIOS[0].map((v, i) => 'a-due ' + i + ': ' + v.toFixed(4)) },
            { kind: 'textHas', selector: '[data-testid="stamp"]', value: 'Unisex', do: [{ mark: '[data-testid="cell"]' }, { click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'list', selector: '[data-testid="cell"]', values: SCENARIOS[1].map((v, i) => 'a-due ' + i + ': ' + v.toFixed(4)) },
            { kind: 'custom', name: 'marked', selector: '[data-testid="cell"]' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.morph',
          text: 'A note typed into the panel must survive the refresh, because morph keeps the input node instead of rebuilding it — and the untouched block must still be there.',
          checks: [
            { kind: 'text', selector: '[data-testid="note"]', value: '', do: [{ click: '[data-testid="refresh"]' }, { wait: 200 }] },
            { kind: 'prop', selector: '[data-testid="note"]', prop: 'value', value: 'tail factor looks low to me', do: [{ type: '[data-testid="note"]', value: 'tail factor looks low to me' }, { wait: 80 }, { click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'textHas', selector: '[data-testid="draft"]', value: 'left alone' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.morph',
          text: 'The work must be observable: the morph counter and the `updating` hook both move when a refresh really patches, and the panel still shows the refreshed basis afterwards.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="morphs"]', pattern: '^[1-9]\\d*$', do: [{ click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'textMatch', selector: '[data-testid="fixes"]', pattern: '^[1-9]\\d*$' },
            { kind: 'textMatch', selector: '[data-testid="stamp"]', pattern: 'Unisex' },
            { kind: 'list', selector: '[data-testid="cell"]', values: SCENARIOS[1].map((v, i) => 'a-due ' + i + ': ' + v.toFixed(4)) }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Extract it into a component',
      objective: 'Register an async component once and use it twice with different arguments.',
      brief: `The extraction recipe has three parts: register inside \`alpine:init\` (or before \`Alpine.start()\` in a bundle), return a **factory** so each instance gets its own state, and accept arguments:\n\n\`\`\`html\n<script>\n  document.addEventListener('alpine:init', () => {\n    Alpine.data('basisTable', (age, factor) => ({ age, factor, rows: [], async init() { … } }))\n  })\n</script>\n\n<div x-data="basisTable(45, 1)"></div>\n<div x-data="basisTable(60, 1.14)"></div>\n\`\`\`\n\nA method called \`init()\` runs automatically when the component is created, which is where the async load belongs. Two instances then behave independently: their state, their requests and their numbers never touch.`,
      example: {
        code: `Alpine.data('basisTable', (age) => ({ age, rows: [], state: 'loading', async init() { this.rows = await load(age); this.state = 'ready' } }))`,
        note: 'Data, behaviour and the initial fetch live together — the markup only chooses the arguments.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    // register the component here
  })
</script>

<div x-data="{}">
  <p>two independently loading cards will go here</p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('basisTable', (age, factor) => ({
      age: age,
      factor: factor,
      state: 'loading',
      rows: [],
      sleep(ms) { return new Promise(res => setTimeout(res, ms)) },
      async fetchRows() {
        await this.sleep(200)
        if (this.failNext) throw new Error('service unavailable')
        return ${sq(TABLE)}.map(r => ({ age: r.age, qx: Number((r.qx * this.factor).toFixed(5)) }))
      },
      async init() {
        this.state = 'loading'
        try { this.rows = await this.fetchRows(); this.state = 'ready' }
        catch (e) { this.state = 'failed' }
      }
    }))
  })
</script>

<div data-testid="card" data-instance="a" x-data="basisTable(45, 1)" style="border:1px solid #253253;border-radius:8px;padding:8px;margin-bottom:8px">
  <b>age 45 · standard</b> — <span data-testid="state" x-text="state"></span>
  <ul style="list-style:none;padding:0">
    <template x-for="r in rows" :key="r.age">
      <li>age <span x-text="r.age"></span>: qₓ <b data-testid="qx" x-text="r.qx"></b></li>
    </template>
  </ul>
</div>

<div data-testid="card" data-instance="b" x-data="basisTable(60, 1.14)" style="border:1px solid #253253;border-radius:8px;padding:8px">
  <b>age 60 · 114 % of standard</b> — <span data-testid="state" x-text="state"></span>
  <ul style="list-style:none;padding:0">
    <template x-for="r in rows" :key="r.age">
      <li>age <span x-text="r.age"></span>: qₓ <b data-testid="qx" x-text="r.qx"></b></li>
    </template>
  </ul>
</div>`,
      hints: [
        'Register inside the `alpine:init` listener, and return an object from a factory function — not a shared object literal.',
        '`init()` is called automatically on creation: start the request there and set `state`.',
        'Pass the arguments through `x-data="basisTable(45, 1)"`; each instance must use its own `age` and `factor`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data extraction',
          text: 'The component must be registered as `basisTable` and used twice with different arguments, both reaching `ready`.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.data\\('basisTable'" },
            { kind: 'code', pattern: 'x-data="basisTable\\(45, 1\\)"' },
            { kind: 'code', pattern: 'x-data="basisTable\\(60, 1\\.14\\)"' },
            { kind: 'count', selector: '[data-testid="card"]', value: 2 },
            { kind: 'list', selector: '[data-testid="state"]', values: ['ready', 'ready'], do: [{ wait: 600 }] }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.data extraction',
          text: 'The instances must not share state: the first card loads the standard table and the second one is scaled by 114 % — the numbers differ accordingly.',
          checks: [
            { kind: 'list', selector: '[data-instance="a"] [data-testid="qx"]', values: TABLE.map(r => String(Number((r.qx * 1).toFixed(5)))) },
            { kind: 'list', selector: '[data-instance="b"] [data-testid="qx"]', values: TABLE.map(r => String(Number((r.qx * 1.14).toFixed(5)))) }
          ]
        },
        {
          id: 't3',
          skill: 'loading state',
          text: '`init()` must own the async load, so the state machine is part of the component rather than the markup.',
          checks: [
            { kind: 'code', pattern: 'async init\\(' },
            { kind: 'textMatch', selector: '[data-instance="a"] [data-testid="state"]', pattern: '^(loading|ready)$' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — an async basis loader with retry',
      objective: 'Two bases, honest loading and failure states, and rows that only appear when the data is really there.',
      scenario: `Valuation needs to pull two tables — ${BASES.map(b => `${b.label} (${(b.factor * 100).toFixed(0)} % of standard)`).join(' and ')} — from a service that takes about 250ms and sometimes fails. Reviewers must always know which table is on screen, whether a request is in flight, and why nothing arrived when it did not.`,
      brief: `Elements: \`data-testid="basis"\` (a button per basis), \`data-testid="state"\` (\`loading\` / \`ready\` / \`failed\`), \`data-testid="label"\` naming the loaded basis, \`data-testid="table"\` with one \`data-testid="row"\` per age when ready, \`data-testid="error"\` carrying the failure message, and \`data-testid="retry"\` which repeats the last request. Bases: ${BASES.map(b => `${b.id}: ${b.label}`).join(', ')}.`,
      starter: `<div x-data="{ state: 'loading', basis: null, error: '' }">
  <p>nothing loaded yet</p>
</div>`,
      solution: `<div x-data="{
  state: 'loading', basis: null, error: '', bomb: false,
  bases: ${sq(BASES.map(b => ({ id: b.id, label: b.label })))},
  rows: ${sq(ROWS_A)},
  loaded: ${sq(ROWS_A)},
  sleep(ms) { return new Promise(res => setTimeout(res, ms)) },
  async load(id) {
    this.state = 'loading'; this.error = ''
    await this.sleep(250)
    try {
      if (this.bomb) throw new Error('the valuation service did not answer')
      this.rows = id === 'unisex' ? ${sq(ROWS_B)} : ${sq(ROWS_A)}
      this.basis = id
      this.state = 'ready'
    } catch (e) { this.error = e.message; this.state = 'failed' }
  },
  retry() { this.load(this.basis || 'vbt') }
}" x-init="await load('vbt')">
  <div class="row">
    <template x-for="b in bases" :key="b.id">
      <button data-testid="basis" @click="load(b.id)" x-text="b.label"></button>
    </template>
    <button data-testid="retry" @click="retry()">retry</button>
    <button data-testid="outage" @click="bomb = !bomb">simulate an outage</button>
  </div>
  <p>
    state <b data-testid="state" x-text="state"></b> ·
    basis <b data-testid="label" x-text="basis === null ? '-' : (bases.find(b => b.id === basis) || {}).label"></b>
  </p>
  <p data-testid="error" style="color:#ff9a9a" x-text="error"></p>
  <table data-testid="table" x-show="state === 'ready'">
    <thead><tr><th>age</th><th>qₓ</th><th>lₓ</th></tr></thead>
    <tbody>
      <template x-for="r in rows" :key="r.age">
        <tr data-testid="row"><td x-text="r.age"></td><td data-testid="qx" x-text="r.qx"></td><td x-text="r.lx"></td></tr>
      </template>
    </tbody>
  </table>
</div>`,
      hints: [
        'One method (`load`) owns the whole request: set loading, await, then commit rows and basis together — never half of them.',
        'The initial load belongs in `x-init="await load(\'vbt\')"`; the buttons just call the same method with another id.',
        'Retry needs to remember which basis was being fetched, so keep the selection in state (`basis`) and default it to vbt.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'loading state',
          text: `The initial load must settle on the 2015 VBT table: \`ready\`, the basis named, and ${ROWS_A.length} rows with their qₓ values (${ROWS_A.map(r => r.qx).join(', ')}).`,
          checks: [
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready', do: [{ wait: 600 }] },
            { kind: 'textHas', selector: '[data-testid="label"]', value: '2015 VBT' },
            { kind: 'count', selector: '[data-testid="row"]', value: ROWS_A.length },
            { kind: 'list', selector: '[data-testid="qx"]', values: ROWS_A.map(r => String(r.qx)) }
          ]
        },
        {
          id: 't2',
          skill: 'async expressions',
          text: `Switching basis must show the loading state while the request is in flight and then swap in the other table (${ROWS_B.map(r => r.qx).join(', ')}).`,
          checks: [
            { kind: 'text', selector: '[data-testid="state"]', value: 'loading', do: [{ click: '[data-testid="basis"]:nth-of-type(2)' }, { wait: 80 }] },
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready', do: [{ wait: 500 }] },
            { kind: 'textHas', selector: '[data-testid="label"]', value: 'Unisex' },
            { kind: 'list', selector: '[data-testid="qx"]', values: ROWS_B.map(r => String(r.qx)) }
          ]
        },
        {
          id: 't3',
          skill: 'error state',
          text: 'A failed request must say so and be retryable: `failed` with the message, then `ready` again once the service behaves.',
          checks: [
            { kind: 'text', selector: '[data-testid="state"]', value: 'failed', do: [{ click: '[data-testid="outage"]' }, { click: '[data-testid="retry"]' }, { wait: 450 }] },
            { kind: 'textHas', selector: '[data-testid="error"]', value: 'did not answer' },
            { kind: 'text', selector: '[data-testid="state"]', value: 'ready', do: [{ click: '[data-testid="outage"]' }, { click: '[data-testid="retry"]' }, { wait: 500 }] },
            { kind: 'count', selector: '[data-testid="row"]', value: ROWS_B.length }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — refresh the quote without losing the notes',
      objective: 'Morph server markup into a live panel and keep everything the reviewer touched.',
      scenario: `The annuity quote recalculation arrives as fresh markup. The reviewer has already typed a note and a compliance flag is parked in the panel, and both must survive the refresh untouched — while the three annuity values and the basis stamp do change. Number-of-patches must be visible, so a refresh that quietly did nothing cannot pass review.`,
      brief: `Elements: \`data-testid="refresh"\` (morph in the new markup), \`data-testid="panel"\` (the morphed region), three \`data-testid="value"\` cells each with a \`key\` attribute, \`data-testid="stamp"\`, the note input \`data-testid="note"\`, the untouched block \`data-testid="compliance"\`, and the readouts \`data-testid="patches"\` and \`data-testid="gen"\`. Scenario 0 rates ${RATES.map(r => (r * 100).toFixed(1) + ' %').join(' / ')} → ${SCENARIOS[0].map(v => v.toFixed(4)).join(', ')}; scenario 1 → ${SCENARIOS[1].map(v => v.toFixed(4)).join(', ')}.`,
      starter: `<div x-data="{ gen: 0, patches: 0 }">
  <button data-testid="refresh" @click="gen++">refresh the quote</button>
  <div data-testid="panel">quote panel</div>
</div>`,
      solution: `<div x-data="{
  gen: 0, patches: 0,
  scenarios: ${sq(SCENARIOS)},
  values() { return this.scenarios[Math.min(this.gen, this.scenarios.length - 1)] },
  serverMarkup() {
    const vals = this.values()
    return '<div data-testid=quoteBody><div class=grid>'
      + vals.map((v, i) => '<span class=cell data-testid=value key=v' + i + '>' + v.toFixed(4) + '</span>').join('')
      + '</div><p data-testid=stamp>recalculated on the ' + (this.gen > 0 ? '5.0 %' : '4.5 %') + ' basis</p>'
      + '<input data-testid=note class=inp placeholder=\\'reviewer note\\'>'
      + '<div data-testid=compliance>compliance flag: tail factor under review</div></div>'
  },
  refresh(root) {
    this.gen++
    Alpine.morph(root.querySelector('[data-testid=quoteBody]'), this.serverMarkup(), {
      updating: () => { this.patches++ }
    })
  }
}">
  <div class="row">
    <button data-testid="refresh" @click="refresh($root)">refresh the quote</button>
    <span class="muted">generation <b data-testid="gen" x-text="gen"></b> · patched elements <b data-testid="patches" x-text="patches"></b></span>
  </div>

  <div data-testid="panel" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px"><div data-testid="quoteBody"><div class="grid"><span class="cell" data-testid="value" key="v0">${SCENARIOS[0][0].toFixed(4)}</span><span class="cell" data-testid="value" key="v1">${SCENARIOS[0][1].toFixed(4)}</span><span class="cell" data-testid="value" key="v2">${SCENARIOS[0][2].toFixed(4)}</span></div><p data-testid="stamp">recalculated on the 4.5 % basis</p><input data-testid="note" class="inp" placeholder="reviewer note"><div data-testid="compliance">compliance flag: tail factor under review</div></div></div>
</div>`,
      hints: [
        'Build the new HTML the way the server would: the same `quoteBody` wrapper and the same child sequence with new numbers, and never a `value` attribute on the note input. Morph the region you look up with `$root.querySelector(...)`.',
        'Each cell needs a `key` so the morph can pair it with the cell it already has.',
        'Count the `updating` hook calls into `patches`; that counter is the proof the patch really happened.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.morph',
          text: `One refresh must move the panel to scenario 1 (${SCENARIOS[1].map(v => v.toFixed(4)).join(', ')}) while keeping the three cell nodes — not rebuilding them — and updating the stamp.`,
          checks: [
            { kind: 'code', pattern: 'Alpine\\.morph\\(' },
            { kind: 'code', pattern: 'key="v0"' },
            { kind: 'list', selector: '[data-testid="value"]', values: SCENARIOS[0].map(v => v.toFixed(4)) },
            { kind: 'textHas', selector: '[data-testid="stamp"]', value: '5.0', do: [{ mark: '[data-testid="value"]' }, { click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'list', selector: '[data-testid="value"]', values: SCENARIOS[1].map(v => v.toFixed(4)) },
            { kind: 'custom', name: 'marked', selector: '[data-testid="value"]' }
          ]
        },
        {
          id: 't2',
          skill: 'morph key',
          text: 'The typed note and the compliance flag must be exactly as the reviewer left them after the refresh.',
          checks: [
            { kind: 'prop', selector: '[data-testid="note"]', prop: 'value', value: 'tail factor under review by actuarial', do: [{ type: '[data-testid="note"]', value: 'tail factor under review by actuarial' }, { click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'textHas', selector: '[data-testid="compliance"]', value: 'tail factor under review' },
            { kind: 'textMatch', selector: '[data-testid="stamp"]', pattern: 'on the (4\\.5|5\\.0) % basis' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.morph',
          text: 'Refreshing must be observable: a generation counter and a patch count that both move, with the recalculated values on screen.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="gen"]', pattern: '^[1-9]\\d*$', do: [{ click: '[data-testid="refresh"]' }, { wait: 250 }] },
            { kind: 'textMatch', selector: '[data-testid="patches"]', pattern: '^[1-9]\\d*$' },
            { kind: 'list', selector: '[data-testid="value"]', values: SCENARIOS[1].map(v => v.toFixed(4)) },
            { kind: 'textHas', selector: '[data-testid="stamp"]', value: '5.0' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'await in x-text',
      q: 'Which expression is legal in Alpine?',
      options: [
        '<span x-text="await getLabel()"></span>',
        '<span x-text="getLabel().then(...)"></span>',
        '<span x-text="Promise.resolve(getLabel())"></span>',
        'None — await needs x-init'
      ],
      answer: 0,
      why: 'Alpine awaits promises in expressions, and it also detects an async function passed without parentheses (`x-text="getLabel"`).',
      distractors: { 1: 'Statements do not work in Alpine expressions — only expressions do.' }
    },
    {
      id: 'q2',
      type: 'multi',
      skill: 'loading state',
      q: 'What should a request-driven component keep, so the interface never lies?',
      options: [
        'A state flag (`loading` / `ready` / `failed`)',
        'The error message, so the failure can be shown and retried',
        'A timeout that forces the data to appear anyway',
        'The last good data, so a failed refresh does not blank the screen'
      ],
      answers: [0, 1, 3],
      why: 'State, message and retained data: that is the difference between a spinner and an interface someone can trust.',
      distractors: { 2: 'Pretending a request succeeded is how wrong numbers reach a valuation report.' }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'Alpine.morph',
      q: 'What does `Alpine.morph(el, newHtml)` do that `x-html` does not?',
      options: [
        'It parses HTML faster',
        'It patches the existing children instead of replacing the subtree, so matching nodes keep their identity and state',
        'It sanitises the HTML',
        'It only works inside x-data'
      ],
      answer: 1,
      why: 'Morph pairs the old and new trees and updates in place — that is why a typed input value and Alpine state inside the region survive.',
      distractors: {
        0: 'Speed is not the point: identity and state are.',
        2: 'Neither directive sanitises anything — run untrusted HTML through your own sanitiser first.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'morph key',
      q: 'How does morph decide that a `<span>` in the new markup is "the same element" as one already in the DOM?',
      options: [
        'By position in the tree only',
        'By the `key` attribute (or whatever `key:` option you pass)',
        'By the element id',
        'By comparing text content'
      ],
      answer: 1,
      why: 'The default key getter reads the `key` attribute, and passing your own `key` option lets you use ids or data attributes instead.',
      distractors: {
        0: 'Position decides where an unmatched node goes next — the key decides which node it *is*.',
        3: 'Text content changes on every refresh, which is exactly what a morph is for.'
      }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'Alpine.data extraction',
      q: 'Why must `Alpine.data("card", …)` be called inside an `alpine:init` listener (or before `Alpine.start()`)?',
      options: [
        'Because Alpine walks the DOM once at start: registration after that comes too late',
        'Because otherwise it registers twice',
        'Because Alpine.data is asynchronous',
        'It does not matter — registration order is irrelevant'
      ],
      answer: 0,
      why: 'The tree is initialised once, and `x-data="card"` has to resolve to a registered name during that walk.',
      distractors: { 3: 'Register after the walk and the component name resolves to nothing.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'loading state',
      q: 'Which method name on a registered component does Alpine call automatically when the component is created? Answer with the name only.',
      accept: ['init'],
      why: '`init()` — the natural home for an initial async load, and for anything that must happen once per instance.'
    }
  ]
}
