/* =============================================================================
 * views/cheatsheet — searchable reference of the whole Alpine 3.17 surface.
 * The `m` field of every row points at the module that drills it.
 * ========================================================================== */

import { reference } from '../content/reference.js'
import { esc, jsonAttr } from '../lib/utils.js'

export function renderCheatsheet() {
  const rows = reference.map(r => ({
    ...r,
    mid: `m${String(r.m).padStart(2, '0')}`,
    hay: `${r.g} ${r.n} ${r.s} ${r.w}`.toLowerCase()
  }))
  return `
  <div class="stack" x-data="cheatsheet" data-cfg='${jsonAttr({ rows, groups: ['Install', 'Directive', 'Modifier', 'Magic', 'Plugin', 'Global', 'Event', 'Pattern'] })}' x-cloak>
    <div>
      <div class="crumb">Cheatsheet</div>
      <h1>Every Alpine 3.17 feature, one line each</h1>
      <p>
        Filter by name, syntax or purpose. The tick on the right shows whether the module that teaches that
        feature is finished — use it as a gap analysis before you call yourself done.
      </p>
    </div>

    <div class="card">
      <div class="row">
        <input x-model="q" type="search" placeholder="e.g. debounce, $persist, x-for, modal, key…" aria-label="Search the cheatsheet" style="max-width:420px">
        <div class="pill-tabs">
          <button @click="group = ''" :class="{ on: group === '' }">all</button>
          <template x-for="g in cfg.groups" :key="g">
            <button @click="group = g" :class="{ on: group === g }" x-text="g.toLowerCase()"></button>
          </template>
        </div>
        <div style="flex:1"></div>
        <span class="chip" x-text="filtered.length + ' / ' + cfg.rows.length + ' features'"></span>
      </div>
    </div>

    <div class="card">
      <div style="overflow:auto">
        <table class="data">
          <thead><tr><th>Feature</th><th>Syntax</th><th>What it does</th><th>Module</th></tr></thead>
          <tbody>
            <template x-for="r in filtered" :key="r.n + r.s">
              <tr>
                <td><b x-text="r.n"></b><div class="tiny muted" x-text="r.g"></div></td>
                <td><code x-text="r.s"></code></td>
                <td x-text="r.w"></td>
                <td>
                  <a class="chip" :class="done(r) ? 'accent' : ''" :href="'#/m/' + r.mid">
                    <span x-text="done(r) ? '✓' : '○'"></span> M<span x-text="String(r.m).padStart(2, '0')"></span>
                  </a>
                  <a class="chip info" :href="r.u" target="_blank" rel="noreferrer" style="margin-left:4px">docs ↗</a>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>`
}
