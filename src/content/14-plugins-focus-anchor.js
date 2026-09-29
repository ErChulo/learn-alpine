/* Module 14 — plugins III: focus (x-trap, $focus) and anchor (x-anchor, $anchor).
 * Matches: /plugins/focus, /plugins/anchor */

import { life, sq } from './data.js'

const AGES = [35, 40, 45, 50, 55, 60]
const TABLE = AGES.map(a => ({
  age: a,
  qx: Number(life.qx(a).toFixed(5)),
  p10: Number(life.p(a, 10).toFixed(4)),
  lx: life.lx(a)
}))
const LAST = AGES[AGES.length - 1]
const LASTROW = TABLE[TABLE.length - 1]
const BASES = [
  { id: 'vbt', label: '2015 VBT (smoker-distinct)', qx50: Number(life.qx(50).toFixed(5)) },
  { id: 'unisex', label: 'Unisex annuitant table', qx50: Number((life.qx(50) * 1.12).toFixed(5)) },
  { id: 'prudential', label: 'Insurer experience table', qx50: Number((life.qx(50) * 0.94).toFixed(5)) }
]
const APPROVERS = ['R. Okonkwo (chief actuary)', 'M. Lindqvist (valuation)', 'S. Bhatt (audit)']

export default {
  id: 'm14',
  num: 14,
  title: 'Plugins III — focus and anchoring',
  blurb: 'x-trap and $focus keep the keyboard usable; x-anchor pins menus to whatever they belong to.',
  goal: 'Build dialogs and popovers that behave for keyboard users and stay attached to their trigger.',
  intro: `Two plugins that protect the parts of an interface people forget to test.\n\n**focus** gives you \`x-trap\` — declare a boolean expression and, while it is true, Tab, Shift+Tab and clicks are kept inside that element, with focus returned to where it came from when the trap closes. The \`$focus\` magic exposes the small utilities underneath: \`next()\`, \`previous()\`, \`first()\`, \`last()\`, \`within()\`, \`wrap()\`, \`focusable()\`, \`focused()\`.\n\n**anchor** gives you \`x-anchor\` — pass it an element and the anchored element is positioned next to it (Floating UI underneath), flipping automatically when there is no room. \`$anchor.x\` / \`$anchor.y\` expose the coordinates so you can style it yourself.`,
  skills: ['x-trap', '.noscroll', '.noautofocus', '$focus', 'x-anchor', '$anchor', '.offset', '.no-style'],
  docRefs: [
    { label: 'focus', url: 'https://alpinejs.dev/plugins/focus' },
    { label: 'anchor', url: 'https://alpinejs.dev/plugins/anchor' },
    { label: 'Floating UI', url: 'https://floating-ui.com/' }
  ],
  mastery: [
    'Keep focus inside a dialog with `x-trap` and give it back on close',
    'Lock scrolling, and know that `x-trap` does not close itself on Escape',
    'Drive focus by keyboard with the `$focus` magic and its `.wrap()` / `.within()` chain',
    'Anchor menus and tooltips to a trigger with `x-anchor`, offsets and `$anchor`'
  ],
  units: [
    {
      id: 's1',
      title: 'x-trap: a dialog that keeps the keyboard',
      objective: 'Trap focus while a dialog is open and hand it back when it closes.',
      brief: `\`x-trap="open"\` activates while the expression is truthy. Then:\n\n- focus moves into the element — to its first focusable child, or to a child marked \`autofocus\`, unless you add \`.noautofocus\`;\n- Tab and Shift+Tab cycle **inside** it, wrapping at both ends;\n- clicking outside does not steal focus;\n- when the trap closes, focus returns to whatever had it before, unless you add \`.noreturn\`.\n\n\`.noscroll\` freezes page scrolling while the dialog is up. And note what \`x-trap\` does *not* do: it never closes anything on Escape — that binding is yours.`,
      example: {
        code: `<div x-show="open" x-trap.noscroll="open" @keydown.escape="open = false">
  <input autofocus>
  <button @click="open = false">Done</button>
</div>`,
        note: 'Activation happens a tick after the expression flips, so the dialog is visible before focus moves into it.'
      },
      starter: `<div x-data="{ open: false }">
  <p>outside the dialog: <input data-testid="pageSearch" placeholder="page search"></p>
  <button data-testid="open" @click="open = true">open the basis dialog</button>
  <div data-testid="dialog" x-show="open" style="border:1px solid #253253;border-radius:10px;padding:12px">
    <h4 style="margin:0 0 8px">Change valuation basis</h4>
    <label>basis <input data-testid="basisInput" value="2015 VBT"></label>
    <div class="row">
      <button data-testid="apply" @click="open = false">apply</button>
      <button data-testid="cancel" @click="open = false">cancel</button>
    </div>
  </div>
</div>`,
      solution: `<div x-data="{ open: false, where: 'nowhere' }">
  <p>outside the dialog: <input data-testid="pageSearch" placeholder="page search"> · keyboard is at <b data-testid="where" x-text="where"></b></p>
  <button data-testid="open" @click="open = true">open the basis dialog</button>
  <div data-testid="dialog" x-show="open" x-trap.noscroll="open" @keydown.escape="open = false"
       @focusin="where = $event.target.dataset.testid || 'something else'"
       style="border:1px solid #253253;border-radius:10px;padding:12px">
    <h4 style="margin:0 0 8px">Change valuation basis</h4>
    <label>basis <input data-testid="basisInput" value="2015 VBT"></label>
    <div class="row">
      <button data-testid="apply" @click="open = false">apply</button>
      <button data-testid="cancel" @click="open = false">cancel</button>
    </div>
  </div>
</div>`,
      hints: [
        'The trap belongs on the dialog element, and it should be driven by the same `open` flag as `x-show`.',
        '`@focusin` on the dialog is enough to report which control the keyboard is on — it bubbles.',
        'Escape must be bound by you: `@keydown.escape="open = false"`, plus `.noscroll` to freeze the page behind.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-trap',
          text: 'Opening the dialog must move the keyboard inside it — onto the first focusable control, the basis field — and freeze page scrolling while it is up.',
          checks: [
            { kind: 'text', selector: '[data-testid="where"]', value: 'basisInput', do: [{ el: '[data-testid="basisInput"]', key: 'Escape' }, { wait: 120 }, { click: '[data-testid="open"]' }, { wait: 240 }] },
            { kind: 'focused', selector: '[data-testid="dialog"]' },
            { kind: 'styleIs', selector: 'html', prop: 'overflow', value: 'hidden' },
            { kind: 'code', pattern: 'x-trap\\.noscroll="open"' }
          ]
        },
        {
          id: 't2',
          skill: 'x-trap',
          text: 'Tab must wrap: from the last control in the dialog, the next Tab lands back on the first control inside it.',
          checks: [
            { kind: 'focused', selector: '[data-testid="cancel"]', do: [{ el: '[data-testid="basisInput"]', key: 'Escape' }, { wait: 120 }, { focus: '[data-testid="open"]' }, { click: '[data-testid="open"]' }, { wait: 220 }, { focus: '[data-testid="cancel"]' }] },
            { kind: 'text', selector: '[data-testid="where"]', value: 'basisInput', do: [{ el: '[data-testid="cancel"]', key: 'Tab' }, { wait: 150 }] },
            { kind: 'focused', selector: '[data-testid="dialog"]' }
          ]
        },
        {
          id: 't3',
          skill: 'x-trap',
          text: 'Closing must hand the keyboard back to the button that opened it, and unfreeze scrolling.',
          checks: [
            { kind: 'focused', selector: '[data-testid="open"]', do: [{ el: '[data-testid="basisInput"]', key: 'Escape' }, { wait: 120 }, { focus: '[data-testid="open"]' }, { click: '[data-testid="open"]' }, { wait: 220 }, { click: '[data-testid="apply"]' }, { wait: 220 }] },
            { kind: 'hidden', selector: '[data-testid="dialog"]' },
            { kind: 'styleIs', selector: 'html', prop: 'overflow', value: 'visible' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: '$focus: moving the keyboard yourself',
      objective: 'Build keyboard navigation with $focus, .within() and .wrap().',
      brief: `\`$focus\` is the toolbox behind the trap:\n\n| call | does |\n| --- | --- |\n| \`$focus.next()\` / \`previous()\` | move relative to the element that has focus |\n| \`$focus.first()\` / \`last()\` | jump to the ends |\n| \`$focus.within(el)\` | scope the search to \`el\` (your current element by default) |\n| \`$focus.wrap()\` | let \`next\`/\`previous\` roll around the ends |\n| \`$focus.focus(el)\` | focus any element, with the timing handled for you |\n| \`$focus.focusable(el)\` | is this element focusable? |\n\nThe chain reads left to right: \`$focus.within($refs.rows).last()\` means "inside that container, go to the last focusable element".`,
      example: {
        code: `<div x-ref="rows" @keydown.right="$focus.wrap().next()" @keydown.arrowleft="$focus.wrap().previous()">
  <button tabindex="0">35</button>
  <button tabindex="0">40</button>
</div>`,
        note: 'Arrow keys on the container; each child only has to be focusable.'
      },
      starter: `<div x-data="{ ages: ${sq(AGES)} }">
  <div data-testid="rows">
    <template x-for="a in ages" :key="a">
      <button data-testid="cell" :data-age="a" x-text="a" tabindex="0"></button>
    </template>
  </div>
  <button data-testid="first">first age</button>
  <button data-testid="last">last age</button>
</div>`,
      solution: `<div x-data="{ ages: ${sq(AGES)}, where: 'nothing yet' }"
     @focusin="where = $event.target.dataset.age || where">
  <p class="muted">keyboard is on age <b data-testid="where" x-text="where"></b></p>
  <div data-testid="rows" x-ref="rows"
       @keydown.right.prevent="$focus.wrap().next()"
       @keydown.left.prevent="$focus.wrap().previous()">
    <template x-for="a in ages" :key="a">
      <button data-testid="cell" :data-age="a" x-text="a" tabindex="0" style="margin-right:6px"></button>
    </template>
  </div>
  <div class="row">
    <button data-testid="first" @click="$focus.within($refs.rows).first()">first age</button>
    <button data-testid="last" @click="$focus.within($refs.rows).last()">last age</button>
  </div>
</div>`,
      hints: [
        'Bind the arrow keys on the container with `@keydown.right` and `@keydown.left`; `.prevent` stops the page scrolling.',
        '`.wrap()` is what makes the ends of the list roll around; without it the last element goes nowhere.',
        '`$focus.within($refs.rows).first()` scopes the jump to the row container — the buttons themselves need `tabindex="0"` (or be real buttons, as here).'
      ],
      tasks: [
        {
          id: 't1',
          skill: '$focus',
          text: 'The two jump buttons must use `$focus.within($refs.rows)` scoped to the row container, and the arrow keys must use `wrap()`.',
          checks: [
            { kind: 'code', pattern: '\\$focus\\.within\\(\\$refs\\.rows\\)\\.first\\(\\)' },
            { kind: 'code', pattern: '\\$focus\\.within\\(\\$refs\\.rows\\)\\.last\\(\\)' },
            { kind: 'code', pattern: '\\$focus\\.wrap\\(\\)\\.next\\(\\)' },
            { kind: 'code', pattern: '\\$focus\\.wrap\\(\\)\\.previous\\(\\)' }
          ]
        },
        {
          id: 't2',
          skill: '$focus',
          text: `"first age" must land on ${AGES[0]} and the right arrow must walk to the next age, one press at a time.`,
          checks: [
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[0]), do: [{ click: '[data-testid="first"]' }, { wait: 150 }] },
            { kind: 'focused', selector: ':is([data-age="' + AGES[0] + '"])' },
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[1]), do: [{ el: '[data-age="' + AGES[0] + '"]', key: 'ArrowRight' }, { wait: 150 }] },
            { kind: 'focused', selector: ':is([data-age="' + AGES[1] + '"])' },
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[2]), do: [{ el: '[data-age="' + AGES[1] + '"]', key: 'ArrowRight' }, { wait: 150 }] }
          ]
        },
        {
          id: 't3',
          skill: '$focus',
          text: `Wrap-around: the right arrow from the last age (${AGES[AGES.length - 1]}) must return to ${AGES[0]}, and the left arrow from the first must jump back to the last.`,
          checks: [
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[0]), do: [{ click: '[data-testid="last"]' }, { wait: 150 }, { el: '[data-age="' + AGES[AGES.length - 1] + '"]', key: 'ArrowRight' }, { wait: 150 }] },
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[AGES.length - 1]), do: [{ el: '[data-age="' + AGES[0] + '"]', key: 'ArrowLeft' }, { wait: 150 }] },
            { kind: 'text', selector: '[data-testid="where"]', value: String(AGES[AGES.length - 2]), do: [{ el: '[data-age="' + AGES[AGES.length - 1] + '"]', key: 'ArrowLeft' }, { wait: 150 }] }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'x-anchor: menus that stay attached',
      objective: 'Anchor a popover to its trigger, with an offset and manual styling.',
      brief: `\`x-anchor="$refs.trigger"\` sets the element's \`position\` and coordinates so it sits next to the trigger — **below** by default, and flipped above automatically when there is no room. Placement modifiers: \`.top\`, \`.bottom\`, \`.left\`, \`.right\`, plus \`-start\` and \`-end\` for alignment. \`.offset.8\` opens a gap; \`.noflip\` refuses to flip; \`.fixed\` uses fixed positioning so the popover escapes a scrolling or \`overflow: hidden\` ancestor.\n\nWith \`.no-style\` Alpine sets *no* styles at all, and you read \`$anchor.x\` / \`$anchor.y\` yourself. Those coordinates live in the coordinate space of the active strategy: with \`.fixed\` you must write \`position: fixed\` yourself, or the numbers land in the wrong place.`,
      example: {
        code: `<button x-ref="trigger" @click="open = !open">basis</button>
<div x-show="open" x-anchor.bottom-start.offset.6="$refs.trigger">
  menu…
</div>`,
        note: 'One directive replaces a pile of measurement code.'
      },
      starter: `<div x-data="{ open: false }" style="position:relative">
  <button data-testid="trigger" x-ref="trigger" @click="open = !open">choose basis</button>
  <div data-testid="menu" x-show="open" style="border:1px solid #253253;border-radius:8px;padding:8px">
    <button data-testid="item">2015 VBT</button>
  </div>
</div>`,
      solution: `<div x-data="{ open: false, readout: '' }" style="position:relative">
  <button data-testid="trigger" x-ref="trigger" @click="open = !open">choose basis</button>

  <div data-testid="menu" x-show="open" x-anchor.bottom-start.offset.6="$refs.trigger"
       style="border:1px solid #253253;border-radius:8px;padding:8px;background:#0e1424">
    <button data-testid="item" x-text="'${BASES[0].label}'"></button>
    <button data-testid="item" x-text="'${BASES[1].label}'"></button>
  </div>

  <p data-testid="coords" class="muted" style="margin:0" x-anchor.no-style.right.offset.6="$refs.trigger"
     x-bind:style="{ position: 'absolute', margin: 0, top: Math.round($anchor.y) + 'px', left: Math.round($anchor.x) + 'px' }"
     x-text="'x=' + Math.round($anchor.x) + ' y=' + Math.round($anchor.y)"></p>

  <div style="height:120px;overflow:hidden;border:1px dashed #253253;margin-top:80px">
    <button data-testid="fixedTrigger" x-ref="fixedTrigger" @click="open = !open">in a clipped box</button>
    <div data-testid="fixedMenu" x-show="open" x-anchor.fixed.no-style="$refs.fixedTrigger"
         x-bind:style="{ position: 'fixed', top: Math.round($anchor.y) + 'px', left: Math.round($anchor.x) + 'px' }"
         style="border:1px solid #253253;border-radius:8px;padding:8px;background:#0e1424">escapes the clip</div>
  </div>
</div>`,
      hints: [
        'Placement and offset are modifiers: `x-anchor.bottom-start.offset.6="$refs.trigger"`.',
        'The `$anchor` magic belongs to the element carrying `x-anchor` — on any other element it throws, so the readout lives on an anchored element of its own.',
        'For the clipped box, `.fixed` plus `.no-style` means writing `position: fixed` from the anchor coordinates yourself.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-anchor',
          text: 'Opening must place the menu below its trigger, in the same column, offset by the 6px you asked for — with the two bases listed.',
          checks: [
            { kind: 'code', pattern: 'x-anchor\\.bottom-start\\.offset\\.6="\\$refs\\.trigger"' },
            { kind: 'shown', selector: '[data-testid="menu"]', do: [{ click: '[data-testid="trigger"]' }, { wait: 200 }] },
            { kind: 'below', selector: '[data-testid="menu"]', of: '[data-testid="trigger"]' },
            { kind: 'list', selector: '[data-testid="item"]', values: [BASES[0].label, BASES[1].label] }
          ]
        },
        {
          id: 't2',
          skill: '$anchor',
          text: 'With `.no-style`, the popped-up element inside the clipped box must still be positioned by your own `x-bind:style` — and it must report `position: fixed`, which is what lets it escape the clip.',
          checks: [
            { kind: 'styledByHand', selector: '[data-testid="fixedMenu"]', do: [{ click: '[data-testid="trigger"]' }, { wait: 140 }, { click: '[data-testid="fixedTrigger"]' }, { wait: 240 }] }
          ]
        },
        {
          id: 't3',
          skill: '$anchor',
          text: 'The `$anchor` readout — an element anchored by hand with `.no-style` — must show real coordinates, and those numbers must be where the element actually sits.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="coords"]', pattern: '^x=\\d+ y=\\d+$' },
            { kind: 'styledByHand', selector: '[data-testid="coords"]' },
            { kind: 'anchorMatches', selector: '[data-testid="coords"]', readout: '[data-testid="coords"]' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a reserve-approval dialog',
      objective: 'A keyboard-complete approval dialog: trapped focus, Escape to close, focus returned, status recorded.',
      scenario: `An IBNR reserve movement of +12.4 % needs sign-off. The dialog takes a note, an approver from ${sq(APPROVERS)}, and an approve-or-reject decision. Auditors check this screen by keyboard only, so: focus must land on the note when it opens, Escape must close it (the trap will not do that for you), Tab must cycle inside while it is up, page scrolling must be frozen, and focus must come back to the "escalate" button afterwards with the decision recorded.`,
      brief: `Elements: \`data-testid="escalate"\` (the trigger), \`data-testid="modal"\` (trapped, scroll-locked), \`data-testid="note"\` (first focusable), \`data-testid="approver"\` (a \`<select>\` of the three approvers), \`data-testid="approve"\`, \`data-testid="reject"\`, \`data-testid="status"\` (fallback text \`awaiting sign-off\` while nothing has been decided), and \`data-testid="where"\` reporting the id of the focused control.`,
      starter: `<div x-data="{ open: false, note: '', approver: 0, status: 'awaiting sign-off' }">
  <button data-testid="escalate" @click="open = true">escalate the reserve movement</button>
  <div data-testid="modal" x-show="open">
    <textarea data-testid="note" placeholder="why is the movement so large?"></textarea>
    <select data-testid="approver"><option>approver…</option></select>
    <button data-testid="approve">approve</button>
    <button data-testid="reject">reject</button>
  </div>
</div>`,
      solution: `<div x-data="{
  open: false, note: '', approver: 0, status: 'awaiting sign-off', where: 'nowhere',
  approvers: ${sq(APPROVERS)},
  decide(verdict) {
    this.status = verdict + ' by ' + this.approvers[this.approver]
    this.open = false
  }
}">
  <p>decision: <b data-testid="status" x-text="status"></b> · keyboard is on <b data-testid="where" x-text="where"></b></p>
  <button data-testid="escalate" @click="open = true">escalate the reserve movement</button>
  <div data-testid="modal" x-show="open" x-trap.noscroll="open" @keydown.escape="open = false"
       @focusin="where = $event.target.dataset.testid || where"
       style="border:1px solid #253253;border-radius:10px;padding:12px;background:#0e1424">
    <h4 style="margin:0 0 8px">Reserve movement +12.4 % — sign-off</h4>
    <textarea data-testid="note" x-model="note" placeholder="why is the movement so large?"></textarea>
    <label>approver
      <select data-testid="approver" x-model.number="approver">
        <template x-for="(who, i) in approvers" :key="who">
          <option :value="i" x-text="who"></option>
        </template>
      </select>
    </label>
    <div class="row">
      <button data-testid="approve" @click="decide('approved')">approve</button>
      <button data-testid="reject" @click="decide('rejected')">reject</button>
    </div>
  </div>
</div>`,
      hints: [
        'Same trap recipe as the step: `x-trap.noscroll="open"` on the modal, plus `@keydown.escape`.',
        'The first focusable in the dialog is the textarea, so opening should put the keyboard there with no extra work.',
        'The decision buttons close the dialog; the trap then returns focus to `escalate` on its own.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-trap',
          text: 'Opening must trap the keyboard on the note field, freeze scrolling, and leave the status untouched at `awaiting sign-off`.',
          checks: [
            { kind: 'text', selector: '[data-testid="where"]', value: 'note', do: [{ el: '[data-testid="note"]', key: 'Escape' }, { wait: 120 }, { click: '[data-testid="escalate"]' }, { wait: 240 }] },
            { kind: 'shown', selector: '[data-testid="modal"]' },
            { kind: 'text', selector: '[data-testid="status"]', value: 'awaiting sign-off' },
            { kind: 'styleIs', selector: 'html', prop: 'overflow', value: 'hidden' }
          ]
        },
        {
          id: 't2',
          skill: 'x-trap',
          text: `Tab from the last control must wrap back to the note. Then Escape must close the modal and give the keyboard back to \`escalate\` with nothing decided.`,
          checks: [
            { kind: 'text', selector: '[data-testid="where"]', value: 'note', do: [{ el: '[data-testid="note"]', key: 'Escape' }, { wait: 140 }, { focus: '[data-testid="escalate"]' }, { click: '[data-testid="escalate"]' }, { wait: 220 }, { focus: '[data-testid="reject"]' }, { el: '[data-testid="reject"]', key: 'Tab' }, { wait: 150 }] },
            { kind: 'focused', selector: '[data-testid="escalate"]', do: [{ el: '[data-testid="note"]', key: 'Escape' }, { wait: 140 }, { focus: '[data-testid="escalate"]' }, { click: '[data-testid="escalate"]' }, { wait: 240 }, { focus: '[data-testid="note"]' }, { el: '[data-testid="note"]', key: 'Escape' }, { wait: 260 }] },
            { kind: 'hidden', selector: '[data-testid="modal"]' },
            { kind: 'text', selector: '[data-testid="status"]', value: 'awaiting sign-off' }
          ]
        },
        {
          id: 't3',
          skill: 'x-trap',
          text: `Approving records the decision and closes the dialog: the status must read \`approved by ${APPROVERS[1]}\` and the keyboard must be back on \`escalate\`.`,
          checks: [
            { kind: 'text', selector: '[data-testid="status"]', value: 'approved by ' + APPROVERS[1], do: [
              { el: '[data-testid="note"]', key: 'Escape' },
              { wait: 140 },
              { focus: '[data-testid="escalate"]' },
              { click: '[data-testid="escalate"]' },
              { wait: 220 },
              { type: '[data-testid="note"]', value: 'IBNR +12.4 %: late-reported large claims' },
              { el: '[data-testid="approver"]', select: '1' },
              { click: '[data-testid="approve"]' },
              { wait: 200 }
            ] },
            { kind: 'focused', selector: '[data-testid="escalate"]' },
            { kind: 'hidden', selector: '[data-testid="modal"]' }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — qx tooltips on a mortality table',
      objective: 'A tooltip per row, anchored to the cell you clicked, opening above and escaping a clipped panel.',
      scenario: `The mortality table lists ages ${AGES.join(', ')} with their \`qₓ\`. Reviewers want the surrounding evidence — \`lₓ\` and ₁₀pₓ — as a tooltip pinned to the age cell they clicked. Rows near the bottom of a short, clipped panel must still show their tooltip whole, which is why one variant uses fixed positioning with its own coordinates.`,
      brief: `Build from ${sq(TABLE)}. Elements: one \`data-testid="row"\` per age with \`data-testid="age"\` and a click target \`data-testid="cell"\`; \`data-testid="tooltip"\` anchored **above** its row with a 6px offset; inside it, \`data-testid="lx"\` and \`data-testid="p10"\`; \`data-testid="close"\` to dismiss. The second, clipped panel (fixed height, \`overflow:hidden\`) carries \`data-testid="clipTrigger"\` and \`data-testid="clipTip"\` using fixed positioning from the anchor coordinates.`,
      starter: `<div x-data="{ sel: null, rows: ${sq(TABLE)} }">
  <div data-testid="rows"></div>
</div>`,
      solution: `<div x-data="{ sel: null, rows: ${sq(TABLE)} }">
  <div data-testid="rows">
    <template x-for="r in rows" :key="r.age">
      <div data-testid="row" :data-age="r.age" style="display:flex;gap:12px;align-items:center;padding:6px 0">
        <button data-testid="cell" :id="'age-' + r.age" @click="sel = (sel === r.age ? null : r.age)" x-text="'age ' + r.age"></button>
        <span x-text="'qₓ ' + r.qx.toFixed(5)"></span>
        <div data-testid="tooltip" x-show="sel === r.age" x-anchor.top.offset.6="document.getElementById('age-' + r.age)"
             style="border:1px solid #253253;border-radius:8px;padding:8px;background:#0e1424;min-width:190px">
          <b>age <span x-text="r.age"></span></b>
          <div>lₓ <span data-testid="lx" x-text="r.lx"></span></div>
          <div>₁₀pₓ <span data-testid="p10" x-text="r.p10.toFixed(4)"></span></div>
          <button data-testid="close" @click="sel = null">close</button>
        </div>
      </div>
    </template>
  </div>

  <div data-testid="clip" style="height:90px;overflow:hidden;border:1px dashed #253253;position:relative;margin-top:40px">
    <button data-testid="clipTrigger" x-ref="clipTrigger" @click="sel = sel === -1 ? null : -1">rates behind the fold</button>
    <div data-testid="clipTip" x-show="sel === -1" x-anchor.fixed.no-style="$refs.clipTrigger"
         x-bind:style="{ position: 'fixed', top: Math.round($anchor.y) + 'px', left: Math.round($anchor.x) + 'px' }"
         style="border:1px solid #253253;border-radius:8px;padding:8px;background:#0e1424">q₅₀ = ${life.qx(50).toFixed(5)}</div>
  </div>
</div>`,
      hints: [
        'An \`x-ref\` inside a template loop ends up pointing at the last row, so anchor by id instead: \`x-anchor="document.getElementById(\'age-\' + r.age)"\` — a documented pattern.',
        '`.top` places the tooltip above the cell; `.offset.6` keeps a 6px gap.',
        `For the clipped panel, \`.fixed\` + \`.no-style\` + your own \`x-bind:style\` is the combination that survives \`overflow:hidden\`.`
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-anchor',
          text: `All ${TABLE.length} ages must be listed, and clicking the cell for age ${LAST} must open a tooltip above that row carrying lₓ = ${LASTROW.lx} and ₁₀pₓ = ${LASTROW.p10.toFixed(4)}.`,
          checks: [
            { kind: 'count', selector: '[data-testid="row"]', value: TABLE.length },
            { kind: 'shown', selector: '[data-age="' + LAST + '"] [data-testid="tooltip"]', do: [{ click: '[data-age="' + LAST + '"] [data-testid="cell"]' }, { wait: 240 }] },
            { kind: 'above', selector: '[data-age="' + LAST + '"] [data-testid="tooltip"]', of: '[data-age="' + LAST + '"]' },
            { kind: 'text', selector: '[data-age="' + LAST + '"] [data-testid="lx"]', value: String(LASTROW.lx) },
            { kind: 'text', selector: '[data-age="' + LAST + '"] [data-testid="p10"]', value: LASTROW.p10.toFixed(4) }
          ]
        },
        {
          id: 't2',
          skill: '$anchor',
          text: 'The tooltip must close again — `close` dismisses it and it disappears from the layout entirely (no stale panel left behind).',
          checks: [
            { kind: 'hidden', selector: '[data-age="' + LAST + '"] [data-testid="tooltip"]', do: [{ click: '[data-age="' + LAST + '"] [data-testid="cell"]' }, { wait: 200 }, { click: '[data-age="' + LAST + '"] [data-testid="close"]' }, { wait: 200 }] }
          ]
        },
        {
          id: 't3',
          skill: '$anchor',
          text: 'In the clipped panel the tip must come up with fixed positioning and real coordinates, and it must still be laid out below its trigger.',
          checks: [
            { kind: 'styledByHand', selector: '[data-testid="clipTip"]', do: [{ click: '[data-testid="clipTrigger"]' }, { wait: 200 }] },
            { kind: 'stacked', selector: '[data-testid="clipTip"]', of: '[data-testid="clipTrigger"]' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-trap',
      q: 'A dialog has `x-trap="open"`. The user presses Escape. What happens?',
      options: [
        'The trap deactivates and the dialog closes',
        'Nothing — `x-trap` never deactivates on its own; you bind Escape yourself',
        'The trap deactivates but the dialog stays open',
        'Alpine clicks the first button inside the trap'
      ],
      answer: 1,
      why: 'The trap handles Tab, Shift+Tab, outside clicks and focus return. Escape is deliberately left to you (`@keydown.escape="open = false"`).',
      distractors: {
        0: 'The trap has no idea that Escape means "close" — it would have to guess which element to click.',
        2: 'It does not deactivate at all, so nothing is returned and nothing closes.'
      }
    },
    {
      id: 'q2',
      type: 'multi',
      skill: 'x-trap',
      q: 'Which are `x-trap` modifiers?',
      options: ['.noscroll', '.noautofocus', '.noreturn', '.inert'],
      answers: [0, 1, 2, 3],
      why: 'All four: freeze scrolling, do not move focus in on activation, do not return focus on deactivation, and make everything outside the trap inert.',
      distractors: {}
    },
    {
      id: 'q3',
      type: 'mc',
      skill: '$focus',
      q: 'Inside a table, you want the right-arrow key to move focus to the next row and roll from the bottom back to the top. Which expression?',
      options: [
        '`$focus.next()`',
        '`$focus.wrap().next()`',
        '`$focus.within($refs.rows).next()`',
        '`$focus.focus($focus.getNext())`'
      ],
      answer: 1,
      why: '`.wrap()` makes `next()` roll around the last element; add `.within($refs.rows)` too when the search should be scoped to the table.',
      distractors: { 0: 'Without `wrap()` the last row is the end of the road.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-anchor',
      q: 'Where do you use `$anchor`?',
      options: [
        'Anywhere in the same `x-data` component',
        'Inside the element carrying `x-anchor`, to read `$anchor.x` / `$anchor.y`',
        'Only on the `document.documentElement`',
        'In the `x-anchor` expression itself, before positioning happens'
      ],
      answer: 1,
      why: 'The magic belongs to the anchored element — it reports where that element ended up.',
      distractors: {
        0: 'A magic is scoped to the element that owns it, not to the whole component.',
        3: 'In the expression the positioning has not happened yet; `$anchor` describes the result, so it is read inside the anchored element.'
      }
    },
    {
      id: 'q5',
      type: 'multi',
      skill: 'x-anchor',
      q: 'An anchored dropdown is being clipped by a parent with `overflow: hidden`. Which responses are right?',
      options: [
        'Re-anchor with `.fixed` so the popover uses fixed positioning',
        'Use `.no-style` and set `position: fixed` yourself from `$anchor.x` / `$anchor.y`',
        'Add `.noflip` to the directive',
        'Remove the parent\'s `overflow: hidden`'
      ],
      answers: [0, 1, 3],
      why: '`.fixed` (or hand-written fixed positioning) escapes the clip; fixing the ancestor is the other honest answer.',
      distractors: { 2: '`.noflip` only stops the automatic flip when there is no room — it does not escape clipping.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: 'x-anchor',
      q: 'Which modifier tells `x-anchor` to leave styling entirely to you? Answer with the modifier only, including its dot.',
      accept: ['.no-style', 'no-style'],
      why: '`.no-style` — then `$anchor.x` and `$anchor.y` are yours to apply, and so is the `position` mode.'
    }
  ]
}
