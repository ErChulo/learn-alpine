/* Module 17 — extending Alpine: custom directives, magics, plugins and hooks.
 * Matches: /advanced/extending */

import { life, sq } from './data.js'

const LX45 = Math.round(life.lx(45))
const QX = 0.00123
const BASES = [
  { id: 'vbt', label: '2015 VBT', factor: 1 },
  { id: 'unisex', label: 'Unisex annuitant', factor: 1.14 }
]
const AGES = [45, 50, 55]

const MAGIC_CODE = `Alpine.magic('now', () => (new Date).toLocaleTimeString('en-GB'))
Alpine.magic('money', () => amount => '$' + Number(amount).toLocaleString('en-US'))`

export default {
  id: 'm17',
  num: 17,
  title: 'Extending Alpine',
  blurb: 'Write your own x- directives and $magics, package them as a plugin, and use the low-level hooks Alpine keeps for integrations.',
  goal: 'Grow the framework itself: register extensions before Alpine initialises, and handle components that only arrive later.',
  intro: `Every directive and magic Alpine ships with is built on the same APIs you get: \`Alpine.directive()\` and \`Alpine.magic()\`. They must be registered **after Alpine is on the page but before it initialises the page** — with a \`<script>\` tag that means inside an \`alpine:init\` listener.\n\nA directive receives its element, its own shape (\`value\`, \`modifiers\`, \`expression\`) and a toolkit (\`evaluate\`, \`evaluateLater\`, \`effect\`, \`cleanup\`). A magic is a **getter**: return a plain value for \`$name\`, or return a function for \`$name(...)\`.\n\nWrap the lot in \`Alpine.plugin(fn)\` to ship one installable package — and when a component arrives late (a module that registers its own \`Alpine.data\`), \`Alpine.interceptInit()\` + \`Alpine.deferInit()\` suspend that subtree until the prerequisite exists.`,
  skills: ['Alpine.magic', 'custom magics', 'Alpine.directive', 'custom directives', 'directive lifecycle', 'Alpine.plugin', 'plugin packaging', 'Alpine.interceptInit', 'Alpine.deferInit', 'Alpine.addScopeToNode', 'Alpine.closestDataStack'],
  docRefs: [
    'https://alpinejs.dev/advanced/extending',
    'https://alpinejs.dev/advanced/async',
    'https://alpinejs.dev/advanced/reactivity'
  ],
  mastery: [
    'Register a magic and a directive from `alpine:init`, and explain why the timing matters',
    'Write a directive that re-renders when an expression changes, using `evaluateLater` + `effect`',
    'Package directives and magics into one `Alpine.plugin()` installable',
    'Suspend a subtree with `Alpine.deferInit` until a late provider exists, and inject scope before `x-bind` runs'
  ],
  units: [
    {
      id: 's1',
      title: 'Your own $magics',
      objective: 'Register a magic before Alpine starts — one property magic, one function magic.',
      brief: `Extension code must run **after Alpine is downloaded, before it initialises the page**. With a script tag, that is an \`alpine:init\` listener:\n\n\`\`\`html\n<script>\n  document.addEventListener('alpine:init', () => {\n    Alpine.magic('now', () => (new Date).toLocaleTimeString('en-GB'))\n  })\n</script>\n\`\`\`\n\n\`Alpine.magic(name, (el, { Alpine }) => value)\` registers a **getter**, not a value: \`$now\` is computed on every read, which is why a timestamp is never stale.\n\nReturn a function from the getter and the magic becomes a method: \`Alpine.magic('money', () => amount => ...)\` is used as \`$money(1234)\`.`,
      example: { code: MAGIC_CODE, note: 'Property magic vs function magic — the getter decides which one you get.' },
      starter: `<div x-data="{ reserve: 1234567, stamped: '', clock: '--:--:--', money: '$0' }">
  <p>valued at <b data-testid="clock" x-text="clock"></b></p>
  <p>reserve <b data-testid="money" x-text="money"></b></p>
  <button data-testid="stamp" @click="stamped = clock">stamp the time</button>
  <p>stamped <b data-testid="stamped" x-text="stamped"></b></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.magic('now', () => (new Date).toLocaleTimeString('en-GB'))

    Alpine.magic('money', () => amount => {
      return '$' + Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })
    })
  })
</script>

<div x-data="{ reserve: 1234567, stamped: '' }">
  <p>valued at <b data-testid="clock" x-text="$now"></b></p>
  <p>reserve <b data-testid="money" x-text="$money(reserve)"></b></p>
  <button data-testid="stamp" @click="stamped = $now">stamp the time</button>
  <p>stamped <b data-testid="stamped" x-text="stamped"></b></p>
</div>`,
      hints: [
        'Both magics belong in the same `alpine:init` listener — registering after init reaches the page too late.',
        '`$now` is used bare (`x-text="$now"`), so its getter returns a string. `$money(reserve)` is called, so its getter must return a function.',
        'Register the names without the `$`: `Alpine.magic(\'money\', ...)` is used as `$money(...)`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.magic',
          text: 'A `$now` magic must be registered from an `alpine:init` listener and show the current time as `hh:mm:ss`.',
          checks: [
            { kind: 'code', pattern: "alpine:init" },
            { kind: 'code', pattern: "Alpine\\.magic\\('now'" },
            { kind: 'textMatch', selector: '[data-testid="clock"]', pattern: '^\\d{2}:\\d{2}:\\d{2}$' }
          ]
        },
        {
          id: 't2',
          skill: 'magic function',
          text: '`$money` must be a function magic that renders 1234567 as $1,234,567.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.magic\\('money'" },
            { kind: 'text', selector: '[data-testid="money"]', value: '$1,234,567' }
          ]
        },
        {
          id: 't3',
          skill: 'magic getter',
          text: 'Because a magic is a getter, reading `$now` again must produce a fresh timestamp: the stamped copy is a real time.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="stamped"]', pattern: '^\\d{2}:\\d{2}:\\d{2}$', do: [{ click: '[data-testid="stamp"]' }, { wait: 120 }] },
            { kind: 'textNotHas', selector: '[data-testid="clock"]', value: 'undefined' }
          ]
        }
      ]
    },

    {
      id: 's2',
      title: 'Your own x- directives',
      objective: 'Write a directive that evaluates an expression, stays reactive, and reads its value and modifiers.',
      brief: `\`\`\`html\nAlpine.directive('[name]', (el, { value, modifiers, expression }, { Alpine, evaluate, evaluateLater, effect, cleanup }) => {})\n\`\`\`\n\n- \`expression\` — the attribute value: \`law\` in \`x-foo="law"\`\n- \`value\` — the part after a colon: \`'bar'\` in \`x-foo:bar\`\n- \`modifiers\` — dot-separated trailing additions: \`['bz', 'lob']\` from \`x-foo.bz.lob\`\n- \`evaluateLater(expression)\` — compile the expression once and run it whenever you like\n- \`effect(fn)\` — run now, re-run whenever anything it read changes, and clean up automatically when the element goes away\n\nUse \`evaluateLater\` + \`effect\` rather than \`evaluate\` whenever the directive renders something that must stay in sync.`,
      example: {
        code: `Alpine.directive('log', (el, { expression }, { evaluateLater, effect }) => {
  let get = evaluateLater(expression)

  effect(() => {
    get(value => console.log(value))
  })
})`,
        note: 'effect() fires immediately and re-fires on change; cleanup is handled for you.'
      },
      starter: `<div x-data="{ q: 0.001, age: 45 }">
  <p>age <b data-testid="age" x-text="age"></b> · qₓ <span data-testid="qx" x-qx="q"></span></p>
  <p>to five places: <span data-testid="qx5" x-qx.dp5="q"></span></p>
  <button data-testid="bump" @click="q = q * 1.5">apply a mortality shock</button>
  <p><span data-testid="tag" x-tag:warning.bold>tail risk</span></p>
</div>`,
      solution: `<script>
  document.addEventListener('alpine:init', () => {
    Alpine.directive('qx', (el, { expression, modifiers }, { evaluateLater, effect }) => {
      const places = modifiers.includes('dp5') ? 5 : 3
      const get = evaluateLater(expression)

      effect(() => {
        get(value => { el.textContent = (value * 100).toFixed(places) + '%' })
      })
    })

    Alpine.directive('tag', (el, { value, modifiers }) => {
      el.dataset.kind = value || 'plain'
      if (modifiers.includes('bold')) el.style.fontWeight = '700'
    })
  })
</script>

<div x-data="{ q: 0.001, age: 45 }">
  <p>age <b data-testid="age" x-text="age"></b> · qₓ <span data-testid="qx" x-qx="q"></span></p>
  <p>to five places: <span data-testid="qx5" x-qx.dp5="q"></span></p>
  <button data-testid="bump" @click="q = q * 1.5">apply a mortality shock</button>
  <p><span data-testid="tag" x-tag:warning.bold>tail risk</span></p>
</div>`,
      hints: [
        '`evaluate(expression)` gives you the value once; `evaluateLater(expression)` gives you a reusable function that can also handle `await`.',
        'The rendering has to happen inside `effect(...)` — that is what re-runs it when `q` changes.',
        'In `x-tag:warning.bold`, `value` is `\'warning\'` and `modifiers` is `[\'bold\']`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.directive',
          text: 'A custom `x-qx` directive must render the expression as a percentage with three places: `0.001` reads 0.100%.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.directive\\('qx'" },
            { kind: 'code', pattern: "evaluateLater" },
            { kind: 'text', selector: '[data-testid="qx"]', value: '0.100%' }
          ]
        },
        {
          id: 't2',
          skill: 'effect',
          text: 'The directive must stay reactive: after the shock, `x-qx` reads 0.150% and the `.dp5` variant reads 0.15000%.',
          checks: [
            { kind: 'text', selector: '[data-testid="qx5"]', value: '0.10000%' },
            { kind: 'text', selector: '[data-testid="qx"]', value: '0.150%', do: [{ click: '[data-testid="bump"]' }, { wait: 150 }] },
            { kind: 'text', selector: '[data-testid="qx5"]', value: '0.15000%' },
            { kind: 'code', pattern: "effect\\(" }
          ]
        },
        {
          id: 't3',
          skill: 'value and modifiers',
          text: '`x-tag:warning.bold` must read its value and modifiers: the chip is a warning chip and it is bold.',
          checks: [
            { kind: 'attr', selector: '[data-testid="tag"]', name: 'data-kind', value: 'warning' },
            { kind: 'styleIs', selector: '[data-testid="tag"]', prop: 'fontWeight', value: '700' },
            { kind: 'code', pattern: "modifiers" }
          ]
        }
      ]
    },

    {
      id: 's3',
      title: 'Plugins and the internal hooks',
      objective: 'Ship directives and magics as one plugin, inject scope early, and suspend a subtree that must wait.',
      brief: `**Package it.** \`Alpine.plugin(fn)\` immediately calls \`fn(Alpine)\`, so one import installs everything:\n\n\`\`\`js\nfunction mortalityTools(Alpine) {\n  Alpine.directive('lx', ...)\n  Alpine.magic('qxPct', ...)\n}\nAlpine.plugin(mortalityTools)\n\`\`\`\n\n**Inject scope.** \`Alpine.addScopeToNode(el, { basis: '2015 VBT' })\` puts data into one element's scope. Combine it with \`.before('bind')\` when a \`x-bind:\` on that same element must see it:\n\n\`\`\`js\nAlpine.directive('basis', (el, { expression }) => {\n  Alpine.addScopeToNode(el, { basis: expression })\n}).before('bind')\n\`\`\`\n\n**Wait for a prerequisite.** \`Alpine.interceptInit(el => {})\` runs for every element just before it initialises; \`Alpine.deferInit(el, promise)\` then suspends that element's tree until the promise settles — nothing inside it initialises, and \`[x-cloak]\` stays in place. \`Alpine.closestDataStack(el)\` is the scope stack that element would get, which is how integrations decide what to hand it.`,
      example: {
        code: `Alpine.interceptInit(el => {
  if (el.hasAttribute('data-widget') && !widgetIsLoaded(el)) {
    Alpine.deferInit(el, loadWidget(el))
  }
})`,
        note: 'A rejected prerequisite is reported and the tree initialises anyway — it is never left suspended.'
      },
      starter: `<div x-data="{ lx: ${LX45}, qx: ${QX} }">
  <p><span data-testid="scoped" x-bind:title="'not injected yet'">basis chip</span> · sibling sees <b data-testid="leak" x-text="typeof basis"></b></p>
  <p>lₓ(45) <b data-testid="lx" x-text="lx"></b> · qₓ <b data-testid="pct" x-text="qx"></b></p>
  <p>deferred: <span data-testid="deferred" data-defer-until-table x-cloak></span></p>
  <button data-testid="release" @click="window.__releaseTable && window.__releaseTable()">the table module finished downloading</button>
</div>`,
      solution: `<script>
  function mortalityTools(Alpine) {
    Alpine.directive('lx', (el, { expression }, { evaluateLater, effect }) => {
      const get = evaluateLater(expression)
      effect(() => get(v => { el.textContent = Number(v).toLocaleString('en-US') }))
    })

    Alpine.magic('qxPct', () => q => (q * 100).toFixed(3) + '%')
  }

  let release
  const tableReady = new Promise(res => { release = res })
  window.__releaseTable = () => { window.__tableReleased = true; release() }

  document.addEventListener('alpine:init', () => {
    Alpine.plugin(mortalityTools)

    Alpine.directive('basis', (el, { expression }, { evaluate }) => {
      Alpine.addScopeToNode(el, { basis: evaluate(expression) })
    }).before('bind')

    Alpine.interceptInit(el => {
      if (!el.hasAttribute('data-defer-until-table')) return
      if (!window.__tableReleased) Alpine.deferInit(el, tableReady)
    })
  })
</script>

<div x-data="{ lx: ${LX45}, qx: ${QX} }">
  <p><span data-testid="scoped" x-basis="'2015 VBT'" x-bind:title="basis">basis chip</span> · sibling sees <b data-testid="leak" x-text="typeof basis"></b></p>
  <p>lₓ(45) <b data-testid="lx" x-lx="lx"></b> · qₓ <b data-testid="pct" x-text="$qxPct(qx)"></b></p>
  <p>deferred: <span data-testid="deferred" data-defer-until-table x-cloak x-init="$el.dataset.stackDepth = Alpine.closestDataStack($el).length" x-text="'table ready'"></span></p>
  <button data-testid="release" @click="window.__releaseTable()">the table module finished downloading</button>
</div>`,
      hints: [
        'A plugin is just a function that receives `Alpine` — register the directive and the magic inside it, then hand the function to `Alpine.plugin(...)`.',
        '`addScopeToNode` only affects the element you pass; the order is what lets `x-bind:title="basis"` read it, hence `.before(\'bind\')`.',
        'The scope depth is asked for with `Alpine.closestDataStack($el).length` — but only once the tree really runs, so put it in the resumed element\'s `x-init`, not in the interceptor (at intercept time the ancestors have not initialised yet, so the stack is empty).',
        'Defer only while the prerequisite is outstanding. When a suspended tree resumes, the interceptors run again for the elements that had not initialised yet — an unguarded `deferInit()` suspends them a second time and the tree never comes up.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.plugin',
          text: 'The `x-lx` directive must arrive inside a plugin installed with `Alpine.plugin(...)`, and render 95004 as 95,004.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.plugin\\(" },
            { kind: 'code', pattern: "Alpine\\.directive\\('lx'" },
            { kind: 'text', selector: '[data-testid="lx"]', value: LX45.toLocaleString('en-US') }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.magic',
          text: 'The plugin also ships a `$qxPct` function magic: 0.00123 must read 0.123%.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.magic\\('qxPct'" },
            { kind: 'text', selector: '[data-testid="pct"]', value: '0.123%' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.addScopeToNode',
          text: '`x-bind:title="basis"` must see the injected scope on its own element (title = 2015 VBT) — and the injection must not leak to its sibling.',
          checks: [
            { kind: 'attr', selector: '[data-testid="scoped"]', name: 'title', value: '2015 VBT' },
            { kind: 'text', selector: '[data-testid="leak"]', value: 'undefined' },
            { kind: 'code', pattern: "addScopeToNode" },
            { kind: 'code', pattern: "\\.before\\('bind'\\)" }
          ]
        },
        {
          id: 't4',
          skill: 'Alpine.deferInit',
          text: 'The tree marked `data-defer-until-table` must stay suspended — empty, still cloaked, with nothing initialised — and come to life (scope depth and all) once the prerequisite settles.',
          checks: [
            { kind: 'text', selector: '[data-testid="deferred"]', value: '' },
            { kind: 'attrGone', selector: '[data-testid="deferred"]', name: 'data-stack-depth' },
            { kind: 'attr', selector: '[data-testid="deferred"]', name: 'x-cloak', value: '' },
            { kind: 'text', selector: '[data-testid="deferred"]', value: 'table ready', do: [{ click: '[data-testid="release"]' }, { wait: 250 }] },
            { kind: 'attr', selector: '[data-testid="deferred"]', name: 'data-stack-depth', value: '1' },
            { kind: 'attrGone', selector: '[data-testid="deferred"]', name: 'x-cloak' },
            { kind: 'code', pattern: "Alpine\\.interceptInit\\(" },
            { kind: 'code', pattern: "Alpine\\.deferInit\\(" },
            { kind: 'code', pattern: "closestDataStack" }
          ]
        }
      ]
    },

    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a table-tools plugin',
      objective: 'Package one directive and one magic as a plugin, then prove both are available to the whole page.',
      scenario: `The quote book formats money in six different components and looks up ${BASES.map(b => `${b.label} (×${b.factor})`).join(' / ')} in four. Instead of repeating markup in every component, the desk wants one installable package: an \`x-money\` directive (whole dollars, two decimals when the actuary asks for cents) and a \`$basis(id)\` magic that returns \`{ label, factor }\`. Both must work in any component on the page, and the money must follow the underlying value when it changes.`,
      brief: `Elements: \`data-testid="money0"\` (whole dollars), \`data-testid="money2"\` (cents), \`data-testid="basisLabel"\` and \`data-testid="factor"\` fed by \`$basis('unisex')\`, and \`data-testid="double"\` which doubles \`reserve\` (start: 1234567). Bases: ${BASES.map(b => `${b.id} → ${b.label} ×${b.factor}`).join('; ')}. Formats: 1234567 → $1,234,567 · with cents → $1,234,567.00.`,
      starter: `<div x-data="{ reserve: 1234567, basisLabel: 'not loaded', factor: '—' }">
  <button data-testid="double" @click="reserve = reserve * 2">double the reserve</button>
  <p>reserve <b data-testid="money0" x-text="reserve"></b> · with cents <b data-testid="money2" x-text="reserve"></b></p>
  <p>basis <b data-testid="basisLabel" x-text="basisLabel"></b> · factor <b data-testid="factor" x-text="factor"></b></p>
</div>`,
      solution: `<script>
  function tableTools(Alpine) {
    Alpine.directive('money', (el, { expression, modifiers }, { evaluateLater, effect }) => {
      const places = modifiers.includes('cents') ? 2 : 0
      const get = evaluateLater(expression)

      effect(() => {
        get(value => {
          el.textContent = '$' + Number(value).toLocaleString('en-US', {
            minimumFractionDigits: places,
            maximumFractionDigits: places
          })
        })
      })
    })

    Alpine.magic('basis', () => {
      const bases = ${sq(BASES)}
      return id => bases.find(b => b.id === id) || bases[0]
    })
  }

  document.addEventListener('alpine:init', () => {
    Alpine.plugin(tableTools)
  })
</script>

<div x-data="{ reserve: 1234567 }">
  <button data-testid="double" @click="reserve = reserve * 2">double the reserve</button>
  <p>reserve <b data-testid="money0" x-money="reserve"></b> · with cents <b data-testid="money2" x-money.cents="reserve"></b></p>
  <p>basis <b data-testid="basisLabel" x-text="$basis('unisex').label"></b> · factor <b data-testid="factor" x-text="$basis('unisex').factor"></b></p>
</div>`,
      hints: [
        'Write `function tableTools(Alpine) { ... }`, register the directive and the magic inside it, and install it with `Alpine.plugin(tableTools)` from `alpine:init`.',
        'The number of decimals is a modifier, so read `modifiers.includes(\'cents\')` and pass it to `toLocaleString` as `minimumFractionDigits` / `maximumFractionDigits`.',
        'A magic that takes an argument returns a function from its getter: `Alpine.magic(\'basis\', () => id => ...)` is used as `$basis(\'unisex\')`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'plugin packaging',
          text: 'One plugin must install the package: `Alpine.plugin(...)` plus an `x-money` directive rendering 1234567 as $1,234,567.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.plugin\\(" },
            { kind: 'code', pattern: "Alpine\\.directive\\('money'" },
            { kind: 'text', selector: '[data-testid="money0"]', value: '$1,234,567' }
          ]
        },
        {
          id: 't2',
          skill: 'modifiers in a directive',
          text: 'The `.cents` modifier must switch the format to two decimals, and the directive must follow the value when the reserve doubles.',
          checks: [
            { kind: 'text', selector: '[data-testid="money2"]', value: '$1,234,567.00' },
            { kind: 'text', selector: '[data-testid="money0"]', value: '$2,469,134', do: [{ click: '[data-testid="double"]' }, { wait: 150 }] },
            { kind: 'text', selector: '[data-testid="money2"]', value: '$2,469,134.00' },
            { kind: 'code', pattern: "modifiers" }
          ]
        },
        {
          id: 't3',
          skill: 'magic function',
          text: 'The `$basis(id)` magic must return the basis record: `$basis(\'unisex\')` gives Unisex annuitant ×1.14.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.magic\\('basis'" },
            { kind: 'text', selector: '[data-testid="basisLabel"]', value: 'Unisex annuitant' },
            { kind: 'text', selector: '[data-testid="factor"]', value: '1.14' }
          ]
        }
      ]
    },

    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a component that arrives late',
      objective: 'Suspend a subtree with interceptInit + deferInit until its Alpine.data provider exists, then let it initialise itself.',
      scenario: `The mortality-card module is fetched on demand: until it lands, \`Alpine.data('basisCard')\` does not exist and the card must not try to initialise. It must stay cloaked and empty while it waits — and bootstrap itself the moment the provider is registered, showing one row per age (${AGES.join(', ')}) and a status of \`ready\`. The integration also wants to know how many scopes deep the card ends up: its own component data plus the surrounding component.`,
      brief: `Elements: \`data-testid="load"\` (calls \`window.__loadCardModule()\`, provided for you), \`data-testid="card"\` (\`x-cloak\`, \`data-widget="basis-card"\`, \`x-data="basisCard"\`), \`data-testid="status"\`, and one \`data-testid="row"\` per age inside the card. While suspended the card must be empty; afterwards it must render the ages and drop its cloak. Ages: ${AGES.join(', ')}.`,
      starter: `<div x-data="{ label: 'Mortality card' }">
  <button data-testid="load" @click="window.__loadCardModule && window.__loadCardModule()">load the basis-card module</button>
  <div data-testid="card" data-widget="basis-card" x-cloak x-data="{ ages: [], status: 'module not loaded' }">
    <p>status <b data-testid="status" x-text="status"></b></p>
    <template x-for="a in ages" :key="a">
      <span data-testid="row" x-text="a"></span>
    </template>
  </div>
</div>`,
      solution: `<script>
  let release
  const cardReady = new Promise(res => { release = res })

  window.__loadCardModule = () => {
    Alpine.data('basisCard', () => ({
      ages: ${sq(AGES)},
      status: 'ready'
    }))
    window.__cardLoaded = true
    release()
  }

  document.addEventListener('alpine:init', () => {
    Alpine.interceptInit(el => {
      if (!el.hasAttribute('data-widget')) return
      if (!window.__cardLoaded) Alpine.deferInit(el, cardReady)
    })
  })
</script>

<div x-data="{ label: 'Mortality card' }">
  <button data-testid="load" @click="window.__loadCardModule()">load the basis-card module</button>
  <div data-testid="card" data-widget="basis-card" x-cloak x-data="basisCard" x-init="$el.dataset.stackDepth = Alpine.closestDataStack($el).length">
    <p>status <b data-testid="status" x-text="status"></b></p>
    <template x-for="a in ages" :key="a">
      <span data-testid="row" x-text="a"></span>
    </template>
  </div>
</div>`,
      hints: [
        '`Alpine.interceptInit` runs for every element before it initialises: look for `data-widget` and defer that element with the promise.',
        '`Alpine.deferInit(el, cardReady)` suspends the element and everything inside it — nothing initialises, and `x-cloak` stays put.',
        'Only defer while the prerequisite is outstanding (`if (!window.__cardLoaded)`), otherwise the resume pass would suspend the card all over again.',
        'The card records its own scope depth in `x-init` with `Alpine.closestDataStack($el).length` — asked for once the card runs it counts 2: the card\'s own component data plus the surrounding component.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.interceptInit',
          text: 'While the module is outstanding the card must be suspended: no status text at all, and nothing initialised in the card.',
          checks: [
            { kind: 'text', selector: '[data-testid="status"]', value: '' },
            { kind: 'attrGone', selector: '[data-testid="card"]', name: 'data-stack-depth' },
            { kind: 'code', pattern: "Alpine\\.interceptInit\\(" },
            { kind: 'code', pattern: "Alpine\\.deferInit\\(" },
            { kind: 'code', pattern: "closestDataStack" }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.deferInit',
          text: 'Loading the module must release the card: status `ready`, rows rendered, cloak gone.',
          checks: [
            { kind: 'text', selector: '[data-testid="status"]', value: 'ready', do: [{ click: '[data-testid="load"]' }, { wait: 300 }] },
            { kind: 'count', selector: '[data-testid="row"]', value: 3 },
            { kind: 'attr', selector: '[data-testid="card"]', name: 'data-stack-depth', value: '2' },
            { kind: 'attrGone', selector: '[data-testid="card"]', name: 'x-cloak' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.data',
          text: 'The provider must be the card\'s own component definition, listing the ages in order.',
          checks: [
            { kind: 'list', selector: '[data-testid="row"]', values: AGES.map(String) },
            { kind: 'code', pattern: "Alpine\\.data\\('basisCard'" }
          ]
        }
      ]
    }
  ],

  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'registration timing',
      q: 'Alpine is loaded with a plain script tag. Where does `Alpine.magic()` belong?',
      options: [
        'Inside `document.addEventListener(\'alpine:init\', () => { ... })`',
        'Anywhere in the page — Alpine resolves magics lazily on first use',
        'Inside `Alpine.start()`',
        'After `alpine:initialized` fires'
      ],
      answer: 0,
      why: 'Extensions must exist after Alpine is downloaded and before it initialises the page; with a script tag, `alpine:init` is exactly that window. Bundle users register between `import Alpine` and `Alpine.start()`.',
      distractors: {
        1: 'Magics are looked up while the page initialises, so a later registration is simply not there yet.',
        3: '`alpine:initialized` fires after the initialisation pass — far too late.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'magic getter',
      q: 'Why does a `$now` magic registered as `Alpine.magic(\'now\', () => (new Date).toLocaleTimeString())` produce a fresh time on every read?',
      options: [
        'Because `Alpine.magic` registers a getter — the callback runs on each access',
        'Because Alpine polls every registered magic twice a second',
        'Because the magic is a reactive property that Alpine tracks like `x-data` state',
        'It does not — you would have to call `$now()`'
      ],
      answer: 0,
      why: 'A magic is a getter evaluated at every access, which is why returning a function from the getter is how you author `$name(...)` function magics.',
      distractors: {
        3: 'That is the syntax for a function magic; a bare `$now` is the property form.'
      }
    },
    {
      id: 'q3',
      type: 'multi',
      skill: 'Alpine.directive',
      q: 'What does a custom directive receive?',
      options: [
        '`el` — the element the directive is on',
        '`{ value, modifiers, expression }` — the directive\'s own shape (`x-qx.dp5="q"` → value `undefined`, modifiers `[\'dp5\']`, expression `\'q\'`)',
        '`{ Alpine, evaluate, evaluateLater, effect, cleanup }` — the toolkit handed to the callback',
        'The page\'s Alpine store collection'
      ],
      answers: [0, 1, 2],
      why: 'Element, shape, toolkit: those three arguments cover everything a directive can read or do, and `cleanup` is how listeners and timers are removed when the element goes away.',
      distractors: { 3: 'Stores are not passed in; use `Alpine.store(...)` if a directive needs shared data.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'Alpine.addScopeToNode',
      q: 'Your `x-basis` directive injects `{ basis: "2015 VBT" }` into the element, but `x-bind:title="basis"` on that same element still logs `undefined`. What is missing?',
      options: [
        'Chain `.before(\'bind\')` so the injection happens before the bind directive runs',
        'Wrap the element in another `x-data`',
        'Use `Alpine.addScopeToNode(el.parentElement, ...)`',
        'Register the directive as a plugin'
      ],
      answer: 0,
      why: 'Custom directives run after the standard ones by default. `Alpine.directive(\'basis\', ...).before(\'bind\')` moves yours ahead of `x-bind`, so the binding sees the injected scope.',
      distractors: {
        1: 'An extra `x-data` creates a nested component — it does not put `basis` into this element\'s scope.'
      }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'Alpine.deferInit',
      q: 'A tree is suspended with `Alpine.deferInit(el, promise)` and the promise **rejects**. What happens?',
      options: [
        'Alpine reports the rejection through its error handler, then the tree initialises anyway',
        'The tree stays suspended forever',
        'The element is removed from the DOM',
        'Alpine retries the promise on the next animation frame'
      ],
      answer: 0,
      why: 'A failed prerequisite never leaves a tree permanently suspended — it is reported and the tree resumes. (A promise that never settles, on the other hand, does leave it suspended, so put timeouts on operations you hand to Alpine.)',
      distractors: {
        3: 'There is no automatic retry: register the promise again, or handle the failure in your own code.'
      }
    },
    {
      id: 'q6',
      type: 'multi',
      skill: 'Alpine.deferInit',
      q: 'Which statements about `Alpine.interceptInit` and `Alpine.deferInit` are true?',
      options: [
        '`interceptInit` callbacks run for every element, just before that element initialises',
        '`[x-cloak]` attributes inside a suspended tree stay in place until it resumes',
        '`alpine:initialized` waits for suspended trees before firing',
        'Calling `deferInit` again before the tree resumes adds another prerequisite — the tree waits for all of them'
      ],
      answers: [0, 1, 3],
      why: 'The hook is per-element and pre-init; suspension is a real pause (cloaks included) that can stack prerequisites; and `alpine:initialized` fires when the synchronous pass over the page completes, suspended trees or not.',
      distractors: { 2: 'It fires when the synchronous pass finishes — do not treat it as "everything is ready" when you defer trees.' }
    }
  ]
}
