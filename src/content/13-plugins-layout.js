/* Module 13 — plugins II: resize and sort.
 * Matches: /plugins/resize, /plugins/sort */

import { triangle, chainLadder, life, sq } from './data.js'

const cl = chainLadder(triangle)
const ROWS = triangle.years
  .map((y, i) => ({ year: y, ibnr: Number(cl.ibnr[i].toFixed(1)) }))
  .filter(r => r.ibnr > 0)
const TOTAL = Number(ROWS.reduce((n, r) => n + r.ibnr, 0).toFixed(1))
const TOP3_PCT = Number((100 * ROWS.slice(0, 3).reduce((n, r) => n + r.ibnr, 0) / TOTAL).toFixed(1))
const PRIORITISED = [ROWS[ROWS.length - 1], ...ROWS.slice(0, ROWS.length - 1)]
const TOP3_AFTER_PCT = Number((100 * PRIORITISED.slice(0, 3).reduce((n, r) => n + r.ibnr, 0) / TOTAL).toFixed(1))
const RATES = [0.03, 0.045, 0.055]
const ADUE = RATES.map(r => Number(life.aDueTemp(45, 15, r).toFixed(4)))
const FACTORS = cl.factors.map((value, i) => ({ age: 15 + i * 5, value: Number(value.toFixed(4)) }))
const AGES = FACTORS.map(f => String(f.age))
const LAST_AGE = FACTORS[FACTORS.length - 1].age

export default {
  id: 'm13',
  num: 13,
  title: 'Plugins II — layout and sizing',
  blurb: 'resize reacts to how big things are; sort lets people reorder them by dragging.',
  goal: 'Build interfaces that adapt to their own size, and lists whose order is data you own.',
  intro: `Two plugins about things that change shape.\n\n**resize** wraps the browser's \`ResizeObserver\`: put \`x-resize\` on an element and its expression runs whenever that element is resized, with \`$width\` and \`$height\` in hand. \`.document\` watches the whole document instead, \`.viewport\` watches the visual viewport (the part not hidden by mobile browser chrome).\n\n**sort** wraps SortableJS: \`x-sort\` on a container plus \`x-sort:item="key"\` on its children makes them draggable, and the handler you pass receives the item's key and its new position, so the new order can be written back into your data.`,
  skills: ['x-resize', '$width / $height', 'x-sort', 'x-sort:item', 'x-sort:handle', '.ghost'],
  docRefs: [
    { label: 'resize', url: 'https://alpinejs.dev/plugins/resize' },
    { label: 'sort', url: 'https://alpinejs.dev/plugins/sort' },
    { label: 'ResizeObserver (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API' }
  ],
  mastery: [
    'React to an element\'s own size with `x-resize` and `$width` / `$height`',
    'Use `.document` and `.viewport` when the page, not the element, is what changes',
    'Make a list sortable with `x-sort` + `x-sort:item`, handles, ghosts and groups',
    'Write the sort handler so the new order lands back in your data'
  ],
  units: [
    {
      id: 's1',
      title: 'x-resize: reacting to your own size',
      objective: 'Read $width and $height whenever an element changes size.',
      brief: `\`x-resize="…"\` runs its expression **once on setup** and again after every resize, with \`$width\` and \`$height\` available inside. Nothing polls; the browser's \`ResizeObserver\` tells Alpine when layout actually changed.\n\nThat makes it the right tool for "this panel is too narrow for a table" decisions, for sticky headers that need their real height, and for charts that must redraw at their true size.`,
      example: {
        code: `<div x-data="{ w: 0 }" x-resize="w = Math.round($width)">
  <p x-text="w + 'px wide'"></p>
</div>`,
        note: 'The first run happens as soon as the element has been laid out, so `w` is never stuck at 0.'
      },
      starter: `<div x-data="{ w: 0 }">
  <div data-testid="frame" style="width:300px">
    <div data-testid="box">
      <p>observed: <b data-testid="w" x-text="w"></b> px</p>
    </div>
  </div>
</div>`,
      solution: `<div x-data="{ w: 0, h: 0, hits: 0, setWidth(px) { this.$refs.frame.style.width = px + 'px' } }">
  <div data-testid="frame" x-ref="frame" style="width:300px">
    <div data-testid="box" x-resize="w = Math.round($width), h = Math.round($height), hits++">
      <p>observed: <b data-testid="w" x-text="w"></b> × <b data-testid="h" x-text="h"></b> px after <b data-testid="hits" x-text="hits"></b> reading(s)</p>
    </div>
  </div>
  <div class="row">
    <button data-testid="narrow" @click="setWidth(240)">narrow to 240px</button>
    <button data-testid="wide" @click="setWidth(520)">widen to 520px</button>
  </div>
</div>`,
      hints: [
        'The expression runs with `$width` / `$height` already in scope — nothing is passed in.',
        '`Math.round($width)` keeps the display stable: the observer reports fractional pixels.',
        'Resizing the *frame* is enough — the inner div inherits the new width and the observer fires.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-resize',
          text: 'On load the observed width must already be the frame\'s 300px (the first reading happens without anyone resizing anything), and the counter must show at least one reading.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="w"]', value: 300, tol: 2 },
            { kind: 'textMatch', selector: '[data-testid="hits"]', pattern: '^[1-9]\\d*$' }
          ]
        },
        {
          id: 't2',
          skill: 'x-resize',
          text: '`narrow` must shrink the frame to 240px and the observer must follow; `wide` must take it to 520px.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="w"]', value: 240, tol: 2, do: [{ click: '[data-testid="narrow"]' }, { wait: 250 }] },
            { kind: 'textNumber', selector: '[data-testid="w"]', value: 520, tol: 2, do: [{ click: '[data-testid="wide"]' }, { wait: 250 }] }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Resize-driven layout, and watching the document',
      objective: 'Switch layout on measured width instead of a window media query.',
      brief: `A CSS media query asks *how wide is the window*. \`x-resize\` asks *how wide is this element* — the honest question when the element lives in a resizable panel, a sidebar or a split view.\n\nUse \`x-resize.document\` when the whole page is what changes (sticky bars, "is there room for the full table"), and \`x-resize.viewport\` on mobile when browser chrome scrolls away.`,
      example: {
        code: `<div x-data="{ w: 0, get big() { return this.w >= 480 } }" x-resize="w = Math.round($width)">
  <p x-show="big">Full table fits here.</p>
  <p x-show="!big">Compact summary only.</p>
</div>`,
        note: 'The same component behaves correctly in a narrow column and in a wide one.'
      },
      starter: `<div x-data="{ w: 0, rows: [] }">
  <div data-testid="panel" style="width:300px">
    <p>panel: <b data-testid="panelW" x-text="w"></b> px · mode <b data-testid="mode" x-text="'compact'"></b></p>
  </div>
</div>`,
      solution: `<div x-data="{
  w: 0, docW: 0,
  rows: ${sq(ROWS)},
  get mode() { return this.w >= 480 ? 'full' : 'compact' },
  get total() { return this.rows.reduce((n, r) => n + r.ibnr, 0).toFixed(1) },
  setWidth(px) { this.$refs.panel.style.width = px + 'px' }
}"
     x-resize.document="docW = Math.round($width)">
  <div data-testid="panel" x-ref="panel" style="width:300px" x-resize="w = Math.round($width)">
    <p>panel: <b data-testid="panelW" x-text="w"></b> px · mode <b data-testid="mode" x-text="mode"></b> · document <b data-testid="docW" x-text="docW"></b> px</p>
  </div>
  <button data-testid="widen" @click="setWidth(520)">widen the panel</button>
  <button data-testid="narrow" @click="setWidth(300)">narrow the panel</button>
  <table data-testid="full" x-show="mode === 'full'">
    <thead><tr><th>accident year</th><th>IBNR</th></tr></thead>
    <tbody>
      <template x-for="r in rows" :key="r.year">
        <tr data-testid="row"><td data-testid="year" x-text="r.year"></td><td x-text="r.ibnr.toFixed(1)"></td></tr>
      </template>
    </tbody>
  </table>
  <p data-testid="compact" x-show="mode === 'compact'">Compact view — IBNR <span x-text="total"></span> across <span x-text="rows.length"></span> accident years.</p>
</div>`,
      hints: [
        'Put `x-resize` on the panel itself, and make `mode` a getter over `w`.',
        '`x-resize.document` belongs on the component root and reads the document width.',
        'Bind both variants with `x-show` and let the measured width choose the winner — the checks ask which one is really visible.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-resize',
          text: `At 300px the panel must be in compact mode: the summary line visible, the table out of the picture — and the document readout must hold a real number.`,
          checks: [
            { kind: 'text', selector: '[data-testid="mode"]', value: 'compact' },
            { kind: 'shown', selector: '[data-testid="compact"]' },
            { kind: 'hidden', selector: '[data-testid="full"]' },
            { kind: 'textMatch', selector: '[data-testid="docW"]', pattern: '^\\d{2,5}$' }
          ]
        },
        {
          id: 't2',
          skill: 'x-resize',
          text: `Widening the panel to 520px must switch it to the full table: ${ROWS.length} rows, each carrying its own accident year.`,
          checks: [
            { kind: 'text', selector: '[data-testid="mode"]', value: 'full', do: [{ click: '[data-testid="widen"]' }, { wait: 250 }] },
            { kind: 'shown', selector: '[data-testid="full"]' },
            { kind: 'count', selector: '[data-testid="row"]', value: ROWS.length },
            { kind: 'list', selector: '[data-testid="year"]', values: ROWS.map(r => String(r.year)) }
          ]
        },
        {
          id: 't3',
          skill: 'x-resize',
          text: 'It must also react to a resize nobody clicked: forcing the panel to 560px, then back to 320px, must flip the mode both ways.',
          checks: [
            { kind: 'text', selector: '[data-testid="mode"]', value: 'full', do: [{ resize: '[data-testid="panel"]', width: 560 }, { wait: 250 }] },
            { kind: 'text', selector: '[data-testid="mode"]', value: 'compact', do: [{ resize: '[data-testid="panel"]', width: 320 }, { wait: 250 }] },
            { kind: 'code', pattern: 'x-resize\\.document' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'x-sort: making a list draggable',
      objective: 'Wire a sortable list and receive the new order in code.',
      brief: `\`x-sort\` goes on the **container**; each child you want draggable carries \`x-sort:item="key"\`. That key is the identity that reaches your handler — usually an id, not the visible text.\n\nThe handler receives \`(item, position)\`, or you can write the expression inline and use \`$item\` and \`$position\`. Add \`x-sort:handle\` to a small grip so the rest of the row stays clickable, \`x-sort:ignore\` on interactive children so a click does not start a drag, and \`.ghost\` to leave a faded copy behind instead of a hole. Matching \`x-sort:group="name"\` on two containers lets rows move between them, and on a cross-list drag **only the destination list's handler runs**.\n\nAlpine delegates the dragging to SortableJS, so nothing fires until a real pointer drag finishes. This sandbox cannot fake a browser drag (SortableJS uses the browser's own HTML5 drag session), which is why the checks here verify the **wiring in your markup** and the **handler contract** — the same method a drag calls at the end.`,
      example: {
        code: `<ul x-sort.ghost="move">
  <template x-for="f in factors" :key="f.age">
    <li x-sort:item="f.age">
      <span x-sort:handle>⠿</span> <span x-text="f.age"></span>
      <button x-sort:ignore @click="inspect(f)">details</button>
    </li>
  </template>
</ul>

move(item, position) { … }   <!-- called with (key, newIndex) -->`,
        note: 'The key and the destination index are all a "save the new order" handler needs.'
      },
      starter: `<div x-data="{ factors: ${sq(FACTORS)}, log: [] }">
  <ul data-testid="list" style="list-style:none;padding:0">
    <template x-for="f in factors" :key="f.age">
      <li :data-age="f.age"><span x-text="f.age"></span> — <span x-text="f.value"></span></li>
    </template>
  </ul>
</div>`,
      solution: `<div x-data="{
  factors: ${sq(FACTORS)},
  log: [],
  move(item, position) {
    const i = this.factors.findIndex(f => String(f.age) === String(item))
    if (i < 0) return
    const [hit] = this.factors.splice(i, 1)
    this.factors.splice(position, 0, hit)
    this.log.push(item + '@' + position)
  },
  prioritiseLast() { this.move(this.factors[this.factors.length - 1].age, 0) }
}">
  <p class="muted">handler log: <b data-testid="log" x-text="log.join(' | ') || 'nothing yet'"></b></p>
  <ul data-testid="list" x-sort.ghost="move" style="list-style:none;padding:0">
    <template x-for="f in factors" :key="f.age">
      <li x-sort:item="f.age" :data-age="f.age" style="border:1px solid #253253;border-radius:8px;padding:8px;margin:6px 0">
        <span x-sort:handle style="cursor:grab">⠿</span>
        <b data-testid="age" x-text="f.age"></b> — factor <span x-text="f.value"></span>
        <button x-sort:ignore data-testid="inspect" @click="log.push('inspected ' + f.age)">details</button>
      </li>
    </template>
  </ul>
  <button data-testid="prioritise" @click="prioritiseLast()">prioritise the last age</button>
  <p>order: <b data-testid="order" x-text="factors.map(f => f.age).join(',')"></b></p>
</div>`,
      hints: [
        '`x-sort="move"` goes on the `<ul>`; every `<li>` gets `x-sort:item="f.age"`.',
        'The handler removes the item from its old index and re-inserts it at `position` — that is the whole contract.',
        'A button can call the same handler, which is how the checks drive it: dragging and clicking must end in one method.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-sort',
          text: 'The list must be sortable with a ghost preview, every row must be an `x-sort:item` whose key is the age, and each row must have a handle.',
          checks: [
            { kind: 'code', pattern: 'x-sort\\.ghost' },
            { kind: 'code', pattern: 'x-sort:item="f\\.age"' },
            { kind: 'code', pattern: 'x-sort:handle' },
            { kind: 'prop', selector: '[data-age="' + LAST_AGE + '"]', prop: '_x_sort_key', value: String(LAST_AGE) },
            { kind: 'list', selector: '[data-testid="age"]', values: AGES }
          ]
        },
        {
          id: 't2',
          skill: 'x-sort',
          text: `Calling the handler the way a drop would — \`prioritise\` moves age ${LAST_AGE} to position 0 — must reorder the list and record \`${LAST_AGE}@0\`.`,
          checks: [
            { kind: 'list', selector: '[data-testid="age"]', values: AGES },
            { kind: 'text', selector: '[data-testid="log"]', value: LAST_AGE + '@0', do: [{ click: '[data-testid="prioritise"]' }, { wait: 150 }] },
            { kind: 'list', selector: '[data-testid="age"]', values: [String(LAST_AGE), ...AGES.slice(0, -1)] }
          ]
        },
        {
          id: 't3',
          skill: 'x-sort',
          text: 'The `details` button must be excluded from dragging with `x-sort:ignore` — and must still work when clicked, proving `ignore` only blocks drags, not clicks.',
          checks: [
            { kind: 'code', pattern: 'x-sort:ignore' },
            { kind: 'textHas', selector: '[data-testid="log"]', value: 'inspected ' + LAST_AGE, do: [{ click: '[data-testid="inspect"]' }] }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a review queue you can reorder',
      objective: 'Let the actuary drag accident years into review priority, and keep the numbers honest.',
      scenario: `Reserve reviews run top-down: only the first three positions in the queue are investigated this quarter. Chain-ladder IBNR by accident year: ${ROWS.map(r => `${r.year}: ${r.ibnr.toFixed(1)}`).join(' · ')} (total ${TOTAL} on the current basis). In accident-year order the top three carry ${TOP3_PCT} % of the IBNR; putting the newest year first lifts that to ${TOP3_AFTER_PCT} %. The queue must be draggable, and the figures must follow the order.`,
      brief: `Build the queue from ${sq(ROWS)}. Elements: the sortable container \`data-testid="queue"\` (ghost preview), one \`data-testid="item"\` per year carrying \`data-year\` and an \`x-sort:item\` key, the year in \`data-testid="year"\`, a drag handle per row, \`data-testid="top3"\` reading \`2022, 2023, 2024\`, \`data-testid="share"\` reading the reviewed share with one decimal, and a \`data-testid="urgent"\` button that calls the same handler to move ${ROWS[ROWS.length - 1].year} to position 0.`,
      starter: `<div x-data="{ years: ${sq(ROWS)}, inScope: 3 }">
</div>`,
      solution: `<div x-data="{
  years: ${sq(ROWS)},
  inScope: 3,
  get total() { return this.years.reduce((n, y) => n + y.ibnr, 0) },
  get top() { return this.years.slice(0, this.inScope) },
  get share() { return (100 * this.top.reduce((n, y) => n + y.ibnr, 0) / this.total).toFixed(1) },
  get topText() { return this.top.map(y => y.year).join(', ') },
  move(item, position) {
    const i = this.years.findIndex(y => String(y.year) === String(item))
    if (i < 0) return
    const [hit] = this.years.splice(i, 1)
    this.years.splice(position, 0, hit)
  },
  urgent() { this.move(this.years[this.years.length - 1].year, 0) }
}">
  <p>this quarter: <b data-testid="top3" x-text="topText"></b> · carrying <b data-testid="share" x-text="share"></b> % of the IBNR</p>
  <ul data-testid="queue" x-sort.ghost="move" style="list-style:none;padding:0;margin:0">
    <template x-for="y in years" :key="y.year">
      <li data-testid="item" x-sort:item="y.year" :data-year="y.year" style="border:1px solid #253253;border-radius:8px;padding:8px;margin:6px 0">
        <span x-sort:handle style="cursor:grab">⠿</span>
        <b data-testid="year" x-text="y.year"></b> — IBNR <span x-text="y.ibnr.toFixed(1)"></span>
        <span class="chip" x-show="top.includes(y)">in scope</span>
      </li>
    </template>
  </ul>
  <button data-testid="urgent" @click="urgent()">move ${ROWS[ROWS.length - 1].year} to the top</button>
</div>`,
      hints: [
        'The sort handler is the `move(item, position)` you wrote in the step; `urgent()` just calls it with position 0.',
        '`top` and `share` are getters over the array, so reordering updates the sentence by itself.',
        `In accident-year order the share is ${TOP3_PCT} %; after prioritising ${ROWS[ROWS.length - 1].year} it must read ${TOP3_AFTER_PCT} %.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-sort',
          text: `In accident-year order the queue lists ${ROWS.map(r => r.year).join(', ')} and the top three carry ${TOP3_PCT} %.`,
          checks: [
            { kind: 'list', selector: '[data-testid="year"]', values: ROWS.map(r => String(r.year)) },
            { kind: 'text', selector: '[data-testid="top3"]', value: ROWS.slice(0, 3).map(r => r.year).join(', ') },
            { kind: 'text', selector: '[data-testid="share"]', value: String(TOP3_PCT) }
          ]
        },
        {
          id: 't2',
          skill: 'x-sort',
          text: `Moving ${ROWS[ROWS.length - 1].year} to the top must reorder the rows, bring it into scope and lift the reviewed share to ${TOP3_AFTER_PCT} % — the same call a drag makes.`,
          checks: [
            { kind: 'text', selector: '[data-testid="share"]', value: String(TOP3_AFTER_PCT), do: [{ click: '[data-testid="urgent"]' }, { wait: 200 }] },
            { kind: 'list', selector: '[data-testid="year"]', values: PRIORITISED.map(r => String(r.year)) },
            { kind: 'text', selector: '[data-testid="top3"]', value: PRIORITISED.slice(0, 3).map(r => String(r.year)).join(', ') }
          ]
        },
        {
          id: 't3',
          skill: 'x-sort',
          text: 'The wiring must be complete for a real user: ghost preview, the year as each row\'s sort key, and a handle on every row so the row itself stays clickable.',
          checks: [
            { kind: 'code', pattern: 'x-sort\\.ghost=' },
            { kind: 'code', pattern: 'x-sort:item="y\\.year"' },
            { kind: 'prop', selector: '[data-year="' + ROWS[0].year + '"]', prop: '_x_sort_key', value: String(ROWS[0].year) },
            { kind: 'countAtLeast', selector: '[x-sort\\:handle]', value: ROWS.length }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a valuation card that fits wherever it is put',
      objective: 'Combine measured element width with a real decision, plus a viewport readout.',
      scenario: `The same valuation card is used on a full-width dashboard and in a narrow side panel. Past 460px it shows the annuity-due table for ${RATES.map(r => `${(r * 100).toFixed(1)} %`).join(' / ')}; below that it shows the annuity for the selected basis only, because a three-column table is unreadable at that size. It must also report the visual viewport width, since on tablets the card sits beside a keyboard.`,
      brief: `Elements: \`data-testid="card"\` (the measured element, starting at 320px), \`data-testid="w"\`, \`data-testid="mode"\` (\`wide\` / \`narrow\`), \`data-testid="table"\` (three rows, only in wide mode), \`data-testid="single"\` (the one-line summary, only in narrow mode), \`data-testid="viewport"\`, and the controls \`data-testid="grow"\` (520px) and \`data-testid="shrink"\` (320px). Threshold: **460px**.`,
      starter: `<div x-data="{ w: 0, rate: 0.045 }">
  <div data-testid="card" style="width:320px"></div>
</div>`,
      solution: `<div x-data="{
  w: 0, vw: 0, rate: ${RATES[1]},
  rates: ${JSON.stringify(RATES)},
  adue: ${JSON.stringify(ADUE)},
  get mode() { return this.w >= 460 ? 'wide' : 'narrow' },
  get index() { return this.rates.indexOf(this.rate) },
  grow() { this.$refs.card.style.width = '520px' },
  shrink() { this.$refs.card.style.width = '320px' }
}">
  <p>card <b data-testid="w" x-text="w"></b> px · <b data-testid="mode" x-text="mode"></b> · viewport <b data-testid="viewport" x-text="vw"></b> px</p>
  <div data-testid="card" x-ref="card" style="width:320px" x-resize="w = Math.round($width)" x-resize.viewport="vw = Math.round($width)">
    <table data-testid="table" x-show="mode === 'wide'">
      <thead><tr><th>basis</th><th>ä<sub>45:15</sub></th></tr></thead>
      <tbody>
        <template x-for="(r, i) in rates" :key="r">
          <tr data-testid="row"><td x-text="(r * 100).toFixed(1) + ' %'"></td><td x-text="adue[i].toFixed(4)"></td></tr>
        </template>
      </tbody>
    </table>
    <p data-testid="single" x-show="mode === 'narrow'">ä<sub>45:15</sub> at <span x-text="(rate * 100).toFixed(1)"></span> % = <b x-text="adue[index].toFixed(4)"></b></p>
    <div class="row">
      <button data-testid="grow" @click="grow()">grow the card</button>
      <button data-testid="shrink" @click="shrink()">shrink the card</button>
    </div>
  </div>
</div>`,
      hints: [
        'Two resize directives on one element: `x-resize` for the card, `x-resize.viewport` for the visual viewport.',
        '`mode` is a getter over `w`; bind both variants with `x-show` and let the width choose.',
        `The wide table must show ${ADUE.join(' / ')} for ${RATES.map(r => (r * 100).toFixed(1) + ' %').join(' / ')}.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-resize',
          text: 'At 320px the card must be `narrow`: the single-basis line visible, the table hidden, and both the card width and the viewport width reported as numbers.',
          checks: [
            { kind: 'textNumber', selector: '[data-testid="w"]', value: 320, tol: 2 },
            { kind: 'text', selector: '[data-testid="mode"]', value: 'narrow' },
            { kind: 'shown', selector: '[data-testid="single"]' },
            { kind: 'hidden', selector: '[data-testid="table"]' },
            { kind: 'textMatch', selector: '[data-testid="viewport"]', pattern: '^\\d{2,5}$' }
          ]
        },
        {
          id: 't2',
          skill: 'x-resize',
          text: `Growing the card past the threshold must switch it to \`wide\` with all three bases listed (${ADUE.join(', ')}), and shrinking must take it back.`,
          checks: [
            { kind: 'text', selector: '[data-testid="mode"]', value: 'wide', do: [{ click: '[data-testid="grow"]' }, { wait: 250 }] },
            { kind: 'shown', selector: '[data-testid="table"]' },
            { kind: 'list', selector: '[data-testid="row"] td:last-child', values: ADUE.map(v => v.toFixed(4)) },
            { kind: 'text', selector: '[data-testid="mode"]', value: 'narrow', do: [{ click: '[data-testid="shrink"]' }, { wait: 250 }] },
            { kind: 'hidden', selector: '[data-testid="table"]' }
          ]
        },
        {
          id: 't3',
          skill: 'x-resize',
          text: 'It must react to a resize it did not cause: forcing the card to 480px from outside must give `wide`, and 400px must give `narrow`.',
          checks: [
            { kind: 'text', selector: '[data-testid="mode"]', value: 'wide', do: [{ resize: '[data-testid="card"]', width: 480 }, { wait: 250 }] },
            { kind: 'text', selector: '[data-testid="w"]', value: '480' },
            { kind: 'text', selector: '[data-testid="mode"]', value: 'narrow', do: [{ resize: '[data-testid="card"]', width: 400 }, { wait: 250 }] }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-resize',
      q: 'Inside `x-resize="label = $width"` — when does that expression run?',
      options: [
        'Only when the user resizes the window',
        'Once when the element is measured, then after every change of its size',
        'On every animation frame',
        'Only if you also bind the element\'s width'
      ],
      answer: 1,
      why: 'The observer reports the current size immediately, then on every layout change of that element — so the initial read is never missing.',
      distractors: { 0: 'Resizing the element itself (a panel, a split view, a collapsing sidebar) counts too.' }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'x-resize',
      q: 'You want to react when the whole *document* is resized, not the element carrying the directive. Which modifier?',
      options: ['`.window`', '`.document`', '`.viewport`', '`.page`'],
      answer: 1,
      why: '`.document` observes the document element; `.viewport` observes the visual viewport (mobile browser chrome, on-screen keyboards).',
      distractors: { 2: 'That is a real modifier — but it tracks `window.visualViewport`, not the document.' }
    },
    {
      id: 'q3',
      type: 'multi',
      skill: 'x-resize',
      q: 'Which are legitimate uses of the resize plugin?',
      options: [
        'Switching a table to a compact summary when its panel gets narrow',
        'Redrawing a canvas chart after its container changes size',
        'Reading an element\'s width once, to store in a database',
        'Making a sticky header aware of its own height'
      ],
      answers: [0, 1, 3],
      why: 'It is a reactive size signal — for layout decisions and redraws. A one-off measurement is simpler with `$refs` and `getBoundingClientRect()`.',
      distractors: { 2: 'Nothing here needs an observer, and a size is rarely worth persisting.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-sort',
      q: 'With `<ul x-sort="handle">` and `<li x-sort:item="\'F3\'">`, what does `handle` receive when that row is dropped at the very top?',
      options: ['(\'F3\', 0)', '(\'F3\', 1)', '(the `<li>` element, 0)', '(0, \'F3\')'],
      answer: 0,
      why: 'The handler gets the item **key** from `x-sort:item` and the new 0-based position. Inline expressions get the same pair as `$item` and `$position`.',
      distractors: { 1: 'Positions start at index 0 — the top of the list.' }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'x-sort',
      q: 'Two lists share `x-sort:group="queue"`, each with its own handler. A row is dragged from list A into list B. Which handlers run?',
      options: [
        'Both handlers',
        'Only list A\'s handler',
        'Only list B\'s handler, with the item key and its new position',
        'Neither — cross-list drags need `x-sort:config`'
      ],
      answer: 2,
      why: 'The destination list is the one that now owns the item, so only its handler is called.',
      distractors: { 0: 'Treating it as a remove-plus-add pair is the classic way to duplicate rows.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'x-sort',
      q: 'Which directive marks a small area inside a sortable item as the only place a drag may start? Answer with the full directive name.',
      accept: ['x-sort:handle'],
      why: '`x-sort:handle` — the rest of the row stays free for clicks, links and inputs.'
    }
  ]
}
