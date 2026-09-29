/* =============================================================================
 * ladder.js — the pedagogical spine.
 *
 * Content files hold the material; THIS file holds the ladder. For every module
 * it answers three questions a learner asks at every rung:
 *
 *   1. what do I already know that this rung uses?   (youKnow)
 *   2. what is the ONE new idea here?                (adds / unit `idea`)
 *   3. what will I be able to do afterwards?         (after)
 *
 * and for every unit a one-sentence `idea` plus a `bridge` that names the
 * connection to the step before it. Exercises also get a plain-language `goal`
 * and a short `build` list, which the workbench shows above the editor — so the
 * goal is never a wall of prose and never off-screen.
 *
 * Rule for authors: if you cannot write the `bridge`, the step is in the wrong
 * place in the ladder.
 * ========================================================================== */

export const ladder = {
  /* ------------------------------------------------------------------ m01 */
  m01: {
    youKnow: `Nothing yet — this is the ground floor. If you have written HTML, you have everything you need.`,
    adds: `Alpine itself: one script tag, and the short window in which your own code is allowed to register things.`,
    after: `You can put Alpine on any page, load a plugin with it, and know exactly when your setup code runs.`,
    units: {
      s1: { idea: `One deferred script tag turns a static page into a reactive one.`,
            bridge: `Start here: no build tools, no npm, no config. Just a page and a script tag.` },
      s2: { idea: `Plugins are separate files that must be loaded before the core, because the core starts everything.`,
            bridge: `You can boot Alpine from a tag. Now add an official plugin to the same page.` },
      s3: { idea: `alpine:init is the window between "Alpine is here" and "the page wakes up" — your code belongs in it.`,
            bridge: `You have loaded Alpine and a plugin by hand. Now register something of your own, at the right moment.` },
      e1: { idea: `Apply all three routes to one real page.`,
            bridge: `Three routes, one exercise: install, register a component, and compute a premium from a life table.`,
            goal: `Make the endowment quote sheet live: a broker types a sum assured and sees the single premium and the level annual premium per 1,000.`,
            build: [ `Register a component and use it from the markup.`,
                     `Sum assured starts at 250,000 and is editable.`,
                     `Single premium = A x sum assured, to 2 decimals.`,
                     `Level premium = (A x 1000) / ä, to 2 decimals.` ] },
      e2: { idea: `Boot a page from scratch and prove the lifecycle order.`,
            bridge: `Now the same job with no help: write the install tag and the registration window yourself, and log the lifecycle.`,
            goal: `Write the bootstrapping for a pricing page by hand, and leave a visible log proving what happened in which order.`,
            build: [ `Load Alpine with a deferred script tag.`,
                     `Register the component during alpine:init.`,
                     `Badge reads READY once the component has initialised.`,
                     `Log reads: alpine:init then the component init then alpine:initialized.` ] }
    }
  },

  /* ------------------------------------------------------------------ m02 */
  m02: {
    youKnow: `Alpine is running (M1) and the page has a component in it.`,
    adds: `Component state: where values live, who can see them, and how to derive new values instead of storing them twice.`,
    after: `You can model a real calculation — inputs, derived figures, and a method that changes them — without duplicating a single number.`,
    units: {
      s1: { idea: `x-data declares the values a component owns; everything inside that element can read them.`,
            bridge: `In M1 you made the page wake up. Now give it something to remember.` },
      s2: { idea: `Scopes nest: a child reads its own values first, then the parent's, without copying.`,
            bridge: `One scope works. Now put a second component inside the first and see who wins.` },
      s3: { idea: `A getter is a value that recomputes from state, so it can never drift out of date.`,
            bridge: `You can hold values. Now make new values out of them — without storing the answer.` },
      s4: { idea: `Methods change state; this refers to the component, and init() runs once at creation.`,
            bridge: `Getters read state. Now change it — on a click, and at start-up.` },
      e1: { idea: `Build a credibility factor from raw inputs.`,
            bridge: `Time to combine all four ideas on one statistical formula a real actuary uses.`,
            goal: `Build a credibility calculator: from exposure m, sample mean x̄ and prior mean μ, show the credibility Z and the blended estimate.`,
            build: [ `Z = m / (m + k) to 4 decimals; credible mean to 3 decimals.`,
                     `Typing 350 exposure gives Z = 0.7568 and a credible mean of 388.108.`,
                     `A button sets m to half the credibility unit and Z falls to 0.5000.` ] },
      e2: { idea: `Turn a survival table into a derived, self-consistent table.`,
            bridge: `One formula is done. Now do the same over an array of ages, where each row derives from l₀.`,
            goal: `Render a mortality-table slice where every row is computed from the radix l₀ — change l₀ and the whole table must follow.`,
            build: [ `Five rows: population at each age (0 dp) and deaths in the year (0 dp).`,
                     `Both columns come from one getter, not from stored arrays.`,
                     `Bind an input to l₀ and the table recomputes: l₀ = 50,000 halves every number.` ] }
    }
  },

  /* ------------------------------------------------------------------ m03 */
  m03: {
    youKnow: `Values live in a scope and can be derived (M2).`,
    adds: `Getting those values onto the screen: text, HTML, attributes, classes and styles — and the rule for each one.`,
    after: `You can put any computed number in the right place, formatted, and know when you are taking a security risk.`,
    units: {
      s1: { idea: `x-text sets the text of an element on every change; expressions are allowed inside it.`,
            bridge: `Your calculator computes numbers nobody can see yet. Start by getting one of them on screen.` },
      s2: { idea: `x-html inserts real markup — powerful, and a security decision you make on purpose.`,
            bridge: `Text is safe. Now the version that is not, and why it exists.` },
      s3: { idea: `x-bind puts an expression into any attribute, and has special forms for classes and styles.`,
            bridge: `Text nodes are handled. Now drive the rest of the element: attributes, classes, inline styles.` },
      s4: { idea: `x-cloak hides un-initialised markup for a moment; x-ignore keeps a subtree out of Alpine entirely.`,
            bridge: `You can bind everything now. Two loose ends: the flash of raw markup, and pieces of the page Alpine should leave alone.` },
      e1: { idea: `An analytics card that binds numbers, a bar and a flag.`,
            bridge: `Time to use every binding at once on a bond: price, duration, convexity, a bar and a warning flag.`,
            goal: `Build a bond analytics card that shows price, modified duration and convexity, plus a bar and a flag that react to a stress button.`,
            build: [ `Price (2 dp), duration (4 dp), convexity (4 dp) rendered as text.`,
                     `The duration bar is an inline width of 87.08%.`,
                     `A stress button sets duration to 4.9 and the flag gets the class rich only above 4.5.` ] },
      e2: { idea: `Bind classes and text across a whole data-driven grid.`,
            bridge: `One card is done. Now the same binding job over 20 cells of a loss triangle, where the rules are per-cell.`,
            goal: `Draw a loss-development heat map: 20 triangle cells, each coloured by its own threshold, plus the worst accident year.`,
            build: [ `20 cells in triangle shape, first cell reads 100.`,
                     `warm above 200, hot above 240.1 — 8 warm and 2 hot.`,
                     `A worst readout names the accident year with the largest latest diagonal.` ] }
    }
  },

  /* ------------------------------------------------------------------ m04 */
  m04: {
    youKnow: `You can render values and bind attributes (M3).`,
    adds: `The choice that decides your bugs: hide an element and keep everything in it, or remove it and lose it.`,
    after: `You pick x-show or x-if deliberately, and you can say what happens to state, cost and focus either way.`,
    units: {
      s1: { idea: `x-show toggles display; the element and its state stay alive.`,
            bridge: `Everything is visible so far. Start with the gentler of the two ways to make something disappear.` },
      s2: { idea: `x-if destroys and rebuilds the subtree, so anything inside it starts fresh.`,
            bridge: `Now the other one: not hiding, removing. Same result on screen, very different underneath.` },
      s3: { idea: `Branch on a computed value, not on a flag you have to keep in sync.`,
            bridge: `Two mechanisms, one decision. Now the decision made in data — a value that says which branch you are in.` },
      e1: { idea: `Choose the right mechanism per panel and justify it.`,
            bridge: `Alert content is cheap and must survive hiding; a heavy table is expensive and must not exist until asked for. Use the right tool for each.`,
            goal: `Build a loss-ratio panel with two very different hidden things: a banner whose contents must survive hiding, and a heavy table that must not exist until asked for.`,
            build: [ `Breach flag reads BREACH and the banner survives being hidden and shown again.`,
                     `Heavy table is absent until its toggle is clicked, then shows 5 rows, then is absent again.` ] },
      e2: { idea: `Per-row conditional detail inside a loop.`,
            bridge: `Panels are done. Now the same idea inside a table: row-level detail that only exists for the open row.`,
            goal: `Make a mortality table where any row can reveal its own detail — and only one row at a time.`,
            build: [ `Five rows, no detail visible at the start.`,
                     `Clicking age 60 creates exactly one detail block containing 99252 and sets openAge to 60.`,
                     `Clicking the same row again removes the block from the DOM.` ] }
    }
  },

  /* ------------------------------------------------------------------ m05 */
  m05: {
    youKnow: `You can show, hide and remove single elements (M4).`,
    adds: `Repeating markup over data with x-for — and the identity rules that make reused rows behave.`,
    after: `You can render tables and lists from data, keep row identity stable with keys, and move a subtree with x-teleport.`,
    units: {
      s1: { idea: `x-for repeats a template once per item, with optional index, over arrays, objects or ranges.`,
            bridge: `One element is easy. Now make twenty of them from data instead of copy-paste.` },
      s2: { idea: `:key tells Alpine which DOM node is which item, so rows keep their state when the order changes.`,
            bridge: `The list renders. Now make it trustworthy: give every row an identity.` },
      s3: { idea: `Nested loops give you a staggered table — a loss triangle is the textbook case.`,
            bridge: `One loop is done. Now put a loop inside a loop, which is exactly what a development triangle is.` },
      s4: { idea: `x-teleport moves a subtree elsewhere in the document while keeping its scope.`,
            bridge: `Tables are covered. One more loop-adjacent tool: rendering content somewhere other than where you wrote it.` },
      e1: { idea: `Nested loops plus derived row totals.`,
            bridge: `Now the reserving table itself: a triangle and a per-year summary derived from it.`,
            goal: `Build a reserving table: render the loss triangle and derive the IBNR per accident year and in total.`,
            build: [ `Full triangle: 20 cells, plus 5 summary lines.`,
                     `Total IBNR (175.8) is derived from the row values, never typed in.` ] },
      e2: { idea: `Keys make re-ordering safe for the user's work.`,
            bridge: `Rendering is solved. The hard part is re-ordering a list without losing what the user typed into each row.`,
            goal: `Build a claims list that can be sorted repeatedly without losing a single tick or DOM row.`,
            build: [ `Four claims, each with a referred checkbox and a live count.`,
                     `Sorting by severity or client re-orders the rows while all 4 original row nodes survive.`,
                     `Sorting by client puts Casa Verde first and Orinoco Rail last.` ] }
    }
  },

  /* ------------------------------------------------------------------ m06 */
  m06: {
    youKnow: `You can render and re-order data (M5).`,
    adds: `Interaction: x-on, the modifiers that control the browser's defaults and propagation, and custom events between components.`,
    after: `You can wire any control, stop a page from navigating, close things only when you mean to, and let components talk.`,
    units: {
      s1: { idea: `x-on listens; .prevent, .stop and key modifiers control what the browser does next.`,
            bridge: `You have data on screen. Now let the user act on it, without the browser's default behaviour getting in the way.` },
      s2: { idea: `.outside and .self say precisely which clicks count — the difference between a dropdown that works and one that fights you.`,
            bridge: `Clicks are wired. Now the subtle version: a click that should close a menu and the many that should not.` },
      s3: { idea: `$dispatch sends a custom event up the tree; the parent listens for it like any other event.`,
            bridge: `Events are handled locally. Now let one component tell another something happened.` },
      e1: { idea: `A keyboard-driven picker with correct defaults.`,
            bridge: `Now build the interaction pattern every serious app needs: arrows to move, Enter to choose, Escape to cancel.`,
            goal: `Build a basis picker operated entirely from the keyboard: arrows move the highlight, Enter applies the basis, Escape cancels and changes nothing.`,
            build: [ `Three bases, the first highlighted; ArrowDown moves the highlight and only one is ever highlighted.`,
                     `ArrowDown then Enter puts ä = 10.8826 in the chosen readout.`,
                     `Escape sets status to cancelled and leaves chosen as none; ArrowUp at the top stays at the top.` ] },
      e2: { idea: `Separate live input from committed change.`,
            bridge: `Keyboard is done. Now the other half of real forms: showing a value while the user is still moving the slider, and recording it only when they let go.`,
            goal: `Build a rate control that updates a provisional readout while you drag, and writes exactly one audit line when you release.`,
            build: [ `Slider to 0.05 updates the provisional readout with no log entry.`,
                     `Releasing adds exactly one entry reading rate=0.050.`,
                     `Enter in the number box adds an entry only when the value actually changed.` ] }
    }
  },
  /* ------------------------------------------------------------------ m07 */
  m07: {
    youKnow: `You can wire any event by hand (M6), including keyboard interaction and commit-on-change.`,
    adds: `x-model: the shortcut that binds a control to state in both directions — plus the modifiers and x-mask that keep typed input sane.`,
    after: `You can build a real form: every control type, correct timing, and input that cannot be malformed.`,
    units: {
      s1: { idea: `x-model binds a control's value to state; one binding covers text, checkbox, radio, select and range.`,
            bridge: `In M6 you wired values by hand with x-on. Here is the shortcut that does it for every control type at once.` },
      s2: { idea: `.lazy waits for the change event, .fill seeds the input on boot, and .number keeps numbers numeric.`,
            bridge: `Binding works. Now choose WHEN the model updates — every keystroke, or only when the user is done.` },
      s3: { idea: `x-mask constrains what can be typed at all, so downstream code never sees a malformed value.`,
            bridge: `The model is honest about timing. Now stop bad input at the keyboard instead of validating it afterwards.` },
      e1: { idea: `A complete illustration form with validation.`,
            bridge: `Every control type, correct timing and a mask — now use them together on a form that must refuse bad business.`,
            goal: `Build a new-business illustration form that quotes a premium from age, sum assured, term and smoker status — and refuses ages outside the issue range.`,
            build: [ `Defaults quote 12206.80 with verdict quoted; the mask is stripped for arithmetic (250000).`,
                     `600,000 moneys and a 20-year term with smoker status re-quote to 36620.39.`,
                     `Age 17 is refused with verdict too young; age 71 says beyond issue age.` ] },
      e2: { idea: `One global control driving derived rows.`,
            bridge: `One form is done. Now a control that re-rates a whole book at once, without a reload and without a thousand recomputations.`,
            goal: `Build a portfolio recalc: one factor control re-rates every policy row through derived state, and a filter narrows the book.`,
            build: [ `Default factor: four policies, first quotes 12206.80, second 24413.60.`,
                     `Factor 1.20 re-rates the first row to 14648.16 and shows the factor as 1.20.`,
                     `Smokers only leaves exactly the two rated policies visible, still at the applied factor.` ] }
    }
  },

  /* ------------------------------------------------------------------ m08 */
  m08: {
    youKnow: `Components react to input and to each other (M6, M7).`,
    adds: `Time: the exact moments your code runs — once at creation, whenever state changes, when one property changes, and after the DOM catches up.`,
    after: `You can seed, mirror, watch and defer without guessing, and you can keep a page and the outside world in step.`,
    units: {
      s1: { idea: `x-init runs once, when the component is created — the place to seed or to start something.`,
            bridge: `Everything so far ran because the user did something. Now run code at a moment you choose.` },
      s2: { idea: `x-effect re-runs whenever anything it reads changes — ideal for mirroring state somewhere else.`,
            bridge: `Init runs once. Now the opposite: work that must run every time a value changes, without you listing the dependencies.` },
      s3: { idea: `$watch gives you one property with old and new values; $nextTick waits for the DOM to catch up.`,
            bridge: `Effects handle mirroring. Two more precise tools: watching a single value, and waiting for the browser to render.` },
      e1: { idea: `Init, effect, watch and nextTick in one believable tool.`,
            bridge: `All four timings, one valuation workbench: title mirroring, an audit trail, focus after render, and a table-driven figure.`,
            goal: `Build a valuation workbench where the tab title mirrors the rate, every revision lands in an audit trail, a new row grabs focus when it appears, and the annuity factor follows the rate table.`,
            build: [ `Tab title and readout both read valuation · UL-4417 @ 0.045 on boot and follow the rate.`,
                     `Two revisions leave two lines: 0.045 → 0.055 then 0.055 → 0.06.`,
                     `Annuitant rows focus their share input on add.`,
                     `Annuity-due tracks the table: 0.03 → 11.9043, 0.045 → 10.8826, 0.055 → 10.2793, otherwise n/a.` ] },
      e2: { idea: `Save with an effect, restore with init.`,
            bridge: `Now the same two hooks doing real work: a draft that saves itself and comes back after a reload.`,
            goal: `Build a draft that mirrors itself to storage on every change and restores itself on boot — without any plugin.`,
            build: [ `On boot the draft is mirrored once and restored reads no.`,
                     `Changing the loading re-mirrors it (effect run 2) and storage holds the new figure.`,
                     `After the sandbox reloads, restored reads yes and the field shows 12.5.` ] }
    }
  },

  /* ------------------------------------------------------------------ m09 */
  m09: {
    youKnow: `You can run code at chosen moments (M8).`,
    adds: `Handles: reaching the current element, the component root, a named node, and generated unique ids.`,
    after: `You can act on any node you need, wire up accessible label relationships, and manage focus without a plugin.`,
    units: {
      s1: { idea: `x-ref names a node; $refs reaches it from anywhere inside the component.`,
            bridge: `So far you changed state and let the markup follow. Now reach into the DOM itself.` },
      s2: { idea: `$el is the element the expression is running on — the key to writing one handler that works for many rows.`,
            bridge: `Named nodes are useful; the node in your hand is more useful still.` },
      s3: { idea: `$root is the component's root element, $data is the merged scope behind it.`,
            bridge: `Now the two ends of a component: the element at the top, and all the data beneath it.` },
      s4: { idea: `$id and x-id generate matching unique ids so label, hint and error can reference each other.`,
            bridge: `Handles are covered. One more: ids that must match each other and must never collide when the component is reused.` },
      e1: { idea: `References, generated ids and a root reset in one form.`,
            bridge: `Now a form built the accessible way: labels that point at inputs, an error that is announced, a jump button, and a reset that clears the root.`,
            goal: `Build an accessible quote form: jump to a field, connect labels and errors to their inputs by id, and clear the whole component from one button.`,
            build: [ `jump focuses the sum field; the age field accepts a typed value.`,
                     `Age and sum labels point at their inputs, and the sum field references the error paragraph.`,
                     `clear wipes the root state and the row note reads cleared from the row.` ] },
      e2: { idea: `One handler, many rows, each acting on itself.`,
            bridge: `The form is done. Now the pattern that makes row components cheap: use $el so one handler serves every row.`,
            goal: `Build claim rows that manage themselves: flagging a row styles that row only, and focuses that row's own note field.`,
            build: [ `Flagging row one adds flagged to that row only and the count reads 1 with CL-901 listed.`,
                     `Flagging row two puts the cursor in its own note field and the list reads CL-901,CL-902.`,
                     `The third row keeps a clean slate.` ] }
    }
  },

  /* ------------------------------------------------------------------ m10 */
  m10: {
    youKnow: `You can build and reach into one component (M2, M9).`,
    adds: `Alpine.store: state that lives outside any component, so unrelated widgets agree on one truth.`,
    after: `You can lift shared state into a store, keep derived values inside it, and mutate deep state correctly.`,
    units: {
      s1: { idea: `A store is global reactive data; any component can read it with $store.`,
            bridge: `Everything you have built lives inside one component. Now that two widgets must agree, state has to move up a level.` },
      s2: { idea: `Getters keep derived values in the store; methods keep mutations in one place.`,
            bridge: `Two widgets can read one value. Now keep the arithmetic there too, so no widget can disagree about it.` },
      s3: { idea: `A store's init() seeds it at registration, and nested objects are reactive when replaced wholesale.`,
            bridge: `The store works. Now give it a proper start-up: seed it once, and change nested state the way Alpine can see.` },
      e1: { idea: `Three writers, one ledger.`,
            bridge: `A ledger is the classic shared-state problem: several cells write, one roll-up reads.`,
            goal: `Build a shared IBNR ledger: several cells add or amend their own line, one roll-up totals whatever is there.`,
            build: [ `Adding Property 19.3 renders one line reading Property 19.3 and totals 19.3.`,
                     `All three lines total 123.5 in the order Motor, Property, Marine.`,
                     `Amending Marine rewrites its line instead of adding one; clear empties the ledger.` ] },
      e2: { idea: `One source of truth, three independent widgets.`,
            bridge: `Now prove it: change one global basis and watch three unrelated components move together.`,
            goal: `Build three widgets that share one basis through a store, so switching the basis moves every widget at once.`,
            build: [ `Standard basis: all three agree — k = 112.5, Z = 0.6400, IBNR 175.8.`,
                     `Prudent basis moves every widget: k = 800, Z = 0.2000, IBNR 158.2.`,
                     `Switching back restores the standard numbers exactly.` ] }
    }
  },

  /* ------------------------------------------------------------------ m11 */
  m11: {
    youKnow: `You can share state app-wide (M10) and derive values (M2).`,
    adds: `Packaging: one component definition instantiated many times, with arguments — and reusable attribute bundles with Alpine.bind.`,
    after: `You can stop copy-pasting components and markup, and give each instance its own data.`,
    units: {
      s1: { idea: `Alpine.data registers a named component once; x-data uses the name as often as you like.`,
            bridge: `You have written state inline every time. Now write it once and reuse it.` },
      s2: { idea: `A component factory takes arguments, so one definition can serve many instances with different data.`,
            bridge: `One definition, one behaviour. Now make the same definition behave differently per instance.` },
      s3: { idea: `Alpine.bind bundles repeated directives into a named object you can apply with x-bind.`,
            bridge: `Behaviour is reusable. Now make the markup reusable too, so you stop rewriting the same attributes.` },
      e1: { idea: `Four instances of one card.`,
            bridge: `One component, four accident years — and each card must own its own numbers.`,
            goal: `Extract a repeated card into one component and instantiate it four times, each with its own accident year and IBNR.`,
            build: [ `All 4 cards show their own year and IBNR: 2020: 5.7, 2021: 19.3, 2022: 46.7, 2023: 104.2.`,
                     `Raising the second card by 10% moves only that card (21.2), leaving the others untouched.`,
                     `Its reset restores 19.3 without disturbing the neighbours.` ] },
      e2: { idea: `A markup bundle plus a behaviour component, joined by this.`,
            bridge: `Instances are done. Now the harder pairing: reusable attributes AND reusable behaviour, sharing one model.`,
            goal: `Build a form field bundle that knows about the form it lives in: markup reused via Alpine.bind, behaviour via Alpine.data, and touch-tracking in between.`,
            build: [ `Field comes from the bundle: type=number, step=10000, id and aria-describedby wired to a real hint.`,
                     `Typing 250000 counts one touch, stores the value and switches the class to touched.`,
                     `reset clears the untracked state: sum 0, touches 0, class back to untouched.` ] }
    }
  },

  /* ------------------------------------------------------------------ m12 */
  m12: {
    youKnow: `You can build, share and reuse components (M10, M11).`,
    adds: `Persistence and visibility: $persist for state that outlives a reload, x-intersect for work that waits until it is looked at.`,
    after: `You can make a tool remember where the user left it, and defer expensive work until it is actually needed.`,
    units: {
      s1: { idea: `$persist mirrors a value into storage and reads it back on boot — one modifier, no code.`,
            bridge: `So far state dies with the page. Now let the user close the tab and come back to where they were.` },
      s2: { idea: `You control the storage key, the storage area, and what shape gets saved.`,
            bridge: `Persisting one value works. Now name the key, pick the store, and save a whole object.` },
      s3: { idea: `x-intersect fires when an element enters the viewport — with .once, .margin and :leave when you need more.`,
            bridge: `State now survives reloads. Next: work that should not run at all until the user actually looks.` },
      e1: { idea: `A settings object that remembers itself.`,
            bridge: `Now a settings panel a reviewer would use daily: three choices that must come back exactly as left.`,
            goal: `Build a valuation settings panel that persists as one object and survives a reload — including a reset back to house defaults.`,
            build: [ `After reset the panel shows 0.045, standard, 250000 and exactly that object is in storage.`,
                     `Changes land in storage as they happen: prudent, 0.03, 500000.`,
                     `After the sandbox reloads the panel returns at 0.03, prudent, 500000.` ] },
      e2: { idea: `Load expensive content on first sight, once.`,
            bridge: `Persistence is done. Now the performance habit: nothing heavy should be built until it is on screen.`,
            goal: `Defer a heavy triangle report until the block is scrolled into view, once, with an honest placeholder until then.`,
            build: [ `Before scrolling in, the placeholder is visible and loaded reads no.`,
                     `Scrolling in builds the report: loaded yes, placeholder gone, 5 rows and IBNR 175.8.` ] }
    }
  },
  /* ------------------------------------------------------------------ m13 */
  m13: {
    youKnow: `You can persist state and defer work until it is visible (M12).`,
    adds: `Sizing and ordering: x-resize for layout that measures itself, x-sort for lists whose order is real data.`,
    after: `You can build components that adapt to the space they are given, and lists the user can re-order for real.`,
    units: {
      s1: { idea: `x-resize re-runs an expression whenever the element's own size changes, exposing $width and $height.`,
            bridge: `Until now layout was decided by the window. Now let an element react to the box it was actually given.` },
      s2: { idea: `Measure the component instead of the viewport: the same card can lay itself out differently in two places.`,
            bridge: `Measuring works. Now make a real decision from the measurement — and watch the document itself when asked.` },
      s3: { idea: `x-sort makes a list draggable and hands you $item and $position; the order is data you own.`,
            bridge: `Size is handled. Now the other half of layout: order, controlled by the person using the tool.` },
      e1: { idea: `A drag-reorderable queue that changes what the numbers mean.`,
            bridge: `Now a review queue where dragging a year to the top changes its review priority — and the percentages must follow.`,
            goal: `Build a review queue the actuary can re-order, where dragging a year into the top three changes the reviewed share of the book.`,
            build: [ `In year order the queue lists 2022, 2023, 2024, 2025 and the top three carry 40.8%.`,
                     `Moving 2025 to the top re-orders the rows and lifts the share to 73.5%.`,
                     `The wiring is complete: ghost preview, the year as each row's sort key, a handle that keeps the row clickable.` ] },
      e2: { idea: `One card, two contexts, two layouts.`,
            bridge: `Measurement is in place. Now use it where it matters: the same valuation card must fit a narrow column and a wide panel.`,
            goal: `Build a valuation card that changes its own layout based on its measured width, and reports the viewport alongside it.`,
            build: [ `Measured element width drives the layout decision, not a window media query.`,
                     `The viewport readout updates on window resize.` ] }
    }
  },

  /* ------------------------------------------------------------------ m14 */
  m14: {
    youKnow: `You can build adaptive, sortable interfaces (M13).`,
    adds: `Dialogs and popovers that behave: x-trap for keyboard containment, $focus for steering, x-anchor for positioning.`,
    after: `You can ship a modal and a menu that a keyboard user can actually complete, positioned correctly.`,
    units: {
      s1: { idea: `x-trap keeps Tab inside a dialog while it is open and gives focus back when it closes.`,
            bridge: `Your interfaces work with a mouse. Now make one that must work with a keyboard, and keep the keyboard inside it.` },
      s2: { idea: `$focus moves focus deliberately — .within() limits the search, .wrap() loops at the ends.`,
            bridge: `The trap holds focus inside. Now drive it yourself: a list you navigate with arrows.` },
      s3: { idea: `x-anchor positions an element relative to another and keeps it there; $anchor reports the coordinates.`,
            bridge: `Keyboard is handled. Now the other half of popovers: they must stay attached to what opened them.` },
      e1: { idea: `A keyboard-complete approval dialog.`,
            bridge: `Now a reserve approval that a keyboard user can complete end to end, with focus returned afterwards.`,
            goal: `Build a reserve-approval dialog: focus is trapped while it is open, Escape closes it, focus returns to the trigger, and the decision is recorded.`,
            build: [ `Tab cycles inside the dialog and the page behind it is not reachable.`,
                     `Escape closes it and focus returns to the button that opened it.`,
                     `Approving records the decision and the status text changes.` ] },
      e2: { idea: `Per-row tooltips that escape a clipped panel.`,
            bridge: `One dialog is done. Now many popovers: a qx tooltip for every row of a table, anchored to the cell clicked.`,
            goal: `Build a mortality table where clicking any qx cell opens a tooltip anchored to that cell, above it, visible even inside a clipped panel.`,
            build: [ `Each row's cell anchors its own tooltip — no shared ref, no swapped positions.`,
                     `The tooltip opens above the cell, within tolerance.`,
                     `The panel clips its content, so the tooltip must be positioned to escape it.` ] }
    }
  },

  /* ------------------------------------------------------------------ m15 */
  m15: {
    youKnow: `You can show, hide and remove content (M4) and control interaction precisely (M6).`,
    adds: `Motion: the transition helper, the six CSS phase classes, and the one directive combination that can actually animate.`,
    after: `You can add movement that explains a change — and you know which toggling directive can be animated and which cannot.`,
    units: {
      s1: { idea: `x-transition with .duration, .delay, .opacity and .scale times the built-in fade and scale.`,
            bridge: `Everything has appeared and disappeared instantly so far. Start with the one-line version of motion.` },
      s2: { idea: `The six phase classes (enter, enter-start, enter-end and the three leave equivalents) hand the motion to your CSS.`,
            bridge: `The helper covers simple cases. Now take full control of every phase.` },
      s3: { idea: `x-show keeps the node, x-if destroys it — and only x-show can be transitioned.`,
            bridge: `Before you animate a conditional block, you must know which of the two mechanisms you are using — because only one of them can.` },
      s4: { idea: `x-collapse animates height on an element that already has x-show, with .duration and a .min floor.`,
            bridge: `Fades and slides are done. The last shape of motion is the one everyone wants: expanding and collapsing to fit the content.` },
      e1: { idea: `A full six-phase cycle, staged correctly, leaving nothing behind.`,
            bridge: `Now drive all six phases yourself on a movement banner: in, out, and no leftover classes.`,
            goal: `Build a banner that arrives and leaves using your own CSS phase classes, with the timings staged so the sequence is visible.`,
            build: [ `All six phase classes are applied in the right order, with your own CSS doing the work.`,
                     `The banner ends hidden with no phase classes left on it.` ] },
      e2: { idea: `Asymmetric timings and a second, independent animation.`,
            bridge: `One animated element is done. Now a drawer that opens slowly and closes quickly, plus a notice that fades in on its own.`,
            goal: `Build a drawer with asymmetric timings — slow to open, quick to close — and an x-if notice that fades in separately.`,
            build: [ `Enter duration is longer than leave duration, and both are visible in computed styles.`,
                     `Closing leaves the drawer hidden, not mid-animation.`,
                     `The notice appears only when the drawer is open.` ] }
    }
  },

  /* ------------------------------------------------------------------ m16 */
  m16: {
    youKnow: `You can build, animate and persist a complete interface (M1-M15).`,
    adds: `Data that arrives late: awaiting promises in markup, and Alpine.morph to patch new markup into a live page.`,
    after: `You can load data honestly, handle failure, and refresh markup without destroying what the user is typing.`,
    units: {
      s1: { idea: `Alpine awaits promises in expressions, so await works directly in x-text — and a paren-less async function is awaited too.`,
            bridge: `Every value so far existed immediately. Now deal with the one that takes 250 milliseconds and sometimes does not arrive at all.` },
      s2: { idea: `Alpine.morph patches new HTML into existing nodes, so the user's input and the component's state survive.`,
            bridge: `Loading is handled. Now the harder refresh: replacing markup without throwing away what the user has done inside it.` },
      s3: { idea: `Alpine.data turns an async component into a reusable definition with arguments.`,
            bridge: `Async loading and morphing both work on one element. Now package them so they can be used twice with different arguments.` },
      e1: { idea: `An async loader with honest states and a retry.`,
            bridge: `Now the interface the desk would accept: two bases, a visible loading state, a real failure, and a retry that works.`,
            goal: `Build a basis loader that pulls one of two tables on demand, says honestly whether it is loading, ready or failed, and can retry after an outage.`,
            build: [ `Two bases, each button loading its own table.`,
                     `State reads loading, ready or failed, and an error message says what happened.`,
                     `Rows appear only when ready; the outage button makes the next attempt fail, and retry recovers it.` ] },
      e2: { idea: `Refresh server markup while keeping the reviewer's work.`,
            bridge: `Loading is solved. Now the refresh that must not lose anything: new numbers arrive while a note is half-typed.`,
            goal: `Refresh a quote panel with freshly generated markup while the reviewer's typed note and the compliance flag survive untouched.`,
            build: [ `One refresh moves the panel to the new scenario and updates the basis stamp.`,
                     `The three value cells keep their DOM identity (keyed) rather than being rebuilt.`,
                     `The typed note and the compliance flag are exactly as left, and the patch count proves the morph ran.` ] }
    }
  },

  /* ------------------------------------------------------------------ m17 */
  m17: {
    youKnow: `You know every directive and magic this course teaches, and you know when they run (M1-M16).`,
    adds: `Writing your own: Alpine.magic, Alpine.directive, Alpine.plugin, and the low-level hooks for components that arrive late.`,
    after: `You can grow the framework itself and ship it as one installable package.`,
    units: {
      s1: { idea: `Alpine.magic registers a getter — return a value for $name, or a function for $name(...).`,
            bridge: `You have used dozens of magics. Now write one, and learn the one window in which you are allowed to.` },
      s2: { idea: `A directive receives its element, its own shape (value, modifiers, expression) and a toolkit including evaluateLater and effect.`,
            bridge: `Opening the door with a magic. Now open it wider: an x- directive of your own, with the same pieces Alpine's own directives use.` },
      s3: { idea: `Alpine.plugin installs a package; addScopeToNode injects scope before other directives; interceptInit plus deferInit suspend a subtree until its prerequisite exists.`,
            bridge: `Two extensions, written one at a time. Now package them, inject scope early, and handle a component that only arrives later.` },
      e1: { idea: `Ship a formatting directive and a lookup magic as one plugin.`,
            bridge: `Now the real thing: one installable package the desk can drop into any page, doing the formatting and lookup nobody wants to repeat.`,
            goal: `Package an x-money directive and a $basis(id) magic as a single plugin, usable from any component on the page.`,
            build: [ `One plugin installs both; x-money renders 1234567 as $1,234,567.`,
                     `The .cents modifier switches to two decimals, and the format follows the value when it doubles.`,
                     `$basis('unisex') returns the record, so the label reads Unisex annuitant and the factor 1.14.` ] },
      e2: { idea: `Suspend a subtree until its provider exists.`,
            bridge: `Installing a package is easy. The hard case is a component whose code has not downloaded yet — and must not initialise until it has.`,
            goal: `Build a card whose component definition arrives late: it stays cloaked and inert while it waits, then initialises itself once the provider is registered.`,
            build: [ `While the module is outstanding nothing inside the card initialises.`,
                     `Loading the module releases the card: status ready, three rows, cloak removed.`,
                     `The provider is a real Alpine.data definition carrying the ages in order.` ] }
    }
  },

  /* ------------------------------------------------------------------ m18 */
  m18: {
    youKnow: `You have used reactivity everywhere — and extended Alpine (M17).`,
    adds: `The engine underneath: Alpine.reactive makes plain objects reactive, Alpine.effect re-runs on what it reads, Alpine.raw and Alpine.release step outside.`,
    after: `You can drive reactivity directly, predict exactly what an effect tracks, and switch it off cleanly.`,
    units: {
      s1: { idea: `reactive() wraps an object in a proxy; effect() runs a callback now and again whenever anything it read changes.`,
            bridge: `This is the machinery behind every x-text you have written. Look at it directly, with no markup involved.` },
      s2: { idea: `Only reads made while the callback runs are tracked — a read inside setTimeout is not.`,
            bridge: `Effects re-run. Now learn the rule that decides when they do, because it explains the bug you will otherwise chase for an hour.` },
      s3: { idea: `Alpine.raw gives the underlying object (reads are not tracked); Alpine.release(runner) stops an effect for good.`,
            bridge: `Tracking is understood. Two escapes left: reading without registering a dependency, and stopping an effect that is no longer needed.` },
      e1: { idea: `A live feed driven by one effect, frozen on demand.`,
            bridge: `Now use the engine on a real feed: an interval that moves the rate, and a stop button that must genuinely stop it.`,
            goal: `Build a live basis feed: a ticker moves the rate, one effect re-renders the rate and the annuity factor, and a stop button releases the effect so nothing follows the store any more.`,
            build: [ `Start runs a tick every 120ms, four basis points each, and the effect re-runs.`,
                     `Stop clears the timer and releases the effect.`,
                     `A hand nudge after the stop still moves the store, while the rendered rate and the frozen count stay put.` ] },
      e2: { idea: `Record change without feeding it back.`,
            bridge: `The feed is done. The last habit is subtler: an effect that writes an audit trail must not read what it writes, or it re-runs itself forever.`,
            goal: `Build an audit trail where every rate change appends one line, the count and newest line update, and the trail can be frozen while the store keeps moving.`,
            build: [ `One line on boot (rate 0.0400) and Alpine.raw(store) is the original object.`,
                     `A bump appends exactly one line (rate 0.0425) and the export reflects it.`,
                     `After stop the store moves on (0.0450) while the trail and the frozen count stay put.` ] }
    }
  }
}
