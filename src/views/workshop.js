/* =============================================================================
 * views/workshop — the free playground: presets, an isolated sandbox and
 * notes that survive reloads thanks to the persist plugin.
 * ========================================================================== */

import { workbench } from './partials.js'
import { esc } from '../lib/utils.js'
import { life, chainLadder, buhlmann, moments, returns, geomMath, life as L } from '../content/data.js'

const cl = chainLadder()

export const presets = [
  {
    id: 'table',
    name: 'x-for + x-text: a mortality table slice',
    code: `<div x-data="{ ages: [40, 50, 60, 70, 80] }">
  <h3>&#8467;<sub>x</sub> from l0 = 100,000</h3>
  <table>
    <thead><tr><th>age x</th><th>q<sub>x</sub></th><th>l<sub>x</sub></th></tr></thead>
    <tbody>
      <template x-for="x in ages" :key="x">
        <tr>
          <td x-text="x"></td>
          <td x-text="($data.q(x) * 100).toFixed(3) + '%'"></td>
          <td x-text="$data.l(x)"></td>
        </tr>
      </template>
    </tbody>
  </table>
</div>`
  },
  {
    id: 'triangle',
    name: 'x-if + x-model.number: chain-ladder factors',
    code: `<div x-data="{ factors: ${JSON.stringify(cl.factors.map(f => Number(f.toFixed(4))))} , latest: ${JSON.stringify(cl.latest)} }">
  <p>Ultimate for the newest accident year:</p>
  <input type="number" step="0.0001" x-model.number="factors[1]" style="width:120px">
  <p>factors: <span x-text="factors.map(f => f.toFixed(4)).join(' · ')"></span></p>
  <p>ultimate = <b x-text="(latest[4] * factors.slice(1).reduce((a, b) => a * b, 1)).toFixed(1)"></b></p>
</div>`
  },
  {
    id: 'cred',
    name: 'x-model + getters: credibility Z',
    code: `<div x-data="{ m: 200, k: 112.5 }">
  <label>exposure <input type="range" min="0" max="1500" x-model.number="m"></label>
  <p>Z = <b x-text="(m / (m + k)).toFixed(4)"></b></p>
  <div style="background:#16203a;height:14px;border-radius:9px;overflow:hidden">
    <div :style="'height:100%;width:' + (100 * m / (m + k)) + '%;background:#5eead4'"></div>
  </div>
</div>`
  },
  {
    id: 'counter',
    name: 'Starter: the classic counter, extended',
    code: `<div x-data="{ count: 0, step: 1 }">
  <button @click="count -= step">−</button>
  <b x-text="count" style="padding:0 12px"></b>
  <button @click="count += step">+</button>
  <p><label>step <input type="number" x-model.number="step" style="width:90px"></label></p>
  <p x-show="count > 10">Running hot — the aggregate loss is growing.</p>
</div>`
  },
  {
    id: 'store',
    name: 'Alpine.store + $dispatch between siblings',
    code: `<div x-data>
  <button @click="$store.demo.bump()">add a claim to the store</button>
  <p>store total: <b x-text="$store.demo.total"></b></p>
</div>
<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('demo', {
      total: 0,
      bump() { this.total += ${Math.round(buhlmann().mu)} }
    })
  })
</script>`
  },
  {
    id: 'magic',
    name: 'Magics: $el, $refs, $nextTick, $watch',
    code: `<div x-data="{ n: 0, log: [] }" x-init="$watch('n', v => log.push('n -> ' + v))">
  <input x-ref="box" type="number" x-model.number="n" style="width:110px">
  <button @click="$refs.box.focus()">focus the input</button>
  <button @click="$nextTick(() => log.push('after tick, input value = ' + $refs.box.value))">$nextTick</button>
  <p>This element is <code x-text="'<' + $el.tagName.toLowerCase() + '>'"></code>, in component <span x-text="Object.keys($data).length"></span> keys.</p>
  <ul><template x-for="(l, i) in log" :key="i"><li x-text="l"></li></template></ul>
</div>`
  },
  {
    id: 'stats',
    name: 'Maths: sample moments of a return series',
    code: `<div x-data="{ xs: ${JSON.stringify(returns.slice(0, 12))} }">
  <p>mean = <b x-text="(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(4)"></b> %</p>
  <p>sample sd = <b x-text="Math.sqrt(xs.reduce((a, b, _, arr) => a + (b - arr.reduce((s, v) => s + v, 0) / arr.length) ** 2, 0) / (xs.length - 1)).toFixed(4)"></b> %</p>
  <p>reference sd from the course data: ${moments(returns).sd.toFixed(4)} % (full 24 months)</p>
</div>`
  },
  {
    id: 'geom',
    name: 'Geometry: triangle solver with getters',
    code: `<div x-data="{ a: ${geomMath.scalene.a}, b: ${geomMath.scalene.b}, C: ${geomMath.scalene.Cdeg} }">
  <p>c = <b x-text="Math.sqrt(a*a + b*b - 2*a*b*Math.cos(C * Math.PI / 180)).toFixed(4)"></b> (law of cosines)</p>
  <p>area = <b x-text="(0.5 * a * b * Math.sin(C * Math.PI / 180)).toFixed(4)"></b></p>
  <label>a <input type="range" min="1" max="20" step="0.5" x-model.number="a"></label>
  <label>b <input type="range" min="1" max="20" step="0.5" x-model.number="b"></label>
  <label>C° <input type="range" min="1" max="179" x-model.number="C"></label>
</div>`
  }
]

const starter = presets[3].code

export function renderWorkshop() {
  const cfg = {
    unitKey: 'workshop.free',
    moduleId: 'workshop',
    unitId: 'free',
    starter,
    solution: '',
    mode: 'provided',
    hints: [],
    tasks: []
  }
  return `
  <div class="stack">
    <div>
      <div class="crumb">Free workshop</div>
      <h1>Break things in a sandbox</h1>
      <p>
        A blank page with a real Alpine 3.17.4 runtime, all official plugins loaded, and nothing to prove.
        Load a preset, take it apart, invent your own components. Your draft and your notes are saved locally.
      </p>
    </div>

    <div class="card" x-data="{ pick: '' }">
      <div class="card-head"><h3>Presets</h3></div>
      <div class="row">
        <select x-model="pick" style="max-width:520px" @change="$dispatch('load-preset', { code: $event.target.value })">
          <option value="">choose a starting point…</option>
          ${presets.map(p => `<option value="${esc(p.code)}">${esc(p.name)}</option>`).join('')}
        </select>
        <span class="tiny muted">Presets replace the editor contents (your previous draft is still saved until you edit again).</span>
      </div>
    </div>

    <div class="card">
      ${workbench(cfg)}
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Notes</h3>
        <div style="flex:1"></div>
        <span class="chip accent">persisted with <code>$persist</code></span>
      </div>
      <div x-data="{ notes: $persist('').as('learn-alpine.workshop-notes') }">
        <textarea x-model="notes" rows="6" placeholder="What did you try? What surprised you? What broke?"
                  style="font-family:var(--font)"></textarea>
        <p class="tiny muted" style="margin-top:6px">
          This textarea is real course code: <code>x-data="{ notes: $persist('').as('learn-alpine.workshop-notes') }"</code> —
          the persist plugin writes it to localStorage under a <code>_x_</code>-prefixed key, so it is still there after a reload.
        </p>
      </div>
    </div>

    <div class="card">
      <h3>Things worth trying (no checks, just curiosity)</h3>
      <ul class="tiny">
        <li>Add <code>x-cloak</code> to an element plus a <code>[x-cloak]{display:none}</code> style tag and watch the flash disappear on reload.</li>
        <li>Move a value into <code>Alpine.store()</code> and read it from two sibling components.</li>
        <li>Register a component with <code>Alpine.data()</code> and use it twice with different arguments.</li>
        <li>Wrap a number in <code>Alpine.reactive()</code> and print it from an <code>Alpine.effect()</code>.</li>
        <li>Write a tiny custom directive with <code>Alpine.directive()</code> that formats a number as currency.</li>
      </ul>
    </div>
  </div>`
}
