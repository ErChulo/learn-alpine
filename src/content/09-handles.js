/* Module 9 — element handles: x-ref/$refs, $el, $root, $data, $id/x-id.
 * Matches: /directives/ref, /magics/el, /magics/root, /magics/data, /magics/id, /directives/id */

import { life, rnd, sq } from './data.js'

const QUOTE = { ref: 'QT-77120', age: 45, sum: 250000, table: 'A' }
const ROWS = [
  { id: 'CL-901', insured: 'Vantor Marine', incurred: 1180, stage: 'reported' },
  { id: 'CL-902', insured: 'Deccan Textiles', incurred: 640, stage: 'reserved' },
  { id: 'CL-903', insured: 'Nordkapp Energy', incurred: 2450, stage: 'paid' }
]
const GRACE = Number(life.qx(45).toFixed(6))

export default {
  id: 'm09',
  num: 9,
  title: 'Element handles',
  blurb: 'x-ref and the magics that point at things: $refs, $el, $root, $data, $id.',
  goal: 'Reach any node or scope you need — the current element, the component root, a named node, or a unique id.',
  intro: `Alpine gives you five handles into the DOM and its scopes:\n\n**\`x-ref\` / \`$refs\`** name a node so you can drive it directly (focus, measure, read). **\`$el\`** is the element the expression is running on. **\`$root\`** is the nearest component root — the element carrying \`x-data\`, so you use it for \`$root.dataset.…\` and friends. **\`$data\`** is the scope your expression runs in, inherited scopes included. **\`$id\` / \`x-id\`** generate ids that are unique per component, which is how you wire labels, tooltips and \`aria-*\` attributes without hand-rolling ids.`,
  skills: ['x-ref', '$refs', '$el', '$root', '$data', '$id', 'x-id'],
  docRefs: [
    { label: 'x-ref', url: 'https://alpinejs.dev/directives/ref' },
    { label: '$el', url: 'https://alpinejs.dev/magics/el' },
    { label: '$root / $data', url: 'https://alpinejs.dev/magics/root' },
    { label: '$id / x-id', url: 'https://alpinejs.dev/magics/id' }
  ],
  mastery: [
    'Point at a node with `x-ref` and use it (focus, read, measure)',
    'Act on the element an expression runs on with `$el`',
    'Read and reset component state from a deep child through `$root` / `$data`',
    'Wire labels, errors and tooltips with `$id` + `x-id` instead of hand-written ids'
  ],
  units: [
    {
      id: 's1',
      title: 'x-ref and $refs',
      objective: 'Name nodes, then drive them from anywhere inside the component.',
      brief: `\`x-ref="field"\` stores the node on the component as \`$refs.field\`. It is the escape hatch for things only the DOM knows: focus, selection ranges, scroll position, measured size, video playback.\n\nIf several elements share one ref name — a ref inside \`x-for\` is the common case — \`$refs.field\` becomes an **array**, in document order.`,
      example: {
        code: `<input x-ref="amount">
<button @click="$refs.amount.focus()">jump to amount</button>`,
        note: 'Refs are not reactive; they are direct node handles. Do not bind a ref to a variable.'
      },
      starter: `<div x-data="{ sum: 250000 }">
  <input data-testid="sum" x-ref="sum" type="number" x-model.number="sum">
  <button data-testid="focus">focus the sum</button>
  <button data-testid="double">double it</button>
  <p>sum: <b data-testid="out" x-text="sum"></b></p>
</div>`,
      solution: `<div x-data="{ sum: 250000, lastAction: '' }">
  <input data-testid="sum" x-ref="sum" type="number" x-model.number="sum">
  <button data-testid="focus" @click="$refs.sum.focus(), lastAction = 'focused'">focus the sum</button>
  <button data-testid="double" @click="$refs.sum.value = $refs.sum.value * 2, sum = sum * 2, lastAction = 'doubled'">double it</button>
  <p>sum: <b data-testid="out" x-text="sum"></b> · last: <span data-testid="last" x-text="lastAction"></span></p>
</div>`,
      hints: [
        '`$refs.sum` is the `<input>` element itself — so `$refs.sum.focus()` works.',
        'Writing to `$refs.sum.value` bypasses `x-model`; the model is only updated when an event fires. Prefer updating the state (`sum`) and letting the binding write the input.',
        'The two-button pattern shows the difference between driving the node and driving the state.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$refs',
          text: 'Clicking `focus` must put focus in the sum input and set `last` to `focused`.',
          checks: [
            { kind: 'focused', selector: '[data-testid="sum"]', do: [{ click: '[data-testid="focus"]' }] },
            { kind: 'text', selector: '[data-testid="last"]', value: 'focused' }
          ]
        },
        {
          id: 't2',
          skill: '$refs',
          text: 'Clicking `double` must double both the model and the input: the visible sum reads 500000 and `last` reads `doubled`.',
          checks: [
            { kind: 'text', selector: '[data-testid="out"]', value: '500000', do: [{ click: '[data-testid="double"]' }] },
            { kind: 'prop', selector: '[data-testid="sum"]', prop: 'value', value: '500000' },
            { kind: 'text', selector: '[data-testid="last"]', value: 'doubled' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: '$el: the element in hand',
      objective: 'Act on the node an expression runs on — classes, data attributes, removal.',
      brief: `Inside any expression, \`$el\` is the element carrying that directive (for a handler, the element that listens; for \`x-show\`, the element being toggled). It is how a single markup line can style *itself* without inventing state.\n\nUse it sparingly: state-driven classes are easier to test and reason about than direct DOM writes. Where \`$el\` genuinely wins is reading what only the node knows — \`$el.dataset.*\`, \`$el.value\`, \`$el.checked\`.`,
      example: {
        code: `<button @click="$el.classList.toggle('done')">mark done</button>
<span @click="stage = $el.dataset.stage" :data-stage="nextStage">…</span>`,
        note: '`$el.dataset.stage` reads the `data-stage` attribute — handy for markup-driven behaviour.'
      },
      starter: `<div x-data="{ pinged: 0 }">
  <button data-testid="ping" @click="pinged++, $el.classList.add('pin')">ping</button>
  <button data-testid="reset" @click="pinged = 0">reset</button>
  <p>pings: <b data-testid="count" x-text="pinged"></b></p>
</div>`,
      solution: `<div x-data="{ pinged: 0, stage: 'none' }">
  <button data-testid="ping" @click="pinged++, $el.classList.add('pin')">ping</button>
  <button data-testid="advance" data-stage="reserved" @click="stage = $el.dataset.stage, $el.classList.add('moved')">advance</button>
  <button data-testid="reset" @click="pinged = 0, stage = 'none'">reset</button>
  <p>pings: <b data-testid="count" x-text="pinged"></b> · stage: <span data-testid="stage" x-text="stage"></span></p>
</div>`,
      hints: [
        '`$el.classList.add(\'pin\')` styles the clicked button, not any other element.',
        '`$el.dataset.stage` reads `data-stage` off the button that was clicked.',
        'State still drives the text: `stage` is what `data-testid="stage"` renders.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$el',
          text: 'Clicking `ping` must add the class `pin` to the button itself and move the counter to 1; clicking `reset` must set the counter back to 0.',
          checks: [
            { kind: 'klass', selector: '[data-testid="ping"]', value: 'pin', do: [{ click: '[data-testid="ping"]' }] },
            { kind: 'text', selector: '[data-testid="count"]', value: '1' },
            { kind: 'text', selector: '[data-testid="count"]', value: '0', do: [{ click: '[data-testid="reset"]' }] }
          ]
        },
        {
          id: 't2',
          skill: '$el',
          text: 'Clicking `advance` must read its own `data-stage` attribute: `stage` becomes `reserved` and the button gains the class `moved`.',
          checks: [
            { kind: 'text', selector: '[data-testid="stage"]', value: 'reserved', do: [{ click: '[data-testid="advance"]' }] },
            { kind: 'klass', selector: '[data-testid="advance"]', value: 'moved' },
            { kind: 'attr', selector: '[data-testid="advance"]', name: 'data-stage', value: 'reserved' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: '$root and $data',
      objective: 'Reach the root *element* with $root, and every inherited scope with $data.',
      brief: `Two different things, easily confused:\n\n**\`$root\`** is the closest ancestor **element** that carries \`x-data\` — a DOM node, so you use it for \`$root.dataset.…\`, \`$root.querySelector(…)\`, \`$root.dispatchEvent(…)\`. It is *not* a data object: \`$root.query\` is undefined.\n\n**\`$data\`** is the data scope of the expression you are in — an object, and it includes the scopes it *inherits* from parent components. So from inside a nested component, \`$data.outerKey\` still reads (and writes) the outer component's state.`,
      example: {
        code: `<div x-data="{ rows: [], query: '' }" data-table="UL-4417">
  <div x-data="{ panel: 'inner' }" data-panel="P-1">
    <button @click="$root.dataset.panel">…</button>
    <button @click="$data.query = ''">clear the outer filter</button>
    <span x-text="$root.dataset.panel"></span>
  </div>
</div>`,
        note: 'Inside the panel `$root` is the *panel* element (`data-panel`), while `$data.query` still reaches the outer component.'
      },
      starter: `<div x-data="{ query: 'mortality', rows: 3, resets: 0 }" data-table="UL-4417">
  <div data-testid="toolbar">
    <button data-testid="readTable">read the table name off the root element</button>
  </div>
</div>`,
      solution: `<div x-data="{ query: 'mortality', rows: 3, resets: 0, tableName: '', clear() { this.query = ''; this.rows = 0; this.resets++ } }" data-table="UL-4417">
  <div data-testid="toolbar">
    <button data-testid="readTable" @click="tableName = $root.dataset.table">read the table name off the root element</button>
    <span data-testid="tableName" x-text="tableName"></span>
  </div>
  <div data-testid="panel" x-data="{ origin: '', panel: 'inner panel' }" data-panel="P-1">
    <button data-testid="innerRoot" @click="origin = $root.dataset.panel">which element is $root here?</button>
    <span data-testid="origin" x-text="origin"></span>
    <button data-testid="resetOuter" @click="$data.clear()">reset the whole table from the panel</button>
  </div>
  <p>query: <b data-testid="query" x-text="query"></b> · rows: <b data-testid="rows" x-text="rows"></b> · resets: <b data-testid="resets" x-text="resets"></b></p>
</div>`,
      hints: [
        '`$root` is an element: read `$root.dataset.table`, not `$root.table`.',
        'Inside the panel, the closest element with `x-data` is the *panel* — so `$root.dataset.panel` is `P-1`, not the table.',
        '`$data` carries inherited scope: `$data.clear()` runs the *outer* component\'s method, and `$data.query` reads the outer filter.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$root',
          text: '`readTable` must read the root element\'s own data attribute: `tableName` becomes `UL-4417` (the outer `query`/`rows` are untouched).',
          checks: [
            { kind: 'text', selector: '[data-testid="tableName"]', value: 'UL-4417', do: [{ click: '[data-testid="readTable"]' }] },
            { kind: 'text', selector: '[data-testid="query"]', value: 'mortality' },
            { kind: 'text', selector: '[data-testid="rows"]', value: '3' }
          ]
        },
        {
          id: 't2',
          skill: '$root / $data',
          text: 'Inside the panel `$root` is the panel itself (`origin` reads `P-1`), and `$data.clear()` reaches the inherited outer scope: query empty, rows 0, resets 1.',
          checks: [
            { kind: 'text', selector: '[data-testid="origin"]', value: 'P-1', do: [{ click: '[data-testid="innerRoot"]' }] },
            { kind: 'text', selector: '[data-testid="query"]', value: '', do: [{ click: '[data-testid="resetOuter"]' }] },
            { kind: 'text', selector: '[data-testid="rows"]', value: '0' },
            { kind: 'text', selector: '[data-testid="resets"]', value: '1' }
          ]
        }
      ]
    },
    {
      id: 's4',
      title: '$id and x-id: unique wiring, no hand-written ids',
      objective: 'Generate matching ids for label/tooltip/error relationships.',
      brief: `\`x-id="['input']"\` declares a component-local id namespace; then \`$id('input')\` returns a *unique* id derived from it, the same value each time it is called in that component. Nested \`x-id\` groups get suffixes.\n\nIds are exactly the kind of thing that breaks when a component is used twice on a page; letting Alpine mint them is how you avoid \`id="name-1"\` colliding with \`id="name-1"\` in the sibling panel.`,
      example: {
        code: `<div x-id="['field']">
  <label :for="$id('field')">Sum assured</label>
  <input :id="$id('field')" :aria-describedby="$id('hint')">
  <p :id="$id('hint')">In whole dollars.</p>
</div>`,
        note: 'Every `$id(\'field\')` call in that component returns the same generated id, so the label and input match.'
      },
      starter: `<div x-data="{ sum: 250000 }" x-id="['sum', 'hint']">
  <label data-testid="label">sum assured</label>
  <input data-testid="input" type="number" x-model.number="sum">
</div>`,
      solution: `<div x-data="{ sum: 250000 }" x-id="['sum', 'hint']">
  <label data-testid="label" :for="$id('sum')">sum assured</label>
  <input data-testid="input" type="number" x-model.number="sum" :id="$id('sum')" :aria-describedby="$id('hint')">
  <p data-testid="hint" :id="$id('hint')" class="muted">In whole dollars.</p>
  <p class="muted">generated ids: <span data-testid="ids" x-text="$id('sum') + ' / ' + $id('hint')"></span></p>
</div>
<div x-data x-id="['sum', 'hint']">
  <label :for="$id('sum')">smoker loading</label>
  <input :id="$id('sum')"><span data-testid="other" x-text="$id('sum')"></span>
</div>`,
      hints: [
        'Both the `for` and the `id` must call `$id(\'sum\')` — same expression, same value.',
        'Declare every name you plan to reference in `x-id="[…]"`: an *undeclared* name gets a fresh value on every call, so `aria-describedby` would never match.',
        'The second component (declared after) gets *different* ids even though it uses the same namespace name.',
        'Wire the hint with `aria-describedby` to see that `$id` works for more than labels.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$id',
          text: 'The label\'s `for` must equal the input\'s `id`, and the input\'s `aria-describedby` must equal the hint\'s `id`.',
          checks: [
            { kind: 'custom', name: 'attrMatch', selector: '[data-testid="label"]', attr: 'for', selector2: '[data-testid="input"]', attr2: 'id' },
            { kind: 'custom', name: 'attrMatch', selector: '[data-testid="input"]', attr: 'aria-describedby', selector2: '[data-testid="hint"]', attr2: 'id' }
          ]
        },
        {
          id: 't2',
          skill: 'x-id',
          text: 'A second component using the same namespace must get *different* ids — `data-testid="ids"` and `data-testid="other"` must not start with the same generated value.',
          checks: [
            { kind: 'textHas', selector: '[data-testid="ids"]', value: 'sum' },
            { kind: 'custom', name: 'differentText', selector: '[data-testid="ids"]', selector2: '[data-testid="other"]' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — an accessible quote form with focus management',
      objective: 'Combine refs, generated ids and a root-level reset in one form.',
      scenario: `New business edits a quote ref \`${QUOTE.ref}\`: age ${QUOTE.age}, sum ${QUOTE.sum.toLocaleString('en-US')}, table ${QUOTE.table}. The form must be usable from the keyboard: a "jump to sum" control focuses the sum field, each field's error text is wired with \`aria-describedby\`, and a "clear quote" control at row level resets the whole form through the root scope.`,
      brief: `Required: \`data-testid="ref"\` (text), \`data-testid="age"\` (number), \`data-testid="sum"\` (number, also \`x-ref\`), \`data-testid="jump"\` (focuses the sum field), \`data-testid="error"\` (id wired to the sum field's \`aria-describedby\`), \`data-testid="clear"\` (nested inside a child component, reaches the root and empties ref, age and sum).`,
      starter: `<div x-data="{ ref: '${QUOTE.ref}', age: ${QUOTE.age}, sum: ${QUOTE.sum} }">
</div>`,
      solution: `<div x-data="{ ref: '${QUOTE.ref}', age: ${QUOTE.age}, sum: ${QUOTE.sum}, touches: 0, note: 'loaded' }" x-id="['quote-ref', 'quote-age', 'quote-sum', 'quote-err']">
  <p>
    <label :for="$id('quote-ref')">quote ref</label>
    <input data-testid="ref" :id="$id('quote-ref')" x-model="ref">
    <label :for="$id('quote-age')">age</label>
    <input data-testid="age" :id="$id('quote-age')" type="number" x-model.number="age">
    <label :for="$id('quote-sum')">sum assured</label>
    <input data-testid="sum" :id="$id('quote-sum')" x-ref="sum" type="number" x-model.number="sum" :aria-describedby="$id('quote-err')">
    <button data-testid="jump" @click="$refs.sum.focus(), touches++">jump to sum</button>
  </p>
  <p data-testid="error" :id="$id('quote-err')" class="muted">Sum must stay above 10,000.</p>
  <div data-testid="row">
    <button data-testid="clear" @click="$data.ref = ''; $data.age = 0; $data.sum = 0; $data.note = 'cleared from the row'">clear quote</button>
    <span data-testid="note" x-text="note"></span>
  </div>
</div>`,
      hints: [
        'The `jump` button needs only `$refs.sum.focus()`.',
        'The error paragraph needs an `:id` and the sum input needs `:aria-describedby` pointing at the same `$id(...)`.',
        '`clear` lives in a nested `x-data`; it must write through `$root` to reach ref/age/sum.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$refs',
          text: '`jump` must focus the sum field, and the age field must accept a typed value (110) into the model.',
          checks: [
            { kind: 'focused', selector: '[data-testid="sum"]', do: [{ click: '[data-testid="jump"]' }] },
            { kind: 'prop', selector: '[data-testid="age"]', prop: 'value', value: '110', do: [{ type: '[data-testid="age"]', value: '110' }] }
          ]
        },
        {
          id: 't2',
          skill: '$id',
          text: 'The age and sum labels must point at their inputs (`for` = `id`) and the sum field must reference the error paragraph via `aria-describedby`.',
          checks: [
            { kind: 'custom', name: 'attrMatch', selector: 'label', nth: 1, attr: 'for', selector2: '[data-testid="age"]', attr2: 'id' },
            { kind: 'custom', name: 'attrMatch', selector: 'label', nth: 2, attr: 'for', selector2: '[data-testid="sum"]', attr2: 'id' },
            { kind: 'custom', name: 'attrMatch', selector: '[data-testid="sum"]', attr: 'aria-describedby', selector2: '[data-testid="error"]', attr2: 'id' }
          ]
        },
        {
          id: 't3',
          skill: '$root',
          text: '`clear` must wipe the root state: ref empty, age 0, sum 0 — and the row note reads `cleared from the row`.',
          checks: [
            { kind: 'prop', selector: '[data-testid="ref"]', prop: 'value', value: '', do: [{ click: '[data-testid="clear"]' }] },
            { kind: 'prop', selector: '[data-testid="age"]', prop: 'value', value: '0' },
            { kind: 'prop', selector: '[data-testid="sum"]', prop: 'value', value: '0' },
            { kind: 'text', selector: '[data-testid="note"]', value: 'cleared from the row' }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — claim rows that manage themselves',
      objective: 'Use $el and the event target so each row acts on its own nodes.',
      scenario: `A claims triage list renders ${ROWS.length} claims. Flagging a claim must restyle *that row* and put the cursor straight into that row's note field, without touching any other row.`,
      brief: `Claims: ${ROWS.map(r => `${r.id} ${r.insured} (${r.incurred}k, ${r.stage})`).join(' · ')}.
      Each row is \`data-testid="row"\` with \`data-claim="<id>"\`, carries its own note input (\`data-testid="note"\`) and its own flag button (\`data-testid="flag"\`). Flagging adds the class \`flagged\` to that row, records the claim id, and focuses that row's note. \`data-testid="flaggedCount"\` and \`data-testid="flagList"\` report progress.`,
      starter: `<div x-data="{ rows: ${sq(ROWS)}, flagged: [] }">
</div>`,
      solution: `<div x-data="{
  rows: ${sq(ROWS)},
  flagged: [],
  flag(event, row) {
    const li = event.currentTarget.closest('[data-testid=row]')
    li.classList.add('flagged')
    if (! this.flagged.includes(row.id)) this.flagged.push(row.id)
    this.$nextTick(() => { const el = li.querySelector('[data-testid=note]'); if (el) el.focus() })
  }
}">
  <p>flagged: <b data-testid="flaggedCount" x-text="flagged.length"></b> <span data-testid="flagList" x-text="flagged.join(',')"></span></p>
  <ul>
    <template x-for="r in rows" :key="r.id">
      <li data-testid="row" :data-claim="r.id">
        <b x-text="r.id"></b> <span x-text="r.insured"></span>
        <button data-testid="flag" @click="flag($event, r)">flag</button>
        <input data-testid="note" placeholder="flag note">
      </li>
    </template>
  </ul>
</div>`,
      hints: [
        '`@click="flag($event, r)"` hands you both the event and the row it belongs to.',
        'From the event you can climb to the row: `event.currentTarget.closest(\'[data-testid=row]\')`, then `li.querySelector(\'input\')` is *that* row\'s note.',
        'Keep the per-row bookkeeping in one array of claim ids so the summary line stays honest.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$el',
          text: 'Flagging the first row must add `flagged` to that row only, set the flagged count to 1 and list `CL-901`.',
          checks: [
            { kind: 'klass', selector: '[data-testid="row"]', nth: 0, value: 'flagged', do: [{ click: '[data-testid="flag"]', nth: 0 }] },
            { kind: 'noKlass', selector: '[data-testid="row"]', nth: 1, value: 'flagged' },
            { kind: 'text', selector: '[data-testid="flaggedCount"]', value: '1' },
            { kind: 'text', selector: '[data-testid="flagList"]', value: 'CL-901' }
          ]
        },
        {
          id: 't2',
          skill: '$el',
          text: 'Flagging the second row must put the cursor in *its* note field (a ref-free DOM climb) and the list must read `CL-901,CL-902`.',
          checks: [
            { kind: 'focused', selector: '[data-testid="note"]', nth: 1, do: [{ click: '[data-testid="flag"]', nth: 1 }] },
            { kind: 'attr', selector: '[data-testid="row"]', nth: 1, name: 'data-claim', value: 'CL-902' },
            { kind: 'text', selector: '[data-testid="flagList"]', value: 'CL-901,CL-902' }
          ]
        },
        {
          id: 't3',
          skill: '$el',
          text: 'Rows that were never flagged keep a clean slate: no `flagged` class on the third row, and the list still holds exactly the two flagged claims.',
          checks: [
            { kind: 'noKlass', selector: '[data-testid="row"]', nth: 2, value: 'flagged' },
            { kind: 'count', selector: '[data-testid="row"]', value: 3 },
            { kind: 'text', selector: '[data-testid="flagList"]', value: 'CL-901,CL-902' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: '$refs',
      q: 'Three inputs inside one `x-for` all carry `x-ref="cell"`. What is `$refs.cell`?',
      options: ['The last input', 'The first input', 'An array of the matched elements', '`undefined` — refs must be unique'],
      answer: 2,
      why: 'Duplicate ref names collect into a document-order array, which is exactly what you want inside a loop.',
      distractors: {
        3: 'Alpine is happy with duplicates — it hands you all of them.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: '$root',
      q: 'Inside a nested child component, which expression resets the *outer* component\'s `query`?',
      options: ['`query = \'\'`', '`$root.query = \'\'`', '`$el.query = \'\'`', '`$refs.query = \'\'`'],
      answer: 1,
      why: '`$root` is the nearest `x-data` ancestor, so writing through it reaches the outer state. A bare `query = \'\'` writes on the inner scope.',
      distractors: {
        0: 'That is the classic surprise: it silently shadows the outer name.',
        2: '`$el` is a DOM node, not a scope.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: '$el',
      q: 'What does `$el` refer to inside `@click="$el.classList.add(\'done\')"`?',
      options: [
        'The component root',
        'The element the directive is attached to (the clicked button)',
        'The event target\'s parent',
        'The document body'
      ],
      answer: 1,
      why: '`$el` is the element carrying that expression — the button in this case. Use `$event.currentTarget` when you want the listening element rather than the target.',
      distractors: { 0: 'That is `$root`.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: '$id',
      q: 'Why prefer `$id(\'field\')` over a hand-written `id="field"`?',
      options: [
        'It is shorter to type',
        'It stays unique when the same component appears several times on the page',
        'It registers the element with `Alpine.data`',
        'It is required for `x-ref` to work'
      ],
      answer: 1,
      why: 'Unique ids are the whole point: two quotes on one page would otherwise ship duplicate `id` values and break label/aria wiring.',
      distractors: { 3: 'Refs are unrelated — they use a namespace of their own.' }
    },
    {
      id: 'q5',
      type: 'multi',
      skill: '$refs',
      q: 'Which jobs are a good fit for `$refs`?',
      options: [
        'Focusing an input after a keyboard shortcut',
        'Reading `scrollTop` of a scroll container',
        'Storing the quote premium so the template can display it',
        'Calling `.play()` on a video element'
      ],
      answers: [0, 1, 3],
      why: 'Refs are node handles: focus, measurement, media control. Display state belongs in reactive data so the template stays declarative and testable.',
      distractors: { 2: 'Data shown in the template belongs in the data object, not on a node.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: '$data',
      q: 'Which magic gives you the *data object* of the nearest component root (not the element)? Answer with the `$` name.',
      accept: ['$data'],
      why: '`$data` — handy for spreading a component\'s scope into a function or logging it during development.'
    }
  ]
}
