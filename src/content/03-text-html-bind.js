/* Module 3 — getting values onto the screen and into attributes.
 * Matches: /directives/text, /html, /bind, /cloak, /ignore */

import { bondMath, bond, chainLadder, triangle, rnd, life } from './data.js'

const bm = bondMath(bond)
const cl = chainLadder(triangle)
const tri = triangle.rows
const maxLoss = Math.max(...tri.flat())

export default {
  id: 'm03',
  num: 3,
  title: 'Text, markup and attributes',
  blurb: 'x-text, x-html, every form of x-bind, plus x-cloak and x-ignore.',
  goal: 'Put values where they belong — text nodes, HTML, attributes, classes and styles — and know the safety and correctness rules for each.',
  intro: `Rendering is where Alpine earns its keep: no template syntax to learn, just directives that take JavaScript expressions. The three functions you need are **\`x-text\`** (text), **\`x-html\`** (markup, dangerous) and **\`x-bind\`** (any attribute, class, or style). Two more directives keep you out of trouble: **\`x-cloak\`** hides markup until Alpine boots, and **\`x-ignore\`** tells Alpine to keep its hands off a subtree.`,
  skills: ['x-text', 'x-bind', 'x-html', 'x-cloak'],
  docRefs: [
    { label: 'x-text', url: 'https://alpinejs.dev/directives/text' },
    { label: 'x-html', url: 'https://alpinejs.dev/directives/html' },
    { label: 'x-bind', url: 'https://alpinejs.dev/directives/bind' },
    { label: 'x-cloak', url: 'https://alpinejs.dev/directives/cloak' },
    { label: 'x-ignore', url: 'https://alpinejs.dev/directives/ignore' }
  ],
  mastery: [
    'Format numbers into text with expressions, including percentages and thousands separators',
    'Explain when `x-html` is a security decision, not a rendering convenience',
    'Bind attributes, booleans, classes (object and array) and styles (object and string)',
    'Stop the flash of un-initialised markup with `x-cloak`, and protect a subtree with `x-ignore`'
  ],
  units: [
    {
      id: 's1',
      title: 'x-text: expressions become text',
      objective: 'Format a rate and an amount for a quote.',
      brief: `\`x-text\` sets \`textContent\` — the string is never parsed as HTML, so it is safe with any data. The expression is ordinary JavaScript: ternaries, method calls, template literals, \`toFixed\`, \`Intl.NumberFormat\`, anything that returns a value.`,
      starter: `<div x-data="{ rate: 0.04321, premium: 1875.5 }">
  <!-- format both values -->
</div>`,
      solution: `<div x-data="{ rate: 0.04321, premium: 1875.5, sumAssured: 250000 }">
  <p>rate: <b data-testid="rate" x-text="(rate * 100).toFixed(2) + '%'"></b></p>
  <p>premium: <b data-testid="premium" x-text="premium.toFixed(2)"></b></p>
  <p>per 1,000: <b data-testid="per1000" x-text="(premium / sumAssured * 1000).toFixed(3)"></b></p>
</div>`,
      hints: [
        'Percentages are a formatting choice: `(rate * 100).toFixed(2) + \'%\'`.',
        'Money: `premium.toFixed(2)` is enough for now; `Intl.NumberFormat` comes later.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-text',
          text: 'Render `rate` as a percentage with two decimals into `data-testid="rate"` (expected `4.32%`) and `premium` with two decimals into `data-testid="premium"` (expected `1875.50`).',
          checks: [
            { kind: 'text', selector: '[data-testid="rate"]', value: '4.32%' },
            { kind: 'text', selector: '[data-testid="premium"]', value: '1875.50' }
          ]
        },
        {
          id: 't2',
          skill: 'x-text',
          text: 'Add a third line that shows the premium **per 1,000 of sum assured** for a sum assured of 250,000, rounded to 3 decimals, into `data-testid="per1000"` (expected `7.502`).',
          checks: [
            { kind: 'text', selector: '[data-testid="per1000"]', value: '7.502' }
          ]
        }
      ]
    },
    {
      id: 's2',
      title: 'x-html vs x-text: a security decision',
      objective: 'Render markup deliberately, and know the risk you just took.',
      brief: `\`x-html\` sets \`innerHTML\`: the string is **parsed as markup**. That is exactly what you want for HTML you generated yourself, and exactly what you must never do with text a user typed — the string is a trust boundary. \`x-text\` cannot be attacked that way, because it writes a text node.\n\nA subtlety worth knowing: a \`<script>\` tag inserted through \`innerHTML\` does **not** execute, but an inline handler such as \`<img onerror="…">\` **does**. "Markup is inert" is a dangerous half-truth.`,
      example: {
        code: `<!-- safe: our own formatting -->
<div x-data="{ span: '14 years' }">
  <p x-html="'Term: <b>' + span + '</b>'"></p>
</div>

<!-- NEVER with user input -->
<p x-html="claim.description"></p>`,
        note: 'Default to `x-text`. Reach for `x-html` only when you control or sanitise the string.'
      },
      starter: `<div x-data="{ note: 'Term: <b>14</b> years' }">
  <p data-testid="asText"></p>
  <p data-testid="asHtml"></p>
</div>`,
      solution: `<div x-data="{ note: 'Term: <b>14</b> years', risky: '<b>parsed</b> — but never trust <img src=x onerror=alert(1)>' }">
  <p data-testid="asText" x-text="note"></p>
  <p data-testid="asHtml" x-html="note"></p>
  <p data-testid="danger" x-html="risky"></p>
</div>`,
      hints: [
        'The exact same string, bound twice: `x-text` writes it as characters, `x-html` parses it.',
        'The comparison is the lesson: open the preview and look at the rendered `<b>` in one line and the literal `<b>` in the other.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-html',
          text: 'Bind the string `Term: <b>14</b> years` twice: once so `data-testid="asHtml"` contains a **real** `<b>` element, and once so `data-testid="asText"` shows the literal characters `<b>` with no element inside it.',
          checks: [
            { kind: 'count', selector: '[data-testid="asHtml"] b', value: 1 },
            { kind: 'textHas', selector: '[data-testid="asHtml"]', value: '14 years' },
            { kind: 'textHas', selector: '[data-testid="asText"]', value: '<b>' },
            { kind: 'count', selector: '[data-testid="asText"] b', value: 0 }
          ]
        },
        {
          id: 't2',
          skill: 'x-html',
          text: 'Now knowingly bind a string containing both `<b>parsed</b>` and an `<img src=x onerror=…>` to `x-html` on an element marked `data-testid="danger"`. Two things must be true: the `<b>` becomes a real element (so the parse happened), and you can explain in one line why this is an injection risk.',
          checks: [
            { kind: 'count', selector: '[data-testid="danger"] b', value: 1 },
            { kind: 'textHas', selector: '[data-testid="danger"]', value: 'parsed' }
          ]
        }
      ]
    },
    {
      id: 's3',
      title: 'x-bind: attributes, booleans, classes, styles',
      objective: 'Drive every kind of attribute binding from one component.',
      brief: `\`x-bind\` writes an attribute from an expression, and the short form is a leading colon: \`:href="url"\`.\n\n• **Booleans**: \`:disabled="!valid"\` — \`false\` removes the attribute, \`true\` adds it.\n• **Classes, object syntax**: \`:class="{ up: trend > 0 }"\` — truthy keys are applied.\n• **Classes, array syntax**: \`:class="[base, trend > 0 && 'up']"\` — \`false\` entries vanish.\n• **Styles**: prefer the object form \`:style="{ width: pct + '%' }"\`; string concatenation works but escapes nothing.\n• **Spread**: \`x-bind="attrs"\` (no argument) applies a whole object of attributes.`,
      example: {
        code: `<button :disabled="!valid" :class="{ 'btn-primary': valid }" :aria-disabled="String(!valid)">Quote</button>`,
        note: 'Accessibility attributes are just attributes — bind them too.'
      },
      tips: [
        { kind: 'warn', title: 'Bare x-bind wins ties', body: 'When a spread (`x-bind="attrs"`) and an explicit binding write the **same attribute**, the one applied last wins — Alpine applies the bare `x-bind` after named bindings. Keep attribute names disjoint across the two, exactly as you would for `v-bind` in Vue.' }
      ],
      starter: `<div x-data="{ valid: true, trend: -1.4, pct: 62 }">
  <button>Submit</button>
  <div class="bar"><span></span></div>
</div>`,
      solution: `<div x-data="{ valid: true, trend: -1.4, pct: 62, attrs: { 'data-state': 'ready', 'aria-live': 'polite' } }">
  <button data-testid="btn"
          :disabled="!valid"
          :aria-disabled="String(!valid)"
          :title="'valid: ' + valid"
          x-bind="attrs">Submit</button>
  <button data-testid="flip" @click="valid = !valid">toggle validity</button>
  <div class="bar"><span data-testid="fill" :style="{ width: pct + '%' }" @click="pct = 85"></span></div>
  <p data-testid="trend" :class="{ up: trend > 0, down: trend <= 0 }">trend</p>
  <p data-testid="trend2" :class="['chip', trend > 0 ? 'accent' : 'warn']">trend</p>
</div>`,
      hints: [
        'Boolean bindings: `:disabled="!valid"` — no string conversion needed.',
        'Class object: `:class="{ up: trend > 0 }"`; class array: `:class="[base, cond && \'up\']"`.',
        'Styles as an object: `:style="{ width: pct + \'%\' }"`.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-bind',
          text: 'Bind the button marked `data-testid="btn"` so it is **disabled while `valid` is false**, and add a `data-testid="flip"` button that toggles `valid`. The `title` attribute must read `valid: false` after flipping (bind it, do not type it).',
          checks: [
            { kind: 'attrGone', selector: '[data-testid="btn"]', name: 'disabled' },
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'title', value: 'valid: true' },
            { kind: 'exists', selector: '[data-testid="btn"][disabled]', do: [{ click: '[data-testid="flip"]' }] },
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'title', value: 'valid: false' },
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'aria-disabled', value: 'true' },
            { kind: 'attrGone', selector: '[data-testid="btn"]', name: 'disabled', do: [{ click: '[data-testid="flip"]' }] }
          ]
        },
        {
          id: 't2',
          skill: 'x-bind',
          text: 'Give the bar fill marked `data-testid="fill"` an inline width of `62%` using a **style object**, and add a click handler on the fill that raises `pct` to 85 so the width follows to `85%`.',
          checks: [
            { kind: 'styleIs', selector: '[data-testid="fill"]', prop: 'width', value: '62%' },
            { kind: 'styleIs', selector: '[data-testid="fill"]', prop: 'width', value: '85%', do: [{ click: '[data-testid="fill"]' }] }
          ]
        },
        {
          id: 't3',
          skill: 'x-bind',
          text: 'With `trend = -1.4`, the element marked `data-testid="trend"` must carry the class `down` and **not** `up` (object syntax), and `data-testid="trend2"` must carry only the classes from the array that are truthy.',
          checks: [
            { kind: 'klass', selector: '[data-testid="trend"]', value: 'down' },
            { kind: 'noKlass', selector: '[data-testid="trend"]', value: 'up' },
            { kind: 'klass', selector: '[data-testid="trend2"]', value: 'chip' },
            { kind: 'noKlass', selector: '[data-testid="trend2"]', value: 'accent' }
          ]
        },
        {
          id: 't4',
          skill: 'x-bind',
          text: 'Use bare `x-bind` (no attribute name) to spread an object of attributes onto the button, including `data-state="ready"`.',
          checks: [
            { kind: 'attr', selector: '[data-testid="btn"]', name: 'data-state', value: 'ready' }
          ]
        }
      ]
    },
    {
      id: 's4',
      title: 'x-cloak and x-ignore',
      objective: 'Remove the flash of un-initialised markup and quarantine a subtree.',
      brief: `Alpine boots after the browser has already painted the HTML: without help, a user can see raw \`x-text\` attributes or an un-hidden element for a few frames. **\`x-cloak\`** plus the CSS rule \`[x-cloak] { display: none !important }\` hides everything marked until initialisation, and Alpine removes the attribute when it is done.\n\n**\`x-ignore\`** is the opposite tool: it tells Alpine to leave a subtree completely alone — perfect for a third-party widget or for markup where curly braces and \`x-\` attributes are literal content. \`x-ignore.self\` ignores only that element, not its children.`,
      example: {
        code: `<style>[x-cloak] { display: none !important }</style>

<div x-cloak x-data="{ loaded: false }" x-init="setTimeout(() => loaded = true, 800)">
  <p x-show="loaded">Data table ready.</p>
</div>

<div x-ignore>
  <p>Documentation sample: literally x-text="count" and {{ braces }}.</p>
</div>`,
        note: 'The cloak rule is ordinary CSS: put it in your stylesheet once, globally.'
      },
      starter: `<div x-data="{ loaded: false }" x-init="setTimeout(() => loaded = true, 1200)">
  <p x-show="loaded" data-testid="late">Surrender charge table loaded.</p>
  <p>Literal example that Alpine must not touch: x-text="count" {{ braces }}</p>
</div>`,
      solution: `<style>[x-cloak] { display: none !important }</style>

<div x-cloak x-data="{ loaded: false }" x-init="setTimeout(() => loaded = true, 1200)">
  <p x-show="loaded" data-testid="late">Surrender charge table loaded.</p>
  <div x-ignore>
    <p data-testid="raw">Literal example that Alpine must not touch: x-text="count" {{ braces }}</p>
  </div>
</div>`,
      hints: [
        'Put the `[x-cloak]` rule in a `<style>` tag (in a real project: your stylesheet).',
        '`x-cloak` goes on the same element as `x-data`, or on any element you want hidden until boot.',
        '`x-ignore` on the wrapper element keeps its children out of Alpine’s reach entirely.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-cloak',
          text: 'Add the `[x-cloak]` CSS rule and put `x-cloak` on the component so nothing un-initialised can flash.',
          checks: [
            { kind: 'code', pattern: '\\[x-cloak\\]\\s*\\{[^}]*display\\s*:\\s*none', flags: 'i' },
            { kind: 'code', pattern: 'x-cloak', flags: 'i' }
          ]
        },
        {
          id: 't2',
          skill: 'x-ignore',
          text: 'Wrap the literal documentation line in `x-ignore` and mark it `data-testid="raw"`, so Alpine leaves the literal `x-text="count"` and `{{ braces }}` text exactly as written.',
          checks: [
            { kind: 'attr', selector: '[data-testid="raw"]', name: 'data-testid', value: 'raw' },
            { kind: 'exists', selector: '[x-ignore]' },
            { kind: 'textHas', selector: '[data-testid="raw"]', value: 'x-text="count"' },
            { kind: 'textHas', selector: '[data-testid="raw"]', value: '{{ braces }}' }
          ]
        }
      ]
    },
    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a bond analytics card',
      objective: 'Bind computed analytics into text, attributes, classes and widths.',
      scenario: `A fixed-income actuary wants a one-glance card for a 5-year, 4.5 % coupon bond with face 1,000 at a 5.2 % yield: price ${rnd(bm.price, 2)}, Macaulay duration ${rnd(bm.macaulay, 4)} years, modified duration ${rnd(bm.modified, 4)}, convexity ${rnd(bm.convexity, 4)}. The card must turn red when the bond is expensive (modified duration above 4.5) and show a duration bar whose width is that duration scaled to a 5-year maximum.`,
      brief: `Start from the numbers above. Everything on the card must be **derived** from \`price\`, \`modified\` and \`convexity\` — no second copy of a number anywhere. The bar is a \`<div class="bar">\` containing a \`<span>\` whose inline width is \`modified / 5 * 100 + '%'\` (expected ${rnd((bm.modified / 5) * 100, 2)}%).`,
      starter: `<div x-data="{ price: ${rnd(bm.price, 2)}, modified: ${rnd(bm.modified, 4)}, convexity: ${rnd(bm.convexity, 4)} }">
  <div class="bar"><span></span></div>
</div>`,
      solution: `<div x-data="{ price: ${rnd(bm.price, 2)}, modified: ${rnd(bm.modified, 4)}, convexity: ${rnd(bm.convexity, 4)}, limit: 4.5, max: 5 }">
  <h3>Bond analytics</h3>
  <p>Price: <b data-testid="price" x-text="price.toFixed(2)"></b></p>
  <p>Modified duration: <b data-testid="dur" x-text="modified.toFixed(4)"></b> yr</p>
  <p>Convexity: <b data-testid="cvx" x-text="convexity.toFixed(4)"></b></p>
  <p data-testid="flag" :class="{ rich: modified > limit }"
     :title="'modified duration ' + modified.toFixed(4) + (modified > limit ? ' — above the limit' : ' — inside the limit')">Duration check</p>
  <div class="bar"><span data-testid="durbar" :style="{ width: (modified / max * 100).toFixed(2) + '%' }"></span></div>
  <button data-testid="stress" @click="modified = 4.9">stress it</button>
</div>`,
      hints: [
        'Class object binding: `:class="{ rich: modified > limit }"`.',
        'Style object binding: `:style="{ width: (modified / max * 100) + \'%\' }"`.',
        'Attributes are bindable too — including `title`, which is a nice place for the working.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-text',
          text: `Render price (2 decimals) into \`data-testid="price"\`, modified duration (4 decimals) into \`data-testid="dur"\` and convexity (4 decimals) into \`data-testid="cvx"\`.`,
          checks: [
            { kind: 'textNumber', selector: '[data-testid="price"]', value: rnd(bm.price, 2), tol: 0.05 },
            { kind: 'textNumber', selector: '[data-testid="dur"]', value: rnd(bm.modified, 4), tol: 0.001 },
            { kind: 'textNumber', selector: '[data-testid="cvx"]', value: rnd(bm.convexity, 4), tol: 0.001 }
          ]
        },
        {
          id: 't2',
          skill: 'x-bind',
          text: `Give the duration bar (\`data-testid="durbar"\`) an inline width of ${rnd((bm.modified / 5) * 100, 2)}%, and make the bar visually signal it in some way (your choice: a class on the fill or a ` + '`title`' + `).`,
          checks: [
            { kind: 'styleIs', selector: '[data-testid="durbar"]', prop: 'width', value: rnd((bm.modified / 5) * 100, 2) + '%' }
          ]
        },
        {
          id: 't3',
          skill: 'x-bind',
          text: 'Add a stress button marked `data-testid="stress"` that sets modified duration to 4.9, and make the flag element `data-testid="flag"` carry the class `rich` only when modified duration exceeds 4.5.',
          checks: [
            { kind: 'noKlass', selector: '[data-testid="flag"]', value: 'rich' },
            { kind: 'klass', selector: '[data-testid="flag"]', value: 'rich', do: [{ click: '[data-testid="stress"]' }] },
            { kind: 'styleIs', selector: '[data-testid="durbar"]', prop: 'width', value: '98%', do: [{ click: '[data-testid="stress"]' }] }
          ]
        }
      ]
    },
    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — a loss-development heat map',
      objective: 'Bind classes and text from a data-driven loop over a triangle.',
      scenario: `The reserving team keeps a cumulative paid-loss triangle ($000) for accident years 2021–2025. The 12→24-month development factor from the column sums is ${rnd(cl.factors[1], 4)}. Build a small heat map: every cell above 200 is marked \`warm\`, every cell above ${rnd(maxLoss * 0.98, 1)} is marked \`hot\`, and the table names the accident year with the largest latest diagonal.`,
      brief: `The triangle is: ${tri.map((r, i) => `${triangle.years[i]}: [${r.join(', ')}]`).join(' · ')}.
      Render one row per accident year, every cell marked \`data-testid="cell"\`, with a class reflecting its magnitude (a cell can be both warm and hot). Add a summary element \`data-testid="worst"\` naming the year with the largest latest diagonal.`,
      starter: `<div x-data="{
  years: ${JSON.stringify(triangle.years)},
  rows: ${JSON.stringify(tri)}
}">
  <table><tbody>
    <template x-for="(row, i) in rows" :key="years[i]">
      <tr><td x-text="years[i]"></td></tr>
    </template>
  </tbody></table>
</div>`,
      solution: `<div x-data="{
  years: ${JSON.stringify(triangle.years)},
  rows: ${JSON.stringify(tri)},
  warm: 200,
  hot: ${rnd(maxLoss * 0.98, 1)},
  get worst() {
    const latest = this.rows.map(r => r[r.length - 1])
    return this.years[latest.indexOf(Math.max(...latest))]
  }
}">
  <table>
    <tbody>
      <template x-for="(row, i) in rows" :key="years[i]">
        <tr>
          <td x-text="years[i]"></td>
          <template x-for="(v, j) in row" :key="j">
            <td data-testid="cell"
                :class="{ warm: v > warm, hot: v > hot }"
                :title="'accident year ' + years[i] + ', development ' + (j + 1)"
                x-text="v"></td>
          </template>
        </tr>
      </template>
    </tbody>
  </table>
  <p>Largest latest diagonal: <b data-testid="worst" x-text="worst"></b></p>
</div>`,
      hints: [
        'Nested `x-for` with `(row, i)` and `(v, j)` gives you the cell coordinates.',
        '`:class="{ warm: v > warm, hot: v > hot }"` — note that both can be true at once.',
        'A getter over the rows is the cleanest way to find the largest latest diagonal.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'x-bind',
          text: `Render the triangle: 20 cells total (4+3+2+1+… in triangle shape), each marked \`data-testid="cell"\`, showing their cumulative loss as text. The first cell must read 100 and the last 217.`,
          checks: [
            { kind: 'listLong', selector: '[data-testid="cell"]', value: 20 },
            { kind: 'text', selector: '[data-testid="cell"]', nth: 0, value: '100' },
            { kind: 'text', selector: '[data-testid="cell"]', nth: 19, value: '217' }
          ]
        },
        {
          id: 't2',
          skill: 'x-bind',
          text: `Apply \`warm\` to every cell above 200 and \`hot\` to every cell above ${rnd(maxLoss * 0.98, 1)}. ${tri.flat().filter(v => v > 200).length} cells are warm, ${tri.flat().filter(v => v > maxLoss * 0.98).length} are hot, and the 2021 development-5 cell (205) is warm but not hot.`,
          checks: [
            { kind: 'count', selector: '[data-testid="cell"].warm', value: tri.flat().filter(v => v > 200).length },
            { kind: 'count', selector: '[data-testid="cell"].hot', value: tri.flat().filter(v => v > maxLoss * 0.98).length },
            { kind: 'klass', selector: '[data-testid="cell"]', nth: 4, value: 'warm' },
            { kind: 'noKlass', selector: '[data-testid="cell"]', nth: 4, value: 'hot' },
            { kind: 'klass', selector: '[data-testid="cell"]', nth: 14, value: 'hot' },
            { kind: 'noKlass', selector: '[data-testid="cell"]', nth: 0, value: 'warm' }
          ]
        },
        {
          id: 't3',
          skill: 'getters',
          text: `Add \`data-testid="worst"\` showing the accident year with the largest latest diagonal (expected ${triangle.years[0] + cl.latest.indexOf(Math.max(...cl.latest))}).`,
          checks: [
            { kind: 'text', selector: '[data-testid="worst"]', value: String(triangle.years[0] + cl.latest.indexOf(Math.max(...cl.latest))) }
          ]
        }
      ]
    }
  ],
  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'x-html',
      q: 'A claim note arrives from a customer and you render it with `x-html`. What is the risk?',
      options: [
        'Nothing: Alpine escapes the string before inserting it',
        'The string is parsed as HTML, so a `<script>` or `<img onerror=…>` in it becomes live markup',
        'Only a performance risk — `x-html` re-parses the whole document',
        'The content is stripped of all markup, so formatting is lost'
      ],
      answer: 1,
      why: '`x-html` is `innerHTML`. Scripts inserted that way do not execute *as tags*, but inline event handlers and `javascript:` URLs in the markup absolutely do. Never bind untrusted data to `x-html` without sanitising.',
      distractors: {
        0: 'Escaping is what `x-text` does — that is why `x-text` is the safe default.',
        2: 'There is a parsing cost, but the risk here is injection.',
        3: 'Nothing is stripped: that is the difference between `x-html` and `x-text`.'
      }
    },
    {
      id: 'q2',
      type: 'mc',
      skill: 'x-bind',
      q: 'What does `:disabled="isLocked"` do when `isLocked` is `false`?',
      options: [
        'Sets the attribute to the string "false" (which still disables the button)',
        'Removes the `disabled` attribute entirely',
        'Sets `disabled="false"`, which browsers ignore',
        'Throws, because boolean attributes need strings'
      ],
      answer: 1,
      why: 'Alpine treats `false` as absent for boolean attributes and `true` as present. That is why `:disabled="isLocked"` is correct and `:disabled="String(isLocked)"` is a bug waiting for a code review.',
      distractors: {
        0: 'A present `disabled` attribute disables the control regardless of value — so a stringified "false" would be a real bug.',
        2: 'Browsers treat any present `disabled` as disabled, including `disabled="false"`.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'x-bind',
      q: 'Which of these correctly applies the class `up` only when `trend > 0`, without ever producing the literal string "false" in the class list?',
      options: [
        `:class="'up ' + (trend > 0)"`,
        `:class="{ up: trend > 0 }"`,
        `:class="trend > 0 && 'up'"`,
        'Both B and C'
      ],
      answer: 3,
      why: 'The object form toggles by truthiness; the array/expression form drops `false` values. Option A is the trap: it concatenates the boolean into the class list.',
      distractors: { 0: 'This produces `class="up false"` when the trend is negative — the classic string-concatenation bug.' }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'x-cloak',
      q: 'What does `x-cloak` actually require to work?',
      options: [
        'Nothing — Alpine understands the attribute natively',
        'A CSS rule such as `[x-cloak] { display: none !important }` in your stylesheet',
        'It must be placed on `<body>`',
        'The `collapse` plugin'
      ],
      answer: 1,
      why: 'Alpine only removes the attribute after initialisation; the *hiding* is plain CSS that you supply once, usually in your global stylesheet.',
      distractors: {
        0: 'Without the CSS rule the attribute is inert: Alpine removes it, but nothing was ever hidden.',
        2: 'It works on any element, often the component root or a whole section.',
        3: 'Collapse is about animating height, not about the initial flash.'
      }
    },
    {
      id: 'q5',
      type: 'short',
      skill: 'x-ignore',
      q: 'Which directive stops Alpine from processing a subtree (for example a third-party widget that contains literal `x-` attributes)? Use the full directive name.',
      accept: ['x-ignore'],
      why: '`x-ignore` (and `x-ignore.self` to ignore only the element itself, not its children).'
    },
    {
      id: 'q6',
      type: 'multi',
      skill: 'x-bind',
      q: 'Which bindings are written correctly?',
      options: [
        `:style="{ width: pct + '%' }"`,
        `:class="['chip', active && 'accent']"`,
        `:class="'chip' + active"`,
        `x-bind="attributeObject"`
      ],
      answers: [0, 1, 3],
      why: 'Object styles, class arrays, and bare `x-bind` spreading an object of attributes are all idiomatic. Concatenating a boolean into a class string is not.',
      distractors: { 2: 'This appends "true"/"false" as class names — use the object or array form instead.' }
    },
    {
      id: 'q7',
      type: 'mc',
      skill: 'x-text',
      q: 'You need the string `1,234.50`. Which is the most robust binding?',
      options: [
        `x-text="'1,234.50'"`,
        `x-text="value.toFixed(2)"`,
        `x-text="new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value)"`,
        `x-html="value"`
      ],
      answer: 2,
      why: '`Intl.NumberFormat` handles rounding, grouping and locale. `toFixed` gives you the digits but not the thousands separator; a hard-coded string is not a binding at all.',
      distractors: {
        0: 'A literal cannot react to a changing value.',
        1: 'Correct digits, no grouping — it prints 1234.50, not 1,234.50.',
        3: '`x-html` on a number throws away the safety of text binding for no reason.'
      }
    }
  ]
}
