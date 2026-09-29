/* =============================================================================
 * reference.js — the complete Alpine 3.17 surface, one row per feature.
 * This file doubles as the exhaustiveness checklist for the curriculum:
 * every entry below is taught (with a checked exercise) in at least one module.
 * `m` = the module number that covers it.
 * ========================================================================== */

export const reference = [
  /* -------------------------------------------------------------- installation */
  { g: 'Install', n: 'Script tag (CDN)', s: '<script defer src="…/alpinejs@3.x.x/dist/cdn.min.js"></script>', w: 'Fastest start. Must be deferred; plugins go before core.', u: 'https://alpinejs.dev/essentials/installation', m: 1 },
  { g: 'Install', n: 'npm + bundler', s: "import Alpine from 'alpinejs'; window.Alpine = Alpine; Alpine.start()", w: 'The npm build does not auto-start: you call Alpine.start() yourself.', u: 'https://alpinejs.dev/essentials/installation', m: 1 },
  { g: 'Install', n: 'Plugin order', s: '<script src="plugin"></script> then <script src="core"></script>', w: 'Plugin scripts listen for alpine:init, so they must load BEFORE Alpine.', u: 'https://alpinejs.dev/essentials/installation', m: 1 },
  { g: 'Install', n: 'CSP build', s: 'dist/cdn.min.js vs module.esm.js + Alpine CSP', w: 'Alpine needs eval for expressions; the CSP build restricts you to method calls.', u: 'https://alpinejs.dev/advanced/csp', m: 1 },

  /* ------------------------------------------------------------------ x-data */
  { g: 'Directive', n: 'x-data', s: 'x-data="{ open: false }"', w: 'Declares the component scope. Everything else lives inside it.', u: 'https://alpinejs.dev/directives/data', m: 2 },
  { g: 'Directive', n: 'x-data (empty)', s: 'x-data', w: 'Legal: creates an empty (but real) scope, e.g. for $refs or $dispatch only.', u: 'https://alpinejs.dev/directives/data', m: 2 },
  { g: 'Directive', n: 'x-data scopes', s: 'nested x-data', w: 'Child scopes see parents; a write always hits the nearest scope that owns the key.', u: 'https://alpinejs.dev/directives/data', m: 2 },
  { g: 'Directive', n: 'Getters', s: 'get bmi() { return this.w / this.h ** 2 }', w: 'Computed values are re-evaluated on read, so they cannot drift out of sync.', u: 'https://alpinejs.dev/directives/data', m: 2 },
  { g: 'Directive', n: 'Methods', s: 'increment() { this.count++ }', w: 'Share logic between directives; call as increment() or @click="increment".', u: 'https://alpinejs.dev/directives/data', m: 2 },
  { g: 'Directive', n: 'Object spread', s: 'x-data="{ ...base(), extra: 1 }"', w: 'Compose reusable data objects without a build step.', u: 'https://alpinejs.dev/directives/data', m: 2 },

  /* ------------------------------------------------------------- templating */
  { g: 'Directive', n: 'x-text', s: 'x-text="premium.toFixed(2)"', w: 'Sets textContent — safe with user data, no HTML parsing.', u: 'https://alpinejs.dev/directives/text', m: 3 },
  { g: 'Directive', n: 'x-html', s: 'x-html="row.comment"', w: 'Sets innerHTML — only with trusted content: it parses markup.', u: 'https://alpinejs.dev/directives/html', m: 3 },
    { g: 'Directive', n: 'x-bind', s: '<div x-bind:class="…"> / :class="…"', w: 'The generic binder: class, style, disabled, aria-*, data-* and plain attributes; the : shorthand is the same directive.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
{ g: 'Directive', n: 'x-bind:attribute', s: 'x-bind:href="url"  ·  :href="url"', w: 'Binds any attribute; the short form is the colon.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-bind:class (object)', s: ':class="{ \'is-up\': trend > 0 }"', w: 'Object syntax toggles classes; false removes the class entirely.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-bind:class (array)', s: ":class=\"[base, active && 'on']\"", w: 'Combine static and conditional classes without string surgery.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-bind:style', s: ":style=\"'width:' + pct + '%'\"  ·  :style=\"{ width: pct + '%' }\"", w: 'Object syntax is safer: it escapes values for you.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'Boolean attribute', s: ':disabled="!valid"', w: 'false removes the attribute; true adds it (works for checked, required, hidden…).', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-bind on aria/data', s: ':aria-invalid="!valid" :data-state="state"', w: 'Accessible and test-friendly bindings are ordinary attributes.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-bind shorthand + object spread', s: ':class="{ ...cls }"  ·  x-bind="allAttrs"', w: 'x-bind with no argument spreads a whole object of attributes.', u: 'https://alpinejs.dev/directives/bind', m: 3 },
  { g: 'Directive', n: 'x-cloak', s: '[x-cloak] { display: none !important }', w: 'Hides un-initialised markup so users never see a flash of raw bindings.', u: 'https://alpinejs.dev/directives/cloak', m: 3 },
  { g: 'Directive', n: 'x-ignore', s: 'x-ignore on a subtree', w: 'Skip Alpine in a subtree (heavy third-party widget). .self ignores just that element.', u: 'https://alpinejs.dev/directives/ignore', m: 3 },

  /* ------------------------------------------------------------------ toggling */
  { g: 'Directive', n: 'x-show', s: 'x-show="open"', w: 'Toggles display:none — the element stays in the DOM (state, focus, height).', u: 'https://alpinejs.dev/directives/show', m: 4 },
    { g: 'Directive', n: 'x-transition', s: 'x-transition.opacity.duration.600ms / :enter="{ … }"', w: 'The transition helper and the six phase classes: x-transition:enter, :enter-start, :enter-end, :leave, :leave-start, :leave-end.', u: 'https://alpinejs.dev/directives/transition', m: 15 },
  { g: 'Plugin', n: 'x-collapse', s: 'x-collapse.duration.600ms / .min.100px', w: 'Animates the height of an element that already has x-show; .min sets a displayed floor instead of the collapsed 0px state.', u: 'https://alpinejs.dev/plugins/collapse', m: 15 },
{ g: 'Directive', n: 'x-show + transition', s: 'x-show="open" x-transition', w: 'The classic dropdown/modal pairing.', u: 'https://alpinejs.dev/directives/show', m: 15 },
  { g: 'Directive', n: 'x-if', s: '<template x-if="rows.length">', w: 'Adds/removes DOM: must live on a <template>, and has no else branch.', u: 'https://alpinejs.dev/directives/if', m: 4 },
  { g: 'Directive', n: 'When to use which', s: 'x-show vs x-if', w: 'Cheap toggling, keep state → x-show. Costly subtree, must not exist → x-if.', u: 'https://alpinejs.dev/directives/if', m: 4 },
  { g: 'Directive', n: 'x-init', s: 'x-init="fetchData()"  ·  x-init="() => {}"', w: 'Runs when the component initialises; also accepts a callback with $nextTick.', u: 'https://alpinejs.dev/directives/init', m: 8 },

  /* --------------------------------------------------------------------- loops */
  { g: 'Directive', n: 'x-for', s: '<template x-for="r in rows" :key="r.id">', w: 'Loops over arrays, numbers and objects (key, value).', u: 'https://alpinejs.dev/directives/for', m: 5 },
  { g: 'Directive', n: 'x-for index', s: '<template x-for="(r, i) in rows">', w: 'Second argument is the index (for objects: value, key, index).', u: 'https://alpinejs.dev/directives/for', m: 5 },
  { g: 'Directive', n: ':key', s: ':key="r.id"', w: 'Identity, not position: keeps DOM nodes (and their state) stable on reorder.', u: 'https://alpinejs.dev/directives/for', m: 5 },
  { g: 'Directive', n: 'x-for over a range', s: '<template x-for="i in 12">', w: 'Repeats N times with a 1-based counter — handy for months/quarters.', u: 'https://alpinejs.dev/directives/for', m: 5 },
  { g: 'Directive', n: 'x-for nesting', s: 'nested templates', w: 'Each loop gets the outer scope; avoid re-keying mistakes.', u: 'https://alpinejs.dev/directives/for', m: 5 },
  { g: 'Directive', n: 'x-teleport', s: '<template x-teleport="body">', w: 'Moves a subtree elsewhere in the DOM (modals, toasts) while keeping scope.', u: 'https://alpinejs.dev/directives/teleport', m: 5 },

  /* -------------------------------------------------------------------- events */
    { g: 'Directive', n: 'x-on', s: '<button @click="open = true">', w: 'Attach listeners from markup; @ is the shorthand, and modifiers (prevent, outside, window, debounce…) hang off it.', u: 'https://alpinejs.dev/directives/on', m: 6 },
{ g: 'Directive', n: 'x-on / @', s: '@click="open = ! open"', w: 'Listens to any DOM event; the shorthand is @.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.prevent / .stop', s: '@submit.prevent="save()"', w: 'Calls preventDefault() / stopPropagation() for you.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.outside', s: '@click.outside="open = false"', w: 'Anywhere in the document except inside this element.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.window / .document', s: '@keydown.escape.window="open = false"', w: 'Attaches the listener to window/document instead of the element.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.once', s: '@click.once="track()"', w: 'The handler runs a single time, then is removed.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.debounce / .throttle', s: '@input.debounce.500ms="search()"', w: 'Debounce waits for quiet; throttle fires at a maximum rate.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.self / .camel / .dot', s: '@click.self  ·  @custom-event.camel', w: 'Only if the event target is this element; casing helpers for event names.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: 'Key modifiers', s: '@keydown.enter.prevent="add()"  ·  @keyup.shift.a', w: 'enter, escape, arrow keys, letters, plus system modifiers (shift-).', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: 'Mouse modifiers', s: '@click.right  ·  @click.middle', w: 'Right/middle-button clicks specifically.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Modifier', n: '.passive', s: '@scroll.passive="…"', w: 'Hints the browser not to wait for the handler (scrolling performance).', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Directive', n: 'Event object', s: '@click="log($event)"', w: '$event is the raw DOM event; also available as $event.target, key, detail…', u: 'https://alpinejs.dev/directives/on', m: 6 },

  /* --------------------------------------------------------------------- forms */
  { g: 'Directive', n: 'x-model', s: 'x-model="rate"', w: 'Two-way binding for text, number, range, checkbox, radio, select, textarea.', u: 'https://alpinejs.dev/directives/model', m: 7 },
  { g: 'Directive', n: 'x-model.number / .boolean', s: 'x-model.number="sum"  ·  x-model.boolean="riders"', w: 'Cast the input to a number / boolean so maths does not silently fail.', u: 'https://alpinejs.dev/directives/model', m: 7 },
  { g: 'Directive', n: 'x-model.debounce', s: 'x-model.debounce.500ms="q"', w: 'Bind only after the user stops typing — ideal for search boxes.', u: 'https://alpinejs.dev/directives/model', m: 7 },
  { g: 'Directive', n: 'x-model.fill', s: 'x-model.fill="label"', w: 'Placeholder text follows the model while typing.', u: 'https://alpinejs.dev/directives/model', m: 7 },
  { g: 'Directive', n: 'Checkbox arrays', s: '<input type="checkbox" value="x" x-model="riderList">', w: 'Several checkboxes bound to one array collect their values.', u: 'https://alpinejs.dev/directives/model', m: 7 },
  { g: 'Directive', n: 'x-modelable', s: 'x-modelable="value" x-data="{ value: 0 }"', w: 'Makes a component work with x-model from the outside.', u: 'https://alpinejs.dev/directives/modelable', m: 7 },
  { g: 'Directive', n: 'x-mask', s: 'x-mask="9999-99-99"', w: 'Input formatting with dynamic and function masks.', u: 'https://alpinejs.dev/plugins/mask', m: 7 },

  /* ------------------------------------------------------------- side effects */
  { g: 'Directive', n: 'x-effect', s: 'x-effect="document.title = title"', w: 'Re-runs whenever anything it reads changes — a reactive side effect.', u: 'https://alpinejs.dev/directives/effect', m: 8 },
  { g: 'Directive', n: 'x-ref', s: 'x-ref="input" … $refs.input.focus()', w: 'Direct handle on an element inside the component.', u: 'https://alpinejs.dev/directives/ref', m: 9 },
  { g: 'Directive', n: 'x-id', s: 'x-id="[\'field\']" :id="$id(\'field\')"', w: 'Generates unique ids — the accessible label/aria pattern.', u: 'https://alpinejs.dev/directives/id', m: 9 },

  /* -------------------------------------------------------------------- magics */
  { g: 'Magic', n: '$el', s: '$el.classList', w: 'The element the expression runs on.', u: 'https://alpinejs.dev/magics/el', m: 9 },
  { g: 'Magic', n: '$refs', s: '$refs.canvas', w: 'All x-ref targets in the current component.', u: 'https://alpinejs.dev/magics/refs', m: 9 },
  { g: 'Magic', n: '$store', s: '$store.course.score.mastery', w: 'Global reactive state shared by every component.', u: 'https://alpinejs.dev/magics/store', m: 10 },
  { g: 'Magic', n: '$data', s: '$data.open', w: 'The raw data object of the nearest x-data — useful for logging.', u: 'https://alpinejs.dev/magics/data', m: 9 },
  { g: 'Magic', n: '$root', s: '$root.querySelectorAll(…).length', w: 'The element that owns the nearest x-data scope.', u: 'https://alpinejs.dev/magics/root', m: 9 },
  { g: 'Magic', n: '$id', s: '$id(\'tab\')', w: 'Stable unique id per component (pairs with x-id).', u: 'https://alpinejs.dev/magics/id', m: 9 },
  { g: 'Magic', n: '$watch', s: 'this.$watch(\'rate\', (v, old) => …)', w: 'Observe a property and react to changes (from inside the component).', u: 'https://alpinejs.dev/magics/watch', m: 8 },
  { g: 'Magic', n: '$dispatch', s: '$dispatch(\'refresh\', { force: true })', w: 'Fires a CustomEvent from the element (bubbles by default).', u: 'https://alpinejs.dev/magics/dispatch', m: 6 },
  { g: 'Magic', n: '$nextTick', s: '$nextTick(() => $refs.input.focus())', w: 'Wait for Alpine to finish updating the DOM.', u: 'https://alpinejs.dev/magics/nextTick', m: 8 },
  { g: 'Magic', n: '$persist', s: 'x-data="{ n: $persist(0).as(\'n\') }"', w: 'localStorage-backed values; keys get the _x_ prefix by default.', u: 'https://alpinejs.dev/plugins/persist', m: 12 },
    { g: 'Plugin', n: 'x-trap', s: 'x-trap.noscroll="open" / .inert / .noautofocus / .noreturn', w: 'Focus trapping for dialogs: Tab cycling, outside-click protection, scroll lock, inert siblings and focus return.', u: 'https://alpinejs.dev/plugins/focus', m: 14 },
{ g: 'Magic', n: '$anchor', s: '$anchor.x, $anchor.y, $anchor.placement', w: 'Positioning data from the Anchor plugin for manual styling.', u: 'https://alpinejs.dev/plugins/anchor', m: 14 },
  { g: 'Magic', n: '$width/$height (plugin)', s: 'x-resize="$width"', w: 'Element (or viewport) size inside x-resize.', u: 'https://alpinejs.dev/plugins/resize', m: 13 },
  { g: 'Magic', n: '$item / $position (plugin)', s: 'x-sort="$item + \'@\' + $position"', w: 'Drag metadata inside an x-sort handler.', u: 'https://alpinejs.dev/plugins/sort', m: 13 },
  { g: 'Magic', n: '$event', s: '@click="pick($event)"', w: 'The DOM event object of the current handler.', u: 'https://alpinejs.dev/directives/on', m: 6 },
  { g: 'Magic', n: '$now / custom magics', s: 'Alpine.magic(\'now\', () => new Date())', w: 'You can add your own $magics — see Extending.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },

  /* ------------------------------------------------------------------- plugins */
  { g: 'Plugin', n: 'persist', s: '@alpinejs/persist', w: 'Survive reloads: drafts, filters, sidebar state.', u: 'https://alpinejs.dev/plugins/persist', m: 12 },
    { g: 'Plugin', n: 'x-intersect', s: 'x-intersect.once.margin.200px="load()"', w: 'Observer-driven visibility: .once, .margin.<n>px, .threshold.<n>, .half / .full, and :leave for the way out.', u: 'https://alpinejs.dev/plugins/intersect', m: 12 },
{ g: 'Plugin', n: 'intersect', s: 'x-intersect:enter.once="loadMore()"', w: 'Run code when an element scrolls into view (paging, lazy charts, impression tracking).', u: 'https://alpinejs.dev/plugins/intersect', m: 12 },
  { g: 'Plugin', n: 'mask', s: 'x-mask="999-99-9999"', w: 'Input masks for policy numbers, dates, money; .dynamic and function masks.', u: 'https://alpinejs.dev/plugins/mask', m: 7 },
  { g: 'Plugin', n: 'collapse', s: 'x-collapse x-show="open"', w: 'Animated height for accordions, with .duration and .min modifiers.', u: 'https://alpinejs.dev/plugins/collapse', m: 15 },
  { g: 'Plugin', n: 'focus', s: 'x-trap="open"', w: 'Focus trapping for modals, plus x-trap.inert and $focus magic helpers.', u: 'https://alpinejs.dev/plugins/focus', m: 14 },
  { g: 'Plugin', n: 'morph', s: 'Alpine.morph(el, html)', w: 'Efficient DOM diffing when you re-render HTML from the server.', u: 'https://alpinejs.dev/plugins/morph', m: 16 },
    { g: 'Plugin', n: 'x-anchor', s: 'x-anchor.bottom-start.offset.6="$refs.trigger"', w: 'Positions an element relative to another and re-positions it; magics $anchor.x / $anchor.y report the result.', u: 'https://alpinejs.dev/plugins/anchor', m: 14 },
{ g: 'Plugin', n: 'anchor', s: 'x-anchor.bottom-start="$refs.button"', w: 'Floating-UI positioning for dropdowns, tooltips and popovers.', u: 'https://alpinejs.dev/plugins/anchor', m: 14 },
    { g: 'Plugin', n: 'x-resize', s: 'x-resize.document="w = $width"', w: 'Runs an expression whenever the element (or the document, with .document) changes size.', u: 'https://alpinejs.dev/plugins/resize', m: 13 },
{ g: 'Plugin', n: 'resize', s: 'x-resize="$width"', w: 'React to element or viewport resizing (responsive charts, containers).', u: 'https://alpinejs.dev/plugins/resize', m: 13 },
    { g: 'Plugin', n: 'x-sort', s: 'x-sort="handleDrop($item, $position)"', w: 'Drag-and-drop sorting; the handler receives $item and $position, and :key is how Alpine knows the order.', u: 'https://alpinejs.dev/plugins/sort', m: 13 },
{ g: 'Plugin', n: 'sort', s: 'x-sort / x-sort:item / x-sort:handle', w: 'Drag-to-reorder lists and Kanban columns (SortableJS under the hood).', u: 'https://alpinejs.dev/plugins/sort', m: 13 },

  /* ------------------------------------------------------------------- globals */
  { g: 'Global', n: 'Alpine.data()', s: "Alpine.data('dropdown', () => ({ open: false }))", w: 'Reusable named components: x-data="dropdown".', u: 'https://alpinejs.dev/globals/alpine-data', m: 11 },
  { g: 'Global', n: 'Alpine.store()', s: "Alpine.store('cart', { items: [] })", w: 'Global reactive state with optional init() and this.$persist.', u: 'https://alpinejs.dev/globals/alpine-store', m: 10 },
  { g: 'Global', n: 'Alpine.bind()', s: "x-bind=\"Alpine.bind('submit', { '@click': '…' })\"", w: 'Reusable bundles of directives (attribute soup, extracted).', u: 'https://alpinejs.dev/globals/alpine-bind', m: 11 },
  { g: 'Global', n: 'Alpine.directive()', s: "Alpine.directive('uppercase', el => …)", w: 'Author your own x- directives; supports .before(name) ordering.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.magic()', s: "Alpine.magic('clipboard', () => s => navigator.clipboard.writeText(s))", w: 'Author your own $magics (properties or functions).', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.plugin()', s: 'export default function (Alpine) { … }', w: 'Package directives + magics into a distributable plugin.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.reactive()', s: 'Alpine.reactive({ count: 1 })', w: 'Wrap a plain object in a reactive proxy (Vue reactivity under the hood).', u: 'https://alpinejs.dev/advanced/reactivity', m: 18 },
  { g: 'Global', n: 'Alpine.effect()', s: 'Alpine.effect(() => console.log(data.count))', w: 'Re-run a callback whenever anything it reads changes.', u: 'https://alpinejs.dev/advanced/reactivity', m: 18 },
  { g: 'Global', n: 'Alpine.raw()', s: 'Alpine.raw(reactiveObj)', w: 'Escape hatch to the unwrapped object (no proxy overhead, no tracking).', u: 'https://alpinejs.dev/advanced/extending', m: 18 },
  { g: 'Global', n: 'Alpine.release()', s: 'Alpine.release(runner) — the effect runner Alpine.effect() returned', w: 'Stops that effect for good (Alpine also releases a discarded subtree\'s scopes internally).', u: 'https://alpinejs.dev/advanced/reactivity', m: 18 },
  { g: 'Global', n: 'Alpine.morph()', s: 'Alpine.morph(el, newHtml)', w: 'From the morph plugin; also Alpine.morph(el, html, { key: … }).', u: 'https://alpinejs.dev/plugins/morph', m: 16 },
  { g: 'Global', n: 'Alpine.deferInit()', s: 'Alpine.deferInit(el, promise)', w: 'Suspends a subtree until a promise settles — for async component providers.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.interceptInit()', s: 'Alpine.interceptInit(el => { … })', w: 'Low-level hook that runs for every element just before it initialises.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.start() / plugin()', s: 'Alpine.start()', w: 'Manual bootstrap for bundles; Alpine.plugin() registers a plugin object.', u: 'https://alpinejs.dev/essentials/installation', m: 1 },
  { g: 'Global', n: 'Alpine.closestDataStack()', s: 'Alpine.closestDataStack(el)', w: 'The scope stack Alpine would give an element — used by integrations.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },
  { g: 'Global', n: 'Alpine.addScopeToNode()', s: "Alpine.addScopeToNode(el, { foo: 'bar' })", w: 'Injects data into an element’s scope from a custom directive.', u: 'https://alpinejs.dev/advanced/extending', m: 17 },

  /* -------------------------------------------------------------------- events */
  { g: 'Event', n: 'alpine:init', s: "document.addEventListener('alpine:init', () => Alpine.data(…))", w: 'Fires before the page is initialised: register components here (script-tag setups).', u: 'https://alpinejs.dev/essentials/lifecycle', m: 1 },
  { g: 'Event', n: 'alpine:initialized', s: "document.addEventListener('alpine:initialized', …)", w: 'Fires once every component on the page has initialised (not including deferred trees).', u: 'https://alpinejs.dev/essentials/lifecycle', m: 1 },
  { g: 'Event', n: 'Custom events', s: "$dispatch('claim-added', { id: 7 })", w: 'Component-to-component messaging; detail arrives as $event.detail.', u: 'https://alpinejs.dev/essentials/events', m: 6 },
  { g: 'Event', n: 'x-on with modifiers on custom events', s: '@claim-added.once="…"', w: 'Every x-on modifier works on your own events too.', u: 'https://alpinejs.dev/directives/on', m: 6 },

  /* ------------------------------------------------------------------ patterns */
  { g: 'Pattern', n: 'Async expressions', s: 'x-text="await getLabel()"', w: 'Most directives accept async functions and await them for you.', u: 'https://alpinejs.dev/advanced/async', m: 16 },
  { g: 'Pattern', n: 'Component extraction', s: 'Alpine.data + x-data="name"', w: 'Move logic out of attributes when markup becomes a soup.', u: 'https://alpinejs.dev/globals/alpine-data', m: 16 },
  { g: 'Pattern', n: 'Dropdown / modal / tabs', s: 'component patterns', w: 'The official component recipes, with the accessibility fixings.', u: 'https://alpinejs.dev/components', m: 14 }
]

export const referenceGroups = ['Install', 'Directive', 'Modifier', 'Magic', 'Plugin', 'Global', 'Event', 'Pattern']

export const referenceStats = {
  directives: reference.filter(r => r.g === 'Directive').length,
  modifiers: reference.filter(r => r.g === 'Modifier').length,
  magics: reference.filter(r => r.g === 'Magic').length,
  plugins: reference.filter(r => r.g === 'Plugin').length,
  globals: reference.filter(r => r.g === 'Global').length
}
