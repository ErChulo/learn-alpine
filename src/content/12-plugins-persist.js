/* Module 12 — plugins I: persist and intersect.
 * Matches: /plugins/persist, /plugins/intersect */

import { life, triangle, chainLadder, sq } from './data.js'

const RATES = [0.03, 0.045, 0.055]
const DEFAULT_RATE = 0.045
const KEY = 'learn-alpine.valuation'
const cl = chainLadder(triangle)

export default {
  id: 'm12',
  num: 12,
  title: 'Plugins I — persistence and visibility',
  blurb: 'persist keeps state across reloads; intersect runs code when something scrolls into view.',
  goal: 'Make a component remember where the user left it, and fire work exactly when a block becomes visible.',
  intro: `Two plugins that extend Alpine with a single magic or directive each.\n\n**persist** gives you \`$persist(initialValue)\`: the value is mirrored into \`localStorage\` (JSON) under \`_x_<property>\`, and rehydrated before the component renders. \`.as('key')\` names the key yourself, \`.using(sessionStorage)\` swaps the store.\n\n**intersect** provides \`x-intersect\` (plus \`:enter\`, \`:leave\`, \`.once\`, \`.full\`, \`.threshold.N\`): it runs an expression when the element enters or leaves the viewport — lazy loading, impression tracking, "load more".`,
  skills: ['$persist', 'x-intersect', '.as / .using', '.once'],
  docRefs: [
    { label: '$persist', url: 'https://alpinejs.dev/plugins/persist' },
    { label: 'x-intersect', url: 'https://alpinejs.dev/plugins/intersect' }
  ],
  mastery: [
    'Persist a piece of state with `$persist(...)` and name the key with `.as(...)`',
    'Swap the storage with `.using(sessionStorage)`',
    'Know that persisted values are JSON and rehydrate before the first render',
    'Run code on `x-intersect`, with `.once` so it fires a single time'
  ],
  units: [
    {
      id: 's1',
      title: '$persist: state that survives a reload',
      objective: 'Mirror a value into storage and read it back on boot.',
      brief: `\`x-data="{ rate: $persist(${DEFAULT_RATE}) }"\` is the whole API for the simple case. Alpine looks for the key \`_x_rate\` in \`localStorage\`; if it is there the stored value wins, otherwise the initial value is used. From then on every change to \`rate\` is written back — JSON-encoded.`,
      example: {
        code: `<div x-data="{ basis: $persist('standard'), rate: $persist(0.045) }">
  <input x-model.number="rate">
</div>
<!-- localStorage gets _x_basis = "prudent", _x_rate = 0.05 -->`,
        note: 'Keys are inspected in devtools → Application → Local Storage.'
      },
      starter: `<div x-data="{ rate: $persist(${DEFAULT_RATE}) }">
  <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
  <p>persisted rate: <b data-testid="shown" x-text="rate"></b></p>
</div>`,
      solution: `<div x-data="{ rate: $persist(${DEFAULT_RATE}), resets: 0 }">
  <input data-testid="rate" type="number" step="0.005" x-model.number="rate">
  <p>persisted rate: <b data-testid="shown" x-text="rate"></b></p>
  <button data-testid="default" @click="rate = ${DEFAULT_RATE}, resets++">back to the default basis</button>
</div>`,
      hints: [
        `\`$persist(${DEFAULT_RATE})\` is a magic property: it is the *value*, not a function call you keep.`,
        '`.as(\u0027name\u0027)` overrides the generated key when you want a readable, shared key.',
        'Storage is JSON: a number comes back as a number, an object as an object.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$persist',
          text: `The field must show the persisted rate, and the checks will find a \`_x_...\` key in storage once a value has been written.`,
          checks: [
            { kind: 'text', selector: '[data-testid="shown"]', value: String(DEFAULT_RATE) },
            { kind: 'custom', name: 'storageAny', value: '_x_rate', do: [{ type: '[data-testid="rate"]', value: '0.05' }] }
          ]
        },
        {
          id: 't2',
          skill: '$persist',
          text: 'Typing 0.05 must persist exactly that number under the generated key (JSON, so the stored text is `0.05`).',
          checks: [
            { kind: 'storage', name: '_x_rate', value: '0.05', do: [{ type: '[data-testid="rate"]', value: '0.05' }] },
            { kind: 'text', selector: '[data-testid="shown"]', value: '0.05' }
          ]
        },
        {
          id: 't3',
          skill: '$persist',
          text: '`default` must put the standard basis back *and* persist it (the stored value returns to 0.045).',
          checks: [
            { kind: 'text', selector: '[data-testid="shown"]', value: String(DEFAULT_RATE), do: [{ type: '[data-testid="rate"]', value: '0.06' }, { click: '[data-testid="default"]' }] },
            { kind: 'storage', name: '_x_rate', value: String(DEFAULT_RATE) }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Naming keys, swapping stores, persisting objects',
      objective: 'Control the key, the storage area and the shape of what is saved.',
      brief: `Three dials:\n\n* \`.as('learn-alpine.valuation')\` — your own key, instead of \`_x_<property>\`.\n* \`.using(sessionStorage)\` — vanish when the tab closes (or hand it any storage-shaped object).\n* the value itself — objects and arrays are fine, because everything goes through \`JSON.stringify\` / \`JSON.parse\`.`,
      example: {
        code: `<div x-data="{ draft: $persist({ rate: 0.045, basis: 'standard' }).as('nyx.draft') }">
  <input x-model.number="draft.rate">
</div>`,
        note: 'Nested writes (`draft.rate = …`) are picked up because the persisted value is read as a whole.'
      },
      starter: `<div x-data="{ draft: $persist({ rate: ${DEFAULT_RATE}, basis: 'standard' }).as('${KEY}') }">
  <p>basis <b data-testid="basis" x-text="draft.basis"></b> at <b data-testid="rate" x-text="draft.rate"></b></p>
</div>`,
      solution: `<div x-data="{
  draft: $persist({ rate: ${DEFAULT_RATE}, basis: 'standard' }).as('${KEY}'),
  tabs: $persist(0).using(sessionStorage).as('learn-alpine.tabs')
}" x-init="tabs++">
  <p>basis <b data-testid="basis" x-text="draft.basis"></b> at <b data-testid="rate" x-text="draft.rate"></b></p>
  <button data-testid="prudent" @click="draft.basis = 'prudent'">switch to the prudent basis</button>
  <button data-testid="cheaper" @click="draft.rate = ${RATES[0]}">price at ${(RATES[0] * 100).toFixed(1)} %</button>
  <p>session visits: <b data-testid="tabs" x-text="tabs"></b></p>
  <button data-testid="forget" @click="draft = { rate: ${DEFAULT_RATE}, basis: 'standard' }">forget the draft</button>
</div>`,
      hints: [
        `\`.as('${KEY}')\` gives the draft a key you can actually find among the \`_x_*\` ones.`,
        `\`.using(sessionStorage)\` keeps the visit counter in the tab, not on the machine.`,
        'Replacing the whole object (`draft = { … }`) is the clearest way to "forget" — it persists the fresh object.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '.as / .using',
          text: `The draft must live under your own key: after switching to the prudent basis the stored JSON reads \`{"rate":${DEFAULT_RATE},"basis":"prudent"}\`.`,
          checks: [
            { kind: 'text', selector: '[data-testid="basis"]', value: 'prudent', do: [{ click: '[data-testid="prudent"]' }] },
            { kind: 'storage', name: KEY, value: JSON.stringify({ rate: DEFAULT_RATE, basis: 'prudent' }) }
          ]
        },
        {
          id: 't2',
          skill: '$persist',
          text: `Pricing at ${(RATES[0] * 100).toFixed(1)} % must only touch the rate inside the same key: \`{"rate":${RATES[0]},"basis":"standard"}\` on a fresh draft.`,
          checks: [
            { kind: 'storage', name: KEY, value: JSON.stringify({ rate: RATES[0], basis: 'standard' }), do: [{ click: '[data-testid="forget"]' }, { click: '[data-testid="cheaper"]' }] },
            { kind: 'text', selector: '[data-testid="rate"]', value: String(RATES[0]) }
          ]
        },
        {
          id: 't3',
          skill: '.as / .using',
          text: 'The session counter must be its own thing: it counts visits in this tab (above zero, and it survives a reload), it must **not** be sitting in `localStorage` where the draft lives, and `forget` must leave it alone.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="tabs"]', pattern: '^[1-9]\\d*$' },
            { kind: 'storageGone', name: 'learn-alpine.tabs' },
            { kind: 'textMatch', selector: '[data-testid="tabs"]', pattern: '^[1-9]\\d*$', do: [{ click: '[data-testid="forget"]' }, { wait: 120 }] },
            { kind: 'text', selector: '[data-testid="basis"]', value: 'standard' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'x-intersect: when something becomes visible',
      objective: 'Fire code on entering (and leaving) the viewport, exactly once when asked.',
      brief: `\`x-intersect="expression"\` runs when the element enters the viewport; \`x-intersect:enter\` and \`x-intersect:leave\` are explicit, \`.once\` unregisters after the first hit, \`.full\` waits until the element is *completely* visible, and \`.threshold.0.5\` fires when half of it is.\n\nTypical jobs: reveal a lazily built table, fetch page two, count an impression.`,
      example: {
        code: `<div x-data="{ seen: false }">
  <div x-intersect.once="seen = true">a long explanation…</div>
  <p x-show="seen">Loaded when you got here.</p>
</div>`,
        note: 'In this preview the block is already visible, so it fires immediately — scroll it out and back in to watch `:leave` and `:enter`.'
      },
      starter: `<div x-data="{ seen: false, once: 0, left: 0 }">
  <p data-testid="target">scroll target</p>
  <p>seen <b data-testid="seen" x-text="seen"></b> · once <b data-testid="once" x-text="once"></b></p>
</div>`,
      solution: `<div x-data="{ seen: false, once: 0, left: 0 }">
  <p data-testid="target" x-intersect:enter="seen = true" x-intersect:leave="left++">scroll target</p>
  <div style="height:520px" class="muted tiny">— a long block of policy wording pushes the next target out of view —</div>
  <p data-testid="target2" x-intersect:enter.once="once++">fires once, ever</p>
  <p>seen <b data-testid="seen" x-text="seen"></b> · once <b data-testid="once" x-text="once"></b> · left <b data-testid="left" x-text="left"></b></p>
</div>`,
      hints: [
        'The plain form `x-intersect="…"` is `:enter`; use `:leave` when you also care about the exit.',
        '`.once` is a *modifier*: `x-intersect:enter.once="…"`.',
        'This cell is short, so the second target sits below the fold — the checks scroll it in.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-intersect',
          text: 'Scrolling the first target into view must set `seen` to true.',
          checks: [
            { kind: 'text', selector: '[data-testid="seen"]', value: 'true', do: [{ scrollIntoView: '[data-testid="target"]' }, { wait: 420 }] }
          ]
        },
        {
          id: 't2',
          skill: '.once',
          text: 'The second target must be wired with `.once`: scrolling it in increments `once` exactly once, and scrolling back and forth again must not increment it further.',
          checks: [
            { kind: 'text', selector: '[data-testid="once"]', value: '1', do: [{ scrollIntoView: '[data-testid="target2"]' }, { wait: 420 }] },
            { kind: 'text', selector: '[data-testid="once"]', value: '1', do: [{ scrollIntoView: '[data-testid="target"]' }, { wait: 200 }, { scrollIntoView: '[data-testid="target2"]' }, { wait: 320 }] },
            { kind: 'code', pattern: 'x-intersect[^=]*\\.once' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — valuation settings that remember themselves',
      objective: 'Persist a small settings object and prove it survives a reload.',
      scenario: `An actuary sets the valuation basis once and expects it to be there tomorrow: rate ${DEFAULT_RATE} or ${RATES[0]}, basis \`standard\` or \`prudent\`, and the sum assured last used. The panel must persist all three under the key \`${KEY}\` and expose a reset that puts the defaults back (and persists *those*).`,
      brief: `Elements: \`data-testid="rate"\` (number input, x-model.number), \`data-testid="standard"\` / \`data-testid="prudent"\` (basis buttons), \`data-testid="sum"\` (number input), \`data-testid="reset"\`, and mirrors \`data-testid="rateOut"\`, \`data-testid="basisOut"\`, \`data-testid="sumOut"\`. Persist one object under \`${KEY}\` with \`rate: ${DEFAULT_RATE}\`, \`basis: 'standard'\`, \`sum: 250000\`. One task is checked **after a sandbox reload** — that is what persistence is for.`,
      starter: `<div x-data="{ settings: { rate: ${DEFAULT_RATE}, basis: 'standard', sum: 250000 } }">
</div>`,
      solution: `<div x-data="{
  settings: $persist({ rate: ${DEFAULT_RATE}, basis: 'standard', sum: 250000 }).as('${KEY}'),
  reset() { this.settings = { rate: ${DEFAULT_RATE}, basis: 'standard', sum: 250000 } }
}">
  <p>
    rate <input data-testid="rate" type="number" step="0.005" x-model.number="settings.rate">
    → <b data-testid="rateOut" x-text="settings.rate"></b>
  </p>
  <p>
    basis <b data-testid="basisOut" x-text="settings.basis"></b>
    <button data-testid="standard" @click="settings.basis = 'standard'">standard</button>
    <button data-testid="prudent" @click="settings.basis = 'prudent'">prudent</button>
  </p>
  <p>sum assured <input data-testid="sum" type="number" step="10000" x-model.number="settings.sum"> → <b data-testid="sumOut" x-text="settings.sum"></b></p>
  <button data-testid="reset" @click="reset()">reset to the house basis</button>
</div>`,
      hints: [
        `Persist the whole settings object: \`$persist({ rate: ${DEFAULT_RATE}, basis: 'standard', sum: 250000 }).as('${KEY}')\`.`,
        'Nested writes are fine — the plugin reads the object as a whole and writes it back.',
        'The last task is a *second phase*: the sandbox is reloaded, so only real storage can satisfy it.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$persist',
          text: `After reset the panel must show the house basis (${DEFAULT_RATE}, standard, 250000) and that exact object must be in storage.`,
          checks: [
            { kind: 'text', selector: '[data-testid="rateOut"]', value: String(DEFAULT_RATE), do: [{ click: '[data-testid="reset"]' }] },
            { kind: 'text', selector: '[data-testid="basisOut"]', value: 'standard' },
            { kind: 'storage', name: KEY, value: JSON.stringify({ rate: DEFAULT_RATE, basis: 'standard', sum: 250000 }) }
          ]
        },
        {
          id: 't2',
          skill: '$persist',
          text: `Changes must be persisted as they happen: prudent basis, rate ${RATES[0]} and sum 500000 land in storage as one object.`,
          checks: [
            { kind: 'storage', name: KEY, value: JSON.stringify({ rate: RATES[0], basis: 'prudent', sum: 500000 }), do: [{ click: '[data-testid="prudent"]' }, { type: '[data-testid="rate"]', value: String(RATES[0]) }, { type: '[data-testid="sum"]', value: '500000' }] },
            { kind: 'text', selector: '[data-testid="basisOut"]', value: 'prudent' },
            { kind: 'text', selector: '[data-testid="sumOut"]', value: '500000' }
          ]
        },
        {
          id: 't3',
          phase: 2,
          skill: '$persist',
          text: `Now the honest test: the sandbox is reloaded. The panel must come back from storage at ${RATES[0]} %, prudent basis, sum 500000.`,
          checks: [
            { kind: 'text', selector: '[data-testid="rateOut"]', value: String(RATES[0]) },
            { kind: 'text', selector: '[data-testid="basisOut"]', value: 'prudent' },
            { kind: 'text', selector: '[data-testid="sumOut"]', value: '500000' }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — load the triangle only when it is looked at',
      objective: 'Reveal a heavy block on intersection, once, and keep the placeholder honest.',
      scenario: `The run-off triangle is heavy, so the page shows a placeholder until the block is scrolled into view: 5 accident years (${triangle.years.join(', ')}), each with its latest paid figure and the IBNR loading, plus the headline IBNR ${Number(cl.totalIBNR.toFixed(1))}.`,
      brief: `A tall spacer keeps the block below the fold. Elements: \`data-testid="prompt"\` (the placeholder, must disappear once loaded), \`data-testid="loaded"\` (reads \`yes\`/\`no\`), \`data-testid="row"\` (one per accident year with \`data-year\`), \`data-testid="ibnr"\` showing ${Number(cl.totalIBNR.toFixed(1))}. Wire the reveal with \`x-intersect.once\`.`,
      starter: `<div x-data="{ loaded: false }">
  <div style="height:560px" class="muted tiny">— the long run-off report intro —</div>
</div>`,
      solution: `<div x-data="{ loaded: false, years: ${sq(triangle.years)}, ibnr: ${Number(cl.totalIBNR.toFixed(1))} }">
  <div style="height:560px" class="muted tiny">— the long run-off report intro —</div>
  <p data-testid="prompt" x-show="!loaded">Scroll down to build the triangle…</p>
  <div x-intersect.once="loaded = true">
    <p>loaded: <b data-testid="loaded" x-text="loaded ? 'yes' : 'no'"></b> · IBNR <b data-testid="ibnr" x-text="ibnr"></b></p>
    <ul>
      <template x-for="y in years" :key="y">
        <li data-testid="row" :data-year="y" x-text="'AY ' + y"></li>
      </template>
    </ul>
  </div>
</div>`,
      hints: [
        'The trigger element wraps the block itself: `x-intersect.once="loaded = true"`.',
        'The placeholder is the *inverse* of the flag — `x-show="!loaded"`.',
        `\`x-text="loaded ? 'yes' : 'no'"\` keeps the state visible for the checks.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-intersect',
          text: 'Before the block is scrolled into view the placeholder is visible and `loaded` reads `no`.',
          checks: [
            { kind: 'text', selector: '[data-testid="loaded"]', value: 'no' },
            { kind: 'exists', selector: '[data-testid="prompt"]' }
          ]
        },
        {
          id: 't2',
          skill: 'x-intersect',
          text: `Scrolling the block in must build the report: \`loaded\` yes, the placeholder gone, five rows for ${triangle.years.join(', ')} and IBNR ${Number(cl.totalIBNR.toFixed(1))}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="loaded"]', value: 'yes', do: [{ scrollIntoView: '[data-testid="row"]' }, { wait: 420 }] },
            { kind: 'hidden', selector: '[data-testid="prompt"]' },
            { kind: 'count', selector: '[data-testid="row"]', value: 5 },
            { kind: 'list', selector: '[data-testid="row"]', values: triangle.years.map(y => `AY ${y}`) },
            { kind: 'textNumber', selector: '[data-testid="ibnr"]', value: Number(cl.totalIBNR.toFixed(1)), tol: 0.05 }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: '$persist',
      q: '`x-data="{ rate: $persist(0.045) }"` — under which key does Alpine store the value?',
      options: ['`rate`', '`_x_rate`', '`alpine.rate`', '`$persist.rate`'],
      answer: 1,
      why: 'The generated key is the property path prefixed with `_x_`. Use `.as(\'…\')` when you want a key you control.',
      distractors: { 0: 'Close — the prefix is what keeps Alpine keys apart from your own.' }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: '$persist',
      q: 'Where is the value kept when you write `$persist(0).using(sessionStorage)`?',
      options: [
        'localStorage',
        'sessionStorage — gone when the tab closes',
        'In memory only',
        'Both, mirrored'
      ],
      answer: 1,
      why: '`.using(…)` swaps the storage area; `sessionStorage` dies with the tab, which is often what you want for per-visit UI state.',
      distractors: { 3: 'It uses one store — the one you handed it.' }
    },
    {
      id: 'q3',
      type: 'multi',
      skill: '$persist',
      q: 'Which values can be persisted with `$persist`?',
      options: [
        'Numbers and booleans',
        'Strings',
        'Objects and arrays',
        'Functions and DOM nodes'
      ],
      answers: [0, 1, 2],
      why: 'Anything JSON can express — the plugin stringifies on write and parses on read.',
      distractors: { 3: 'JSON has no functions; a DOM node would not survive a reload anyway.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-intersect',
      q: 'Which form fires only the first time an element enters the viewport?',
      options: [
        '`x-intersect="…"`',
        '`x-intersect:enter="…"`',
        '`x-intersect:enter.once="…"`',
        '`x-intersect.full="…"`'
      ],
      answer: 2,
      why: '`.once` unregisters the observer after the first hit — the usual choice for lazy loading.',
      distractors: { 3: '`.full` changes *when* it fires, not how often.' }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'x-intersect',
      q: 'A block below the fold uses `x-intersect.once="loaded = true"`. When is the expression evaluated?',
      options: [
        'On page load',
        'When the block enters the viewport',
        'When the block leaves the viewport',
        'Every time the viewport changes'
      ],
      answer: 1,
      why: 'That is the point of the plugin: work happens when the user actually looks at the element.',
      distractors: { 0: 'It waits for visibility — that is why it saves work.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: '$persist',
      q: 'Which modifier names the storage key (`.??(\'my.key\')`)? Answer with the dot and the word.',
      accept: ['.as', 'as', '.as()'],
      why: '`.as(\'my.key\')` — and `.using(sessionStorage)` picks the store.'
    }
  ]
}
