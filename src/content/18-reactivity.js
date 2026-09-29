/* Module 18 — reactivity from the source: Alpine.reactive, Alpine.effect,
 * Alpine.raw and Alpine.release.
 * Matches: /advanced/reactivity, /advanced/extending */

import { sq } from './data.js'

/* a 20-year temporary annuity-due per unit of sum assured, at annual rate i */
const aDue = i => (1 - Math.pow(1 + i, -20)) / (i / (1 + i))
const RATE = 0.03

export default {
  id: 'm18',
  num: 18,
  title: 'Reactivity from the source',
  blurb: 'The two functions everything else is built on — Alpine.reactive and Alpine.effect — plus the escape hatches Alpine.raw and Alpine.release.',
  goal: 'Understand and drive Alpine\'s reactivity directly: make plain objects reactive, run effects on them, and know how to step outside the proxy.',
  intro: `Every bit of reactivity in Alpine — \`x-data\`, \`x-text\`, \`x-effect\`, \`$watch\`, stores — is put together from two functions:\n\n- **\`Alpine.reactive(obj)\`** returns a *proxy* of \`obj\`: a thin wrapper that behaves exactly like the original, except that Alpine now knows every read and write. Writes are visible on the original object too.\n- **\`Alpine.effect(fn)\`** runs \`fn\` immediately and records every reactive property it reads *while it runs*. When one of those properties changes, \`fn\` runs again. That dependency map is the whole trick.\n\nTwo footnotes decide most real-life bugs: reads that happen **after** the callback returns (inside a \`setTimeout\`, an event handler, an \`await\`) are not tracked; and \`Alpine.raw(obj)\` hands you the underlying, non-reactive object so a library — or a deliberately untracked read — can step outside the proxy. \`Alpine.release(runner)\` stops an effect for good.`,
  skills: ['Alpine.reactive', 'Alpine.effect', 'dependency tracking', 'Alpine.raw', 'Alpine.release', 'reactive proxies', 'effect cleanup'],
  docRefs: [
    'https://alpinejs.dev/advanced/reactivity',
    'https://alpinejs.dev/advanced/extending',
    'https://alpinejs.dev/directives/effect'
  ],
  mastery: [
    'Make a plain object reactive with `Alpine.reactive` and drive the page from effects',
    'Predict exactly which reads an effect tracks — and which of them it does not',
    'Reach for `Alpine.raw` when a read must not be tracked, and explain why the original object still changes',
    'Stop an effect with `Alpine.release(runner)` and keep its last value in the interface'
  ],
  units: [
    {
      id: 's1',
      title: 'Reactive data, driven by effects',
      objective: 'Wrap a plain object, render it from an effect, and watch writes reach the original object.',
      brief: `No markup needed — this is the reactivity engine itself:\n\n\`\`\`js\nconst plain = { rate: 0.031 }\nconst data = Alpine.reactive(plain)\n\nAlpine.effect(() => {\n  span.textContent = (data.rate * 100).toFixed(2) + '%'   // read -> dependency\n})\n\ndata.rate = 0.04   // the effect runs again\n\`\`\`\n\n\`Alpine.reactive\` returns a **proxy**, not a copy: \`data.rate = 0.04\` really does set \`plain.rate\`, which is why \`Alpine.raw(data) === plain\`.\n\nAn effect runs **once immediately**, then again on every change to something it read.`,
      example: {
        code: `let data = Alpine.reactive({ count: 1 })

Alpine.effect(() => {
  console.log(data.count)        // logs 1 now, and again after every change
})`,
        note: 'Effect + reactive is the mechanism behind x-effect, x-text and every store in Alpine.'
      },
      starter: `<p>rate <b data-testid="rate"></b> · the plain object says <b data-testid="plain"></b> · audit lines <b data-testid="ticks"></b> · <code>raw === plain</code> <b data-testid="identity"></b></p>
<button data-testid="tick">+25 bp</button>`,
      solution: `<p>rate <b data-testid="rate"></b> · the plain object says <b data-testid="plain"></b> · audit lines <b data-testid="ticks"></b> · <code>raw === plain</code> <b data-testid="identity"></b></p>
<button data-testid="tick">+25 bp</button>

<script>
  const plain = { rate: 0.031, ticks: 0 }
  const data = Alpine.reactive(plain)

  const el = id => document.querySelector(\`[data-testid="\${id}"]\`)

  // the read happens during the run -> this effect re-runs when data.rate changes
  Alpine.effect(() => {
    el('rate').textContent = (data.rate * 100).toFixed(2) + '%'
    el('plain').textContent = plain.rate.toFixed(4)
  })

  // the same data, counted. The counter lives on the *raw* object, so writing it
  // cannot re-trigger this effect.
  Alpine.effect(() => {
    data.rate
    el('ticks').textContent = ++plain.ticks
  })

  el('identity').textContent = String(Alpine.raw(data) === plain)

  document.querySelector('[data-testid="tick"]').addEventListener('click', () => {
    data.rate = data.rate + 0.0025
  })
</script>`,
      hints: [
        'Everything below the markup is plain JavaScript: query the elements once, then let effects write into them.',
        'The first effect must *read* `data.rate` during the run — that read is what registers the dependency.',
        'Count into the raw object (`plain.ticks = plain.ticks + 1`), not into a reactive property the same effect reads: that is how you avoid an effect that triggers itself.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.reactive',
          text: 'The object must be made reactive with `Alpine.reactive`, the rate rendered by an effect, and `Alpine.raw(data) === plain` reported as true.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.reactive\\(" },
            { kind: 'code', pattern: "Alpine\\.effect\\(" },
            { kind: 'text', selector: '[data-testid="rate"]', value: '3.10%' },
            { kind: 'text', selector: '[data-testid="identity"]', value: 'true' }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.effect',
          text: 'Changing the reactive property must re-run the effects: the rate moves and the audit counter goes up.',
          checks: [
            { kind: 'text', selector: '[data-testid="ticks"]', value: '1' },
            { kind: 'text', selector: '[data-testid="rate"]', value: '3.35%', do: [{ click: '[data-testid="tick"]' }, { wait: 150 }] },
            { kind: 'textMatch', selector: '[data-testid="ticks"]', pattern: '^[2-9]\\d*$' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.raw',
          text: 'A write through the proxy must be visible on the original object — that is what `Alpine.raw` hands back.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.raw\\(" },
            { kind: 'textMatch', selector: '[data-testid="plain"]', pattern: '^0\\.03[5-9]\\d$', do: [{ click: '[data-testid="tick"]' }, { wait: 150 }] },
            { kind: 'textMatch', selector: '[data-testid="rate"]', pattern: '^3\\.[3-9]\\d%$' }
          ]
        }
      ]
    },

    {
      id: 's2',
      title: 'What an effect really tracks',
      objective: 'See the dependency rule: only reads made while the callback runs are tracked.',
      brief: `An effect tracks the properties read **between the moment it starts and the moment it returns**. Reads made later — in a \`setTimeout\`, in an event handler, after an \`await\` — belong to no effect at all.\n\n\`\`\`js\nAlpine.effect(() => {\n  const snapshot = state.t          // tracked read\n  setTimeout(() => {\n    out.textContent = snapshot       // fine: the value was read above\n  }, 0)\n})\n\nAlpine.effect(() => {\n  setTimeout(() => {\n    out.textContent = state.t        // NOT tracked: this effect runs exactly once\n  }, 0)\n})\n\`\`\`\n\nIf an effect is supposed to react to something, read it synchronously first — or it will silently go stale the first time the data moves.`,
      example: {
        code: `Alpine.effect(() => {
  let rate = state.rate                 // read here -> tracked
  chart.draw(() => render(state.rate))  // and here -> tracked
  requestAnimationFrame(() => label.textContent = rate)   // uses the snapshot: fine
})`,
        note: 'Snapshot first, then branch out into callbacks that run later.'
      },
      starter: `<p>watched <b data-testid="watched"></b> · snapshot <b data-testid="snapshot"></b> · stale <b data-testid="stale"></b></p>
<button data-testid="step">advance the valuation date</button>`,
      solution: `<p>watched <b data-testid="watched"></b> · snapshot <b data-testid="snapshot"></b> · stale <b data-testid="stale"></b></p>
<button data-testid="step">advance the valuation date</button>

<script>
  const state = Alpine.reactive({ t: 0 })
  const el = id => document.querySelector(\`[data-testid="\${id}"]\`)
  let watchedRuns = 0, staleRuns = 0

  // read in the callback body: tracked, so this re-runs whenever state.t changes
  Alpine.effect(() => {
    watchedRuns++
    el('watched').textContent = 't=' + state.t + ' (run ' + watchedRuns + ')'
  })

  // read in the callback body, used inside the timeout: correct
  Alpine.effect(() => {
    const snapshot = state.t
    setTimeout(() => { el('snapshot').textContent = 'timeout sees t=' + snapshot }, 0)
  })

  // ONLY read after the callback returned: nothing is tracked, so it never re-runs
  Alpine.effect(() => {
    staleRuns++
    setTimeout(() => { el('stale').textContent = 'timeout sees t=' + state.t + ' (run ' + staleRuns + ')' }, 0)
  })

  document.querySelector('[data-testid="step"]').addEventListener('click', () => { state.t = state.t + 1 })
</script>`,
      hints: [
        'Two of the three effects are correct. The third reads its dependency only inside `setTimeout`, so it has no dependencies and runs once.',
        'The fix for the stale one is a snapshot: read `state.t` in the callback body and use that value inside the timeout.',
        'Each effect keeps its own run counter in a plain variable, so the run counts are visible in the interface.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'dependency tracking',
          text: 'Three effects, three readouts — and all of them show the state of `t` at the moment they ran.',
          checks: [
            { kind: 'code', pattern: "setTimeout" },
            { kind: 'textMatch', selector: '[data-testid="watched"]', pattern: '^t=0 \\(run 1\\)$', do: [{ wait: 150 }] },
            { kind: 'textMatch', selector: '[data-testid="snapshot"]', pattern: '^timeout sees t=0$' },
            { kind: 'textMatch', selector: '[data-testid="stale"]', pattern: '^timeout sees t=0 \\(run 1\\)$' }
          ]
        },
        {
          id: 't2',
          skill: 'dependency tracking',
          text: 'After one advance the tracked readout and the snapshot follow `t`, while the untracked one is still stuck on its first run.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="watched"]', pattern: '^t=1 \\(run [2-9]\\d*\\)$', do: [{ click: '[data-testid="step"]' }, { wait: 200 }] },
            { kind: 'textMatch', selector: '[data-testid="snapshot"]', pattern: '^timeout sees t=1$' },
            { kind: 'textMatch', selector: '[data-testid="stale"]', pattern: '^timeout sees t=0 \\(run 1\\)$' }
          ]
        },
        {
          id: 't3',
          skill: 'effect cleanup',
          text: 'Two more advances: the tracked effect keeps up, the untracked one still has exactly one run to its name.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="watched"]', pattern: '^t=3 \\(run [4-9]\\d*\\)$', do: [{ click: '[data-testid="step"]' }, { wait: 160 }, { click: '[data-testid="step"]' }, { wait: 200 }] },
            { kind: 'textMatch', selector: '[data-testid="stale"]', pattern: '\\(run 1\\)$' },
            { kind: 'textMatch', selector: '[data-testid="snapshot"]', pattern: '^timeout sees t=3$' }
          ]
        }
      ]
    },

    {
      id: 's3',
      title: 'Stepping outside the proxy: raw and release',
      objective: 'Read without tracking, and stop an effect you no longer need.',
      brief: `**\`Alpine.raw(proxy)\`** gives you the underlying object. It is the original, not a copy (\`Alpine.raw(data) === plain\`), and reads made through it are **not** tracked:\n\n\`\`\`js\nAlpine.effect(() => {\n  log.textContent = Alpine.raw(store).rate      // never re-runs: nothing was tracked\n})\n\`\`\`\n\nThat is exactly what you want when a library takes your data and you do not want its internal reads to become dependencies — or when an effect must survive without re-running.\n\n**\`Alpine.release(runner)\`** stops an effect for good. \`Alpine.effect(callback)\` returns the effect's runner function, and that is what you hand to \`release\`:\n\n\`\`\`js\nconst runner = Alpine.effect(() => { … })\nAlpine.release(runner)          // this effect will never run again\n\`\`\`\n\n(Alpine uses the same call internally when it discards a subtree — which is why you should not keep writing into an effect you have released: it will happily ignore you.)`,
      example: {
        code: `const store = Alpine.reactive({ rate: 0.03 })

const runner = Alpine.effect(() => {
  label.textContent = store.rate.toFixed(4)
})

Alpine.release(runner)      // stop when the panel closes`,
        note: 'raw() = look without tracking · release(runner) = stop listening'
      },
      starter: `<p><b data-testid="tracked"></b> · <b data-testid="untracked"></b> · raw is the original object: <b data-testid="identity"></b></p>
<button data-testid="bump">+20 bp</button>
<button data-testid="stop">release the effect</button>
<p>frozen at run <b data-testid="stoppedAt"></b> · still at <b data-testid="atStop"></b></p>`,
      solution: `<p><b data-testid="tracked"></b> · <b data-testid="untracked"></b> · raw is the original object: <b data-testid="identity"></b></p>
<button data-testid="bump">+20 bp</button>
<button data-testid="stop">release the effect</button>
<p>frozen at run <b data-testid="stoppedAt"></b> · still at <b data-testid="atStop"></b></p>

<script>
  const plain = { rate: 0.031 }
  const store = Alpine.reactive(plain)
  const el = id => document.querySelector(\`[data-testid="\${id}"]\`)
  let liveRuns = 0, rawRuns = 0

  const tracked = Alpine.effect(() => {
    liveRuns++
    el('tracked').textContent = 'tracked: ' + store.rate.toFixed(4) + ' (run ' + liveRuns + ')'
  })

  // read through raw(): nothing is tracked, so this effect runs exactly once
  Alpine.effect(() => {
    rawRuns++
    el('untracked').textContent = 'raw read: ' + Alpine.raw(store).rate.toFixed(4) + ' (run ' + rawRuns + ')'
  })

  el('identity').textContent = String(Alpine.raw(store) === plain)

  document.querySelector('[data-testid="bump"]').addEventListener('click', () => {
    store.rate = store.rate + 0.002
    el('atStop').textContent = liveRuns        // how many runs the (possibly released) effect has had
  })

  document.querySelector('[data-testid="stop"]').addEventListener('click', () => {
    Alpine.release(tracked)
    el('stoppedAt').textContent = liveRuns
  })
</script>`,
      hints: [
        'The second effect reads `Alpine.raw(store).rate` — the raw object knows nothing about Alpine, so no dependency is registered and it runs once.',
        'Keep the runner returned by `Alpine.effect(...)` in a variable: that is the argument `Alpine.release()` wants.',
        'Report the run count in two places: once when you release, once on the next change — identical numbers are the proof the effect really stopped.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.raw',
          text: 'Both effects run once at start-up, and `Alpine.raw(store) === plain` is reported as true.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.raw\\(" },
            { kind: 'textMatch', selector: '[data-testid="tracked"]', pattern: '^tracked: 0\\.0310 \\(run 1\\)$' },
            { kind: 'textMatch', selector: '[data-testid="untracked"]', pattern: '^raw read: 0\\.0310 \\(run 1\\)$' },
            { kind: 'text', selector: '[data-testid="identity"]', value: 'true' }
          ]
        },
        {
          id: 't2',
          skill: 'dependency tracking',
          text: 'A change moves the tracked readout to 0.0330 — and leaves the raw read at its first value, because nothing was tracked.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="tracked"]', pattern: '^tracked: 0\\.0330 \\(run 2\\)$', do: [{ click: '[data-testid="bump"]' }, { wait: 150 }] },
            { kind: 'textMatch', selector: '[data-testid="untracked"]', pattern: '^raw read: 0\\.0310 \\(run 1\\)$' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.release',
          text: 'After `Alpine.release(runner)` the store can keep changing: the effect never runs again, so the two run counts agree.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.release\\(" },
            { kind: 'custom', name: 'sameText', selector: '[data-testid="stoppedAt"]', selector2: '[data-testid="atStop"]', do: [{ click: '[data-testid="stop"]' }, { click: '[data-testid="bump"]' }, { wait: 200 }] },
            { kind: 'textMatch', selector: '[data-testid="tracked"]', pattern: '^tracked: 0\\.0330 \\(run 2\\)$' }
          ]
        }
      ]
    },

    {
      id: 'e1',
      kind: 'exercise',
      title: 'Exercise — a live basis feed',
      objective: 'Drive an interval-fed reactive store with effects, and freeze it on demand with release.',
      scenario: `The quote desk watches the ${(RATE * 100).toFixed(1)} % basis move during the day: every tick pushes the rate up by 4 bp, and the screen must show the current rate, the 20-year temporary annuity-due per unit of sum assured (${aDue(RATE).toFixed(4)} at ${(RATE * 100).toFixed(1)} %), and a count of how many times the feed effect has run. Starting, stopping and nudging are separate buttons — and after a stop the feed must be dead: no readout may move again, even though the store keeps its new value.`,
      brief: `Elements: \`data-testid="start"\` (a tick every 120 ms, +4 bp each), \`data-testid="stop"\` (stops the timer, releases the effect, writes the run count into \`data-testid="frozen"\`), \`data-testid="nudge"\` (one more +4 bp by hand, and it also writes the current store rate into \`data-testid="rateNow"\`), and the readouts \`rate\` (\`3.000%\` style, three places), \`adue\` (four places), \`ticks\`, \`frozen\`, \`rateNow\`. Annuity-due factor: \`(1 − (1+i)⁻²⁰) / (i/(1+i))\` for a 20-year term.`,
      starter: `<p>rate <b data-testid="rate"></b> · ä₂₀ <b data-testid="adue"></b> · effect runs <b data-testid="ticks"></b> · frozen <b data-testid="frozen"></b> · store now <b data-testid="rateNow"></b></p>
<div class="row">
  <button data-testid="start">start the feed</button>
  <button data-testid="stop">stop and release</button>
  <button data-testid="nudge">+4 bp by hand</button>
</div>`,
      solution: `<p>rate <b data-testid="rate"></b> · ä₂₀ <b data-testid="adue"></b> · effect runs <b data-testid="ticks"></b> · frozen <b data-testid="frozen"></b> · store now <b data-testid="rateNow"></b></p>
<div class="row">
  <button data-testid="start">start the feed</button>
  <button data-testid="stop">stop and release</button>
  <button data-testid="nudge">+4 bp by hand</button>
</div>

<script>
  const plain = { rate: ${RATE}, ticks: 0 }
  const store = Alpine.reactive(plain)
  const el = id => document.querySelector(\`[data-testid="\${id}"]\`)

  const annuityDue = i => (1 - Math.pow(1 + i, -20)) / (i / (1 + i))

  const feed = Alpine.effect(() => {
    el('rate').textContent = (store.rate * 100).toFixed(3) + '%'
    el('adue').textContent = annuityDue(store.rate).toFixed(4)
    el('ticks').textContent = ++plain.ticks
  })

  let timer = null
  document.querySelector('[data-testid="start"]').addEventListener('click', () => {
    if (timer) return
    timer = setInterval(() => { store.rate = Number((store.rate + 0.0004).toFixed(4)) }, 120)
  })

  document.querySelector('[data-testid="stop"]').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null }
    Alpine.release(feed)
    el('frozen').textContent = plain.ticks
  })

  document.querySelector('[data-testid="nudge"]').addEventListener('click', () => {
    store.rate = Number((store.rate + 0.0004).toFixed(4))
    el('rateNow').textContent = plain.rate.toFixed(4)
  })
</script>`,
      hints: [
        'One effect, three readouts: everything the screen shows comes from a single tracked read of `store.rate`.',
        'Keep the runner: `const feed = Alpine.effect(...)` — the stop button hands that to `Alpine.release(feed)`.',
        'The interval lives in a plain variable and is cleared on stop; after the release, `store.rate` still changes but no readout follows it — which is exactly what `rateNow` vs `rate` shows.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.reactive',
          text: 'The store must be reactive and effect-driven: the feed starts at 3.000% with ä₂₀ rendered, and the runner is kept for release.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.reactive\\(" },
            { kind: 'code', pattern: "Alpine\\.effect\\(" },
            { kind: 'code', pattern: "Alpine\\.release\\(" },
            { kind: 'text', selector: '[data-testid="rate"]', value: '3.000%' },
            { kind: 'text', selector: '[data-testid="adue"]', value: aDue(RATE).toFixed(4) }
          ]
        },
        {
          id: 't2',
          skill: 'Alpine.effect',
          text: 'Starting the feed must push the rate and re-run the effect on every tick.',
          checks: [
            { kind: 'text', selector: '[data-testid="ticks"]', value: '1' },
            { kind: 'textMatch', selector: '[data-testid="ticks"]', pattern: '^[2-9]\\d*$', do: [{ click: '[data-testid="start"]' }, { wait: 520 }] },
            { kind: 'textMatch', selector: '[data-testid="rate"]', pattern: '^3\\.[0-9]{3}%$' },
            { kind: 'textNotHas', selector: '[data-testid="rate"]', value: '3.000%' }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.release',
          text: 'After `stop` the feed is dead but the store is not: a hand nudge moves the store while the frozen count and the rendered rate stay put.',
          checks: [
            { kind: 'custom', name: 'sameText', selector: '[data-testid="frozen"]', selector2: '[data-testid="ticks"]', do: [{ click: '[data-testid="stop"]' }, { click: '[data-testid="nudge"]' }, { wait: 200 }] },
            { kind: 'custom', name: 'differentText', selector: '[data-testid="rate"]', selector2: '[data-testid="rateNow"]' },
            { kind: 'textMatch', selector: '[data-testid="rateNow"]', pattern: '^0\\.03[0-9]{2}$' },
            { kind: 'textMatch', selector: '[data-testid="ticks"]', pattern: '^[1-9]\\d*$' }
          ]
        }
      ]
    },

    {
      id: 'e2',
      kind: 'exercise',
      title: 'Exercise — the audit trail',
      objective: 'Keep a running trail from an effect without triggering it again, and stop the trail on demand.',
      scenario: `Every change to the valuation rate has to be written down: one line per run of the audit effect, the count on screen, and a serialised export of the store for the file. The trick is to keep the trail in a plain (non-reactive) buffer — an effect that reads its own output re-runs itself forever. When the desk closes the review, the trail must stop for good while the store keeps its value.`,
      brief: `Elements: \`data-testid="count"\` (lines in the trail), \`data-testid="last"\` (the newest line, \`rate 0.0400\` style), \`data-testid="export"\` (JSON of the raw store), \`data-testid="identity"\` (whether \`Alpine.raw(store)\` is the original object), \`data-testid="bump"\` (+25 bp), \`data-testid="refresh"\` (re-writes the export), \`data-testid="stop"\` (releases the audit effect and writes the line count into \`data-testid="frozen"\`), plus \`data-testid="atStop"\` and \`data-testid="rateNow"\`, both written by the \`bump\` handler. Start: rate 0.04, one line already in the trail.`,
      starter: `<p>lines <b data-testid="count"></b> · newest <b data-testid="last"></b> · rate now <b data-testid="rateNow"></b></p>
<p>export <code data-testid="export"></code> · raw is the store object itself: <b data-testid="identity"></b></p>
<p>frozen at <b data-testid="frozen"></b> · still at <b data-testid="atStop"></b></p>
<div class="row">
  <button data-testid="bump">+25 bp</button>
  <button data-testid="refresh">refresh the export</button>
  <button data-testid="stop">stop the trail</button>
</div>`,
      solution: `<p>lines <b data-testid="count"></b> · newest <b data-testid="last"></b> · rate now <b data-testid="rateNow"></b></p>
<p>export <code data-testid="export"></code> · raw is the store object itself: <b data-testid="identity"></b></p>
<p>frozen at <b data-testid="frozen"></b> · still at <b data-testid="atStop"></b></p>
<div class="row">
  <button data-testid="bump">+25 bp</button>
  <button data-testid="refresh">refresh the export</button>
  <button data-testid="stop">stop the trail</button>
</div>

<script>
  const plain = { rate: 0.04, trail: [] }
  const store = Alpine.reactive(plain)
  const el = id => document.querySelector(\`[data-testid="\${id}"]\`)

  const audit = Alpine.effect(() => {
    const rate = store.rate                       // the only tracked read
    plain.trail.push('rate ' + rate.toFixed(4))   // a plain buffer: writing here cannot re-trigger the effect
    el('count').textContent = plain.trail.length
    el('last').textContent = plain.trail[plain.trail.length - 1]
  })

  const writeExport = () => { el('export').textContent = JSON.stringify(Alpine.raw(store)) }

  el('identity').textContent = String(Alpine.raw(store) === plain)
  writeExport()

  document.querySelector('[data-testid="bump"]').addEventListener('click', () => {
    store.rate = Number((store.rate + 0.0025).toFixed(4))
    el('rateNow').textContent = plain.rate.toFixed(4)
    el('atStop').textContent = plain.trail.length
  })

  document.querySelector('[data-testid="refresh"]').addEventListener('click', writeExport)

  document.querySelector('[data-testid="stop"]').addEventListener('click', () => {
    Alpine.release(audit)
    el('frozen').textContent = plain.trail.length
  })
</script>`,
      hints: [
        'Keep the trail in the raw object (`plain.trail`) and only read `store.rate` in the effect — otherwise the effect reads what it writes and runs forever.',
        'The export is a snapshot of the raw store: `JSON.stringify(Alpine.raw(store))`.',
        'Two run counts, again: one written when you release, one written by the bump handler — equal numbers mean the trail really stopped.'
      ],
      tasks: [
        {
          id: 't1',
          skill: 'Alpine.effect',
          text: 'The audit effect must have run once at start-up, leaving one line, and `Alpine.raw(store)` must be the original object.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.effect\\(" },
            { kind: 'code', pattern: "Alpine\\.raw\\(" },
            { kind: 'text', selector: '[data-testid="count"]', value: '1' },
            { kind: 'text', selector: '[data-testid="last"]', value: 'rate 0.0400' },
            { kind: 'text', selector: '[data-testid="identity"]', value: 'true' },
            { kind: 'textHas', selector: '[data-testid="export"]', value: '\"rate\":0.04' }
          ]
        },
        {
          id: 't2',
          skill: 'dependency tracking',
          text: 'A bump must append exactly one line, name it after the new rate, and show up in a refreshed export.',
          checks: [
            { kind: 'textMatch', selector: '[data-testid="count"]', pattern: '^[2-9]\\d*$', do: [{ click: '[data-testid="bump"]' }, { wait: 150 }] },
            { kind: 'text', selector: '[data-testid="last"]', value: 'rate 0.0425' },
            { kind: 'textHas', selector: '[data-testid="export"]', value: '\"rate\":0.0425', do: [{ click: '[data-testid="refresh"]' }, { wait: 100 }] }
          ]
        },
        {
          id: 't3',
          skill: 'Alpine.release',
          text: 'After `stop` the trail must be closed: the store moves on, the trail does not, and both run counts agree.',
          checks: [
            { kind: 'code', pattern: "Alpine\\.release\\(" },
            { kind: 'custom', name: 'sameText', selector: '[data-testid="frozen"]', selector2: '[data-testid="atStop"]', do: [{ click: '[data-testid="stop"]' }, { click: '[data-testid="bump"]' }, { wait: 200 }] },
            { kind: 'text', selector: '[data-testid="rateNow"]', value: '0.0450' },
            { kind: 'textMatch', selector: '[data-testid="last"]', pattern: '^rate 0\\.0425$' }
          ]
        }
      ]
    }
  ],

  quiz: [
    {
      id: 'q1',
      type: 'mc',
      skill: 'Alpine.reactive',
      q: 'What does `Alpine.reactive({ rate: 0.03 })` give you back?',
      options: [
        'The same object, wrapped in a proxy that records reads and writes',
        'A deep copy — the original stays plain and unaffected',
        'A read-only frozen snapshot',
        'A new object with getters and setters generated per property, disconnected from the original'
      ],
      answer: 0,
      why: 'It is a thin wrapper: writes through the proxy land on the original object, which is why `Alpine.raw(proxy) === obj` and why a plain variable you kept can be read by other, non-Alpine code.',
      distractors: {
        1: 'A copy would break that identity — and with it every hand-off to code that already holds the object.'
      }
    },
    {
      id: 'q2',
      type: 'multi',
      skill: 'dependency tracking',
      q: 'Which reads become dependencies of a running `Alpine.effect` callback?',
      options: [
        'A reactive property read in the callback body',
        'A reactive property read inside a helper the callback calls synchronously',
        'A reactive property read inside a `setTimeout` the callback scheduled',
        'A reactive property read in an event handler the callback registered'
      ],
      answers: [0, 1],
      why: 'Tracking runs between the start and the end of the callback: anything reached synchronously counts, anything that happens later belongs to no effect.',
      distractors: {
        2: 'Later reads are untracked — the classic reason an effect "never fires" when the only read sits in a timeout.'
      }
    },
    {
      id: 'q3',
      type: 'mc',
      skill: 'dependency tracking',
      q: 'An effect never re-runs and its readout stays on the first value. The only read of the dependency happens inside a `setTimeout`. Why?',
      options: [
        'Nothing was read while the callback ran, so the effect registered no dependencies',
        'Alpine throttles effects to one run per second',
        'The reactive proxy was garbage collected',
        '`setTimeout` callbacks are not allowed to read reactive data'
      ],
      answer: 0,
      why: 'Dependencies are collected during the run. Snapshot the value synchronously (`const t = state.t`) and use the snapshot inside the timeout — then the read is tracked and the later callback still has the right value.',
      distractors: {
        1: 'There is no default throttling; a scheduler can be passed to `Alpine.effect(cb, { scheduler })` when you want one.'
      }
    },
    {
      id: 'q4',
      type: 'mc',
      skill: 'Alpine.raw',
      q: 'You hand a reactive store to a charting library and do not want the library\'s reads to count as dependencies. What do you pass?',
      options: [
        '`Alpine.raw(store)` — the underlying object, reads through which are not tracked',
        '`JSON.parse(JSON.stringify(store))` — a deep copy',
        '`store` anyway: libraries cannot read proxies',
        '`Object.assign({}, store)` — a shallow copy'
      ],
      answer: 0,
      why: '`raw()` returns the original object behind the proxy: same data, no tracking, and the identity test `Alpine.raw(store) === plain` passes.',
      distractors: {
        1: 'A deep copy costs you the identity and any live binding the library might have wanted.'
      }
    },
    {
      id: 'q5',
      type: 'mc',
      skill: 'Alpine.release',
      q: 'How do you stop an effect created with `Alpine.effect(callback)`?',
      options: [
        'Keep the runner it returns and call `Alpine.release(runner)`',
        'Call `Alpine.release(proxy)` on the reactive object the effect reads',
        'Set `runner.stopped = true`',
        'It cannot be stopped — only page teardown ends an effect'
      ],
      answer: 0,
      why: '`Alpine.effect` returns the effect\'s runner function; `Alpine.release(runner)` stops it. Passing anything else (a proxy, for example) throws, because there is no effect on it to stop.',
      distractors: {
        1: 'Releasing the proxy is not a thing in this API — the error mentions `.stop`, which is your clue.'
      }
    },
    {
      id: 'q6',
      type: 'multi',
      skill: 'Alpine.reactive',
      q: 'Which statements are true?',
      options: [
        '`x-data` properties are reactive because Alpine wraps a component\'s data in `Alpine.reactive`',
        'An effect that reads a property it also writes will keep re-running itself',
        '`Alpine.raw(obj)` returns a copy of the object',
        'Reading through `Alpine.raw(obj)` inside an effect does not register a dependency'
      ],
      answers: [0, 1, 3],
      why: 'One engine, one rule: reads track, writes trigger. Keeping a buffer outside the reactive graph (a raw array, a plain variable) is how you record change without feeding it back in.',
      distractors: { 2: '`raw()` gives you the object itself, not a copy — which is exactly why the identity check passes.' }
    }
  ]
}
