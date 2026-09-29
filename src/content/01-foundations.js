/* Module 1 — Getting Alpine onto a page, and knowing exactly when it boots.
 * Matches: /start-here, /essentials/installation, /essentials/lifecycle, /advanced/csp */

import { life } from './data.js'

const aDue1 = life.aDueTemp(45, 15, 0.04)
const aDue2 = life.aDue(65, 0.035)
const A1 = life.AEndow(45, 15, 0.04)
/* the published solutions pass the assumptions as rounded literals, so the
   checks use the same rounded constants — otherwise a 6-dp input drifts. */
const Ar = Number(A1.toFixed(6))
const aDue1r = Number(aDue1.toFixed(6))

export default {
  id: 'm01',
  num: 1,
  title: 'Foundations: installing Alpine and its lifecycle',
  blurb: 'Script tags, plugin order, npm, and the two events that bookend initialisation.',
  goal: 'Get Alpine running on a page by all three supported routes, and know precisely when your code may register components, stores and magics.',
  intro: `Alpine is 16 kB of JavaScript that gives markup a reactive brain. There is no build step in this course at all — but you must know the three installation routes, because they differ in exactly one dangerous way: **who calls \`Alpine.start()\`, and when.**\n\nPlugins register themselves during a short window that opens when Alpine loads and closes when the page initialises. Get the order wrong and you get silent nothing: no error, no effect, just markup that never wakes up.`,
  skills: ['installation', 'lifecycle'],
  docRefs: [
    { label: 'Start Here', url: 'https://alpinejs.dev/start-here' },
    { label: 'Installation', url: 'https://alpinejs.dev/essentials/installation' },
    { label: 'Lifecycle', url: 'https://alpinejs.dev/essentials/lifecycle' },
    { label: 'CSP build', url: 'https://alpinejs.dev/advanced/csp' }
  ],
  mastery: [
    'Write the CDN `<script defer>` tag from memory, and explain why `defer` matters',
    'Load an Alpine plugin and explain why it must come **before** the core script',
    'Bootstrap Alpine from a bundler (import → `window.Alpine` → `Alpine.start()`)',
    'Use `alpine:init` to register an `Alpine.data()` component and prove it works'
  ],
  units: [
    {
      id: 's1',
      title: 'Route 1 — the script tag (and the `defer` rule)',
      objective: 'Load Alpine from a plain script tag and prove it boots.',
      brief: `The fastest route: one \`<script>\` tag with \`defer\`. Because the tag is deferred, the HTML is parsed first and Alpine initialises the finished tree — no \`DOMContentLoaded\` gymnastics in your own code.\n\nThis sandbox starts **empty of Alpine**: your script tag has to load it. The vendored copies live at \`./vendor/alpine/cdn.min.js\`, and the real CDN URL works too when you are online.`,
      example: {
        code: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div x-data="{ message: 'I ❤️ Alpine' }">
  <h1 x-text="message"></h1>
</div>`,
        note: 'The `3.x.x` floating version is what the docs use. In production, pin the exact version you tested.'
      },
      starter: `<h1 x-data="{ message: 'I love Alpine' }" x-text="message"></h1>`,
      solution: `<script defer src="./vendor/alpine/cdn.min.js"></script>

<h1 x-data="{ message: 'I love Alpine' }" x-text="message"></h1>
<p data-testid="echo" x-data="{ message: 'I love Alpine' }" x-text="'[' + message + ']'"></p>`,
      mode: 'raw',
      hints: [
        'A script tag goes anywhere in the body, but `defer` makes the placement irrelevant.',
        'Path is relative to this page: `./vendor/alpine/cdn.min.js`.',
        'If nothing renders, the harness falls back to a built-in copy and tells you your tags did not load.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'installation',
          text: 'Add a **deferred** `<script>` tag that loads `./vendor/alpine/cdn.min.js`, so the `<h1>` renders the message instead of the raw `x-text` attribute. The text must read exactly `I love Alpine`.',
          checks: [
            { kind: 'code', pattern: '<script[^>]+src\\s*=\\s*["\']\\.\\/vendor\\/alpine\\/cdn\\.min\\.js["\'][^>]*>', flags: 'i' },
            { kind: 'code', pattern: 'defer', flags: 'i' },
            { kind: 'text', selector: 'h1', value: 'I love Alpine' }
          ]
        },
        {
          id: 't2',
          skill: 'installation',
          text: 'Now change the message to your own name and add a second element that shows the message in brackets, using a plain expression (`hint: \`"[" + message + "]"\``). Mark the second element `data-testid="echo"`.',
          checks: [
            { kind: 'countAtLeast', selector: '[data-testid="echo"]', value: 1 },
            { kind: 'textMatch', selector: '[data-testid="echo"]', pattern: '^\\[\\s*.+\\s*\\]$' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Route 2 — plugins: load them before the core',
      objective: 'Attach an official plugin and understand the ordering constraint.',
      brief: `Official plugins are separate files that listen for the \`alpine:init\` event. If they load **after** Alpine has already initialised the page, the event has fired and gone — the plugin registers too late and its directives silently do nothing.\n\nSo the rule is: **plugins first, core last.**`,
      example: {
        code: `<!-- Plugins BEFORE core, always -->
<script defer src="./vendor/alpine/persist.min.js"></script>
<script defer src="./vendor/alpine/cdn.min.js"></script>

<div x-data="{ n: $persist(0).as('counter') }">
  <button @click="n++">+1</button>
  <span x-text="n"></span>
</div>`,
        note: 'The `.as()` suffix names the storage key. Without it the key is derived from the expression.'
      },
      starter: `<div x-data="{ n: $persist(7).as('m01-s2') }">
  <span data-testid="persisted" x-text="n"></span>
</div>`,
      solution: `<script defer src="./vendor/alpine/persist.min.js"></script>
<script defer src="./vendor/alpine/cdn.min.js"></script>

<div x-data="{ n: $persist(7).as('m01-s2') }">
  <button @click="n++">+1</button>
  <span data-testid="persisted" x-text="n"></span>
</div>`,
      mode: 'raw',
      hints: [
        'Two script tags: the plugin file first, the core file second.',
        'Both need `defer` — otherwise the browser executes them while the HTML is still being parsed.',
        'Bind the counter with `x-text` so the check can read it.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'persist',
          text: 'Load `./vendor/alpine/persist.min.js` **before** `./vendor/alpine/cdn.min.js` (both deferred) and render `n` so the number `7` appears in `data-testid="persisted"`.',
          checks: [
            { kind: 'code', pattern: 'vendor\\/alpine\\/persist\\.min\\.js[\\s\\S]*vendor\\/alpine\\/cdn\\.min\\.js', flags: 'i' },
            { kind: 'text', selector: '[data-testid="persisted"]', value: '7' }
          ]
        },
        {
          id: 't2',
          skill: 'persist',
          text: 'Add a button that increments `n` and mark the number so it updates when clicked.',
          checks: [
            { kind: 'countAtLeast', selector: 'button', value: 1 },
            { kind: 'text', selector: '[data-testid="persisted"]', value: '8', do: [{ click: 'button' }] },
            { kind: 'text', selector: '[data-testid="persisted"]', value: '10', do: [{ click: 'button' }, { click: 'button' }] }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Route 3 — bundlers, and the `alpine:init` window',
      objective: 'Register a reusable component in the correct lifecycle window.',
      brief: `With a bundler you import the module build, expose Alpine on \`window\`, and **call \`Alpine.start()\` yourself** — the module build does not auto-start:\n\n\`import Alpine from 'alpinejs'; window.Alpine = Alpine; Alpine.start()\`\n\nWhenever Alpine is loaded by script tag, your registration code must wait for \`alpine:init\`, which fires just before the page initialises and closes right after. Two events matter: **\`alpine:init\`** (register here) and **\`alpine:initialized\`** (everything on the page is live — good for one-off DOM work).`,
      example: {
        code: `document.addEventListener('alpine:init', () => {
  Alpine.data('quoteCard', (cfg) => ({
    age: cfg.age,
    get aDue() { return (cfg.aDue).toFixed(4) }
  }))
})`,
        note: 'Anything registered after `alpine:init` has fired never gets used: `x-data="quoteCard"` has already been looked up.'
      },
      starter: `<div x-data="quote">
  <p>Age <span data-testid="age" x-text="age"></span></p>
</div>

<script>
  // A minimal registration so the starter already runs — grow it into a quote.
  document.addEventListener('alpine:init', () => {
    Alpine.data('quote', () => ({ age: 0, aDue: 0 }))
  })
</script>`,
      solution: `<div x-data="quote({ age: 45, aDue: ${aDue1r} })">
  <p>Age <span data-testid="age" x-text="age"></span></p>
  <p>ä<sub>45:15</sub> at 4 % = <b data-testid="adue" x-text="aDue.toFixed(4)"></b></p>
</div>

<div x-data="quote({ age: 65, aDue: ${Number(aDue2.toFixed(6))} })">
  <p>Age <span data-testid="age" x-text="age"></span></p>
  <p>ä<sub>65</sub> at 3.5 % = <b data-testid="adue" x-text="aDue.toFixed(4)"></b></p>
</div>

<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('quote', (cfg = {}) => ({
      age: cfg.age ?? 45,
      aDue: cfg.aDue ?? 0,
      get loading() { return this.age >= 100 }
    }))
  })
</script>`,
      mode: 'provided',
      hints: [
        'Alpine core and all official plugins are already loaded in this sandbox: you only need the registration code.',
        "Register inside `document.addEventListener('alpine:init', () => { Alpine.data('quote', (cfg = {}) => ({ ... })) })`.",
        'Arguments are passed as ordinary JavaScript in the attribute: `x-data="quote({ age: 65 })"`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data',
          text: `Register a component called \`quote\` inside an \`alpine:init\` listener that accepts a config argument (\`Alpine.data('quote', (cfg) => ({...}))\`). Then use it once as \`x-data="quote({ age: 45, aDue: ${aDue1.toFixed(4)} })"\`, rendering the age into \`data-testid="age"\` and \`aDue\` (4 decimals) into \`data-testid="adue"\`.`,
          checks: [
            { kind: 'code', pattern: 'alpine:init' },
            { kind: 'code', pattern: "Alpine\\.data\\(\\s*['\"]quote['\"]" },
            { kind: 'countAtLeast', selector: '[x-data^="quote("]', value: 1 },
            { kind: 'text', selector: '[data-testid="adue"]', value: aDue1.toFixed(4) },
            { kind: 'text', selector: '[data-testid="age"]', value: '45' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.data',
          text: 'Prove the component is generic: add a **second** instance with a different age (65) and a different annuity value — use the whole-life annuity at 3.5 % = ' + aDue2.toFixed(4) + ' — and render the same two `data-testid` marks inside it.',
          checks: [
            { kind: 'count', selector: '[x-data^="quote("]', value: 2 },
            { kind: 'text', selector: '[data-testid="age"]', nth: 1, value: '65' },
            { kind: 'textNumber', selector: '[data-testid="adue"]', nth: 1, value: Number(aDue2.toFixed(4)), tol: 0.0002 }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — an endowment quote sheet',
      objective: 'Install Alpine, register a component, and compute a premium from life-table assumptions.',
      scenario: 'A broker asks for a one-page quote sheet: for age 45, a 15-year endowment at i = 4 %, show the single premium and the level annual premium per 1,000 of sum assured. The numbers are fixed: ä₄₅:₁₅ = ' + aDue1.toFixed(4) + ', A₄₅:₁₅ = ' + A1.toFixed(4) + '. A colleague already wrote the markup skeleton below — make it live, and make the premium change when the sum assured changes.',
      brief: `An **endowment** pays on survival *or* on death within the term, so its single premium per 1 of sum assured is A₄₅:₁₅. The level annual premium per 1,000 is \`(A × 1000) / ä\`.

Requirements: the sum assured must be an editable input (start at 250,000); the two premium figures must be marked \`data-testid="single"\` and \`data-testid="level"\` and formatted to 2 decimals.`,
      starter: `<div x-data="quoteSheet">
  <label>Sum assured <input type="number" x-model.number="sumAssured" step="1000"></label>
  <p>Single premium: <b data-testid="single" x-text="single.toFixed(2)"></b></p>
  <p>Level premium per 1,000: <b data-testid="level" x-text="level.toFixed(2)"></b></p>
</div>

<script>
  // The starter runs, but the numbers are placeholders until you fill them in.
  document.addEventListener('alpine:init', () => {
    Alpine.data('quoteSheet', () => ({
      sumAssured: 250000,
      get single() { return 0 },
      get level() { return 0 }
    }))
  })
</script>`,
      solution: `<div x-data="quoteSheet({ aDue: ${aDue1r}, A: ${Ar} })">
  <label>Sum assured <input type="number" x-model.number="sumAssured" step="1000"></label>
  <p>Single premium: <b data-testid="single" x-text="single.toFixed(2)"></b></p>
  <p>Level premium per 1,000: <b data-testid="level" x-text="level.toFixed(2)"></b></p>
</div>

<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('quoteSheet', (cfg) => ({
      sumAssured: 250000,
      aDue: cfg.aDue,
      A: cfg.A,
      get single() { return this.A * this.sumAssured },
      get level() { return (this.A * 1000) / this.aDue }
    }))
  })
</script>`,
      mode: 'provided',
      hints: [
        'Register with `Alpine.data` inside `alpine:init`, then use the name in `x-data`.',
        'A getter that reads `this.sumAssured` re-computes automatically whenever the input changes.',
        `Expected values: single premium = A × 250000 = ${(Ar * 250000).toFixed(2)}; level = A × 1000 / ä = ${((Ar * 1000) / aDue1r).toFixed(2)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.data',
          text: 'Make the sheet live for a sum assured of 250,000: render the single premium into `data-testid="single"` (2 decimals) and the level premium per 1,000 into `data-testid="level"` (2 decimals).',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="single"]', value: Number((Ar * 250000).toFixed(2)), tol: 0.02 },
            { kind: 'textNumber', selector: '[data-testid="level"]', value: Number(((Ar * 1000) / aDue1r).toFixed(2)), tol: 0.02 }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: 'Prove the sheet is reactive: type 500,000 into the sum-assured input and the single premium must become exactly double.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="single"]', value: Number((Ar * 500000).toFixed(2)), tol: 0.5, do: [{ type: 'input[type=number]', value: '500000' }] }
          ]
        }
      ]
    },

    {
      id: 'e2',
      kind: 'exercise',
      mode: 'raw',
      title: 'Exercise — boot the pricing page yourself',
      objective: 'Write the install tag and the registration window, and prove the lifecycle order.',
      scenario: `The pricing page is one static file that whoever is on duty uploads by hand, so the bootstrapping is written out in full: Alpine comes from a deferred script tag, and a small inline script registers the \`pricingPage\` component **before** the page initialises. QA wants the lifecycle visible — the page must keep a log of \`alpine:init\`, the component's own \`init()\` and \`alpine:initialized\` in the order they happen, and show a READY badge only once the component is live.`,
      brief: `Elements: \`data-testid="quote"\` (\`quote\`, formatted to 2 decimals — start at 42.5), \`data-testid="badge"\` (\`READY\` once the component has initialised, \`booting\` before), \`data-testid="log"\` (the three lifecycle events joined with \`' → '\`), and \`data-testid="source"\` (a one-line note saying where the provider came from).\n\nIn production the install tag points at the CDN (\`https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js\`); this sandbox serves the same build at \`vendor/alpine/cdn.min.js\`, and a sandbox with neither falls back to its own copy — so keep the tag, and keep the registration inside an \`alpine:init\` listener.`,
      starter: `<div x-data="{ quote: 0, ready: false }">
  <p>quote <b data-testid="quote"></b></p>
  <p><b data-testid="badge"></b></p>
  <p>lifecycle <code data-testid="log"></code></p>
  <p data-testid="source"></p>
</div>`,
      solution: `<script defer src="vendor/alpine/cdn.min.js"></script>

<div x-data="pricingPage">
  <p>quote <b data-testid="quote" x-text="quote.toFixed(2)"></b></p>
  <p><b data-testid="badge" x-text="ready ? 'READY' : 'booting'"></b></p>
  <p>lifecycle <code data-testid="log"></code></p>
  <p data-testid="source"></p>
</div>

<script>
  const log = []
  const write = () => { document.querySelector('[data-testid="log"]').textContent = log.join(' → ') }
  const mark = name => { if (!log.includes(name)) { log.push(name); write() } }

  document.addEventListener('alpine:init', () => {
    mark('alpine:init')

    Alpine.data('pricingPage', () => ({
      quote: 42.5,
      ready: false,
      init() {
        mark('component:init')
        this.ready = true
        document.querySelector('[data-testid="source"]').textContent = 'pricingPage was registered during alpine:init'
        write()
      }
    }))

    write()
  })

  document.addEventListener('alpine:initialized', () => {
    mark('alpine:initialized')
    write()
  })
</script>`,
      hints: [
        'The install tag is deferred, so it executes after the parsed markup — which is exactly why the registration must live in an `alpine:init` listener rather than at the top level of the script.',
        'Push each event into an array as it happens and re-render the log after every push; the component init hook runs during the initialisation pass, between the two document events.',
        'Set `ready` in `init()` instead of hard-coding `READY`, so the badge is evidence that the component really initialised.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'installation',
          text: 'Alpine must be loaded by a deferred install tag and the component registered during `alpine:init`, so the badge reads READY.',
          checks: [
            { kind: 'code', pattern: "cdn\.min\.js" },
            { kind: 'code', pattern: "defer" },
            { kind: 'code', pattern: "alpine:init" },
            { kind: 'text', selector: '[data-testid="badge"]', value: 'READY' }
          ]
        },
        {
          id: 't2',
          skill: 'lifecycle',
          text: 'The lifecycle must be logged in order: `alpine:init`, then the component init, then `alpine:initialized`.',
          checks: [
            { kind: 'code', pattern: "alpine:initialized" },
            { kind: 'text', selector: '[data-testid="log"]', value: 'alpine:init → component:init → alpine:initialized' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.data',
          text: 'The provider must be a real `Alpine.data` component: it carries the quote and says where it came from.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.data\\('pricingPage'" },
            { kind: 'text', selector: '[data-testid="quote"]', value: '42.50' },
            { kind: 'textHas', selector: '[data-testid="source"]', value: 'registered during alpine:init' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'installation',
      q: 'Why does the documentation insist on `<script defer src="…/alpinejs@3.x.x/dist/cdn.min.js"></script>` rather than a plain `<script>`?',
      options: [
        'Because `defer` downloads the file faster',
        'Because Alpine must run after the HTML is parsed, so it can initialise the whole component tree',
        'Because `defer` is required for modules',
        'Because otherwise `x-data` attributes are stripped by the browser'
      ],
      answer: 1,
      why: 'Deferred scripts execute in order, after parsing and before `DOMContentLoaded`. Alpine initialises a finished tree, so `x-data` scopes exist by the time it boots.',
      distractors: {
        0: '`defer` changes *when* a script runs, not how fast it downloads (that is `preload`/`prefetch`).',
        2: 'Modules use `type="module"`; `defer` is meaningless-to-harmless there. The CDN build is a classic script.',
        3: 'Browsers never strip unknown attributes — they are just inert until Alpine reads them.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'installation',
      q: 'You add `<script defer src="alpine.js"></script>` **before** `<script defer src="focus-plugin.js"></script>`, and `x-trap` does nothing. Why?',
      options: [
        'The plugin file is corrupt',
        'Both scripts run in order, so Alpine initialises the page before the plugin gets to listen for `alpine:init`',
        'Plugins must be loaded with `async`',
        'x-trap needs a `$refs` element to work at all'
      ],
      answer: 1,
      why: 'Deferred scripts execute in document order. Alpine ran first, fired `alpine:init`, initialised the page — then the plugin registered into a party that was already over. Plugins before core.',
      distractors: {
        0: 'Nothing is corrupt: the plugin simply registered too late.',
        2: '`async` makes ordering *worse* — it discards the guarantee you need.',
        3: 'x-trap works without refs; the symptom here is ordering.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'lifecycle',
      q: 'Which statement about the lifecycle events is correct?',
      options: [
        '`alpine:initialized` fires before `alpine:init`',
        '`alpine:init` fires when Alpine is loaded from disk; `alpine:initialized` fires after `Alpine.start()`',
        '`alpine:init` fires before the page initialises (register components here); `alpine:initialized` fires after every component has initialised',
        'Both fire once per component'
      ],
      answer: 2,
      why: '`alpine:init` is the registration window — data providers, stores, magics, directives. `alpine:initialized` is your cue that the page is live (it does not wait for trees suspended by `Alpine.deferInit()`).',
      distractors: {
        0: 'The names describe the order: init happens first.',
        1: 'Both are page-level events tied to `Alpine.start()`, not to file loading.',
        3: 'They are `document`-level events fired once, not per component.'
      }
    },
    {
      id: 'q4',
      type: 'multi',
      skill: 'installation',
      q: 'Which of these are true about the npm/bundler route?',
      options: [
        'You import the module build: `import Alpine from \'alpinejs\'`',
        'The module build starts itself automatically, like the CDN build',
        'You must call `Alpine.start()` after registering your components',
        '`window.Alpine = Alpine` is a convenience for console access and for plugins that look for it'
      ],
      answers: [0, 2, 3],
      why: 'The bundle build leaves starting to you, which is precisely what makes registering components before the page initialises reliable.',
      distractors: { 1: 'Only the CDN/script-tag build auto-starts (on `DOMContentLoaded`). Bundles call `Alpine.start()` explicitly.' }
    },
    {
      id: 'q5',
      type: 'short',
      skill: 'installation',
      q: 'What single attribute makes a plain `<script>` tag execute after the document has been parsed? (one word)',
      accept: ['defer', 'defer attribute', 'the defer attribute'],
      why: '`defer` — parse first, execute in order, before `DOMContentLoaded`. `type="module"` implies it, but `defer` is the explicit answer for classic scripts.'
    },
    {
      id: 'q6',
      type: 'mc',
      skill: 'installation',
      q: 'Your CSP forbids `unsafe-eval`. What does that mean for Alpine, and what is the documented workaround?',
      options: [
        'Alpine cannot be used at all',
        'Alpine still works because expressions are parsed with `new Function`',
        'Alpine’s default build needs eval; switch to the CSP build and restrict expressions to plain method calls',
        'You must inline every expression into a `<template>`'
      ],
      answer: 2,
      why: 'Alpine compiles attribute expressions, which needs eval. The CSP build parses expressions structurally and only allows calls like `foo()` / `foo.bar()` — no arbitrary JavaScript in attributes.',
      distractors: {
        0: 'You lose the expression syntax, not Alpine.',
        1: '`new Function` is exactly what CSP blocks — this is the trap.',
        3: 'Templates have nothing to do with CSP.'
      }
    }
  ]
}
