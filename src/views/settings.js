/* =============================================================================
 * views/settings — readability, storage, shortcuts and the honest small print.
 * ========================================================================== */

import { stats } from '../content/index.js'

export function renderSettings() {
  return `
  <div class="stack" x-data="settings" x-cloak>
    <div>
      <div class="crumb">Readability &amp; storage</div>
      <h1>Make this course fit your eyes</h1>
      <p>
        Dyslexia-friendly defaults are baked in: no italics, wide word spacing, long line height, short lines,
        never colour alone, and a font you choose. These settings are stored in this browser and apply instantly.
      </p>
    </div>

    <div class="card">
      <h3>Reading font</h3>
      <p class="tiny muted">Lexend and Atkinson Hyperlegible are bundled locally as woff2; OpenDyslexic is bundled too. No web font request ever leaves this page.</p>
      <div class="grid three">
        <template x-for="f in fonts" :key="f.id">
          <button class="card" style="margin:0;text-align:left;background:#101a30" @click="setFont(f.id)"
                  :class="prefs.font === f.id ? 'btn-primary' : ''">
            <b x-text="f.name"></b>
            <div class="tiny" x-text="f.note"></div>
            <div style="font-family:'Lexend'" x-show="f.id === 'lexend'" class="tiny">Probability of survival ₙpₓ = ℓₓ₊ₙ / ℓₓ</div>
            <div style="font-family:'Atkinson Hyperlegible'" x-show="f.id === 'atkinson'" class="tiny">Probability of survival ₙpₓ = ℓₓ₊ₙ / ℓₓ</div>
            <div style="font-family:'OpenDyslexic'" x-show="f.id === 'opendyslexic'" class="tiny">Probability of survival ₙpₓ = ℓₓ₊ₙ / ℓₓ</div>
          </button>
        </template>
      </div>
      <hr>
      <div class="grid two">
        <div>
          <h4>Text size</h4>
          <div class="row">
            <button class="btn-sm" @click="setSize(-1)">A−</button>
            <span class="chip" x-text="sizeNames[prefs.size - 1]"></span>
            <button class="btn-sm" @click="setSize(1)">A+</button>
          </div>
          <label class="switch" style="margin-top:12px">
            <input type="checkbox" x-model="prefs.spacing" :true-value="'wide'" :false-value="'normal'">
            <span>Extra word &amp; line spacing</span>
          </label>
          <label class="switch">
            <input type="checkbox" x-model="prefs.plain">
            <span>Plain mode — remove colour accents (never colour-alone, but some readers prefer no hue at all)</span>
          </label>
          <label class="switch">
            <input type="checkbox" x-model="prefs.ruler">
            <span>Reading ruler — a band that follows your pointer</span>
          </label>
        </div>
        <div>
          <h4>Why these defaults</h4>
          <ul class="tiny">
            <li>No italics: slanted letterforms are the first thing to break apart for dyslexic readers; emphasis uses weight and colour instead.</li>
            <li>Word spacing is widened by ~0.09em and line height is 1.75 by default.</li>
            <li>Paragraphs are capped at 78 characters, because long lines make return-sweeps error-prone.</li>
            <li>Every status carries a symbol (✓ ✗ –) and a number, never colour alone.</li>
            <li>All controls are at least 44&nbsp;px tall and reachable by keyboard with a 3&nbsp;px focus ring.</li>
            <li><code>prefers-reduced-motion</code> switches off every animation.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Progress storage</h3>
      <p class="tiny">
        The dashboard score, every checked task, every quiz answer and your drafts live in this browser.
        Nothing is sent anywhere; there is no account and no analytics.
      </p>
      <dl class="kv">
        <dt>Backend</dt><dd x-text="storageKind"></dd>
        <dt>Storage keys in use</dt><dd x-text="keys"></dd>
        <dt>Progress size</dt><dd x-text="bytes + ' bytes'"></dd>
        <dt>Course content</dt><dd>${stats.moduleCount} modules · ${stats.taskCount} tasks · ${stats.quizCount} quiz items</dd>
      </dl>
      <div class="row" style="margin-top:10px">
        <button class="btn" @click="exportProgress()">⤓ export progress</button>
        <label class="btn" style="cursor:pointer">⤒ import progress
          <input type="file" accept="application/json" @change="importProgress($event)" style="display:none">
        </label>
        <button class="btn-danger" @click="$dispatch('open-reset')">reset everything</button>
      </div>
    </div>

    <div class="card">
      <h3>Keyboard shortcuts</h3>
      <table class="data">
        <tbody>
          <tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Move through every control (focus ring is always visible)</td></tr>
          <tr><td><kbd>Alt</kbd>+<kbd>→</kbd></td><td>Next module</td></tr>
          <tr><td><kbd>Alt</kbd>+<kbd>←</kbd></td><td>Previous module</td></tr>
          <tr><td><kbd>Tab</kbd> inside the editor</td><td>Inserts two spaces instead of leaving the field</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Closes the reset dialog</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>About this course</h3>
      <p class="tiny">
        Content is written against <b>Alpine.js 3.17.4</b> and follows the structure of the official documentation
        (Essentials → Directives → Magics → Globals → Plugins → Advanced), plus the parts that only exist in the
        source: <code>Alpine.deferInit()</code>, <code>Alpine.interceptInit()</code>,
        <code>Alpine.addScopeToNode()</code>, <code>Alpine.release()</code>, <code>Alpine.raw()</code> and
        directive ordering with <code>.before()</code>.
        Exercises run against a real Alpine instance inside a sandboxed iframe — the same version you will ship.
      </p>
      <p class="tiny muted">
        The course app itself is written in the style it teaches: <code>Alpine.store()</code> for shared state,
        <code>Alpine.data()</code> for components, <code>$watch</code>, <code>$nextTick</code>,
        <code>$dispatch</code>, <code>x-for</code> with <code>:key</code>, and the persist plugin in the workshop notes.
      </p>
    </div>
  </div>`
}
