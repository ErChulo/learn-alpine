/* =============================================================================
 * views/path — the recommended route through the 18 modules.
 * ========================================================================== */

import { modules } from '../content/index.js'
import { referenceStats } from '../content/reference.js'
import { esc } from '../lib/utils.js'

const arcs = [
  { title: 'Arc A — The grammar of Alpine', ids: ['m01', 'm02', 'm03'], note: 'Installation, component scope, and getting values onto the screen.' },
  { title: 'Arc B — Decisions and lists', ids: ['m04', 'm05'], note: 'Show/hide/remove, and looping over real tables — including loss triangles.' },
  { title: 'Arc C — Interaction', ids: ['m06', 'm07'], note: 'Events, modifiers, custom events, and every form control.' },
  { title: 'Arc D — Coordination', ids: ['m08', 'm09', 'm10', 'm11'], note: 'Side effects, element handles, global stores and the three global APIs.' },
  { title: 'Arc E — Official plugins', ids: ['m12', 'm13', 'm14'], note: 'persist, intersect, collapse, focus, anchor, resize, sort, morph — the full set.' },
  { title: 'Arc F — Under the hood', ids: ['m15', 'm16', 'm17', 'm18'], note: 'Transitions, async data, extending Alpine, and the reactivity engine itself.' }
]

export function renderPath() {
  return `
  <div class="stack">
    <div>
      <div class="crumb">Study path</div>
      <h1>Eighteen modules, six arcs</h1>
      <p>
        The order matters, but it is not sacred: modules 1–7 are the core language, 8–11 are the coordination APIs,
        12–16 are the official plugins plus async work, and 17–18 turn you into someone who can extend Alpine itself.
        Expect ${Math.round(modules.reduce((n, m) => n + m.units.length, 0) * 12 / 60)}–${Math.round(modules.reduce((n, m) => n + m.units.length, 0) * 20 / 60)} hours of hands-on work.
      </p>
      <div class="row tiny muted">
        <span class="chip">${referenceStats.directives} directives &amp; behaviours</span>
        <span class="chip">${referenceStats.modifiers} modifiers</span>
        <span class="chip">${referenceStats.magics} magics</span>
        <span class="chip">${referenceStats.plugins} official plugins</span>
        <span class="chip">${referenceStats.globals} global APIs</span>
      </div>
    </div>

    ${arcs.map(arc => `
      <div class="card">
        <div class="card-head"><h3>${esc(arc.title)}</h3></div>
        <p class="tiny muted">${esc(arc.note)}</p>
        <div class="grid three">
          ${arc.ids.map(id => {
            const m = modules.find(x => x.id === id)
            if (!m) return ''
            return `
            <a href="#/m/${m.id}" class="card" style="margin:0;text-decoration:none;color:inherit;background:#101a30">
              <div class="row" style="justify-content:space-between">
                <span class="chip">${String(m.num).padStart(2, '0')}</span>
                <span class="chip" :class="$store.course.modStats['${m.id}']?.pct === 100 ? 'accent' : ''">
                  <span x-text="$store.course.modStats['${m.id}']?.pct || 0"></span>%
                </span>
              </div>
              <h4 style="margin:8px 0 4px">${esc(m.title)}</h4>
              <div class="tiny muted">${esc(m.blurb)}</div>
              <div class="bar" style="margin-top:10px"><span :style="'width:' + ($store.course.modStats['${m.id}']?.pct || 0) + '%'"></span></div>
            </a>`
          }).join('')}
        </div>
      </div>`).join('')}

    <div class="card">
      <h3>How to study this so it sticks</h3>
      <ul>
        <li><b>Write first, read second.</b> Every step gives you the minimum theory, then makes you type. Typing is where the syntax lives.</li>
        <li><b>Do not chase the score.</b> The score exists to tell you which module is still thin — the skill table in Insights ranks your weakest features first.</li>
        <li><b>Break things on purpose.</b> Delete a <code>:key</code>, remove <code>.prevent</code>, forget <code>x-cloak</code>. The sandbox tells you what changed.</li>
        <li><b>Come back later.</b> Modules 17–18 explain why the earlier ones behaved the way they did; re-reading them after you have written 40 components is a different experience.</li>
        <li><b>Use the actuarial toolkit</b> as a reference implementation: it is plain Alpine code, written the way this course asks you to write.</li>
      </ul>
    </div>
  </div>`
}
