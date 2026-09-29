/* Module 15 — x-transition.
 * Matches: /directives/transition */

import { triangle, chainLadder, sq } from './data.js'

const cl = chainLadder(triangle)
const ROWS = triangle.years
  .map((y, i) => ({ year: y, ibnr: Number(cl.ibnr[i].toFixed(1)) }))
  .filter(r => r.ibnr > 0)
const TOTAL = Number(ROWS.reduce((n, r) => n + r.ibnr, 0).toFixed(1))

/** Class-based transition CSS, provided so the phases have something to animate. */
const CSS = `<style>
  .sl-enter  { transition: opacity 700ms ease, transform 700ms ease; }
  .sl-enter-start { opacity: 0; transform: translateY(10px); }
  .sl-enter-end   { opacity: 1; transform: none; }
  .sl-leave  { transition: opacity 700ms ease; }
  .sl-leave-start { opacity: 1; }
  .sl-leave-end   { opacity: 0; }
</style>`

export default {
  id: 'm15',
  num: 15,
  title: 'Transitions — motion with meaning',
  blurb: 'x-transition turns show/hide into a glide: helper modifiers for the common cases, classes for full control.',
  goal: 'Use transitions where they explain a change, and know exactly which class or style is applied when.',
  intro: `\`x-transition\` works on the element that carries \`x-show\`; keep that in mind, because \`x-if\` **cannot** be transitioned at all.\n\n**The helper.** A bare \`x-transition\` fades *and* scales: 150ms entering, 75ms leaving. Modifiers refine it: \`.duration.500ms\` and \`.delay.250ms\` set the clock, \`.opacity\` keeps opacity only, \`.scale.90\` scales only (and with \`.origin.top\`, \`.origin.bottom.left\` and friends, picks the anchor point).\n\n**The classes.** When you want your own CSS to own the look, apply classes per phase:\n\n| directive | when the class is on |\n| --- | --- |\n| \`x-transition:enter\` | the whole entering phase |\n| \`x-transition:enter-start\` | before insertion, lifted one frame after |\n| \`x-transition:enter-end\` | from that frame until the transition ends |\n| \`x-transition:leave\` | the whole leaving phase |\n| \`x-transition:leave-start\` | the instant leaving begins, lifted one frame later |\n| \`x-transition:leave-end\` | from that frame until the element is removed/hidden |`,
  skills: ['x-transition', '.duration', '.delay', '.opacity', '.scale', 'x-transition:enter', 'x-transition:leave', 'x-show vs x-if'],
  docRefs: [
    { label: 'x-transition', url: 'https://alpinejs.dev/directives/transition' },
    { label: 'Web Animations API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API' }
  ],
  mastery: [
    'Fade, scale and time an element with `x-transition` and its modifiers',
    'Drive a transition from your own CSS with the six phase classes',
    'Know the default timings (150ms in, 75ms out) and override them precisely',
    'Know why `x-if` cannot be transitioned, and choose between `x-show` and `x-if` on purpose'
  ],
  units: [
    {
      id: 's1',
      title: 'The transition helper',
      objective: 'Time a transition with .duration, .delay, .opacity and .scale.',
      brief: `A bare \`x-transition\` is a pleasant default: fade plus a small scale, 150ms in and 75ms out. Everything else is a modifier.\n\n\`\`.duration.600ms\`\` sets both directions; \`x-transition:enter.duration.600ms\` and \`x-transition:leave.duration.200ms\` set them apart. \`\`.delay.400ms\` waits before starting. \`\`.opacity\` drops the scale; \`\`.scale.90\` drops the fade and scales to 90%, with \`\`.origin.top\` (also \`bottom\`, \`left\`, \`right\`, and pairs like \`.origin.top.right\`) choosing the anchor.\n\nThe element is still *in the layout* for the whole leaving phase — \`display\` only flips when the transition finishes. Your checks can see that window.`,
      example: {
        code: `<div x-show="open" x-transition.duration.500ms>fades and scales over half a second</div>
<div x-show="open" x-transition.opacity.delay.200ms>fades only, after a 200ms pause</div>`,
        note: 'Two elements, one flag — different motion for different roles.'
      },
      starter: `<div x-data="{ open: true }">
  <button data-testid="toggle" @click="open = !open">show or hide the banner</button>
  <div data-testid="banner" x-show="open" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    IBNR movement +12.4 % this quarter
  </div>
</div>`,
      solution: `<div x-data="{ open: true, delayed: false }">
  <div class="row">
    <button data-testid="toggle" @click="open = !open">show or hide the banner</button>
    <button data-testid="slow" @click="delayed = !delayed">toggle the delayed card</button>
  </div>
  <div data-testid="banner" x-show="open" x-transition.duration.600ms
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    IBNR movement +12.4 % this quarter
  </div>
  <div data-testid="fadeOnly" x-show="open" x-transition.opacity.duration.600ms
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    fades, never scales
  </div>
  <div data-testid="zoom" x-show="open" x-transition.scale.90.origin.top.duration.600ms
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    grows from its top edge
  </div>
  <div style="margin-top:8px">
    <div data-testid="delayed" x-show="delayed" x-transition.delay.400ms.duration.400ms
         style="border:1px solid #253253;border-radius:8px;padding:10px">appears after a pause</div>
  </div>
</div>`,
      hints: [
        'The bare helper is already a fade + scale; add `.duration.600ms` to slow it down.',
        '`.opacity` and `.scale` are alternatives: each one *removes* the other effect.',
        'For the delayed card, the pause comes from `.delay.400ms` and it needs its own flag — a second `x-data` keeps the starter simple.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '.duration',
          text: 'The banner must use the helper with a 600ms duration; hiding it must leave it in the layout for a moment before it disappears, and showing it again must catch it mid-fade.',
          checks: [
            { kind: 'code', pattern: 'x-transition\\.duration\\.600ms' },
            { kind: 'shown', selector: '[data-testid="banner"]' },
            { kind: 'textHas', selector: '[data-testid="banner"]', value: 'IBNR movement', do: [{ click: '[data-testid="toggle"]' }, { wait: 120 }] },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.05, hi: 0.99 },
            { kind: 'hidden', selector: '[data-testid="banner"]', do: [{ wait: 700 }] },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.02, hi: 0.97, do: [{ click: '[data-testid="toggle"]' }, { wait: 300 }] },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.99, hi: 1.01, do: [{ wait: 600 }] }
          ]
        },
        {
          id: 't2',
          skill: '.scale',
          text: 'The `fadeOnly` card must never scale — even mid-transition its transform stays `none` — while `zoom` must scale to 90 % from its top edge.',
          checks: [
            { kind: 'code', pattern: 'x-transition\\.opacity\\.duration\\.600ms' },
            { kind: 'code', pattern: 'x-transition\\.scale\\.90\\.origin\\.top\\.duration\\.600ms' },
            { kind: 'styleBetween', selector: '[data-testid="fadeOnly"]', prop: 'opacity', lo: 0.02, hi: 0.97, do: [{ click: '[data-testid="toggle"]' }, { wait: 350 }] },
            { kind: 'styleMatch', selector: '[data-testid="fadeOnly"]', prop: 'transform', pattern: '^(none|matrix\\(1, 0, 0, 1, 0, 0\\))$' },
            { kind: 'styleMatch', selector: '[data-testid="zoom"]', prop: 'transform', pattern: '^matrix\\(0?\\.\\d+' },
            { kind: 'styleMatch', selector: '[data-testid="zoom"]', prop: 'transform-origin', pattern: '^[\\d.]+px 0px' }
          ]
        },
        {
          id: 't3',
          skill: '.delay',
          text: 'The delayed card must wait 400ms and then take 400ms: right after its toggle it must still be fully transparent, and complete by 900ms.',
          checks: [
            { kind: 'code', pattern: 'x-transition\\.delay\\.400ms\\.duration\\.400ms' },
            { kind: 'styleBetween', selector: '[data-testid="delayed"]', prop: 'opacity', lo: -0.01, hi: 0.2, do: [{ click: '[data-testid="slow"]' }, { wait: 150 }] },
            { kind: 'styleBetween', selector: '[data-testid="delayed"]', prop: 'opacity', lo: 0.99, hi: 1.01, do: [{ wait: 800 }] }
          ]
        }
      ]
    },
{
      id: 's2',
      title: 'Class-based transitions',
      objective: 'Hand the motion to your own CSS with the six phase classes.',
      brief: `Instead of the helper's inline animation, name classes for each phase and let CSS do the rest:\n\n\`\`\`html\n<div x-show="open"\n     x-transition:enter="sl-enter"\n     x-transition:enter-start="sl-enter-start"\n     x-transition:enter-end="sl-enter-end"\n     x-transition:leave="sl-leave"\n     x-transition:leave-start="sl-leave-start"\n     x-transition:leave-end="sl-leave-end">…</div>\n\`\`\`\n\nThe stylesheet in this cell provides those six classes, with a 700ms transition attached to \`sl-enter\` and \`sl-leave\`. Watch the order: \`*-start\` classes exist for exactly **one frame**, then the \`*-end\` class takes over until the transition finishes. That is why a *start* class is the "from" state and an *end* class is the "to" state.`,
      example: {
        code: `/* .box-enter { transition: opacity 500ms }  .box-enter-start { opacity: 0 }  .box-enter-end { opacity: 1 } */
<div x-show="open" x-transition:enter="box-enter" x-transition:enter-start="box-enter-start" x-transition:enter-end="box-enter-end">…</div>`,
        note: 'The helper is a shortcut; these six classes are the machinery underneath.'
      },
      starter: CSS + `
<div x-data="{ open: false }">
  <button data-testid="toggle" @click="open = !open">show the valuation panel</button>
  <div data-testid="panel" x-show="open" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    Valuation panel — basis 2015 VBT, rate 4.5 %
  </div>
</div>`,
      solution: CSS + `
<div x-data="{ open: false }">
  <button data-testid="toggle" @click="open = !open">show the valuation panel</button>
  <div data-testid="panel" x-show="open"
       x-transition:enter="sl-enter" x-transition:enter-start="sl-enter-start" x-transition:enter-end="sl-enter-end"
       x-transition:leave="sl-leave" x-transition:leave-start="sl-leave-start" x-transition:leave-end="sl-leave-end"
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    Valuation panel — basis 2015 VBT, rate 4.5 %
  </div>
</div>`,
      hints: [
        'Six directives, six class names — the names must match the stylesheet above.',
        'The `-start` class is the "from" state and is removed one frame in; the `-end` class carries the "to" state.',
        'Because `sl-enter` carries the CSS transition, Alpine can measure the 700ms duration and knows when to clean up.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-transition:enter',
          text: 'All six phase directives must be wired to the provided classes. When the panel enters, it must wear `sl-enter` and `sl-enter-end` — and no longer `sl-enter-start` — while its opacity is still climbing.',
          checks: [
            { kind: 'code', pattern: 'x-transition:enter="sl-enter"' },
            { kind: 'code', pattern: 'x-transition:enter-start="sl-enter-start"' },
            { kind: 'code', pattern: 'x-transition:enter-end="sl-enter-end"' },
            { kind: 'code', pattern: 'x-transition:leave="sl-leave"' },
            { kind: 'code', pattern: 'x-transition:leave-start="sl-leave-start"' },
            { kind: 'code', pattern: 'x-transition:leave-end="sl-leave-end"' },
            { kind: 'klass', selector: '[data-testid="panel"]', value: 'sl-enter', do: [{ click: '[data-testid="toggle"]' }, { wait: 80 }] },
            { kind: 'klass', selector: '[data-testid="panel"]', value: 'sl-enter-end' },
            { kind: 'noKlass', selector: '[data-testid="panel"]', value: 'sl-enter-start' },
            { kind: 'shown', selector: '[data-testid="panel"]', do: [{ wait: 700 }] },
            { kind: 'styleBetween', selector: '[data-testid="panel"]', prop: 'opacity', lo: 0.02, hi: 0.97, do: [{ click: '[data-testid="toggle"]' }, { wait: 350 }] },
            { kind: 'klass', selector: '[data-testid="panel"]', value: 'sl-leave' }
          ]
        },
        {
          id: 't2',
          skill: 'x-transition:enter',
          text: 'Once the enter finishes the classes must be cleaned up: no `sl-enter`, no `sl-enter-end`, no `sl-leave` — and the panel fully opaque.',
          checks: [
            { kind: 'noKlass', selector: '[data-testid="panel"]', value: 'sl-enter', do: [{ wait: 600 }, { click: '[data-testid="toggle"]' }, { wait: 800 }] },
            { kind: 'shown', selector: '[data-testid="panel"]' },
            { kind: 'noKlass', selector: '[data-testid="panel"]', value: 'sl-enter-end' },
            { kind: 'noKlass', selector: '[data-testid="panel"]', value: 'sl-leave' },
            { kind: 'styleBetween', selector: '[data-testid="panel"]', prop: 'opacity', lo: 0.99, hi: 1.01 }
          ]
        },
        {
          id: 't3',
          skill: 'x-transition:leave',
          text: 'Leaving must be staged too: 80ms in, the panel still wears `sl-leave` and `sl-leave-end` and is still in the layout; after the 700ms it is gone.',
          checks: [
            { kind: 'klass', selector: '[data-testid="panel"]', value: 'sl-leave', do: [{ click: '[data-testid="toggle"]' }, { wait: 80 }] },
            { kind: 'klass', selector: '[data-testid="panel"]', value: 'sl-leave-end' },
            { kind: 'styleBetween', selector: '[data-testid="panel"]', prop: 'opacity', lo: 0.05, hi: 0.99 },
            { kind: 'hidden', selector: '[data-testid="panel"]', do: [{ wait: 800 }] },
            { kind: 'noKlass', selector: '[data-testid="panel"]', value: 'sl-leave' }
          ]
        }
      ]
    },
{
      id: 's3',
      title: 'x-show keeps the node, x-if destroys it',
      objective: 'Pick the directive that matches the job — only one of them can transition.',
      brief: `A leaving transition needs the element to still be in the document while it fades. \`x-show\` does exactly that: it flips \`display\` when the transition finishes. \`x-if\` does **not support transitions at all** — it clones the template in on truth and destroys the node on falsity, so there is nothing left to animate on the way out.

That is the whole choice: \`x-show\` + \`x-transition\` when the element should animate, or when re-creating it is cheap; \`x-if\` when the subtree must genuinely not exist — a heavy chart, a block only some roles may see.`,
      example: {
        code: `<p x-show="notice" x-transition.duration.500ms>fades out, then display:none — the node stays</p>

<template x-if="audit"><p>created and destroyed — no transition is possible</p></template>`,
        note: 'Both are conditional rendering; only one of the two can be animated.'
      },
      starter: `<div x-data="{ notice: true, audit: false, rows: ${sq(ROWS)}, openYear: null }">
  <button data-testid="dismiss" @click="notice = false">dismiss the notice</button>
  <p data-testid="notice">Late-reported claims are loading the tail.</p>
  <button data-testid="audit" @click="audit = !audit">show the audit trail</button>
  <template x-if="audit">
    <p data-testid="auditBlock">41 manual overrides this quarter.</p>
  </template>
  <ul data-testid="list" style="list-style:none;padding:0">
    <template x-for="r in rows" :key="r.year">
      <li :data-year="r.year">
        <button data-testid="rowToggle" @click="openYear = openYear === r.year ? null : r.year">year <span x-text="r.year"></span></button>
        <div data-testid="detail" x-show="openYear === r.year" style="margin-top:6px">IBNR <b x-text="r.ibnr.toFixed(1)"></b></div>
      </li>
    </template>
  </ul>
</div>`,
      solution: `<div x-data="{ notice: true, audit: false, rows: ${sq(ROWS)}, openYear: null }">
  <button data-testid="dismiss" @click="notice = false">dismiss the notice</button>
  <p data-testid="notice" x-show="notice" x-transition.duration.600ms style="color:#8fb3ff">
    Late-reported claims are loading the tail —
    <span data-testid="noticeBody">${ROWS[ROWS.length - 1].year} carries ${(100 * ROWS[ROWS.length - 1].ibnr / TOTAL).toFixed(0)} % of the total IBNR of ${TOTAL}.</span>
  </p>

  <button data-testid="audit" @click="audit = !audit">show the audit trail</button>
  <template x-if="audit">
    <p data-testid="auditBlock">41 manual overrides this quarter — created and destroyed, so it cannot animate.</p>
  </template>

  <ul data-testid="list" style="list-style:none;padding:0">
    <template x-for="r in rows" :key="r.year">
      <li :data-year="r.year" style="border:1px solid #253253;border-radius:8px;padding:8px;margin:6px 0">
        <button data-testid="rowToggle" @click="openYear = openYear === r.year ? null : r.year">year <span x-text="r.year"></span></button>
        <div data-testid="detail" x-show="openYear === r.year" x-transition.duration.400ms style="margin-top:6px">
          IBNR <b x-text="r.ibnr.toFixed(1)"></b>
        </div>
      </li>
    </template>
  </ul>
</div>`,
      hints: [
        'The notice has to fade, so it needs `x-show` alongside `x-transition` — with `x-if` it would be deleted before anything could animate.',
        'The audit block stays on `x-if` on purpose: a heavy or sensitive block should not sit in the DOM at all.',
        'The row panels are `x-show` + `x-transition.duration.400ms`, so opening a row glides while the other rows keep their state.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-show',
          text: 'The notice must use `x-show` with a 600ms transition and never `x-if`; 300ms after dismissing it, it is still in the layout with its opacity on the way down.',
          checks: [
            { kind: 'code', pattern: 'x-show="notice"' },
            { kind: 'code', pattern: 'x-transition\\.duration\\.600ms' },
            { kind: 'noCode', pattern: 'x-if="notice"' },
            { kind: 'shown', selector: '[data-testid="notice"]', do: [{ click: '[data-testid="dismiss"]' }, { wait: 300 }] },
            { kind: 'styleBetween', selector: '[data-testid="notice"]', prop: 'opacity', lo: 0.02, hi: 0.97 }
          ]
        },
        {
          id: 't2',
          skill: 'x-show',
          text: 'Once the fade is done the notice is hidden but still in the document — the surviving inner span is the proof that `x-if` was not used.',
          checks: [
            { kind: 'hidden', selector: '[data-testid="notice"]', do: [{ wait: 700 }] },
            { kind: 'count', selector: '[data-testid="noticeBody"]', value: 1 }
          ]
        },
        {
          id: 't3',
          skill: 'x-if',
          text: 'The audit block is the opposite case: `x-if` must create it, and destroy it — present 400ms after showing, absent from the document one frame after hiding.',
          checks: [
            { kind: 'code', pattern: 'x-if="audit"' },
            { kind: 'shown', selector: '[data-testid="auditBlock"]', do: [{ click: '[data-testid="audit"]' }, { wait: 400 }] },
            { kind: 'count', selector: '[data-testid="auditBlock"]', value: 0, do: [{ click: '[data-testid="audit"]' }, { wait: 150 }] }
          ]
        },
        {
          id: 't4',
          skill: 'x-for',
          text: `Each year owns a detail panel; opening ${ROWS[1].year} reveals only that panel and catches it mid-fade, while ${ROWS[0].year} stays closed.`,
          checks: [
            { kind: 'count', selector: '[data-testid="detail"]', value: ROWS.length },
            { kind: 'hidden', selector: '[data-year="' + ROWS[0].year + '"] [data-testid="detail"]' },
            { kind: 'shown', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="detail"]', do: [{ click: '[data-year="' + ROWS[1].year + '"] [data-testid="rowToggle"]' }, { wait: 100 }] },
            { kind: 'styleBetween', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="detail"]', prop: 'opacity', lo: 0.02, hi: 0.97 },
            { kind: 'hidden', selector: '[data-year="' + ROWS[0].year + '"] [data-testid="detail"]' }
          ]
        }
      ]
    },
{
      id: 's4',
      title: 'x-collapse: animating height',
      objective: 'Expand and collapse content along its height, with a floor when you want a teaser.',
      brief: `\`x-collapse\` must sit on an element that already carries \`x-show\`. Where \`x-transition\` fades and scales, \`x-collapse\` animates **height** — from 0 up to the element's natural height and back — which is the motion that suits accordions and inline detail panels, because everything below glides instead of jumping.

\`.duration.1000ms\` sets the pace (the default is 250ms). \`.min.100px\` keeps a floor: the collapsed state becomes a 100px cut-off rather than \`height: 0\` plus \`display: none\` — that is how "show more" teasers are built.`,
      example: {
        code: `<div x-show="open" x-collapse>height: 0 → auto, animated</div>
<div x-show="open" x-collapse.min.80px>never shrinks past 80px, and stays displayed</div>`,
        note: 'Unlike a transition, the element is measured: the plugin animates to its real height.'
      },
      starter: `<div x-data="{ open: false, teaser: false }">
  <button data-testid="toggle" @click="open = !open">show the reserve note</button>
  <div data-testid="note" x-show="open" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    <p>Two late-reported claims moved the 2025 IBNR by 11.3 points.</p>
    <p>The tail factor went from 1.04 to 1.07 on the strength of the last four diagonals.</p>
  </div>
  <button data-testid="teaserToggle" @click="teaser = !teaser">show more of the tail note</button>
  <div data-testid="teaser" x-show="teaser" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    <p>Reported development now runs nine years past the accident year, against seven a decade ago.</p>
    <p>Settlement speed improved, which argues for a shorter tail than the one loaded here.</p>
    <p>Recommendation: hold the factor and revisit with the next diagonal.</p>
  </div>
</div>`,
      solution: `<div x-data="{ open: false, teaser: false }">
  <button data-testid="toggle" @click="open = !open">show the reserve note</button>
  <div data-testid="note" x-show="open" x-collapse.duration.600ms
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    <p>Two late-reported claims moved the 2025 IBNR by 11.3 points.</p>
    <p>The tail factor went from 1.04 to 1.07 on the strength of the last four diagonals.</p>
  </div>

  <button data-testid="teaserToggle" @click="teaser = !teaser">show more of the tail note</button>
  <div data-testid="teaser" x-show="teaser" x-collapse.min.100px
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px;overflow:hidden">
    <p>Reported development now runs nine years past the accident year, against seven a decade ago.</p>
    <p>Settlement speed improved, which argues for a shorter tail than the one loaded here.</p>
    <p>Recommendation: hold the factor and revisit with the next diagonal.</p>
  </div>
</div>`,
      hints: [
        'Both blocks keep `x-show`; `x-collapse` is added on the same element and takes over the motion.',
        'The slow note uses `.duration.600ms` — you should be able to catch it at half height.',
        'The teaser uses `.min.100px`, so even collapsed it stays 100px tall and visible instead of `display: none`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-collapse',
          text: 'The note must use `x-collapse` with a 600ms duration: 200ms into the expansion its height is a real but partial number of pixels, and once it settles it holds its full height.',
          checks: [
            { kind: 'code', pattern: 'x-collapse\.duration\.600ms' },
            { kind: 'shown', selector: '[data-testid="note"]', do: [{ click: '[data-testid="toggle"]' }, { wait: 200 }] },
            { kind: 'styleBetween', selector: '[data-testid="note"]', prop: 'height', lo: 0.5, hi: 4000 },
            { kind: 'styleBetween', selector: '[data-testid="note"]', prop: 'height', lo: 20, hi: 4000, do: [{ wait: 600 }] }
          ]
        },
        {
          id: 't2',
          skill: '.min',
          text: 'The teaser must never vanish: with `.min.100px` the collapsed state is 100px tall and still displayed — page scrolling and layout should not jump.',
          checks: [
            { kind: 'code', pattern: 'x-collapse\.min\.100px' },
            { kind: 'shown', selector: '[data-testid="teaser"]' },
            { kind: 'styleBetween', selector: '[data-testid="teaser"]', prop: 'height', lo: 99, hi: 101 },
            { kind: 'styleBetween', selector: '[data-testid="teaser"]', prop: 'height', lo: 101, hi: 4000, do: [{ click: '[data-testid="teaserToggle"]' }, { wait: 500 }] }
          ]
        },
        {
          id: 't3',
          skill: 'x-collapse',
          text: 'Collapsing the note must animate too, then put it away: 150ms in it is still in the layout with a positive height, and after 800ms it is `display: none`.',
          checks: [
            { kind: 'shown', selector: '[data-testid="note"]', do: [{ click: '[data-testid="toggle"]' }, { wait: 150 }] },
            { kind: 'styleBetween', selector: '[data-testid="note"]', prop: 'height', lo: 0.5, hi: 4000 },
            { kind: 'hidden', selector: '[data-testid="note"]', do: [{ wait: 700 }] }
          ]
        }
      ]
    },
{
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a movement banner that arrives and leaves',
      objective: 'A full class-based cycle: six phases, correct staging, nothing left behind.',
      scenario: `The quarter's reserve movement notice must slide up into place over 700ms when a reviewer reveals it, and slide away over the same 700ms when dismissed — and while it slides away it must still occupy its space, so the table below does not jump. Provided CSS: \`.mv-enter\`, \`.mv-enter-start\`, \`.mv-enter-end\`, \`.mv-leave\`, \`.mv-leave-start\`, \`.mv-leave-end\`, with the 700ms transitions already attached.`,
      brief: `Elements: \`data-testid="reveal"\` shows the notice, \`data-testid="dismiss"\` takes it away, and \`data-testid="banner"\` carries the six phase directives with the \`mv-*\` classes. The banner starts hidden.`,
      starter: `<div x-data="{ open: false }">
  <button data-testid="reveal" @click="open = true">reveal the movement notice</button>
  <button data-testid="dismiss" @click="open = false">dismiss</button>
  <div data-testid="banner" x-show="open" style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    IBNR up 12.4 % on 2025 frequency
  </div>
</div>`,
      solution: `<style>
  .mv-enter  { transition: opacity 700ms ease, transform 700ms ease; }
  .mv-enter-start { opacity: 0; transform: translateY(12px); }
  .mv-enter-end   { opacity: 1; transform: none; }
  .mv-leave  { transition: opacity 700ms ease; }
  .mv-leave-start { opacity: 1; }
  .mv-leave-end   { opacity: 0; }
</style>
<div x-data="{ open: false }">
  <button data-testid="reveal" @click="open = true">reveal the movement notice</button>
  <button data-testid="dismiss" @click="open = false">dismiss</button>
  <div data-testid="banner" x-show="open"
       x-transition:enter="mv-enter" x-transition:enter-start="mv-enter-start" x-transition:enter-end="mv-enter-end"
       x-transition:leave="mv-leave" x-transition:leave-start="mv-leave-start" x-transition:leave-end="mv-leave-end"
       style="border:1px solid #253253;border-radius:8px;padding:10px;margin-top:8px">
    IBNR up 12.4 % on 2025 frequency
  </div>
</div>`,
      hints: [
        'Same six directives as the step; the class names here are `mv-*`, and the stylesheet is already given.',
        `The banner must be \`hidden\` at 80ms into the leave but only \`display:none\` after the 700ms finishes.`,
        'Dismissing then re-revealing must work repeatedly — Alpine cleans the classes up for you.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-transition:enter',
          text: 'The banner must start hidden, then enter over 700ms: 150ms in it is wearing `mv-enter` and `mv-enter-end`, has shed `mv-enter-start`, and its opacity is climbing.',
          checks: [
            { kind: 'hidden', selector: '[data-testid="banner"]' },
            { kind: 'code', pattern: 'x-transition:enter-start="mv-enter-start"' },
            { kind: 'klass', selector: '[data-testid="banner"]', value: 'mv-enter', do: [{ click: '[data-testid="reveal"]' }, { wait: 150 }] },
            { kind: 'klass', selector: '[data-testid="banner"]', value: 'mv-enter-end' },
            { kind: 'noKlass', selector: '[data-testid="banner"]', value: 'mv-enter-start' },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.02, hi: 0.95 }
          ]
        },
        {
          id: 't2',
          skill: 'x-transition:enter',
          text: 'By the time it has arrived the phase classes are gone and it is fully opaque — the notice is not left mid-transition.',
          checks: [
            { kind: 'noKlass', selector: '[data-testid="banner"]', value: 'mv-enter', do: [{ wait: 700 }] },
            { kind: 'noKlass', selector: '[data-testid="banner"]', value: 'mv-enter-end' },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.99, hi: 1.01 },
            { kind: 'shown', selector: '[data-testid="banner"]' }
          ]
        },
        {
          id: 't3',
          skill: 'x-transition:leave',
          text: 'Dismissing must stage the leave: at 150ms the banner wears `mv-leave`, is still occupying space, and its opacity is between the ends; after 700ms it is hidden with no classes left.',
          checks: [
            { kind: 'klass', selector: '[data-testid="banner"]', value: 'mv-leave', do: [{ click: '[data-testid="dismiss"]' }, { wait: 150 }] },
            { kind: 'shown', selector: '[data-testid="banner"]' },
            { kind: 'styleBetween', selector: '[data-testid="banner"]', prop: 'opacity', lo: 0.02, hi: 0.95 },
            { kind: 'hidden', selector: '[data-testid="banner"]', do: [{ wait: 700 }] },
            { kind: 'noKlass', selector: '[data-testid="banner"]', value: 'mv-leave' },
            { kind: 'noKlass', selector: '[data-testid="banner"]', value: 'mv-leave-end' }
          ]
        }
      ]
    },
{
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a drawer with asymmetric timings',
      objective: 'Slow to open, quick to close, plus an x-if notice that fades in.',
      scenario: `Accident-year drawers in the IBNR workbench open over 600ms, because opening is when the reviewer wants the movement to be legible. Closing happens when they have already read the drawer, so it takes 200ms. When every year has been cleared, the \`x-if\` notice "nothing outstanding" fades in over 300ms. Rows: ${ROWS.map(r => `${r.year} (${r.ibnr.toFixed(1)})`).join(' · ')}.`,
      brief: `Elements: one \`data-testid="row"\` per year with \`data-year\`, a \`data-testid="drawer"\` inside each row (toggled by a \`data-testid="rowToggle"\` button, one open at a time), \`data-testid="clear"\` empties the list, and \`data-testid="nothing"\` hidden by \`x-show="rows.length === 0"\` with a 300ms transition (a leaving transition rules out \`x-if\`). The drawer must use \`x-transition:enter.duration.600ms\` and \`x-transition:leave.duration.200ms\`.`,
      starter: `<div x-data="{ rows: ${sq(ROWS)}, openYear: null }">
  <button data-testid="clear" @click="rows = []">mark everything reviewed</button>
</div>`,
      solution: `<div x-data="{ rows: ${sq(ROWS)}, openYear: null }">
  <button data-testid="clear" @click="rows = []; openYear = null">mark everything reviewed</button>

  <ul style="list-style:none;padding:0">
    <template x-for="r in rows" :key="r.year">
      <li data-testid="row" :data-year="r.year" style="border:1px solid #253253;border-radius:8px;padding:8px;margin:6px 0">
        <button data-testid="rowToggle" @click="openYear = openYear === r.year ? null : r.year">
          <span x-text="r.year"></span> — IBNR <span x-text="r.ibnr.toFixed(1)"></span>
        </button>
        <div data-testid="drawer" x-show="openYear === r.year"
             x-transition:enter.duration.600ms x-transition:leave.duration.200ms
             style="margin-top:6px">
          development factor applied <span x-text="(r.ibnr / ${ROWS[0].ibnr}).toFixed(2)"></span>× the 2022 base; review the tail before sign-off.
        </div>
      </li>
    </template>
  </ul>

  <p data-testid="nothing" x-show="rows.length === 0" x-transition.duration.300ms>
    Nothing outstanding — every accident year is reviewed.
  </p>
</div>`,
      hints: [
        'Opening slowly and closing quickly means two separate duration directives on the same element.',
        'The "nothing outstanding" message lives inside `<template x-if>`; the transition goes on the `<p>`.',
        'The 200ms leave still keeps the drawer in the layout for a moment — that gap is what makes the asymmetrical timings visible.'
      ],
      tasks: [
        {
          id: 't1',
          skill: '.duration',
          text: `Opening ${ROWS[1].year} must be slow: 300ms in, the drawer is visible with its opacity still climbing between the ends, and it reads complete by 900ms.`,
          checks: [
            { kind: 'code', pattern: 'x-transition:enter\\.duration\\.600ms' },
            { kind: 'shown', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="drawer"]', do: [{ click: '[data-year="' + ROWS[1].year + '"] [data-testid="rowToggle"]' }, { wait: 300 }] },
            { kind: 'styleBetween', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="drawer"]', prop: 'opacity', lo: 0.02, hi: 0.97 },
            { kind: 'styleBetween', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="drawer"]', prop: 'opacity', lo: 0.99, hi: 1.01, do: [{ wait: 600 }] }
          ]
        },
        {
          id: 't2',
          skill: '.duration',
          text: `Closing must be quick but not instant: 120ms after the toggle the drawer is still in the layout, and by 400ms it is gone. (A 600ms leave would still be on screen at 400ms.)`,
          checks: [
            { kind: 'code', pattern: 'x-transition:leave\\.duration\\.200ms' },
            { kind: 'shown', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="drawer"]', do: [{ click: '[data-year="' + ROWS[1].year + '"] [data-testid="rowToggle"]' }, { wait: 120 }] },
            { kind: 'hidden', selector: '[data-year="' + ROWS[1].year + '"] [data-testid="drawer"]', do: [{ wait: 300 }] },
            { kind: 'shown', selector: '[data-year="' + ROWS[0].year + '"] [data-testid="drawer"]', do: [{ click: '[data-year="' + ROWS[0].year + '"] [data-testid="rowToggle"]' }, { wait: 700 }] }
          ]
        },
        {
          id: 't3',
          skill: 'x-if',
          text: 'Reviewing everything must empty the list and fade the notice in over 300ms — mid-flight its opacity sits between the ends, and it settles opaque without ever leaving the document.',
          checks: [
            { kind: 'hidden', selector: '[data-testid="nothing"]' },
            { kind: 'shown', selector: '[data-testid="nothing"]', do: [{ click: '[data-testid="clear"]' }, { wait: 100 }] },
            { kind: 'styleBetween', selector: '[data-testid="nothing"]', prop: 'opacity', lo: 0.02, hi: 0.97 },
            { kind: 'count', selector: '[data-testid="row"]', value: 0 },
            { kind: 'styleBetween', selector: '[data-testid="nothing"]', prop: 'opacity', lo: 0.99, hi: 1.01, do: [{ wait: 500 }] },
            { kind: 'code', pattern: 'x-transition\\.duration\\.300ms' }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-transition',
      q: 'What does a bare `x-transition` do, and how long does it take?',
      options: [
        'Opacity only, 300ms both ways',
        'Opacity and scale, 150ms entering and 75ms leaving',
        'Opacity and scale, 150ms both ways',
        'It only adds a CSS class — the timing is up to you'
      ],
      answer: 1,
      why: 'The helper fades *and* scales, using 150ms to enter and a snappier 75ms to leave.',
      distractors: { 2: 'The leave is deliberately quicker than the enter.' }
    },
    {
      id: 'q2',
      type: 'multi',
      skill: '.scale',
      q: 'Which modifiers change the *character* of the helper (rather than its timing)?',
      options: ['.opacity', '.scale.90', '.origin.top', '.delay.200ms'],
      answers: [0, 1, 2],
      why: '`.opacity` keeps only the fade, `.scale.90` keeps only the scaling, `.origin.*` moves the scale anchor. `.delay.*` only shifts the clock.',
      distractors: { 3: 'A delay changes *when*, not *what*.' }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'x-transition:enter',
      q: 'In the enter phase, when is `x-transition:enter-start` on the element?',
      options: [
        'For the whole transition',
        'Before insertion, then one frame after insertion it is swapped for the `-end` class',
        'Only after the transition finishes',
        'Never — the `-start` class is only used on leave'
      ],
      answer: 1,
      why: 'The `-start` class supplies the "from" state; it is lifted one frame in and `-end` takes over as the target state.',
      distractors: { 0: 'That is what the plain `:enter` class is for.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-if',
      q: 'You put `x-transition.duration.500ms` on an element inside `<template x-if="...">`. When the condition goes false, the element vanishes instantly. Why?',
      options: [
        'The duration modifier was written in the wrong order',
        '`x-if` does not support transitions — the node is destroyed, so there is nothing to animate out',
        'Transitions need an `x-effect` alongside them',
        'The element also needs a `tabindex`'
      ],
      answer: 1,
      why: '`x-if` inserts and destroys nodes; Alpine does not run the transition machinery for it. Use `x-show` when the element must animate (and it will stay in the DOM).',
      distractors: { 0: 'Modifier order never matters in Alpine — it parses them all.' }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: '.duration',
      q: 'You want a panel to take 600ms to appear but only 150ms to disappear. Which pair of directives is right?',
      options: [
        '`x-transition.duration.600ms`',
        '`x-transition.duration.600ms` and `x-transition.duration.150ms`',
        '`x-transition:enter.duration.600ms` and `x-transition:leave.duration.150ms`',
        '`x-transition.delay.600ms` and `x-transition.duration.150ms`'
      ],
      answer: 2,
      why: 'Per-phase directives override the duration for that direction; a single `.duration` sets both.',
      distractors: { 3: '`.delay` postpones the transition, it does not lengthen it.' }
    },
    {
      id: 'q6',
      type: 'short',
      skill: '.duration',
      q: 'Which modifier adds a pause before the transition begins? Answer with the modifier and a value, e.g. the form used in this module.',
      accept: ['.delay.400ms', 'delay', '.delay', '.delay.200ms', '.delay.500ms'],
      why: '`.delay.<value>` — for example `x-transition.delay.400ms.duration.400ms` waits 400ms and then animates for 400ms.'
    },
    {
      id: 'q7',
      type: 'mc',
      skill: 'x-collapse',
      q: 'What does `x-collapse` animate that `x-transition` does not?',
      options: [
        'The element\'s height, from 0 to its natural height',
        'The element\'s width',
        'Nothing — they are the same plugin',
        'The scroll position of the page'
      ],
      answer: 0,
      why: 'It measures the element and animates `height`, so surrounding content glides instead of jumping. `x-transition` works on opacity/transform.',
      distractors: { 2: 'Collapse is a separate plugin (`@alpinejs/collapse`) for exactly this reason.' }
    },
    {
      id: 'q8',
      type: 'mc',
      skill: '.min',
      q: 'An element has `x-show="open"` and `x-collapse.min.120px`. What does the collapsed state look like?',
      options: [
        'The element is 120px tall and still displayed',
        'The element is hidden with `display: none`',
        'The element is 0px tall but still displayed',
        'The plugin refuses the combination and throws'
      ],
      answer: 0,
      why: '`.min` replaces the "0px + display: none" end state with a fixed floor, which is how teasers that reveal more work.',
      distractors: {
        1: 'That is the plain collapsed state — `.min` exists precisely to keep the element on screen.',
        3: 'The combination is supported and documented.'
      }
    }
  ]
}
