/* Module 2 — x-data: the component scope, nested scopes, getters and methods.
 * Matches: /essentials/state, /directives/data */

import { life, buhlmann, credibility, chainLadder, triangle, rnd } from './data.js'

const k = credibility.EPV / credibility.VHM
const mu = credibility.groups.reduce((s, g) => s + g.exposure * g.mean, 0) / credibility.groups.reduce((s, g) => s + g.exposure, 0)
const groupA = credibility.groups[0]
const zA = groupA.exposure / (groupA.exposure + k)
const zACredible = zA * groupA.mean + (1 - zA) * mu
const cl = chainLadder(triangle)
const f2 = cl.factors[1]
/* the rows below use q rounded to 6 dp, so derived l values are checked with a small tolerance */
const q40r = rnd(life.qx(40), 6), q50r = rnd(life.qx(50), 6), q60r = rnd(life.qx(60), 6), q70r = rnd(life.qx(70), 6)
const l60 = 100000 * (1 - q40r) * (1 - q50r)
const l60half = 50000 * (1 - q40r) * (1 - q50r)

export default {
  id: 'm02',
  num: 2,
  title: 'State, scopes and computed values',
  blurb: 'x-data, nesting, shadowing, getters that cannot go stale, and methods that mutate state.',
  goal: 'Model a real pricing or reserving calculation as component state: know which scope owns each value, and derive everything derived.',
  intro: `\`x-data\` is the only directive that is strictly required, and everything else is an expression evaluated against the scope it creates. Three skills carry most of the weight: **where a value lives**, **how a value changes** (getters vs. stored state), and **why \`this\` is the scope and not the element**.`,
  skills: ['x-data', 'reactivity', 'getters'],
  docRefs: [
    { label: 'State', url: 'https://alpinejs.dev/essentials/state' },
    { label: 'x-data', url: 'https://alpinejs.dev/directives/data' }
  ],
  mastery: [
    'Declare component state and read it from a child element',
    'Explain and demonstrate scope shadowing between nested `x-data`',
    'Replace a duplicated stored value with a getter and prove it updates',
    'Write methods that mutate state, and call them from a click and from `x-init`'
  ],
  units: [
    {
      id: 's1',
      title: 'Your first scope',
      objective: 'Declare a state object and render two of its fields.',
      brief: `Everything inside the element that carries \`x-data\` can read its properties. Alpine wraps the object in a **reactive proxy**, so any expression that *reads* a property is re-evaluated when it *changes* — no re-render call, no list of dependencies to maintain.`,
      starter: `<div x-data="{ age: 45, rate: 0.05 }">
  <!-- render age and rate here -->
</div>`,
      solution: `<div x-data="{ age: 45, rate: 0.05, product: 'endowment' }">
  <p>Entry age: <b data-testid="age" x-text="age"></b></p>
  <p>Interest: <b data-testid="rate" x-text="(rate * 100).toFixed(2) + '%'"></b></p>
  <p>Product: <b data-testid="product" x-text="product"></b></p>
</div>`,
      hints: [
        '`x-text` takes any JavaScript expression, so `(rate * 100).toFixed(2) + \'%\'` is allowed.',
        'Mark the two output elements `data-testid="age"` and `data-testid="rate"` so the checker can find them.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-data',
          text: 'Render `age` into an element marked `data-testid="age"` and `rate` as a percentage with two decimals (e.g. `5.00%`) into `data-testid="rate"`.',
          checks: [
            { kind: 'text', selector: '[data-testid="age"]', value: '45' },
            { kind: 'textMatch', selector: '[data-testid="rate"]', pattern: '^5(\\.0+)?\\s*%$' }
          ]
        },
        {
          id: 't2',
          skill: 'x-data',
          text: 'Add a third property `product` with the value `\'endowment\'` and display it in an element marked `data-testid="product"`.',
          checks: [
            { kind: 'text', selector: '[data-testid="product"]', value: 'endowment' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Nested scopes, and who owns what',
      objective: 'Demonstrate shadowing and inheritance between parent and child scopes.',
      brief: `Nested \`x-data\` elements create nested scopes. Reading walks **outwards** until a scope has the property; writing always writes to the **nearest** scope that owns it — creating the property in the inner scope if it does not exist anywhere.\n\nSo a child that assigns to a name the parent owns will change the parent (any name it can see), but a child that declares the same name in its own \`x-data\` **shadows** it and the parent never notices.`,
      example: {
        code: `<div x-data="{ rate: 0.05 }">
  <span x-text="rate"></span>              <!-- 0.05 -->
  <div x-data="{ rate: 0.03 }">
    <span x-text="rate"></span>            <!-- 0.03 : own scope wins on read -->
  </div>
  <span x-text="rate"></span>              <!-- still 0.05 : nobody wrote to it -->
</div>`,
        note: 'Two scopes, two independent `rate` values. This is the source of most "why did nothing change?" bugs.'
      },
      starter: `<div x-data="{ rate: 0.05, label: 'base' }">
  <!-- inner scope with its own rate -->
</div>`,
      solution: `<div x-data="{ rate: 0.05, label: 'base' }">
  <span data-testid="outer" x-text="label + ' ' + rate"></span>
  <div x-data="{ rate: 0.03 }">
    <span data-testid="inner" x-text="label + ' ' + rate"></span>
    <span data-testid="after" x-text="label + ' ' + rate"></span>
  </div>
</div>`,
      hints: [
        'The inner element simply declares `x-data="{ rate: 0.03 }"` — it inherits `label` from the parent because it does not declare one.',
        'The outer value must still read `base 0.05` after the inner block.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-data',
          text: 'Create an inner scope that overrides `rate` with `0.03` while inheriting `label`. The inner element marked `data-testid="inner"` must read `base 0.03`, and the outer element marked `data-testid="outer"` must still read `base 0.05`.',
          checks: [
            { kind: 'text', selector: '[data-testid="inner"]', value: 'base 0.03' },
            { kind: 'text', selector: '[data-testid="outer"]', value: 'base 0.05' }
          ]
        },
        {
          id: 't2',
          skill: 'x-data',
          text: 'Now put a third element **inside** the inner scope, marked `data-testid="after"`, reading the same two names. It must still read `base 0.03` — proof that the inner scope keeps its own value.',
          checks: [
            { kind: 'exists', selector: '[data-testid="after"]' },
            { kind: 'text', selector: '[data-testid="after"]', value: 'base 0.03' },
            { kind: 'countAtLeast', selector: '[x-data]', value: 2 }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Getters: derive, never duplicate',
      objective: 'Compute values with getters instead of storing them twice.',
      brief: `If a value can be computed from other values, store the inputs and write a **getter**. Alpine re-evaluates the getter whenever the state it reads changes, so a stored copy can never disagree with its source — the entire class of "stale number" bugs disappears.\n\nTrade-off: getters run on every read, so keep genuinely expensive work out of them (or memoise deliberately).`,
      example: {
        code: `<div x-data="{
  survival: 0.9,
  get death() { return 1 - this.survival }        // always consistent
}">`,
        note: 'Note `this.` — inside the object, getters read their siblings through `this`.'
      },
      starter: `<div x-data="{ lx: 100000, lxPlus: 96000 }">
  <!-- p and q -->
</div>`,
      solution: `<div x-data="{
  lx: 100000,
  lxPlus: 96000,
  get px() { return this.lxPlus / this.lx },
  get qx() { return 1 - this.px },
  get deaths() { return this.lx - this.lxPlus }
}">
  <p>₁pₓ = <b data-testid="p" x-text="px.toFixed(4)"></b></p>
  <p>₁qₓ = <b data-testid="q" x-text="qx.toFixed(4)"></b></p>
  <p>deaths = <b data-testid="d" x-text="deaths"></b></p>
  <button data-testid="btn" @click="lxPlus = 90000">set l(x+1) = 90,000</button>
</div>`,
      hints: [
        'Write `get px() { return this.lxPlus / this.lx }` and `get qx() { return 1 - this.px }`.',
        'A third getter `get deaths() { return this.lx - this.lxPlus }` shows the same idea on a count instead of a probability.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'getters',
          text: 'Add getters `px` (= l(x+1)/l(x)) and `qx` (= 1 − px), marked `data-testid="p"` and `data-testid="q"` with 4 decimals.',
          checks: [
            { kind: 'text', selector: '[data-testid="p"]', value: '0.9600' },
            { kind: 'text', selector: '[data-testid="q"]', value: '0.0400' }
          ]
        },
        {
          id: 't2',
          skill: 'getters',
          text: 'Add a getter `deaths` = l(x) − l(x+1) rendered into `data-testid="d"`, and a button marked `data-testid="btn"` that sets `lxPlus` to 90000. After clicking it, `p` must read `0.9000` and `deaths` must read `10000` — without you recomputing anything by hand.',
          checks: [
            { kind: 'text', selector: '[data-testid="d"]', value: '4000' },
            { kind: 'text', selector: '[data-testid="p"]', value: '0.9000', do: [{ click: '[data-testid="btn"]' }] },
            { kind: 'text', selector: '[data-testid="d"]', value: '10000', do: [{ click: '[data-testid="btn"]' }] }
          ]
        }
      ]
    },
    {
      id: 's4',
      title: 'Methods, `this`, and calling them from anywhere',
      objective: 'Mutate state from a method and call it both on click and during init.',
      brief: `Methods are ordinary functions on the scope. Inside them \`this\` is the **component data object** — which is why you can write \`this.riders += amount\` — and Alpine binds them for you, so \`@click="reset"\` (no parentheses) works just as well as \`@click="reset()"\`.\n\n\`x-init\` runs once, when the component initialises: the natural home for "load the defaults" or "apply the standing rider". Two \`x-data\` blocks are two independent instances, so the second one can start with an automatic rider while the first stays plain.`,
      example: {
        code: `<div x-data="{ base: 1200, get premium() { return this.base } }">
  <span x-text="premium"></span>
</div>`,
        note: '`x-init` runs before the first paint, so the initialised value is what the user sees — never a flicker from 0.'
      },
      starter: `<div x-data="{ base: 1200, riders: 0, get premium() { return this.base + this.riders } }">
  <!-- premium, an add-rider button, and a reset method -->
</div>`,
      solution: `<div x-data="{
  base: 1200,
  riders: 0,
  get premium() { return this.base + this.riders },
  addRider(amount = 250) { this.riders += amount },
  reset() { this.riders = 0 }
}">
  <p>premium: <b data-testid="premium" x-text="premium"></b></p>
  <button data-testid="add" @click="addRider()">add rider (+250)</button>
  <button data-testid="reset" @click="reset">reset</button>
</div>

<div x-data="{
  base: 1200,
  riders: 0,
  get premium() { return this.base + this.riders },
  addRider(amount = 250) { this.riders += amount }
}" x-init="addRider(50)">
  <p>premium with the standing rider: <b data-testid="premiumAuto" x-text="premium"></b></p>
</div>`,
      hints: [
        'A method may take a default parameter: `addRider(amount = 250)`.',
        '`@click="reset"` passes the method itself; `@click="reset()"` calls it. Both are fine.',
        '`x-init="addRider(50)"` runs during initialisation, before the first paint.',
        'Two `x-data` blocks are two separate instances — the second one does not affect the first.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'methods',
          text: 'Build a premium calculator: `base` 1200, `riders` 0, a getter `premium` = base + riders shown in `data-testid="premium"`, a method `addRider(amount = 250)` wired to a button marked `data-testid="add"`, and a `reset` method wired to `data-testid="reset"`.',
          checks: [
            { kind: 'text', selector: '[data-testid="premium"]', value: '1200' },
            { kind: 'text', selector: '[data-testid="premium"]', value: '1450', do: [{ click: '[data-testid="add"]' }] },
            { kind: 'text', selector: '[data-testid="premium"]', value: '1700', do: [{ click: '[data-testid="add"]' }] },
            { kind: 'text', selector: '[data-testid="premium"]', value: '1200', do: [{ click: '[data-testid="reset"]' }] }
          ]
        },
        {
          id: 't2',
          skill: 'x-init',
          text: 'Add a **second, independent** component that applies `addRider(50)` in `x-init`, rendering its premium into `data-testid="premiumAuto"`. It must show 1250 immediately — while the first component is untouched.',
          checks: [
            { kind: 'text', selector: '[data-testid="premiumAuto"]', value: '1250' },
            { kind: 'text', selector: '[data-testid="premium"]', value: '1200' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a credibility calculator',
      objective: 'Turn a statistical formula into component state with inputs and a getter.',
      scenario: `A pricing team pools four clinics. For each clinic you know the exposure m and the observed mean claim cost x̄. Bühlmann credibility says the credible mean is Z·x̄ + (1 − Z)·μ where Z = m/(m + k), k = EPV/VHM, and μ is the exposure-weighted grand mean. With the study in front of you — EPV = ${credibility.EPV}, VHM = ${credibility.VHM}, so k = ${k} — build a one-clinic calculator starting with Clinic A (m = ${groupA.exposure}, x̄ = ${groupA.mean}).`,
      brief: `Make \`m\` and \`xbar\` editable inputs (\`x-model.number\`). Render **Z with 4 decimals** into \`data-testid="z"\` and the **credible mean with 3 decimals** into \`data-testid="credible"\`. Keep μ and k fixed: μ = ${rnd(mu, 4)}, k = ${k}.`,
      starter: `<div x-data="{ m: 200, xbar: 420, mu: ${rnd(mu, 4)}, k: ${k} }">
  <label>exposure m <input type="number" x-model.number="m"></label>
  <label>observed mean x̄ <input type="number" x-model.number="xbar"></label>
  <p>Z = <b></b></p>
  <p>credible mean = <b></b></p>
</div>`,
      solution: `<div x-data="{ m: 200, xbar: 420, mu: ${rnd(mu, 4)}, k: ${k},
  get z() { return this.m / (this.m + this.k) },
  get credible() { return this.z * this.xbar + (1 - this.z) * this.mu } }">
  <label>exposure m <input type="number" x-model.number="m"></label>
  <label>observed mean x̄ <input type="number" x-model.number="xbar"></label>
  <p>Z = <b data-testid="z" x-text="z.toFixed(4)"></b></p>
  <p>credible mean = <b data-testid="credible" x-text="credible.toFixed(3)"></b></p>
  <p><button data-testid="half" @click="m = 112.5">halve the credibility</button></p>
</div>`,
      hints: [
        'Z is a getter: `get z() { return this.m / (this.m + this.k) }`.',
        `The credible mean is a second getter using the first: \`this.z * this.xbar + (1 - this.z) * this.mu\`. Starting values must give Z = ${rnd(zA, 4)} and ${rnd(zACredible, 3)}.`,
        'Clinic A with m = 200 and k = 112.5 → Z = 200/312.5 = 0.64.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'getters',
          text: `Render Z (4 decimals) into \`data-testid="z"\` and the credible mean (3 decimals) into \`data-testid="credible"\`, computed from \`m\`, \`xbar\`, \`mu\` and \`k\`.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="z"]', value: Number(zA.toFixed(4)), tol: 0.0002 },
            { kind: 'textNumber', selector: '[data-testid="credible"]', value: Number(zACredible.toFixed(3)), tol: 0.001 }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: 'Prove it is live: typing `350` into the exposure input must give Z = 0.7568 (350/462.5) and a credible mean of 388.108.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="z"]', value: Number((350 / (350 + k)).toFixed(4)), tol: 0.0002, do: [{ type: 'input[type=number]', value: '350' }] },
            { kind: 'textNumber', selector: '[data-testid="credible"]', value: Number((350 / (350 + k) * 420 + (1 - 350 / (350 + k)) * mu).toFixed(3)), tol: 0.002 }
          ]
        },
        {
          id: 't3',
          skill: 'x-model',
          text: 'Add a button marked `data-testid="half"` that sets `m` to 112.5 — half the credibility unit — and check that Z falls to 0.5000.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="z"]', value: 0.5, tol: 0.0002, do: [{ click: '[data-testid="half"]' }] }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a mortality-table slice with a derived column',
      objective: 'Use getters over array state, and make a derived table column that cannot disagree with its inputs.',
      scenario: `A reserving actuary wants a five-row mortality slice for ages 40, 50, 60, 70 and 80 showing qₓ, lₓ and the number of deaths dₓ. The component holds an array of \`{ x, q }\` objects — qₓ is the input, everything else must be **derived**, from a radix of l₄₀ = 100,000 taken at every tenth age.`,
      brief: `Build \`rows\` as \`[{ x: 40, q: ${rnd(life.qx(40), 6)} }, …]\` with the five q-values below, then derive the rest. l₄₀ = 100,000 is the starting population; each later l is the previous l minus that age's deaths.
      q₄₀ = ${rnd(life.qx(40), 6)} · q₅₀ = ${rnd(life.qx(50), 6)} · q₆₀ = ${rnd(life.qx(60), 6)} · q₇₀ = ${rnd(life.qx(70), 6)} · q₈₀ = ${rnd(life.qx(80), 6)}`,
      starter: `<div x-data="{
  l0: 100000,
  rows: [
    { x: 40, q: ${rnd(life.qx(40), 6)} },
    { x: 50, q: ${rnd(life.qx(50), 6)} },
    { x: 60, q: ${rnd(life.qx(60), 6)} },
    { x: 70, q: ${rnd(life.qx(70), 6)} },
    { x: 80, q: ${rnd(life.qx(80), 6)} }
  ]
}">
  <table><tbody><template x-for="r in rows" :key="r.x"><tr><td x-text="r.x"></td></tr></template></tbody></table>
</div>`,
      solution: `<div x-data="{
  l0: 100000,
  rows: [
    { x: 40, q: ${rnd(life.qx(40), 6)} },
    { x: 50, q: ${rnd(life.qx(50), 6)} },
    { x: 60, q: ${rnd(life.qx(60), 6)} },
    { x: 70, q: ${rnd(life.qx(70), 6)} },
    { x: 80, q: ${rnd(life.qx(80), 6)} }
  ],
  get table() {
    let l = this.l0
    return this.rows.map(r => {
      const d = l * r.q
      const row = { ...r, l, d }
      l = l - d
      return row
    })
  }
}">
  <p><label>radix l₄₀ <input type="number" x-model.number="l0" step="10000"></label></p>
  <table>
    <tbody>
      <template x-for="r in table" :key="r.x">
        <tr>
          <td x-text="r.x"></td>
          <td data-testid="q" x-text="(r.q * 100).toFixed(3) + '%'"></td>
          <td data-testid="l" x-text="r.l.toFixed(0)"></td>
          <td data-testid="d" x-text="r.d.toFixed(0)"></td>
        </tr>
      </template>
    </tbody>
  </table>
</div>`,
      hints: [
        'A single getter can build the whole table: start with `let l = this.l0` and accumulate with `Array.map`.',
        'Because the getter reads `this.rows` and `this.l0`, changing either re-derives the table automatically.',
        'Rows are rendered with `x-for` — you met it here for the first time, and it is the whole of Module 5.',
        `Check row 3 (age 60): l = ${l60.toFixed(0)} and deaths = ${(l60 * q60r).toFixed(0)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'getters',
          text: `Render five rows with ` + '`x-for`' + ` and, using one getter, fill ` + '`data-testid="l"`' + ` (deaths-free population at each age, 0 decimals) and ` + '`data-testid="d"`' + ` (deaths in the year, 0 decimals). Age 60's row must show l = ${life.lx(60).toFixed(0)}.`,
          checks: [
            { kind: 'listLong', selector: '[data-testid="l"]', value: 5 },
            { kind: 'text', selector: '[data-testid="l"]', nth: 0, value: '100000' },
            { kind: 'textNumber', selector: '[data-testid="l"]', nth: 2, value: Math.round(l60), tol: 2 },
            { kind: 'textNumber', selector: '[data-testid="d"]', nth: 2, value: Math.round(l60 * q60r), tol: 2 }
          ]
        },
        {
          id: 't2',
          skill: 'getters',
          text: `Make it react: add an input bound to ` + '`l0`' + ` (use ` + '`x-model.number`' + `) and the whole table must recompute. With l₀ = 50,000 the age-40 row must read 50000 and the age-60 row exactly half of its previous value.`,
          checks: [
            { kind: 'text', selector: '[data-testid="l"]', nth: 0, value: '50000', do: [{ type: 'input[type=number]', value: '50000' }] },
            { kind: 'textNumber', selector: '[data-testid="l"]', nth: 2, value: Math.round(l60half), tol: 2, do: [{ type: 'input[type=number]', value: '50000' }] }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-data',
      q: 'What does Alpine actually do with the object you pass to `x-data`?',
      options: [
        'It copies it into a global variable so every component shares it',
        'It wraps it in a reactive proxy and makes it the scope for every expression inside that element',
        'It serialises it to JSON and re-reads the attributes on every change',
        'It stores it on `window.__alpineData` for debugging'
      ],
      answer: 1,
      why: 'X-data creates a scope; the object is wrapped in a reactive proxy (Vue’s reactivity under the hood) so reads are tracked and writes notify every dependent expression.',
      distractors: {
        0: 'Sharing across components is `Alpine.store()`. Each `x-data` is its own instance.',
        2: 'Nothing is serialised; Alpine keeps one reactive object per component and evaluates expressions against it.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'getters',
      q: 'You store `lx` and `lxPlus`, and also store `px = lxPlus / lx` as a plain property. A colleague changes `lxPlus` with a slider and `px` never moves. What is the correct fix?',
      options: [
        'Recompute `px` inside the slider’s `@input` handler',
        'Make `px` a getter so it is derived on every read',
        'Wrap `px` in `Alpine.reactive()`',
        'Use `x-effect` to copy `lxPlus` into `px` on every change'
      ],
      answer: 1,
      why: 'Storing a derived value means it can go stale. A getter is re-evaluated whenever anything it reads changes — no handler, no effect, no drift.',
      distractors: {
        0: 'Works until someone changes `lxPlus` from somewhere else — that is exactly how stale-data bugs are born.',
        2: '`Alpine.reactive()` on a number does nothing useful: numbers cannot be made reactive, and the problem is derivation, not reactivity.',
        3: 'A hand-written effect that clones state is a getter with extra steps and more ways to be wrong.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'x-data',
      q: 'Inside `x-data="{ rate: 0.05, bump() { rate = 0.06 } }"` what happens when `bump()` runs?',
      options: [
        'Nothing — you must write `this.rate`',
        'It writes a new global variable `rate`',
        'It works, because Alpine evaluates method bodies with the component data in scope (though `this.rate` is clearer)',
        'It throws a ReferenceError'
      ],
      answer: 2,
      why: 'Method bodies are evaluated with `with(scope)` semantics, so bare names resolve against the component data. `this` is also the component data object, and the docs recommend being explicit.',
      distractors: {
        0: 'It is not required, though it is the style used in this course for clarity.',
        1: 'Alpine does not create globals from component state.',
        3: 'No error: the name resolves through the component scope.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'reactivity',
      q: 'Two sibling components each declare `x-data="{ count: 0 }"`. You click “+” in the first one. What does the second show?',
      options: [
        'The same number — they share state',
        'Still 0 — each `x-data` creates an independent scope instance',
        'It throws because `count` is already defined',
        'It depends on whether the elements are siblings or nested'
      ],
      answer: 1,
      why: 'Two scopes, two objects. Sharing is a deliberate act: `Alpine.store()`, a custom event, or a parent scope that both children write to.',
      distractors: {
        0: 'Sharing name-and-value never means sharing state in Alpine.',
        2: 'Duplicate keys in different scopes are perfectly legal.',
        3: 'Siblings or nested does not matter — nesting only changes *lookup*, never identity.'
      }
    },
    {
      id: 'q5',
      type: 'short',
      skill: 'x-data',
      q: 'Which Alpine directive is required on an ancestor for `x-text`, `x-show` and friends to work? (include the colon and name, e.g. `x-foo`)',
      accept: ['x-data'],
      why: '`x-data` — or the global `Alpine.data()` component it names. Without a scope, Alpine has nothing to evaluate expressions against.'
    },
    {
      id: 'q6',
      type: 'multi',
      skill: 'getters',
      q: 'Which of these are good reasons to prefer a getter over stored state?',
      options: [
        'The value is a pure function of other state',
        'You want the value to update automatically when its inputs change',
        'The computation takes 400 ms and runs on every keystroke',
        'You want to avoid maintaining two sources of truth'
      ],
      answers: [0, 1, 3],
      why: 'Getters are re-evaluated on read, so pure derivations stay consistent for free. Expensive work is the one case where you memoise or compute deliberately.',
      distractors: { 2: 'A getter over a 400 ms computation runs far too often: cache it, compute on change, or move it off the main thread.' }
    }
  ]
}
