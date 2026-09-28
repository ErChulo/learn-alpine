/* Module 11 — reusable components: Alpine.data and Alpine.bind.
 * Matches: /globals/alpine-data, /globals/alpine-bind */

import { life, triangle, chainLadder } from './data.js'

const RATES = [0.03, 0.045, 0.06]
const ADUE = RATES.map(r => Number(life.aDueTemp(45, 15, r).toFixed(4)))
const cl = chainLadder(triangle)
const YEARS = [2019, 2020, 2021, 2022, 2023]
const IBNR = cl.ibnr.map(v => Number(v.toFixed(1)))
const CARDS = YEARS.map((y, i) => ({ year: y, ibnr: IBNR[i] })).slice(1)
const ONE = CARDS[0], TWO = CARDS[1], THREE = CARDS[2]

export default {
  id: 'm11',
  num: 11,
  title: 'Reusable components',
  blurb: 'Alpine.data and Alpine.bind: markup you can use twice without copying it.',
  goal: 'Package a component once and instantiate it as often as you like — with arguments, and with attribute bundles you can reuse.',
  intro: `Once a component earns its keep, stop writing it inline. \`Alpine.data('name', () => ({ … }))\` registers a **named component**: any element can use it with \`x-data="name"\`, and \`x-data="name(45, 250000)"\` passes arguments. Every instance gets its own state.\n\n\`Alpine.bind('name', () => ({ type: 'button', '@click'() { … } }))\` does the same for *attribute bundles*: \`x-bind="name"\` splats a whole object of directives and attributes onto an element.`,
  skills: ['Alpine.data', 'Alpine.bind', 'parameterised components'],
  docRefs: [
    { label: 'Alpine.data', url: 'https://alpinejs.dev/globals/alpine-data' },
    { label: 'Alpine.bind', url: 'https://alpinejs.dev/globals/alpine-bind' }
  ],
  mastery: [
    'Register a component with `Alpine.data` at the right moment',
    'Use `x-data="name"` and `x-data="name(args)"`',
    'Pass arguments with defaults and keep instances independent',
    'Bundle repeated attributes with `Alpine.bind` + `x-bind="name"`'
  ],
  units: [
    {
      id: 's1',
      title: 'Alpine.data: one definition, many instances',
      objective: 'Register a named component and instantiate it from markup.',
      brief: `Registration happens **before** the tree is walked: inside \`document.addEventListener('alpine:init', …)\` for script-tag pages, or between the imports and \`Alpine.start()\` in a bundle. After that, \`x-data="basisCard"\` is equivalent to writing the whole object literal inline — except the logic now lives in one place.\n\nMethods and getters inside a registered component behave exactly like inline ones.`,
      example: {
        code: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('counter', () => ({ n: 0, inc() { this.n++ } }))
  })
</script>

<div x-data="counter"><button @click="inc()" x-text="n"></button></div>`,
        note: 'The factory is a function, so every `x-data="counter"` gets a fresh object.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    // register the component here
  })
</script>

<div x-data="{ rate: ${RATES[0]}, table: { ${RATES.map((r, i) => `${r}: ${ADUE[i]}`).join(', ')} }, get aDue() { return this.table[this.rate] ?? null } }">
  <p>rate <b data-testid="rate" x-text="rate"></b> → ä<sub>45:15</sub> <b data-testid="aDue" x-text="aDue === null ? 'n/a' : aDue"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('basisCard', () => ({
      rate: ${RATES[0]},
      table: { ${RATES.map((r, i) => `${r}: ${ADUE[i]}`).join(', ')} },
      get aDue() { return this.table[this.rate] ?? null },
      bump() {
        const keys = Object.keys(this.table).map(Number)
        const i = keys.indexOf(this.rate)
        this.rate = keys[Math.min(i + 1, keys.length - 1)]
      }
    }))
  })
</script>

<div x-data="basisCard">
  <p>rate <b data-testid="rate" x-text="rate"></b> → ä<sub>45:15</sub> <b data-testid="aDue" x-text="aDue === null ? 'n/a' : aDue"></b></p>
  <button data-testid="bump" @click="bump()">next basis up</button>
</div>`,
      hints: [
        `Register \`Alpine.data('basisCard', () => ({ … }))\` inside the \`alpine:init\` listener.`,
        `The markup then only needs \`x-data="basisCard"\` — the getter and the bump method travel with it.`,
        `Expected values: ${RATES.map((r, i) => `${r} → ${ADUE[i]}`).join(', ')}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data',
          text: `The component must boot on the ${(RATES[0] * 100).toFixed(1)} % basis with ä = ${ADUE[0]}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: String(RATES[0]) },
            { kind: 'text', selector: '[data-testid="aDue"]', value: String(ADUE[0]) }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.data',
          text: `The bundled bump method must move the card one basis up: rate ${RATES[1]} with ä = ${ADUE[1]}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: String(RATES[1]), do: [{ click: '[data-testid="bump"]' }] },
            { kind: 'text', selector: '[data-testid="aDue"]', value: String(ADUE[1]) }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Passing arguments',
      objective: 'Give one component several instances with different data.',
      brief: `Make the factory take arguments: \`Alpine.data('reserveCard', (year = 2019, ibnr = 0) => ({ … }))\`. Markup passes them positionally — \`x-data="reserveCard(2021, 165.8)"\` — and anything you leave out falls back to the default.\n\nBecause the factory runs per instance, two cards share code and share nothing else.`,
      example: {
        code: `Alpine.data('rate', (value = 0.045) => ({ value }))

<div x-data="rate(0.03)"></div>
<div x-data="rate()"></div>   <!-- 0.045 -->`,
        note: 'Arguments are ordinary JavaScript: strings need quotes, numbers do not.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('reserveCard', () => ({ year: 0, ibnr: 0, factor: 1, get loaded() { return 0 } }))
  })
</script>

<div x-data="reserveCard()">
  <p>accident year <b data-testid="y1" x-text="year"></b> · loaded IBNR <b data-testid="l1" x-text="loaded"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('reserveCard', (year = 2019, ibnr = 0) => ({
      year,
      ibnr,
      factor: 1,
      get loaded() { return (this.ibnr * this.factor).toFixed(1) },
      bump() { this.factor = +(this.factor + 0.1).toFixed(1) }
    }))
  })
</script>

<div data-testid="cardA" x-data="reserveCard(${ONE.year}, ${ONE.ibnr})">
  <p>accident year <b data-testid="y1" x-text="year"></b> · loaded IBNR <b data-testid="l1" x-text="loaded"></b></p>
  <button data-testid="bump1" @click="bump()">load +10 %</button>
</div>
<div data-testid="cardB" x-data="reserveCard(${TWO.year}, ${TWO.ibnr})">
  <p>accident year <b data-testid="y2" x-text="year"></b> · loaded IBNR <b data-testid="l2" x-text="loaded"></b></p>
</div>`,
      hints: [
        `The factory signature is \`(year = ${ONE.year}, ibnr = 0) => ({ … })\` — defaults cover omitted arguments.`,
        `Markup passes real values: \`x-data="reserveCard(${ONE.year}, ${ONE.ibnr})"\`.`,
        `Two instances must not share state: bumping one leaves the other where it was.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data',
          text: `Two instances with different arguments: card A shows AY ${ONE.year} and ${ONE.ibnr}, card B AY ${TWO.year} and ${TWO.ibnr}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="y1"]', value: String(ONE.year) },
            { kind: 'text', selector: '[data-testid="l1"]', value: ONE.ibnr.toFixed(1) },
            { kind: 'text', selector: '[data-testid="y2"]', value: String(TWO.year) },
            { kind: 'text', selector: '[data-testid="l2"]', value: TWO.ibnr.toFixed(1) }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.data',
          text: `Bumping card A must load ${ONE.ibnr} by 10 % (${(ONE.ibnr * 1.1).toFixed(1)}) and leave card B at ${TWO.ibnr.toFixed(1)} — separate instances, separate state.`,
          checks: [
            { kind: 'text', selector: '[data-testid="l1"]', value: (ONE.ibnr * 1.1).toFixed(1), do: [{ click: '[data-testid="bump1"]' }] },
            { kind: 'text', selector: '[data-testid="l2"]', value: TWO.ibnr.toFixed(1) }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Alpine.bind: reusable attribute bundles',
      objective: 'Stop repeating the same directives on every button or field.',
      brief: `\`Alpine.bind('name', () => ({ … }))\` registers an object of attributes and directives. \`x-bind="name"\` splatting that object onto an element gives you one place to change the recipe — a plain \`type\`, a \`class\` binding, an \`@click\` handler.\n\nInside those handlers \`this\` is the surrounding component, exactly as if the directives had been written on the element itself.`,
      example: {
        code: `Alpine.bind('primaryButton', () => ({
  type: 'button',
  class: 'btn primary',
  '@click'() { this.touched = true }
}))

<button x-bind="primaryButton">Save</button>`,
        note: 'The bundle is a live object: keys starting with `@` or `:` become directives.'
      },
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    // bind a reusable button bundle
  })
</script>

<div x-data="{ touched: false }">
  <button data-testid="btn">use the bound bundle</button>
  <span data-testid="state" x-text="touched"></span>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.bind('resetButton', () => ({
      type: 'button',
      ':class'() { return this.touched ? 'touched' : 'idle' },
      ':data-touched'() { return String(this.touched) },
      '@click'() { this.touched = true }
    }))
  })
</script>

<div x-data="{ touched: false }">
  <button data-testid="btn" x-bind="resetButton">use the bound bundle</button>
  <span data-testid="state" x-text="touched"></span>
</div>`,
      hints: [
        `Register the bundle with \`Alpine.bind('resetButton', () => ({ type: 'button', '@click'() { this.touched = true } }))\`.`,
        `Use it as \`x-bind="resetButton"\` — that is the whole point of the API.`,
        `Keyed entries start with \`\`:\` or \`@\`: \`:class\` and \`:data-touched\` stay reactive, while \`type\` is set once.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.bind',
          text: 'The button must carry `type="button"`, be idle at first (class `idle`, `data-touched="false"`) and show `false`.',
          checks: [
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'type', value: 'button' },
            { kind: 'klass', selector: '[data-testid="btn"]', value: 'idle' },
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'data-touched', value: 'false' },
            { kind: 'text', selector: '[data-testid="state"]', value: 'false' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.bind',
          text: 'Clicking it must run the bundle\'s handler: `touched` becomes true, the button switches to class `touched` and `data-touched="true"`.',
          checks: [
            { kind: 'text', selector: '[data-testid="state"]', value: 'true', do: [{ click: '[data-testid="btn"]' }] },
            { kind: 'klass', selector: '[data-testid="btn"]', value: 'touched' },
            { kind: 'noKlass', selector: '[data-testid="btn"]', value: 'idle' },
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'data-touched', value: 'true' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — one component, ' + CARDS.length + ' accident years',
      objective: 'Extract a repeated card into Alpine.data and instantiate it with arguments.',
      scenario: `A reserving summary shows one card per accident year that still carries IBNR — chain-ladder gives ${CARDS.map(c => `${c.year} ${c.ibnr.toFixed(1)}`).join(' · ')} (five-year total ${Number(cl.totalIBNR.toFixed(1))}). Each card lets an actuary load its figure and shows the loaded amount; the cards must be completely independent, and the component may be written **once**.`,
      brief: `Register \`Alpine.data('ibnrCard', (year, ibnr) => ({ … }))\` with \`year\`, \`ibnr\`, a \`factor\` starting at 1, a \`loaded\` getter (\`ibnr × factor\` to one decimal) and \`load()\` (factor +0.1) and \`reset()\` methods. Instantiate one card per year — ${CARDS.map(c => `${c.year}: ${c.ibnr.toFixed(1)}`).join(', ')}. Elements per card: \`data-testid="card"\`, \`data-testid="year"\`, \`data-testid="loaded"\`, \`data-testid="lift"\` (button, +10 %), \`data-testid="reset"\` (back to factor 1).`,
      starter: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('ibnrCard', () => ({ year: 0, ibnr: 0, factor: 1 }))
  })
</script>
`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('ibnrCard', (year = 2019, ibnr = 0) => ({
      year,
      ibnr,
      factor: 1,
      get loaded() { return (this.ibnr * this.factor).toFixed(1) },
      load() { this.factor = +(this.factor + 0.1).toFixed(1) },
      reset() { this.factor = 1 }
    }))
  })
</script>
${CARDS.map(c => `<div data-testid="card" x-data="ibnrCard(${c.year}, ${c.ibnr})">
  <p>AY <b data-testid="year" x-text="year"></b> · IBNR <span x-text="ibnr.toFixed(1)"></span>
     · loaded <b data-testid="loaded" x-text="loaded"></b> at factor <span x-text="factor"></span></p>
  <button data-testid="lift" @click="load()">load +10 %</button>
  <button data-testid="reset" @click="reset()">reset</button>
</div>`).join('\n')}`,
      hints: [
        `One factory, ${CARDS.length} instances: \`x-data="ibnrCard(${CARDS[0].year}, ${CARDS[0].ibnr})"\` and so on.`,
        `\`loaded\` is a getter, so it re-renders when \`factor\` changes — no watcher needed.`,
        `Reset must put the factor back to 1 for *that* card only.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data',
          text: `All ${CARDS.length} cards must render their own accident year and IBNR (${CARDS.map(c => `${c.year}: ${c.ibnr.toFixed(1)}`).join(', ')}).`,
          checks: [
            { kind: 'count', selector: '[data-testid="card"]', value: CARDS.length },
            { kind: 'list', selector: '[data-testid="year"]', values: CARDS.map(c => String(c.year)) },
            { kind: 'list', selector: '[data-testid="loaded"]', values: CARDS.map(c => c.ibnr.toFixed(1)) }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.data',
          text: `Raising the second card by 10 % must move only that card: it reads ${(CARDS[1].ibnr * 1.1).toFixed(1)} while the first and the last stay at ${CARDS[0].ibnr.toFixed(1)} and ${CARDS[CARDS.length - 1].ibnr.toFixed(1)}.`,
          checks: [
            { kind: 'text', selector: '[data-testid="loaded"]', nth: 1, value: (CARDS[1].ibnr * 1.1).toFixed(1), do: [{ click: '[data-testid="lift"]', nth: 1 }] },
            { kind: 'text', selector: '[data-testid="loaded"]', nth: 0, value: CARDS[0].ibnr.toFixed(1) },
            { kind: 'text', selector: '[data-testid="loaded"]', nth: CARDS.length - 1, value: CARDS[CARDS.length - 1].ibnr.toFixed(1) }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.data',
          text: `Its reset must restore ${CARDS[1].ibnr.toFixed(1)} — again without disturbing the other two.`,
          checks: [
            { kind: 'text', selector: '[data-testid="loaded"]', nth: 1, value: CARDS[1].ibnr.toFixed(1), do: [{ click: '[data-testid="lift"]', nth: 1 }, { click: '[data-testid="reset"]', nth: 1 }] },
            { kind: 'text', selector: '[data-testid="loaded"]', nth: 0, value: CARDS[0].ibnr.toFixed(1) },
            { kind: 'text', selector: '[data-testid="loaded"]', nth: CARDS.length - 1, value: CARDS[CARDS.length - 1].ibnr.toFixed(1) }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a form field bundle that knows about the form',
      objective: 'Use Alpine.bind for markup, Alpine.data for behaviour, and let `this` connect them.',
      scenario: `Underwriting needs the same "sum assured" input on several screens: a label wired to the input by id, a currency hint, a class that changes once the field has been touched, and a tally of how many times it has been edited. Rather than copy those attributes, publish them once.`,
      brief: `Register an \`Alpine.bind('sumField', () => ({ … }))\` bundle that sets \`type="number"\`, \`step="10000"\`, an \`:id\` and \`:aria-describedby\` from \`$id\`-style static ids (\`sum-input\` / \`sum-hint\`), an \`:class\` that adds \`touched\` once \`touches > 0\`, and \`@input\` that counts edits and stores the numeric value in \`sum\`. The component itself (\`x-data\`) holds \`sum\`, \`touches\` and a \`reset()\`, and the page shows \`data-testid="sum"\`, \`data-testid="touches"\`, \`data-testid="reset"\` and a \`data-testid="hint"\` paragraph with \`id="sum-hint"\`.`,
      starter: `<div x-data="{ sum: 0, touches: 0, reset() { this.sum = 0; this.touches = 0 } }">
  <input data-testid="sum" x-model.number="sum">
  <p data-testid="hint" id="sum-hint">In whole dollars.</p>
  <button data-testid="reset" @click="reset()">reset</button>
  <span data-testid="touches" x-text="touches"></span>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.bind('sumField', () => ({
      type: 'number',
      step: '10000',
      id: 'sum-input',
      'aria-describedby': 'sum-hint',
      ':class'() { return this.touches > 0 ? 'touched' : 'untouched' },
      '@input'(e) { this.sum = + e.target.value; this.touches++ }
    }))
  })
</script>

<div x-data="{ sum: 0, touches: 0, reset() { this.sum = 0; this.touches = 0 } }">
  <label for="sum-input">sum assured</label>
  <input data-testid="sum" x-bind="sumField">
  <p data-testid="hint" id="sum-hint">In whole dollars.</p>
  <button data-testid="reset" @click="reset()">reset</button>
  <span data-testid="touches" x-text="touches"></span>
  <span data-testid="sumOut" x-text="sum"></span>
</div>`,
      hints: [
        'Everything static (`type`, `step`, `id`, `aria-describedby`) is a plain key in the bundle object.',
        'Keyed bindings are written as strings: \':class\' and \'@input\'.',
        'The handler receives the event, so `e.target.value` gives you the typed sum — `+` it before storing.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.bind',
          text: 'The field must come from the bundle: `type="number"`, `step="10000"`, `id="sum-input"`, `aria-describedby="sum-hint"`, and the hint paragraph must exist with that id.',
          checks: [
            { kind: 'attr', selector: '[data-testid="sum"]', name: 'type', value: 'number' },
            { kind: 'attr', selector: '[data-testid="sum"]', name: 'step', value: '10000' },
            { kind: 'attr', selector: '[data-testid="sum"]', name: 'id', value: 'sum-input' },
            { kind: 'custom', name: 'attrMatch', selector: '[data-testid="sum"]', attr: 'aria-describedby', selector2: '[data-testid="hint"]', attr2: 'id' },
            { kind: 'klass', selector: '[data-testid="sum"]', value: 'untouched' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.bind',
          text: 'Typing 250000 must count as one touch, store 250000 in the model, and switch the class to `touched`.',
          checks: [
            { kind: 'text', selector: '[data-testid="touches"]', value: '1', do: [{ type: '[data-testid="sum"]', value: '250000' }] },
            { kind: 'text', selector: '[data-testid="sumOut"]', value: '250000' },
            { kind: 'klass', selector: '[data-testid="sum"]', value: 'touched' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.bind',
          text: '`reset` must clear the untracked state: sum 0, touches 0 — and the class goes back to `untouched`.',
          checks: [
            { kind: 'text', selector: '[data-testid="sumOut"]', value: '0', do: [{ type: '[data-testid="sum"]', value: '180000' }, { click: '[data-testid="reset"]' }] },
            { kind: 'text', selector: '[data-testid="touches"]', value: '0' },
            { kind: 'klass', selector: '[data-testid="sum"]', value: 'untouched' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'Alpine.data',
      q: 'Where must `Alpine.data(...)` be called?',
      options: [
        'Anywhere after the DOM is ready',
        'Inside `alpine:init` (script tags) or before `Alpine.start()` (bundles)',
        'In the `x-init` of the component',
        'Inside `alpine:initialized`'
      ],
      answer: 1,
      why: 'Components are resolved while the tree is walked, so the registry has to be complete before that walk begins.',
      distractors: { 2: 'By then the element that wanted the component has already been initialised.' }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'Alpine.data',
      q: 'What is the difference between `x-data="card"` and `x-data="card()"`?',
      options: [
        'None — both call the factory',
        '`card` calls the factory with no arguments; `card()` is invalid',
        'Both call the factory; the parentheses are where you pass arguments',
        '`card` is for `Alpine.store`, `card()` for `Alpine.data`'
      ],
      answer: 2,
      why: 'Either spelling invokes the registered factory — `card(2021, 165.8)` is how arguments travel.',
      distractors: { 3: 'Both APIs accept the same call shape.' }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'Alpine.bind',
      q: 'Which element usage binds a registered attribute bundle called `primaryButton`?',
      options: [
        '`x-data="primaryButton"`',
        '`x-bind="primaryButton"`',
        '`x-init="primaryButton"`',
        '`x-bind:class="primaryButton"`'
      ],
      answer: 1,
      why: '`x-bind` with an object expression (here the registered bundle) spreads its keys as attributes and directives.',
      distractors: { 0: 'That would look for a *component* of that name.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'Alpine.data',
      q: 'Two elements both say `x-data="ibnrCard(2019, 214.5)"`. What do they share?',
      options: [
        'Nothing — each `x-data` runs the factory again',
        'Everything — the registered object is reused',
        'Only methods, not data',
        'Only getters'
      ],
      answer: 0,
      why: 'The factory runs per element, so each instance gets its own state while sharing the definition.',
      distractors: { 1: 'Sharing the definition is the point; sharing the *state* would be a bug.' }
    },
    {
      id: 'q5',
      type: 'multi',
      skill: 'Alpine.bind',
      q: 'Which keys are valid inside an `Alpine.bind` object?',
      options: [
        '`type: \'button\'` and `step: \'10000\'`',
        '`\'@click\'() { … }`',
        '`\':disabled\'() { return this.busy }`',
        '`\'#loop\'() { … }`'
      ],
      answers: [0, 1, 2],
      why: 'Bundles carry plain attributes plus anything x-bind understands: `@` for events, `:` for bindings.',
      distractors: { 3: 'There is no `#` prefix in Alpine\'s directive vocabulary.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'Alpine.data',
      q: 'Which method adds a named component to Alpine\'s registry? Answer with the full call up to the first parenthesis (e.g. `Alpine.foo`).',
      accept: ['Alpine.data'],
      why: '`Alpine.data(name, factory)` — the factory runs once per `x-data` that names it.'
    }
  ]
}
