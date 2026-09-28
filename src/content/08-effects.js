/* Module 8 — effects and lifecycle: x-init, x-effect, $watch, $nextTick.
 * Matches: /directives/init, /directives/effect, /essentials/lifecycle, /magics/watch */

import { life, rnd, sq } from './data.js'

const RATES = [0.03, 0.045, 0.055]
const ADUE = RATES.map(r => Number(life.aDueTemp(45, 15, r).toFixed(4)))
const SUM = 250000
const KEY = 'learn-alpine.demo.draft'
const SEED = { policy: 'UL-4417', rate: 0.045, sum: SUM }
const BEN = [
  { name: 'Ingrid Halvorsen', share: 0.5 },
  { name: 'Petra Halvorsen', share: 0.5 }
]

export default {
  id: 'm08',
  num: 8,
  title: 'Effects and lifecycle',
  blurb: 'x-init, x-effect, $watch and $nextTick — the four verbs of "when".',
  goal: 'Know exactly when your code runs: on init, on state change, or after the DOM has caught up.',
  intro: `Four tools, four moments:\n\n**\`x-init\`** runs once, when the component is created — and can be \`async\`, so \`x-init="await load()"\` is legal. **\`x-effect\`** re-runs whenever the reactive values *read during its last run* change. **\`$watch\`** does the same for one named property, with old and new values, and can be deep or immediate. **\`$nextTick\`** defers work until the DOM has been updated — the tool you reach for when you need to focus or measure something you just rendered.`,
  skills: ['x-init', 'x-effect', '$watch', '$nextTick', 'lifecycle'],
  docRefs: [
    { label: 'x-init', url: 'https://alpinejs.dev/directives/init' },
    { label: 'x-effect', url: 'https://alpinejs.dev/directives/effect' },
    { label: 'Lifecycle', url: 'https://alpinejs.dev/essentials/lifecycle' },
    { label: '$watch', url: 'https://alpinejs.dev/magics/watch' }
  ],
  mastery: [
    'Seed state in `x-init`, including from an `await`',
    'Keep a side effect (document title, storage, derived cache) in sync with `x-effect`',
    'Audit changes with `$watch` — including old value, deep and immediate options',
    'Touch the DOM only after Alpine has rendered it, using `$nextTick`'
  ],
  units: [
    {
      id: 's1',
      title: 'x-init: the once-per-component hook',
      objective: 'Seed state and run a one-off side effect at creation time.',
      brief: `\`x-init\` runs once for each element that carries it (or, if the element also has \`x-data\`, for that component — in which case you can use the short form \`x-data="…" x-init="…"\`).\n\nBecause it is *one* run, seeding, subscribing and registering live here. It may be \`async\`: Alpine awaits nothing on your behalf, but \`x-init="await load()"\` is a supported expression.`,
      example: {
        code: `<div x-data="{ pol: null }" x-init="pol = await fetchPolicy(id)">
  <p x-text="pol?.id ?? 'loading…'"></p>
</div>`,
        note: 'An async `x-init` leaves the component usable immediately; guard the template for `null`.'
      },
      starter: `<div x-data="{ basis: 'unset', ran: 0 }" x-init="basis = '4.50 %', ran++">
  <p>basis: <b data-testid="basis" x-text="basis"></b></p>
  <p>init ran <b data-testid="ran" x-text="ran"></b> time(s)</p>
</div>`,
      solution: `<div x-data="{ basis: 'unset', ran: 0, loaded: false }" x-init="basis = '4.50 %', ran++, loaded = true">
  <p>basis: <b data-testid="basis" x-text="basis"></b></p>
  <p>init ran <b data-testid="ran" x-text="ran"></b> time(s) — loaded: <b data-testid="loaded" x-text="loaded"></b></p>
  <button data-testid="touch" @click="basis = '6.00 %'">switch to the 6.00 % basis</button>
</div>`,
      hints: [
        '`x-init` belongs on the component root, next to `x-data`.',
        'A comma expression runs several statements: `basis = \'4.50 %\', ran++`.',
        'The counter proves it runs once: changing state later must not re-run it.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-init',
          text: 'The component must boot with basis `4.50 %`, not the `unset` placeholder, and `ran` must read 1.',
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: '4.50 %' },
            { kind: 'text', selector: '[data-testid="ran"]', value: '1' },
            { kind: 'text', selector: '[data-testid="loaded"]', value: 'true' }
          ]
        },
        {
          id: 't2',
          skill: 'x-init',
          text: 'Add a button (`data-testid="touch"`) that changes `basis` to `6.00 %`; the counter must stay at 1, proving `x-init` is not a reactive effect.',
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: '6.00 %', do: [{ click: '[data-testid="touch"]' }] },
            { kind: 'text', selector: '[data-testid="ran"]', value: '1' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'x-effect: derived work that keeps itself honest',
      objective: 'Mirror state into somewhere outside Alpine — the title, storage, another object.',
      brief: `An \`x-effect\` callback runs immediately, and again whenever any reactive value **read during that run** changes. That "read during the run" is the whole model: read it and you are subscribed, do not read it and you are not.\n\nTypical uses: keeping \`document.title\` in step with the route or policy, mirroring a draft into storage, and recomputing a cache you would rather not recompute in the template.`,
      example: {
        code: `<div x-data="{ q: '' }" x-effect="document.title = q ? 'search · ' + q : 'reserve board'">
  <input x-model="q">
</div>`,
        note: 'Reads that happen *after* the callback returns (inside a `setTimeout`) are not tracked — that is the classic leak.'
      },
      starter: `<div x-data="{ pol: '${SEED.policy}', rate: ${SEED.rate}, mirror: '' }">
  <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
  <p>mirror: <b data-testid="mirror" x-text="mirror"></b></p>
</div>`,
      solution: `<div x-data="{ pol: '${SEED.policy}', rate: ${SEED.rate}, mirror: '', renders: 0 }"
     x-effect="mirror = pol + '@' + rate.toFixed(3), renders++, document.title = mirror">
  <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
  <p>mirror: <b data-testid="mirror" x-text="mirror"></b></p>
  <p>effect runs: <b data-testid="renders" x-text="renders"></b></p>
</div>`,
      hints: [
        '`x-effect` runs once on init, so `mirror` must already be filled before the user touches anything.',
        `Expected initial mirror: ${SEED.policy}@${SEED.rate.toFixed(3)}.`,
        'Change the rate and both the mirror and the run counter must move — no click handler required.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-effect',
          text: `On init the mirror must read \`${SEED.policy}@${SEED.rate.toFixed(3)}\` and the effect must have run exactly once.`,
          checks: [
            { kind: 'text', selector: '[data-testid="mirror"]', value: `${SEED.policy}@${SEED.rate.toFixed(3)}` },
            { kind: 'text', selector: '[data-testid="renders"]', value: '1' }
          ]
        },
        {
          id: 't2',
          skill: 'x-effect',
          text: 'Typing a new rate must re-run the effect without any explicit handler: at 0.055 the mirror ends in `@0.055` and the counter has advanced to 2.',
          checks: [
            { kind: 'textHas', selector: '[data-testid="mirror"]', value: '@0.055', do: [{ type: '[data-testid="rate"]', value: '0.055' }] },
            { kind: 'text', selector: '[data-testid="renders"]', value: '2' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: '$watch and $nextTick',
      objective: 'React to one property with old/new values, and defer DOM work until after render.',
      brief: `**\`$watch('rate', (value, old) => …)\`** is the surgical version of an effect: one property, both values, and options \`{ immediate: true, deep: true }\`. It is the right place for an audit trail.\n\n**\`$nextTick(cb)\`** defers until Alpine has flushed the DOM. Any time you want to *focus*, *scroll to* or *measure* something that was just added, you need it — otherwise you are measuring a node that does not exist yet.`,
      example: {
        code: `x-init="$watch('rate', (v, old) => audit.push(old + ' → ' + v))"
@click="rows.push({}), $nextTick(() => $refs.last.focus())"`,
        note: 'Watch for the record, nextTick for the pixels.'
      },
      starter: `<div x-data="{ rate: ${SEED.rate}, audit: [], rows: [] }">
  <button data-testid="add" @click="addRow()">add row</button>
  <ul><template x-for="(r, i) in rows" :key="i"><li data-testid="row"><input x-ref="rowInput"></li></template></ul>
  <ul><template x-for="(a, i) in audit" :key="i"><li data-testid="audit" x-text="a"></li></template></ul>
</div>`,
      solution: `<div x-data="{
  rate: ${SEED.rate},
  audit: [],
  rows: [],
  addRow() {
    this.rows.push({ seed: this.rate })
    this.$nextTick(() => { const el = this.$refs.rowInput; if (el) (Array.isArray(el) ? el[el.length - 1] : el).focus() })
  }
}" x-init="$watch('rate', (v, old) => audit.push(old + ' → ' + v))">
  <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
  <button data-testid="add" @click="addRow()">add row</button>
  <ul><template x-for="(r, i) in rows" :key="i"><li data-testid="row"><input data-testid="rowInput" x-ref="rowInput" :value="r.seed"></li></template></ul>
  <ul><template x-for="(a, i) in audit" :key="i"><li data-testid="audit" x-text="a"></li></template></ul>
</div>`,
      hints: [
        'Register the watch in the root `x-init`: `$watch(\'rate\', (v, old) => audit.push(old + \' → \' + v))`.',
        '`$refs.rowInput` becomes an **array** once several rows share the ref name — take the last one.',
        'Focusing inside `$nextTick` is the difference between "input does not exist yet" and "focused".'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$watch',
          text: `Changing the rate to 0.06 must append exactly one audit line reading \`${SEED.rate} → 0.06\`, and changing it to 0.02 afterwards must append a second.`,
          checks: [
            { kind: 'count', selector: '[data-testid="audit"]', value: 0 },
            { kind: 'list', selector: '[data-testid="audit"]', values: [`${SEED.rate} → 0.06`], do: [{ type: '[data-testid="rate"]', value: '0.06' }] },
            { kind: 'listLong', selector: '[data-testid="audit"]', value: 2, do: [{ type: '[data-testid="rate"]', value: '0.02' }] },
            { kind: 'text', selector: '[data-testid="audit"]', nth: 1, value: '0.06 → 0.02' }
          ]
        },
        {
          id: 't2',
          skill: '$nextTick',
          text: 'Clicking `add` must append a row **and** leave focus inside that new row\'s input (only `$nextTick` can do the second part).',
          checks: [
            { kind: 'count', selector: '[data-testid="row"]', value: 1, do: [{ click: '[data-testid="add"]' }] },
            { kind: 'focused', selector: '[data-testid="rowInput"]', nth: 0 },
            { kind: 'count', selector: '[data-testid="row"]', value: 2, do: [{ click: '[data-testid="add"]' }] },
            { kind: 'focused', selector: '[data-testid="rowInput"]', nth: 1 }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — valuation workbench with an audit trail',
      objective: 'Wire init, effect, watch and nextTick together in one believable tool.',
      scenario: `A reserving team edits a policy's valuation rate. The workbench must: boot from a seeded basis; keep \`document.title\` in step so the browser tab identifies the case; record every rate revision with old → new; and when a beneficiary row is added, focus its share field immediately so the actuary can type straight away.\n\nRates and the resulting temporary annuity-due for a 15-year endowment on (45): ${RATES.map((r, i) => `${(r * 100).toFixed(1)} % → ä ${ADUE[i]}`).join(' · ')}.`,
      brief: `Seed the component with policy \`${SEED.policy}\`, rate ${SEED.rate} and a beneficiary list. Elements: \`data-testid="rate"\` (number), \`data-testid="tabTitle"\` (mirrors the document title), \`data-testid="rev"\` lines reading \`0.045 → 0.055\`, \`data-testid="addBen"\` button, \`data-testid="share"\` inputs (one per beneficiary, focused on add), and \`data-testid="aDue"\` showing the annuity-due from the table above (unavailable → \`n/a\`).`,
      starter: `<div x-data="{ pol: '${SEED.policy}', rate: ${SEED.rate}, ben: ${sq(BEN)}, rev: [] }">
</div>`,
      solution: `<div x-data="{
  pol: '${SEED.policy}',
  rate: ${SEED.rate},
  ben: ${sq(BEN)},
  rev: [],
  table: ${sq(RATES.map((r, i) => [r, ADUE[i]]))},
  get tabTitle() { return 'valuation · ' + this.pol + ' @ ' + this.rate.toFixed(3) },
  get synced() { return this.tabTitle === document.title ? 'yes' : 'no' },
  get aDue() { const hit = this.table.find(([r]) => r === this.rate); return hit ? hit[1] : null },
  addBen() { this.ben.push({ name: 'new beneficiary', share: 0 }); this.$nextTick(() => { const els = this.$refs.share; (Array.isArray(els) ? els[els.length - 1] : els).focus() }) }
}"
     x-init="$watch('rate', (v, old) => rev.push(old + ' → ' + v))"
     x-effect="document.title = 'valuation · ' + pol + ' @ ' + rate.toFixed(3)">
  <p class="muted">tab title: <span data-testid="tabTitle" x-text="tabTitle"></span> · book says: <span data-testid="synced" x-text="synced"></span></p>
  <p>
    rate <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
    → ä<sub>45:15</sub> = <b data-testid="aDue" x-text="aDue === null ? 'n/a' : aDue.toFixed(4)"></b>
  </p>
  <button data-testid="addBen" @click="addBen()">add beneficiary</button>
  <button data-testid="clearRev" @click="rev = []">clear the audit trail</button>
  <ul>
    <template x-for="(b, i) in ben" :key="i">
      <li data-testid="ben"><span x-text="b.name"></span> — <input data-testid="share" x-ref="share" type="number" step="0.05" x-model.number="b.share" style="width:90px"></li>
    </template>
  </ul>
  <ul><template x-for="(r, i) in rev" :key="i"><li data-testid="rev" x-text="r"></li></template></ul>
</div>`,
      hints: [
        'The title belongs in `x-effect` — it must follow *any* change of `pol` or `rate`.',
        'The revision list belongs in `$watch` in the root `x-init` (you want old and new).',
        'To focus the freshly added share input: push first, then `$nextTick(...)`, then take the **last** `$refs.share` entry.',
        `Expected tab title at the seed basis: \`valuation · ${SEED.policy} @ ${SEED.rate.toFixed(3)}\`.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-effect',
          text: `The document title and \`data-testid="tabTitle"\` must both read \`valuation · ${SEED.policy} @ 0.045\` on boot, and follow the rate when it changes to 0.03.`,
          checks: [
            { kind: 'custom', name: 'docTitle', value: `valuation · ${SEED.policy} @ 0.045` },
            { kind: 'custom', name: 'docTitle', value: `valuation · ${SEED.policy} @ 0.030`, do: [{ type: '[data-testid="rate"]', value: '0.03' }] },
            { kind: 'text', selector: '[data-testid="tabTitle"]', value: `valuation · ${SEED.policy} @ 0.030` }
          ]
        },
        {
          id: 't2',
          skill: '$watch',
          text: `The audit trail must record every revision: two changes (0.055 then 0.06) must leave two lines, the first reading \`0.045 → 0.055\` and the second \`0.055 → 0.06\`.`,
          checks: [
            { kind: 'listLong', selector: '[data-testid="rev"]', value: 1, do: [{ set: '[data-testid="rate"]', value: '0.045' }, { dispatch: '[data-testid="rate"]', event: 'input' }, { click: '[data-testid="clearRev"]' }, { type: '[data-testid="rate"]', value: '0.055' }] },
            { kind: 'text', selector: '[data-testid="rev"]', value: '0.045 → 0.055' },
            { kind: 'listLong', selector: '[data-testid="rev"]', value: 2, do: [{ type: '[data-testid="rate"]', value: '0.06' }] },
            { kind: 'text', selector: '[data-testid="rev"]', nth: 1, value: '0.055 → 0.06' }
          ]
        },
        {
          id: 't3',
          skill: '$nextTick',
          text: `Adding a beneficiary must focus its share input, and the annuity-due must track the table: ${RATES.map((r, i) => `${r} → ${ADUE[i]}`).join(', ')}, \`n/a\` otherwise.`,
          checks: [
            { kind: 'count', selector: '[data-testid="share"]', value: 3, do: [{ click: '[data-testid="addBen"]' }] },
            { kind: 'focused', selector: '[data-testid="share"]', nth: 2 },
            { kind: 'textNumber', selector: '[data-testid="aDue"]', value: ADUE[2], tol: 0.0005, do: [{ type: '[data-testid="rate"]', value: '0.055' }] },
            { kind: 'text', selector: '[data-testid="aDue"]', value: 'n/a', do: [{ type: '[data-testid="rate"]', value: '0.07' }] }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a draft that saves itself',
      objective: 'Build autosave with x-effect and restore it with x-init, without a plugin.',
      scenario: `An underwriter types a mortality loading and a retention limit. The form must survive a page reload: every change mirrors the draft into \`localStorage\` under the key \`${KEY}\`, and on boot the component restores whatever is there. A \`data-testid="saved"\` counter shows how many times the draft has been mirrored, and \`data-testid="restored"\` reads \`yes\` when a stored draft was found.\n\nThis is what the persist plugin does for you in module 12 — here you build it by hand so that the plugin is not magic later.`,
      brief: `Elements: \`data-testid="loading"\` (number, %), \`data-testid="retention"\` (number), \`data-testid="saved"\` (effect run count), \`data-testid="restored"\` (\`yes\`/\`no\`), \`data-testid="clear"\` (wipes the stored draft and resets the fields). Storage key: \`${KEY}\`.`,
      starter: `<div x-data="{ loading: 0, retention: 1000000 }">
</div>`,
      solution: `<div x-data="{
  loading: 0,
  retention: ${1000000},
  fromStore: false,
  saved: 0,
  get restored() { return this.fromStore ? 'yes' : 'no' },
  get draft() { return JSON.stringify({ loading: this.loading, retention: this.retention }) },
  clear() { this.loading = 0; this.retention = ${1000000}; this.fromStore = false; localStorage.setItem('${KEY}', this.draft) }
}"
     x-init="const raw = localStorage.getItem('${KEY}'); if (raw) { try { const d = JSON.parse(raw); loading = d.loading ?? loading; retention = d.retention ?? retention; fromStore = true } catch (e) {} }"
     x-effect="localStorage.setItem('${KEY}', draft), saved++">
  <p>
    mortality loading <input data-testid="loading" type="number" step="0.5" x-model.number="loading"> %
    · retention <input data-testid="retention" type="number" step="100000" x-model.number="retention">
  </p>
  <p>restored: <b data-testid="restored" x-text="restored"></b> · mirrored <b data-testid="saved" x-text="saved"></b> time(s)</p>
  <button data-testid="clear" @click="clear()">clear the draft</button>
</div>`,
      hints: [
        'The effect must read both fields (and nothing else) so it re-runs exactly when they change: `x-effect="localStorage.setItem(key, JSON.stringify({ loading, retention })), saved++"`.',
        'Make `restored` a **getter** over a plain flag you flip in `x-init` — then `clear()` can flip it back and the template stays in step.',
        'The init runs before the first effect, so setting `loading` in `x-init` shows up in the very first mirror.',
        `Storage key: \`${KEY}\` — the checks look for a key containing \`learn-alpine.demo\`.`,
        'Wrap `JSON.parse` in a try/catch: a corrupted draft must not break the page.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-effect',
          text: `On boot the draft must already be mirrored to storage (one effect run) and \`restored\` must read \`no\` because nothing was stored yet.`,
          checks: [
            { kind: 'text', selector: '[data-testid="restored"]', value: 'no', do: [{ click: '[data-testid="clear"]' }] },
            { kind: 'custom', name: 'storageAny', value: KEY },
            { kind: 'prop', selector: '[data-testid="loading"]', prop: 'value', value: '0' }
          ]
        },
        {
          id: 't2',
          skill: 'x-effect',
          text: 'Changing the loading to 12.5 must re-mirror the draft — the effect counter moves to 2 and the stored JSON holds the new figure.',
          checks: [
            { kind: 'storage', name: KEY, value: JSON.stringify({ loading: 12.5, retention: 1000000 }), do: [{ type: '[data-testid="loading"]', value: '12.5' }] },
            { kind: 'prop', selector: '[data-testid="loading"]', prop: 'value', value: '12.5' }
          ]
        },
        {
          id: 't3',
          phase: 2,
          skill: 'x-init',
          text: `Now the interesting half: the checks reload the sandbox. Whatever you stored must come back — \`restored\` reads \`yes\` and the loading field shows the stored 12.5.`,
          checks: [
            { kind: 'text', selector: '[data-testid="restored"]', value: 'yes' },
            { kind: 'prop', selector: '[data-testid="loading"]', prop: 'value', value: '12.5' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-init',
      q: 'A component has `x-data="{ n: 0 }" x-init="n = 5"`. How many times does that initialiser run?',
      options: ['Once, on creation', 'Every time `n` changes', 'On creation and again after each DOM update', 'Never — `x-init` needs a function'],
      answer: 0,
      why: '`x-init` is a one-off: it runs when the component is created and never again. Reactive re-runs are what `x-effect` is for.',
      distractors: { 1: 'That describes `x-effect` (or `$watch`).', 3: 'A bare expression is fine; a function is optional.' }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'x-effect',
      q: 'An `x-effect` callback reads `rate`, then inside a `setTimeout` reads `sum`. Which values will re-trigger it?',
      options: ['Both `rate` and `sum`', 'Only `rate`', 'Only `sum`', 'Neither — effects only run once'],
      answer: 1,
      why: 'Only reads that happen *during* the synchronous run are tracked. Reads inside a later callback are outside the tracking scope.',
      distractors: {
        0: 'The `setTimeout` body runs after the effect has finished tracking.',
        2: 'That read was never tracked at all.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: '$nextTick',
      q: 'You add a row to a list and immediately want to `.focus()` the new row\'s input. What is the correct move?',
      options: [
        'Focus it right after pushing — the DOM is synchronous',
        'Wrap the focus in `$nextTick(...)`',
        'Wrap it in `setTimeout(..., 1000)`',
        'It cannot be done in Alpine'
      ],
      answer: 1,
      why: 'Alpine renders after your handler returns, so `$nextTick` is exactly the hook for "after the DOM caught up".',
      distractors: {
        0: 'The element does not exist yet: `x-for` has not re-rendered.',
        2: 'A guessed timeout is a race with the renderer — and it feels slow.'
      }
    },
    {
      id: 'q4',
      type: 'multi',
      skill: '$watch',
      q: 'Which statements about `$watch` are true?',
      options: [
        'It can give you the previous value as the second argument',
        'You register it from `x-init` (it needs an expression to watch)',
        '`{ deep: true }` makes it notice changes inside nested objects',
        'It replaces `x-effect` in all cases'
      ],
      answers: [0, 1, 2],
      why: '`$watch(expr, cb, { immediate, deep })` — one property, both values, optional depth. `x-effect` remains the tool for multi-value dependencies.',
      distractors: { 3: 'An effect tracks *every* reactive read; a watch tracks one expression.' }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'lifecycle',
      q: 'Where must `Alpine.data(...)` registration happen so components are available in the initial markup?',
      options: [
        'Anywhere on the page, order does not matter',
        'Inside an `alpine:init` listener (or before `Alpine.start()` in a bundle)',
        'Inside `x-init` of the component that uses it',
        'After `alpine:initialized`'
      ],
      answer: 1,
      why: '`alpine:init` fires once, before Alpine starts walking the DOM — the last moment at which a registration can still affect the initial render.',
      distractors: {
        2: 'By then the component is already being initialised.',
        3: '`alpine:initialized` fires *after* everything, which is far too late.'
      }
    },
    {
      id: 'q6',
      type: 'short',
      skill: '$nextTick',
      q: 'Which magic defers a callback until after Alpine has updated the DOM? Answer with the `$` name.',
      accept: ['$nextTick', 'nextTick'],
      why: '`$nextTick` — the equivalent of "after render" in Alpine.'
    }
  ]
}
