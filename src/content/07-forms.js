/* Module 7 — forms and two-way binding: x-model and x-mask.
 * Matches: /directives/model, /plugins/mask */

import { life, rnd, sq } from './data.js'

const A_END = Number(life.AEndow(45, 15, 0.045).toFixed(6))
const ADUE = Number(life.aDueTemp(45, 15, 0.045).toFixed(6))
const RATING = 1.25                                   // smoker differential A × 1.25
const premium = (sum, smoker) => (sum * A_END * (smoker ? RATING : 1)) / ADUE
const PORTFOLIO = [
  { id: 'P-01', age: 42, sum: 250000, smoker: false },
  { id: 'P-02', age: 51, sum: 400000, smoker: true },
  { id: 'P-03', age: 37, sum: 150000, smoker: false },
  { id: 'P-04', age: 58, sum: 300000, smoker: true }
]
const DATE_IN = '04212026'
const DATE_OUT = '04/21/2026'

export default {
  id: 'm07',
  num: 7,
  title: 'Forms and two-way binding',
  blurb: 'x-model in every flavour, x-mask for input your users cannot get wrong.',
  goal: 'Bind every control type with x-model, choose the right modifier, and constrain typed input with x-mask.',
  intro: `**\`x-model\`** is "value in, value out": it sets the element from the data on init and writes changes back. It works for text inputs, numbers, checkboxes, radios, selects, textareas and \`contenteditable\`.\n\nModifiers change *when* and *how* it writes: **\`.number\`** casts to a number, **\`.boolean\`** to a boolean, **\`.lazy\`** waits for \`change\` instead of \`input\`, **\`.debounce\`** waits for quiet, and **\`.fill\`** pushes the initial value *into* the input. **\`x-mask\`** is a separate plugin that formats as the user types.`,
  skills: ['x-model', 'x-mask', 'form inputs'],
  docRefs: [
    { label: 'x-model', url: 'https://alpinejs.dev/directives/model' },
    { label: 'Mask plugin', url: 'https://alpinejs.dev/plugins/mask' }
  ],
  mastery: [
    'Bind text, number, checkbox, radio, select and textarea controls',
    'Choose between `.number`, `.boolean`, `.lazy`, `.debounce` and `.fill` deliberately',
    'Explains why `"45" + 1` breaks without `.number`',
    'Apply `x-mask` to dates and currency and read the formatted value in state'
  ],
  units: [
    {
      id: 's1',
      title: 'Every control, one directive',
      objective: 'Bind four control types and derive an actuarial quantity from them.',
      brief: `Bindings are just variables. A text input writes a string, \`.number\` writes a number, a checkbox with \`.boolean\` writes a boolean — so arithmetic in your getters depends on the modifiers being right.`,
      example: {
        code: `<input type="text"   x-model="name">
<input type="number" x-model.number="age">
<input type="checkbox" x-model="smoker">        <!-- truthy/array semantics -->
<input type="radio"  x-model="table" value="A">
<select x-model="term"><option>15</option></select>
<textarea x-model="notes"></textarea>`,
        note: 'For a checkbox you want `.boolean` when the value should be a real `true`/`false` rather than a string.'
      },
      starter: `<div x-data="{ sum: 250000, smoker: '' , table: 'A' }">
  sum: <input type="number" data-testid="sum" x-model.number="sum">
  smoker: <input type="checkbox" data-testid="smoker" x-model="smoker">
  <p>type of sum: <b data-testid="sumType" x-text="typeof sum"></b></p>
</div>`,
      solution: `<div x-data="{
  sum: 250000,
  smoker: false,
  table: 'A',
  aEnd: ${A_END},
  adue: ${ADUE},
  get premium() { return (this.sum * this.aEnd * (this.smoker ? ${RATING} : 1)) / this.adue }
}">
  sum assured:
  <input type="number" data-testid="sum" step="1000" x-model.number="sum">
  <label><input type="checkbox" data-testid="smoker" x-model.boolean="smoker"> smoker (rated table)</label>

  <p>type of sum: <b data-testid="sumType" x-text="typeof sum"></b>,
     smoker: <b data-testid="smokerType" x-text="typeof smoker"></b></p>
  <p>single premium: <b data-testid="premium" x-text="premium.toFixed(2)"></b></p>
</div>`,
      hints: [
        '`x-model.number` on the sum, `x-model.boolean` on the checkbox — otherwise you get `"250000"` and `"on"`.',
        'The premium formula is `sum × A ÷ ä`, doubled-ish by the rating factor for smokers.',
        `With the defaults the premium is ${premium(250000, false).toFixed(2)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-model',
          text: `With the defaults the premium must read ${premium(250000, false).toFixed(2)}, and the type readouts must show \`number\` for the sum and \`boolean\` for the smoker flag.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="premium"]', value: Number(premium(250000, false).toFixed(2)), tol: 0.02 },
            { kind: 'text', selector: '[data-testid="sumType"]', value: 'number' },
            { kind: 'text', selector: '[data-testid="smokerType"]', value: 'boolean' }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: `Typing \`400000\` as the sum and ticking the smoker box must move the premium to ${premium(400000, true).toFixed(2)}.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="premium"]', value: Number(premium(400000, true).toFixed(2)), tol: 0.05, do: [{ type: '[data-testid="sum"]', value: '400000' }, { click: '[data-testid="smoker"]' }] },
            { kind: 'prop', selector: '[data-testid="smoker"]', prop: 'checked', value: 'true' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: '.lazy, .fill and the shape of a write',
      objective: 'Control when the model updates and how the input is seeded.',
      brief: `By default \`x-model\` listens to \`input\` (every keystroke). **\`.lazy\`** switches to \`change\` (on blur or Enter). **\`.fill\`** seeds the *input* from the data on init, which matters when the initial value was never typed. **\`.debounce\`** keeps the \`input\` event but waits for a pause — the right choice when each keystroke triggers work.`,
      example: {
        code: `<input x-model="q">                     <!-- live -->
<input x-model.lazy="q">                <!-- on change -->
<input x-model.debounce.500ms="q">      <!-- after 500 ms of quiet -->
<input x-model.fill="q">                <!-- input seeded from q on init -->`,
        note: '`.debounce` on x-model needs the debounce plugin-less syntax `.debounce.500ms`; bare `.debounce` waits 250 ms.'
      },
      starter: `<div x-data="{ q: 'mortality' }">
  <input data-testid="live" x-model="q">
  <input data-testid="lazy" x-model.lazy="q">
  <input data-testid="fill" x-model.fill="q" >
  <p>model: <b data-testid="model" x-text="q"></b></p>
</div>`,
      solution: `<div x-data="{ q: 'mortality' }">
  <input data-testid="live" x-model="q">
  <input data-testid="lazy" x-model.lazy="q">
  <input data-testid="fill" x-model.fill="q" placeholder="seeded from state">
  <p>model: <b data-testid="model" x-text="q"></b></p>
</div>`,
      hints: [
        '`.lazy` commits on `change`, so a typed value only reaches the model when the field loses focus or the user presses Enter.',
        '`.fill` makes the input show the initial model value on load.',
        'All three inputs share one variable, so any commit is visible in `data-testid="model"`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-model',
          text: 'On load all three inputs must be seeded from `q` (they read `mortality`), proving the binding pushes data *into* the DOM as well as out.',
          checks: [
            { kind: 'prop', selector: '[data-testid="live"]', prop: 'value', value: 'mortality' },
            { kind: 'prop', selector: '[data-testid="lazy"]', prop: 'value', value: 'mortality' },
            { kind: 'prop', selector: '[data-testid="fill"]', prop: 'value', value: 'mortality' }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: 'Change the value of the lazy input *without* committing it: the model must not move until that input fires `change`, while the live input writes on every `input` event.',
          checks: [
            { kind: 'text', selector: '[data-testid="model"]', value: 'mortality' },
            { kind: 'text', selector: '[data-testid="model"]', value: 'mortality', do: [{ set: '[data-testid="lazy"]', value: 'gradient table' }, { dispatch: '[data-testid="lazy"]', event: 'input' }] },
            { kind: 'prop', selector: '[data-testid="lazy"]', prop: 'value', value: 'gradient table' },
            { kind: 'text', selector: '[data-testid="model"]', value: 'gradient table', do: [{ dispatch: '[data-testid="lazy"]', event: 'change' }] },
            { kind: 'text', selector: '[data-testid="model"]', value: 'mortality gradient', do: [{ set: '[data-testid="live"]', value: 'mortality gradient' }, { dispatch: '[data-testid="live"]', event: 'input' }] }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'x-mask',
      objective: 'Constrain typed input to a date format.',
      brief: `The **mask** plugin formats as the user types, so the model never holds a half-typed mess. Tokens: \`9\` = digit, \`A\` = letter, \`*\` = alphanumeric; characters you write literally (like \`/\` or \`$\`) are inserted for you.\n\nMasks are a *presentation* guard, not validation: pair them with a real check when the value must be valid.`,
      example: {
        code: `<input x-mask="99/99/9999" placeholder="valuation date">
<input x-mask="$999,999,999" placeholder="sum assured">`,
        note: 'Type `04212026` into the first field and the raw value becomes `04/21/2026`.'
      },
      starter: `<div x-data="{ date: '' }">
  valuation date: <input data-testid="date" x-mask="99/99/9999" x-model="date">
  <p>model: <b data-testid="model" x-text="date === '' ? 'empty' : date"></b></p>
</div>`,
      solution: `<div x-data="{ date: '', sum: '' }">
  valuation date: <input data-testid="date" x-mask="99/99/9999" x-model="date" placeholder="mm/dd/yyyy">
  sum assured: <input data-testid="sum" x-mask="$999,999,999" x-model="sum" placeholder="$0">
  <p>model: <b data-testid="model" x-text="date === '' ? 'empty' : date"></b></p>
</div>`,
      hints: [
        'Type digits only — the slashes are inserted by the mask.',
        '`9` matches a single digit, so `99/99/9999` is exactly `mm/dd/yyyy`.',
        'The model holds the *masked* string, `04/21/2026`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-mask',
          text: `Typing \`${DATE_IN}\` into the date field must leave \`${DATE_OUT}\` in the input and in the model.`,
          checks: [
            { kind: 'text', selector: '[data-testid="model"]', value: 'empty' },
            { kind: 'prop', selector: '[data-testid="date"]', prop: 'value', value: DATE_OUT, do: [{ type: '[data-testid="date"]', value: DATE_IN }] },
            { kind: 'text', selector: '[data-testid="model"]', value: DATE_OUT }
          ]
        },
        {
          id: 't2',
          skill: 'x-mask',
          text: 'The sum-assured field must be masked too: typing a nine-digit sum must produce a dollar-formatted value grouping the thousands.',
          checks: [
            { kind: 'prop', selector: '[data-testid="sum"]', prop: 'value', value: '' },
            { kind: 'prop', selector: '[data-testid="sum"]', prop: 'value', value: '$175,000,000', do: [{ type: '[data-testid="sum"]', value: '175000000' }] }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — new-business illustration form',
      objective: 'Bind a full form, derive the premium, and validate before it is issued.',
      scenario: `The new-business desk quotes a ${15}-year endowment on (45): A = ${A_END.toFixed(6)}, ä = ${ADUE.toFixed(6)}. The form captures age, sum assured (masked currency), term (10/15/20) and smoker status. The quoted annual premium is \`sum × A ÷ ä\`, with the smoker differential × ${RATING}. Below 18 or above 70 the form must refuse to quote and say why.`,
      brief: `Required elements: \`data-testid="age"\` (number), \`data-testid="sum"\` (masked currency \`$999,999,999\`), \`data-testid="term"\` (select with 10/15/20), \`data-testid="smoker"\` (checkbox), \`data-testid="premium"\` (2 dp), and \`data-testid="verdict"\` reading \`quoted\` or the reason. Strip the mask before doing arithmetic.`,
      starter: `<div x-data="{ age: 45, sumRaw: '250000', term: '15', smoker: false }">
</div>`,
      solution: `<div x-data="{
  age: 45,
  sumMasked: '$250,000',
  term: '15',
  smoker: false,
  aEnd: ${A_END},
  adue: ${ADUE},
  get sum() { return Number(String(this.sumMasked).replace(/[^0-9.]/g, '')) || 0 },
  get problem() {
    if (this.age < 18) return 'too young'
    if (this.age > 70) return 'beyond issue age'
    return null
  },
  get premium() { return (this.sum * this.aEnd * (this.smoker ? ${RATING} : 1)) / this.adue }
}">
  age <input type="number" data-testid="age" x-model.number="age">
  sum <input data-testid="sum" x-mask="$999,999,999" x-model="sumMasked" placeholder="$0">
  term <select data-testid="term" x-model="term"><option>10</option><option>15</option><option>20</option></select>
  <label><input type="checkbox" data-testid="smoker" x-model.boolean="smoker"> smoker</label>

  <p>sum parsed: <b data-testid="sumParsed" x-text="sum"></b></p>
  <p>annual premium: <b data-testid="premium" x-text="problem ? '—' : premium.toFixed(2)"></b></p>
  <p>verdict: <b data-testid="verdict" x-text="problem ?? 'quoted'"></b></p>
</div>`,
      hints: [
        'Masked text is still text: `Number(String(v).replace(/[^0-9.]/g, \'\'))` gives you the number.',
        'A getter `problem` returning `null` or a reason string keeps the template clean.',
        `Default quote: ${premium(250000, false).toFixed(2)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-mask',
          text: `On the defaults the form must quote ${premium(250000, false).toFixed(2)} with verdict \`quoted\`, and the mask must be stripped to \`250000\` for arithmetic.`,
          checks: [
            { kind: 'text', selector: '[data-testid="verdict"]', value: 'quoted' },
            { kind: 'textNumber', selector: '[data-testid="sumParsed"]', value: 250000 },
            { kind: 'textNumber', selector: '[data-testid="premium"]', value: Number(premium(250000, false).toFixed(2)), tol: 0.05 }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: `Typing a sum of $600,000, a term of 20 and ticking smoker status must re-quote (the smoker differential applies): ${premium(600000, true).toFixed(2)}.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="premium"]', value: Number(premium(600000, true).toFixed(2)), tol: 0.2, do: [{ type: '[data-testid="sum"]', value: '600000' }, { el: '[data-testid="term"]', select: '20' }, { click: '[data-testid="smoker"]' }] },
            { kind: 'text', selector: '[data-testid="verdict"]', value: 'quoted' }
          ]
        },
        {
          id: 't3',
          skill: 'x-model',
          text: 'An age of 17 must be refused with verdict `too young` and no quoted premium; an age of 71 must say `beyond issue age`.',
          checks: [
            { kind: 'text', selector: '[data-testid="verdict"]', value: 'too young', do: [{ type: '[data-testid="age"]', value: '17' }] },
            { kind: 'text', selector: '[data-testid="premium"]', value: '—' },
            { kind: 'text', selector: '[data-testid="verdict"]', value: 'beyond issue age', do: [{ type: '[data-testid="age"]', value: '71' }] }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — portfolio recalc with a debounced factor',
      objective: 'Bind a global control and let four rows recompute through derived state.',
      scenario: `A portfolio of four policies is re-rated with a single "rating factor" input. Typing must not thrash the table: the recalculation should wait 300 ms after the last keystroke. A second control filters the list down to smokers only.`,
      brief: `Policies: ${PORTFOLIO.map(p => `${p.id} (age ${p.age}, ${p.sum.toLocaleString('en-US')}, ${p.smoker ? 'smoker' : 'non-smoker'})`).join(' · ')}. Each row's premium is \`sum × A ÷ ä × factor\` (smokers × ${RATING}), shown in \`data-testid="premium"\`, with rows marked \`data-testid="policy"\`. Factor input: \`data-testid="factor"\` with \`.debounce.300ms\`; filter checkbox: \`data-testid="onlySmokers"\`.`,
      starter: `<div x-data="{ factor: 1, onlySmokers: false, pol: ${sq(PORTFOLIO)} }">
</div>`,
      solution: `<div x-data="{
  factor: 1,
  onlySmokers: false,
  pol: ${sq(PORTFOLIO)},
  aEnd: ${A_END},
  adue: ${ADUE},
  get shown() { return this.onlySmokers ? this.pol.filter(p => p.smoker) : this.pol },
  rowPremium(p) { return (p.sum * this.aEnd * (p.smoker ? ${RATING} : 1) * this.factor) / this.adue }
}">
  factor <input type="range" data-testid="factor" min="0.8" max="1.5" step="0.05" x-model.number="factor" @input="factor = + $event.target.value">
  <span>factor: <b data-testid="factorOut" x-text="factor.toFixed(2)"></b></span>
  <label><input type="checkbox" data-testid="onlySmokers" x-model.boolean="onlySmokers"> smokers only</label>

  <ul>
    <template x-for="p in shown" :key="p.id">
      <li data-testid="policy">
        <b x-text="p.id"></b> — <span data-testid="premium" x-text="rowPremium(p).toFixed(2)"></span>
      </li>
    </template>
  </ul>
</div>`,
      hints: [
        'The factor input is a range control: use `@input` to read `$event.target.value` as a number.',
        'Filtering with a getter (`get shown()`) keeps the loop and the checkbox in sync automatically.',
        `At factor 1.00 the first policy quotes ${premium(250000, false).toFixed(2)}; the smoker one ${premium(400000, true).toFixed(2)}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-model',
          text: `At the default factor, four policies render with the first quoting ${premium(250000, false).toFixed(2)} and the second ${premium(400000, true).toFixed(2)}.`,
          checks: [
            { kind: 'count', selector: '[data-testid="policy"]', value: 4 },
            { kind: 'textNumber', selector: '[data-testid="premium"]', nth: 0, value: Number(premium(250000, false).toFixed(2)), tol: 0.05 },
            { kind: 'textNumber', selector: '[data-testid="premium"]', nth: 1, value: Number(premium(400000, true).toFixed(2)), tol: 0.1 }
          ]
        },
        {
          id: 't2',
          skill: 'x-model',
          text: `Moving the factor to 1.20 must re-rate the first row to ${premium(250000 * 1.2, false).toFixed(2)} and show the factor as \`1.20\`.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="premium"]', nth: 0, value: Number(premium(250000 * 1.2, false).toFixed(2)), tol: 0.3, do: [{ type: '[data-testid="factor"]', value: '1.2' }] },
            { kind: 'text', selector: '[data-testid="factorOut"]', value: '1.20' }
          ]
        },
        {
          id: 't3',
          skill: 'x-model',
          text: 'Ticking `smokers only` must leave exactly the two rated policies visible, and the remaining premiums must still reflect the factor already applied.',
          checks: [
            { kind: 'count', selector: '[data-testid="policy"]', value: 2, do: [{ set: '[data-testid="factor"]', value: '1' }, { dispatch: '[data-testid="factor"]', event: 'input' }, { click: '[data-testid="onlySmokers"]' }] },
            { kind: 'textNumber', selector: '[data-testid="premium"]', nth: 0, value: Number(premium(400000, true).toFixed(2)), tol: 0.6 }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-model',
      q: 'An input is bound with `x-model="age"` (no modifier) and the user types `45`. What does `age + 1` evaluate to?',
      options: ['46', '451', 'NaN', 'undefined'],
      answer: 1,
      why: 'Without `.number` the model holds the string `"45"`, and `+` concatenates. Use `x-model.number` for anything you will do arithmetic with.',
      distractors: { 2: '`"45" + 1` is `"451"`, not NaN: that is the quiet danger.' }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'x-model',
      q: 'A text field is bound with `x-model.fill="q"` where `q` starts as the string `mortality`. What does the user see before typing?',
      options: [
        'An empty field, because the DOM boots empty',
        'The field shows `mortality`',
        '`undefined`',
        'The field is disabled until it is touched'
      ],
      answer: 1,
      why: '`.fill` exists exactly for this: it seeds the input from the model on init, so a value that was never typed still shows up.',
      distractors: {
        0: 'Without `.fill` that can happen with some plugins and rich inputs — which is why the modifier exists.',
        3: 'Nothing is disabled: this is purely about the initial value.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'x-model',
      q: 'What does `.lazy` change about `x-model`?',
      options: [
        'It delays the write by 250 ms',
        'It listens for `change` instead of `input`',
        'It only writes when the form is submitted',
        'It makes the value read-only'
      ],
      answer: 1,
      why: '`.lazy` swaps the event: the model updates on blur/Enter rather than on every keystroke.',
      distractors: {
        0: 'That is `.debounce`.',
        2: 'There is no submit gating; `change` fires on commit of the field.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-mask',
      q: 'An input has `x-mask="99/99/9999"`. The user types `04212026`. What is in the input?',
      options: ['04212026', '04/21/2026', '99/99/9999', '04-21-2026'],
      answer: 1,
      why: 'The mask inserts the literal slashes as the digits come in, so the field (and the model) hold `04/21/2026`.',
      distractors: {
        0: 'The mask is the point: unformatted digits never appear.',
        2: '`9` is a placeholder token, not a literal.'
      }
    },
    {
      id: 'q5',
      type: 'multi',
      skill: 'x-model',
      q: 'Which statements about `x-model` are true?',
      options: [
        'It works on `<textarea>` and `<select>` as well as `<input>`',
        'It writes the initial state into the element on init',
        'It replaces the need for `x-on:input` in most cases',
        'It stores values in `localStorage` automatically'
      ],
      answers: [0, 1, 2],
      why: '`x-model` is two-way by definition: state → element on init, element → state on interaction. Persistence is the `persist` plugin\'s job.',
      distractors: { 3: 'Nothing persists by default: that is `$persist` or the persist plugin.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'x-model',
      q: 'Which modifier makes a checkbox write a real boolean instead of a string? Answer with the modifier including its dot.',
      accept: ['.boolean'],
      why: '`x-model.boolean` — useful whenever the state is conceptually `true`/`false` and you will branch on it.'
    }
  ]
}
