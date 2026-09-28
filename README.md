# learn-alpine

An exhaustive, exercise-driven course for **Alpine.js 3.17.4** — eighteen modules that walk
from `x-data` to `Alpine.deferInit`, with every claim tied to the official documentation and
every lesson checked by a real browser running real Alpine.

The exercises are **real work**: reserving triangles and chain-ladder development factors,
life contingencies (`äₓ:ₙ`, endowments, reserves), mortality-table interpolation, credibility
theory, information geometry, Monte Carlo risk simulations, portfolio valuation tools.
You learn the framework by using it on problems that deserve a spreadsheet.

- **Nothing is taken on faith.** Every task is asserted by a sandbox that mounts your markup,
  dispatches real events and inspects the DOM. Failures tell you what the sandbox actually saw.
- **A mastery score** you can trust: 45 % auto-checked exercises, 40 % quiz credit (1.0 for a
  first-try answer, 0.5 for a corrected one), 15 % coverage. Progress persists locally, and
  exports as JSON.
- **Built for long reading sessions:** dark by default, three reading fonts
  (Lexend · Atkinson Hyperlegible · OpenDyslexic), adjustable size and word spacing, an
  optional reading ruler, a colour-plain mode, and generous line height everywhere.
- **Runs anywhere:** a static folder, or the whole thing as **one double-clickable HTML file**.

---

## Quick start

```bash
npm install
npm run dev          # → http://localhost:5173
```

No Node? Any static server will do, because there is no build step at runtime:

```bash
python3 -m http.server 5173      # then open http://localhost:5173
```

Or grab the single file:

```bash
npm run build:standalone         # writes learn-alpine.html (~1.3 MB, everything inlined)
```

Double-click `learn-alpine.html`. No server, no folder, no network — it even carries its own
copy of Alpine for the "installation" lesson, whose exercises deliberately load Alpine with a
`<script src>` tag that cannot resolve offline.

## What is in the box

| | |
|---|---|
| **Modules** | 18, from `x-data` and reactivity to `Alpine.directive`, `Alpine.morph` and `Alpine.reactive` |
| **Guided steps** | 60+ short units, each with one idea, one worked example, and 2 tasks |
| **Exercises** | 24+ of them, each a small application to build and get auto-checked |
| **Quiz items** | 74, with per-distractor explanations, filterable in the quiz battery |
| **Reference** | 100-row cheatsheet of the complete 3.17 surface, searchable, linked to alpinejs.dev |
| **Toolkit** | six working actuarial calculators (life table, chain-ladder, credibility, bond, VaR, stats) |

Modules: ① foundations · ② state · ③ text/html/bind · ④ show/if · ⑤ loops · ⑥ events ·
⑦ forms · ⑧ effects & lifecycle · ⑨ element handles · ⑩ global state · ⑪ reusable components ·
⑫ persist & intersect · ⑬ collapse/resize/sort · ⑭ focus & anchor · ⑮ transitions ·
⑯ async & morph · ⑰ extending Alpine · ⑱ reactivity from the source.

## Publishing it

```bash
bash scripts/publish.sh          # build, push to GitHub, switch GitHub Pages on
```

The script creates the repo if needed, pushes `main`, and enables Pages for the branch root
via the GitHub API; it prints the live URL when it is done. Requirements: `git` and the
[GitHub CLI](https://cli.github.com) (`gh auth login` once). The site works from the
`/<repo>/` subpath — there is a test for exactly that (`node tests/pages.mjs`).

Prefer Vercel? `bash scripts/publish.sh --vercel` (or `npx vercel --prod`). Either host works:
the app is plain static files with hash routing and relative paths.

Doing it by hand is three clicks too:

```bash
git remote add origin https://github.com/<you>/learn-alpine.git
git push -u origin main
# then on GitHub: Settings → Pages → Source: Deploy from a branch → main → / (root) → Save
```

## Tests

| command | what it proves |
|---|---|
| `npm test` | browser-free audit: 18 modules, ≥3 units each, quiz sanity, actuarial identities, 100 reference rows |
| `npm run test:e2e` | Playwright: every published solution passes every task of every unit, every marked quiz answer scores, every route renders |
| `node tests/standalone.mjs` | the single-file build really works from `file://` — including the raw-mode lessons |
| `node tests/pages.mjs` | the course works when served from a subpath, with no 404s (GitHub Pages layout) |
| `node tests/probe.mjs m07 e2 --trace` | one unit, one check at a time, with DOM dumps — for authoring new material |

`npm run test:all` runs the first two together.

## Repository layout

```
index.html              the hosted entry point
styles.css              the design system (already dark-first)
assets/                 build output: app.js + harness-inline.js
learn-alpine.html       the single-file build (generated)
src/
  app.js                Alpine start-up: plugins, components, router
  store.js              the course store: progress, prefs, score, toasts
  lib/                  engine (mastery), checks (assertion DSL), runner (sandboxes), storage
  harness/index.js      the runtime that lives inside every exercise sandbox
  components/           workbench, quiz item, quiz battery, cheatsheet, toolkit, settings
  views/                dashboard, study path, module, quiz, workshop, calculator, insights
  content/              the curriculum: one file per module, data.js, reference.js
scripts/                build · standalone · serve · dev · content-index · publish.sh
tests/                  run.mjs · e2e.mjs · standalone.mjs · pages.mjs · probe.mjs
vendor/alpine/          pinned 3.17.4 builds for the offline "installation" lesson
```

Edit `src/`, then `npm run build` to regenerate `assets/`. The curriculum itself lives in
`src/content/NN-*.js` — one object per module: `units[]` (starter markup, solution, hints,
tasks with checks) and `quiz[]`.

## License

MIT. Alpine.js is MIT-licensed and belongs to Caleb Porzio and contributors; the fonts are
Lexend, Atkinson Hyperlegible and OpenDyslexic, all under the SIL Open Font License.
