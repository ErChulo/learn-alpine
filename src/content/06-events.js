/* Module 6 — events and modifiers.
 * Matches: /essentials/events, /directives/on */

import { life, rnd, sq } from './data.js'

const BASES = [0.03, 0.045, 0.06].map(i => ({ rate: i, aDue: Number(life.aDueTemp(45, 15, i).toFixed(4)) }))
const FACTOR = Number(rnd(0.0512, 4))
const QUEUE_CODE = 'CL-9' + Math.round(rnd(1000, 100))

export default {
  id: 'm06',
  num: 6,
  title: 'Events and modifiers',
  blurb: 'x-on, every modifier worth knowing, and custom events between components.',
  goal: 'Wire interactions with x-on, control propagation and defaults with modifiers, and let components talk through custom events.',
  intro: `**\`x-on\`** (or its shorthand \`@\`) attaches a listener. Everything after the colon is the event name; everything after a dot is a modifier. Modifiers run **left to right**, which is why \`.prevent\` and \`.stop\` order matters when both are present.\n\nCustom events close the loop between components: \`$dispatch\` fires a bubbling \`CustomEvent\` that any ancestor can listen for. The payload travels in \`$event.detail\`.`,
  skills: ['x-on', 'modifiers', '$dispatch'],
  docRefs: [
    { label: 'Events', url: 'https://alpinejs.dev/essentials/events' },
    { label: 'x-on', url: 'https://alpinejs.dev/directives/on' }
  ],
  mastery: [
    'Attach listeners with `@` and stop a form from navigating with `.prevent`',
    'Use `.outside`, `.self` and `.once` to control *where* and *how often* a handler fires',
    'Drive a list with arrow keys and Enter, correctly preventing the browser default',
    'Dispatch a custom event from a child and read its `detail` in the parent'
  ],
  units: [
    {
      id: 's1',
      title: 'Submit, keys and defaults',
      objective: 'Stop a form from navigating and drive it from the keyboard.',
      brief: `A \`<form>\` submit navigates the page by default; **\`.prevent\`** stops that. Keyboard events are \`keydown\` (fires while held, and before the character appears), \`keypress\` and \`keyup\`; \`.prevent\` on a key handler stops the browser's own behaviour (scrolling, submitting).`,
      example: {
        code: `<form @submit.prevent="add()">
  <input x-model="draft" @keydown.escape="draft = ''">
</form>`,
        note: 'Without `.prevent` on submit, the sandbox would navigate away and every check would fail — a realistic bug.'
      },
      starter: `<div x-data="{ draft: '', queue: [] }">
  <form data-testid="form" @submit.prevent="add()">
    <input data-testid="code" x-model="draft" placeholder="claim code">
    <button type="submit">add</button>
  </form>
  <ul><template x-for="(c, i) in queue" :key="i"><li data-testid="queue" x-text="c"></li></template></ul>
</div>`,
      solution: `<div x-data="{
  draft: '',
  queue: [],
  add() { if (! this.draft.trim()) return; this.queue.push(this.draft.trim()); this.draft = '' }
}">
  <form data-testid="form" @submit.prevent="add()">
    <input data-testid="code" x-model="draft" @keydown.escape="draft = ''" placeholder="claim code">
    <button data-testid="submit" type="submit">add</button>
  </form>
  <p>in queue: <b data-testid="count" x-text="queue.length"></b>
     <button data-testid="clear" type="button" @click="queue = []">clear queue</button></p>
  <ul><template x-for="(c, i) in queue" :key="i"><li data-testid="queue" x-text="c"></li></template></ul>
</div>`,
      hints: [
        '`@submit.prevent="add()"` is the whole trick for forms.',
        'The empty draft must be ignored: `if (! this.draft.trim()) return`.',
        '`@keydown.escape="draft = \'\'"` clears the field.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-on',
          text: `Submitting the form must add the claim code to the queue without the sandbox navigating away: the queue must hold one item reading \`${QUEUE_CODE}\`, the input must be emptied, and the form must be bound with \`.prevent\` (Enter works in a real browser, a synthetic key press does not submit a form — so this checks the handler).`,
          checks: [
            { kind: 'code', pattern: '@submit\\.prevent|x-on:submit\\.prevent' },
            { kind: 'listLong', selector: '[data-testid="queue"]', value: 1, do: [{ type: '[data-testid="code"]', value: QUEUE_CODE }, { dispatch: '[data-testid="form"]', event: 'submit' }] },
            { kind: 'text', selector: '[data-testid="queue"]', value: QUEUE_CODE },
            { kind: 'prop', selector: '[data-testid="code"]', prop: 'value', value: '' },
            { kind: 'text', selector: '[data-testid="count"]', value: '1' }
          ]
        },
        {
          id: 't2',
          skill: 'modifiers',
          text: 'An empty submit must add nothing, and pressing Escape in the field must clear it.',
          checks: [
            { kind: 'listLong', selector: '[data-testid="queue"]', value: 0, do: [{ click: '[data-testid="clear"]' }, { dispatch: '[data-testid="form"]', event: 'submit' }] },
            { kind: 'prop', selector: '[data-testid="code"]', prop: 'value', value: '', do: [{ type: '[data-testid="code"]', value: 'CL-x' }, { el: '[data-testid="code"]', key: 'Escape' }] },
            { kind: 'text', selector: '[data-testid="count"]', value: '0' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'Where did that click come from?',
      objective: 'Use .outside and .self to close a dropdown only when you mean to.',
      brief: `\`.outside\` fires when the event happens **outside the element carrying the directive** — the standard way to dismiss a menu. \`.self\` fires only when the event *target* is the element itself, not one of its children, which is the standard way to make a backdrop clickable.`,
      example: {
        code: `<div x-data="{ open: false }" @click.outside="open = false">
  <button @click="open = ! open">basis</button>
  <div x-show="open">…</div>
</div>`,
        note: '`.outside` needs a data scope to sit in, so it lives on the component root.'
      },
      starter: `<div x-data="{ open: false }" @click.outside="open = false">
  <button data-testid="toggle" @click.stop="open = ! open">choose basis</button>
  <div data-testid="menu" x-show="open">
    <button data-testid="inner">3.00 %</button>
  </div>
</div>
<button data-testid="elsewhere">elsewhere</button>`,
      solution: `<div x-data="{ open: false, basis: null }" @click.outside="open = false">
  <button data-testid="toggle" @click.stop="open = ! open">choose basis</button>
  <div data-testid="menu" x-show="open">
    <button data-testid="inner" @click="basis = '3.00 %', open = false">3.00 %</button>
    <button data-testid="inner2" @click="basis = '4.50 %', open = false">4.50 %</button>
  </div>
  <p>basis: <b data-testid="basis" x-text="basis ?? 'none'"></b></p>
</div>
<button data-testid="elsewhere">elsewhere</button>`,
      hints: [
        '`.outside` goes on the root that wraps *everything* that counts as "inside".',
        'Clicking a menu item should also close the menu: set `open = false` in that handler.',
        'The `elsewhere` button sits *outside* the component root — that is what makes it an outside click.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'modifiers',
          text: 'Opening with the toggle must show the menu; clicking a menu item must set the basis and close the menu.',
          checks: [
            { kind: 'hidden', selector: '[data-testid="menu"]' },
            { kind: 'shown', selector: '[data-testid="menu"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'text', selector: '[data-testid="basis"]', value: '3.00 %', do: [{ click: '[data-testid="inner"]' }] },
            { kind: 'hidden', selector: '[data-testid="menu"]' }
          ]
        },
        {
          id: 't2',
          skill: 'modifiers',
          text: 'Clicking anywhere outside the component must close the menu (the outside click must not be swallowed, so no blanket `.stop` on the root).',
          checks: [
            { kind: 'shown', selector: '[data-testid="menu"]', do: [{ click: '[data-testid="toggle"]' }] },
            { kind: 'hidden', selector: '[data-testid="menu"]', do: [{ click: '[data-testid="elsewhere"]' }] }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'Components talking: custom events',
      objective: 'Dispatch an event from a child and consume its payload in the parent.',
      brief: `\`$dispatch('rate-change', { rate: 0.045 })\` fires a bubbling \`CustomEvent\`; ancestors listen with \`@rate-change\`. The payload is at \`$event.detail\`, and when the payload is an object the keys are spread into your handler's scope argument.\n\nThis is how a deep child (a rate slider) can tell a distant parent (the valuation header) something without either knowing about the other's data.`,
      example: {
        code: `<div @rate-change="rate = $event.detail.rate">      <!-- ancestor listens -->
  <button @click="$dispatch('rate-change', { rate: 0.045 })">apply</button>
</div>`,
        note: 'Events bubble: the listener can sit many levels above the dispatcher.'
      },
      starter: `<div x-data="{ rate: null }" @rate-change="rate = $event.detail.rate">
  <div x-data>
    <button data-testid="apply" @click="$dispatch('rate-change', { rate: 0.045 })">apply 4.5 %</button>
  </div>
  <p>valuation rate: <b data-testid="rate" x-text="rate ?? 'unset'"></b></p>
</div>`,
      solution: `<div x-data="{ rate: null, source: 'none' }" @rate-change="rate = $event.detail.rate, source = $event.detail.from ?? 'child'">
  <div x-data>
    <button data-testid="apply" @click="$dispatch('rate-change', { rate: 0.045, from: 'button' })">apply 4.5 %</button>
    <button data-testid="apply6" @click="$dispatch('rate-change', { rate: 0.06, from: 'button' })">apply 6 %</button>
  </div>
  <p>valuation rate: <b data-testid="rate" x-text="rate === null ? 'unset' : rate"></b></p>
  <p class="muted">last source: <span data-testid="source" x-text="source"></span></p>
</div>`,
      hints: [
        'Read the payload from `$event.detail.rate` — the second argument of `$dispatch` is the detail object.',
        'The listener sits on the ancestor, the dispatcher on the button; bubbling does the rest.',
        '`data-testid="source"` proves the *listener* ran, independent of the value.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$dispatch',
          text: 'Clicking `data-testid="apply"` must show rate `0.045` in `data-testid="rate"` and `button` in `data-testid="source"`.',
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: 'unset' },
            { kind: 'text', selector: '[data-testid="rate"]', value: '0.045', do: [{ click: '[data-testid="apply"]' }] },
            { kind: 'text', selector: '[data-testid="source"]', value: 'button' }
          ]
        },
        {
          id: 't2',
          skill: '$dispatch',
          text: 'The listener must work for events it did not dispatch itself: when the checker fires `rate-change` with detail `{ rate: 0.07, from: \'external\' }` on the root, `data-testid="rate"` must read `0.07`.',
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: '0.07', do: [{ dispatch: 'body [x-data]', event: 'rate-change', detail: { rate: 0.07, from: 'external' } }] },
            { kind: 'text', selector: '[data-testid="source"]', value: 'external' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — keyboard-driven basis picker',
      objective: 'Build an arrow-key/Enter interaction with correctly prevented defaults.',
      scenario: `Valuation bases for a ${15}-year endowment on (45) at the current table: ${BASES.map(b => `${(b.rate * 100).toFixed(2)} % → ä = ${b.aDue}`).join(' · ')}. The actuary wants to walk the list with ↑/↓, apply the highlighted basis with Enter, and cancel with Escape — exactly like a native listbox, and without the page scrolling on arrow keys.`,
      brief: `Mark the list items \`data-testid="basis"\`, the highlighted one with the class \`active\`, the chosen value in \`data-testid="chosen"\` and the rejected/cancelled state in \`data-testid="status"\` (reading \`cancelled\` after Escape). Selection starts at the first basis.`,
      starter: `<div x-data="{ bases: ${sq(BASES)}, i: 0, chosen: null }" tabindex="0">
</div>`,
      solution: `<div x-data="{
  bases: ${sq(BASES)},
  i: 0,
  chosen: null,
  status: 'idle',
  move(step) { this.i = Math.min(this.bases.length - 1, Math.max(0, this.i + step)) },
  pick() { this.chosen = this.bases[this.i].aDue; this.status = 'applied' },
  cancel() { this.status = 'cancelled' }
}" tabindex="0" data-testid="picker" @keydown.arrow-down.prevent="move(1)" @keydown.arrow-up.prevent="move(-1)" @keydown.enter.prevent="pick()" @keydown.escape="cancel()">
  <ul>
    <template x-for="(b, k) in bases" :key="b.rate">
      <li data-testid="basis" :class="k === i ? 'active' : ''"
          @click="i = k, pick()"
          x-text="(b.rate * 100).toFixed(2) + ' % · ä = ' + b.aDue"></li>
    </template>
  </ul>
  <button data-testid="reset" @click="i = 0, chosen = null, status = 'idle'">reset</button>
  <p>applied ä: <b data-testid="chosen" x-text="chosen === null ? 'none' : chosen.toFixed(4)"></b></p>
  <p class="muted">status: <span data-testid="status" x-text="status"></span></p>
</div>`,
      hints: [
        'Clamp the index: `Math.min(len - 1, Math.max(0, i + step))`.',
        '`.prevent` on the arrow-key handlers stops the page from scrolling.',
        'Enter applies `bases[i].aDue`; Escape sets the status to `cancelled`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-on',
          text: `Render the three bases with the first highlighted. Pressing ArrowDown must move \`active\` to the second item — nothing else may be highlighted, and the first must lose the class.`,
          checks: [
            { kind: 'count', selector: '[data-testid="basis"]', value: 3 },
            { kind: 'klass', selector: '[data-testid="basis"]', nth: 0, value: 'active' },
            { kind: 'klass', selector: '[data-testid="basis"]', nth: 1, value: 'active', do: [{ el: '[data-testid="picker"]', key: 'ArrowDown' }] },
            { kind: 'noKlass', selector: '[data-testid="basis"]', nth: 0, value: 'active' }
          ]
        },
        {
          id: 't2',
          skill: 'modifiers',
          text: `Enter must apply the highlighted basis: from the start, ArrowDown then Enter must put ä = ${BASES[1].aDue} in \`data-testid="chosen"\` (4 dp).`,
          checks: [
            { kind: 'text', selector: '[data-testid="chosen"]', value: 'none', do: [{ click: '[data-testid="reset"]' }] },
            { kind: 'text', selector: '[data-testid="chosen"]', value: BASES[1].aDue.toFixed(4), do: [{ el: '[data-testid="picker"]', key: 'ArrowDown' }, { el: '[data-testid="picker"]', key: 'Enter' }] },
            { kind: 'text', selector: '[data-testid="status"]', value: 'applied' }
          ]
        },
        {
          id: 't3',
          skill: 'modifiers',
          text: 'Escape must cancel: `data-testid="status"` reads `cancelled` and `chosen` stays `none`. ArrowUp at the top must not run off the list.',
          checks: [
            { kind: 'text', selector: '[data-testid="status"]', value: 'cancelled', do: [{ click: '[data-testid="reset"]' }, { el: '[data-testid="picker"]', key: 'Escape' }] },
            { kind: 'text', selector: '[data-testid="chosen"]', value: 'none' },
            { kind: 'klass', selector: '[data-testid="basis"]', nth: 0, value: 'active', do: [{ el: '[data-testid="picker"]', key: 'ArrowUp' }] },
            { kind: 'count', selector: '[data-testid="basis"].active', value: 1 }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — provisional versus committed rate',
      objective: 'Separate live input from committed change, the way real forms do.',
      scenario: `A pricing team adjusts the valuation rate with a slider. While dragging (\`input\` events) they want the *provisional* premium recomputed instantly; only when they let go (\`change\`) should the value be written to the decision log. A number box next to it must behave the same way, and Enter must commit it without adding a duplicate entry when nothing changed.`,
      brief: `Premium model: provisional premium = ${rnd(250000, 0)} × A₄₅:₁₅ ÷ ä₄₅:₁₅. Use the factor \`${rnd(0.0512, 4)}\` per unit of sum assured so premiums are just \`sum × factor\`. Log entries go in elements marked \`data-testid="log"\` as \`rate=0.045\` strings, and the running provisional value shows in \`data-testid="provisional"\`.`,
      starter: `<div x-data="{ rate: 0.045, factor: ${FACTOR}, sum: 250000, log: [] }">
</div>`,
      solution: `<div x-data="{
  rate: 0.045,
  factor: ${FACTOR},
  sum: 250000,
  log: [],
  get provisional() { return this.sum * this.factor * (1 + (this.rate - 0.045) * 6) },
  commit() {
    const tag = 'rate=' + this.rate.toFixed(3)
    if (this.log[this.log.length - 1] === tag) return
    this.log.push(tag)
  }
}">
  <input type="range" data-testid="slider" min="0.02" max="0.08" step="0.001" x-model.number="rate" @input="rate = + $event.target.value" @change="commit()">
  <input type="number" data-testid="rateBox" step="0.001" x-model.number="rate" @keydown.enter.prevent="commit()">
  <button data-testid="clearLog" @click="log = []">clear log</button>
  <p>provisional annual premium: <b data-testid="provisional" x-text="provisional.toFixed(0)"></b></p>
  <ul><template x-for="(l, i) in log" :key="i"><li data-testid="log" x-text="l"></li></template></ul>
</div>`,
      hints: [
        '`@input` fires continuously while dragging; `@change` fires when the control is released.',
        'Guard duplicates by comparing with the last log entry before pushing.',
        '`x-model.number` keeps `rate` a number, so `.toFixed(3)` works.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-on',
          text: 'Moving the slider to `0.05` must update `data-testid="provisional"` **without** writing a log entry; releasing it (`change`) must add exactly one entry reading `rate=0.050`.',
          checks: [
            { kind: 'count', selector: '[data-testid="log"]', value: 0 },
            { kind: 'textNumber', selector: '[data-testid="provisional"]', value: 250000 * FACTOR * 1.03, tol: 60, do: [{ set: '[data-testid="slider"]', value: '0.05' }, { dispatch: '[data-testid="slider"]', event: 'input' }] },
            { kind: 'count', selector: '[data-testid="log"]', value: 0 },
            { kind: 'list', selector: '[data-testid="log"]', values: ['rate=0.050'], do: [{ dispatch: '[data-testid="slider"]', event: 'change' }] }
          ]
        },
        {
          id: 't2',
          skill: 'modifiers',
          text: 'Pressing Enter in the number box after a real change adds one entry; pressing it again without changing anything must not add a second.',
          checks: [
            { kind: 'count', selector: '[data-testid="log"]', value: 0, do: [{ click: '[data-testid="clearLog"]' }] },
            { kind: 'count', selector: '[data-testid="log"]', value: 1, do: [{ type: '[data-testid="rateBox"]', value: '0.06' }, { el: '[data-testid="rateBox"]', key: 'Enter' }] },
            { kind: 'list', selector: '[data-testid="log"]', values: ['rate=0.060'] },
            { kind: 'count', selector: '[data-testid="log"]', value: 1, do: [{ el: '[data-testid="rateBox"]', key: 'Enter' }] }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'modifiers',
      q: 'A form with `@submit="save()"` keeps reloading the page. What is the fix?',
      options: ['Add `.stop`', 'Add `.prevent`', 'Add `.self`', 'Add `.passive`'],
      answer: 1,
      why: 'The browser default for submit is navigation; `.prevent` cancels it.',
      distractors: {
        0: '`.stop` stops propagation to ancestors, not the default action.',
        2: '`.self` restricts *where* the handler fires.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'modifiers',
      q: 'Which directive closes a dropdown when the user clicks anywhere *except* inside it?',
      options: ['`@click.self="open = false"`', '`@click.outside="open = false"`', '`@click.window="open = false"`', '`@click.document="open = false"`'],
      answer: 1,
      why: '`.outside` listens for clicks outside the element carrying the directive — the idiomatic popover dismiss.',
      distractors: {
        0: '`.self` fires when the event target is the element itself: that is a backdrop pattern, not dismissal.',
        2: '`.window` widens the listener to the window, so clicks *inside* the panel close it too.',
        3: '`.document` does the same thing one level down: a global listener that cannot tell inside from outside.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'modifiers',
      q: '`@click.stop.prevent="go()"` — in which order do the modifiers run?',
      options: [
        '`.prevent` then `.stop`',
        '`.stop` then `.prevent`',
        'Both at once, order is irrelevant',
        'Order is alphabetical, so `.prevent` first'
      ],
      answer: 1,
      why: 'Modifiers are applied left to right, exactly as written.',
      distractors: {
        2: 'There are cases where order matters (e.g. `.prevent` before `.once` reads differently), so Alpine keeps your order.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: '$dispatch',
      q: 'A child runs `$dispatch(\'reserve-change\', { amount: 412 })`. How does an ancestor read the payload?',
      options: ['`$event.amount`', '`$event.detail.amount`', '`$event.data.amount`', '`$detail.amount`'],
      answer: 1,
      why: '`$dispatch` sends a `CustomEvent`, whose payload lives under `detail` — that is also why the payload must be serialisable-ish data.',
      distractors: {
        0: 'CustomEvent does not copy detail keys onto the event object.',
        3: '`$detail` is not a magic.'
      }
    },
    {
      id: 'q5',
      type: 'multi',
      skill: 'modifiers',
      q: 'Which of these are real Alpine event modifiers?',
      options: ['.once', '.debounce.500ms', '.self', '.async', '.window'],
      answers: [0, 1, 2, 4],
      why: '`.once` listens a single time, `.debounce.Nms` delays until input settles, `.self` filters by target, `.window`/`.document` widen the listener.',
      distractors: { 3: 'There is no `.async` modifier: use an async handler instead.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'modifiers',
      q: 'Which single modifier makes a handler run at most once, even if the element stays in the DOM? Answer with the modifier including its dot.',
      accept: ['.once'],
      why: '`.once` — the listener removes itself after the first trigger.'
    },
    {
      id: 'q7',
      type: 'mc',
      skill: 'modifiers',
      q: 'What is the difference between `.debounce.500ms` and `.throttle.500ms`?',
      options: [
        'They are aliases',
        'Debounce waits for 500 ms of quiet; throttle fires at most once every 500 ms',
        'Throttle waits for quiet; debounce fires on a fixed cadence',
        'Debounce only works on `input`, throttle only on `scroll`'
      ],
      answer: 1,
      why: 'Debounce is "after the storm ends"; throttle is "at most this often". Search boxes want debounce, scroll handlers want throttle.',
      distractors: { 2: 'That is exactly inverted.' }
    }
  ]
}
