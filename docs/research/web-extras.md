# web-extras

Combined note for twelve supporting guides (modern-web-guidance CLI, retrieved 2026-11-10).

## Guide
| id | Stated support for the features it uses |
| --- | --- |
| `sortable-table` | Invoker commands Newly available (2025-12-12); element-scoped view transitions Limited (Chrome/Edge 147); `moveBefore()` Limited (no Safari) |
| `color` | No Baseline block; WCAG 1.4.1, 1.4.3, 1.4.11; `forced-colors`, `prefers-contrast`, `color-mix()` |
| `motion` | No Baseline block; `@starting-style`, `transition-behavior`, `overlay`, `event.animation` (feature-detect) |
| `css-layout` | Subgrid Widely available; container queries Widely available (2023-02-14); `<dialog>` Widely available; Popover Newly; anchor positioning Limited (as printed: Safari 27 only); `scrollbar-gutter` Newly (2024-12-11); dynamic viewport units Widely; `flex-wrap: balance` Limited; `line-clamp` and grid lanes unsupported |
| `ime-safe-enter-submit` | `KeyboardEvent.isComposing` Limited ("Unsupported in: Safari", event-ordering bug) |
| `sanitize-untrusted-html` | Sanitizer API Limited (Chrome/Edge 146, Firefox 148; no Safari) |
| `spatial-navigation` | No Baseline block; uses `checkVisibility()`, `getBoundingClientRect()`, roving tabindex |
| `interactions-in-complex-layouts` | `content-visibility` Newly available (2025-09-15; Safari 26) |
| `animate-to-from-top-layer` | `@starting-style` Newly (2024-08-06); `transition-behavior` Newly; discrete `display` transition Limited (no Firefox); `overlay` Limited (Chrome/Edge 117 only) |
| `light-dismiss-a-dialog` | `closedby` Limited (no Safari) |
| `icons` | Registered custom properties Newly (2024-07-09); container style queries Newly (2026-05-19; Firefox 151); CSS `d` Limited (no Safari) |
| `performance` | No Baseline block; `content-visibility`, `contain`, `scheduler.yield()` (with fallback) |

## Rules we will follow
```html
<th scope="col" aria-sort="ascending"><button type="button">Due date</button></th>
```
```css
.database-row { content-visibility: auto; contain-intrinsic-block-size: auto var(--size-row); }
.app-shell { display: grid; grid-template-areas: "sidebar main"; grid-template-columns: var(--sidebar-inline-size) minmax(0, 1fr); }
.sidebar { overflow-y: auto; scrollbar-gutter: stable; overscroll-behavior: contain; }
dialog, [popover] {
  opacity: 0;
  transition-property: opacity, transform, display, overlay;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--easing-out);
  transition-behavior: allow-discrete;
  @media (prefers-reduced-motion: no-preference) { transform: scale(var(--scale-overlay-closed)); }
}
:is(dialog[open], [popover]:popover-open):where(:not([data-closing])) {
  opacity: 1;
  @starting-style { opacity: 0; }
}
```
```ts
if (event.key === 'Enter') {                       // cell editor, rename field, command palette
  event.preventDefault();
  if (event.isComposing || event.keyCode === 229) return;
  dispatch(commit);
}
```
- `sortable-table`: `aria-sort` on the sorted `<th>` only (never `"none"`, never on the button); button label stays the column name; compare with `Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })` and typed raw values; one `role="status"` message per sort.
- `color`: 4.5:1 text, 3:1 large text, icons, component boundaries and focus rings; never colour alone; `@media (forced-colors: active)` system-colour fallbacks for tokens; no borders or state conveyed only by `box-shadow`/`background-image`. Tints come from predefined tokens, not runtime lightness math.
- `motion`: animate `opacity`/`transform`/`translate` only; opt into movement inside `@media (prefers-reduced-motion: no-preference)`; keep colour transitions; never a global `animation-duration: 0.01ms`; code waiting on `transitionend` must continue when `getAnimations()` is empty.
- `css-layout`: grid with named areas for the shell, flex for rows and toolbars with `gap`, `min-inline-size: 0` on shrinking flex items, container queries for components, no `100vw`, no `order`/`*-reverse`/`dense` on interactive content.
- `spatial-navigation` (table cells): arrow handling only inside a composite widget with matching roles; `preventDefault()` only when a target exists; `scrollIntoView({ block: 'nearest', inline: 'nearest' })`; do not intercept when the innermost target is `:read-write` (an open cell editor) or a modifier is held; no single-letter shortcuts.
- `sanitize-untrusted-html` (paste, spec 5.3): parse clipboard HTML with `Document.parseHTML()` into a detached document, walk it into `RichText`, never serialize back through `innerHTML`.
- `icons`: decorative icons `aria-hidden="true"` or CSS-mask tokens (`--icon-*` data URIs, `currentColor`); icon-only buttons need `aria-label`; 3:1 contrast in both schemes.
- `performance`: no interleaved layout reads and writes; `content-visibility` only on long lists, always with `contain-intrinsic-size` using `auto` and content-derived units; no `@import` in shipped CSS (Vite must inline the layer files); `type="module"` scripts; tasks over 50 ms yield (`scheduler.yield()` with a `setTimeout` fallback) for import/search.

## Fallbacks required
- `isComposing` (Safari): add `event.keyCode === 229` (recommended), or the `compositionend` `event.timeStamp` window under 50 ms if lint forbids `keyCode`.
- Sanitizer API (Safari): guide says load DOMPurify only when `!('setHTML' in Element.prototype)`, with `ALLOW_ARIA_ATTR: false`, `ALLOW_DATA_ATTR: false`, `KEEP_CONTENT: false`. This adds a dependency the spec forbids; since we never insert pasted HTML, an inert `DOMParser` document walked to plain text and marks is the dependency-free equivalent (needs an ADR).
- Top-layer exit animation (Firefox, Safari): `data-closing` attribute plus `closeTopLayer()` that awaits `getAnimations({ subtree: true })` (2 s race) before `.close()`/`.hidePopover()`; detect with `CSS.supports('overlay', 'auto')` and a computed-style probe, not `CSS.supports('transition-behavior', …)`. Popover light-dismiss exits stay instant there.
- `closedby`: `light-dismiss-a-dialog` gives a `click` + bounding-rect script; prefer the `dialog` guide's `pointerdown`/`pointerup` version (survives text-selection drags).
- `content-visibility`: degrades gracefully; `@supports not (content-visibility: auto) { contain: layout style paint; }`.
- Invoker `--sort` command: plain `click` listener on header buttons. `moveBefore()` and scoped view transitions: see `web-dynamic-sort.md`.
- Container style queries (icon engine): class hooks (`.icon-start`, `.icon:empty`) with the `image-set()` trick, plus the Safari `@supports` workarounds for WebKit bugs 301609, 320220, 325900. Simpler for us: inline SVG or `<use>` from lit-html templates.
- Anchor positioning: `@supports (anchor-name: --x)` with an absolute-position fallback.

## Verbatim quotes
- sortable-table: "Do not set `aria-sort="none"`, and do not put `aria-sort` on the button."
- ime-safe-enter-submit: "The composition-active check applies to any custom `keydown` handler that acts on `Enter`, not only to multiline `<textarea>` fields."
- spatial-navigation: "If there is no focusable element in the pressed direction, **do not prevent default browser behavior**."
- animate-to-from-top-layer: "**DO NOT**: Use `allow-discrete` in the `transition` shorthand — it will make older browsers ignore the entire `transition` declaration."
- motion: "**DO NOT** globally apply `animation-duration: 0.01ms;` as it can cause certain animations to become _more_ jarring."
- performance: "**DON'T apply `content-visibility: auto` to above-the-fold content**"

## Decision it supports
These guides fix the details behind spec sections 5.3, 5.5 and 5.6: IME-safe Enter everywhere, sort state on the `<th>`, overlay motion with a scripted exit path for Firefox and Safari, containment for long tables, and a dependency-free paste parser.

## Sources
- modern-web-guidance ids: `sortable-table`, `color`, `motion`, `css-layout`, `ime-safe-enter-submit`, `sanitize-untrusted-html`, `spatial-navigation`, `interactions-in-complex-layouts`, `animate-to-from-top-layer`, `light-dismiss-a-dialog`, `icons`, `performance`
- https://cloudfour.com/thinks/svg-icon-stress-test/
- https://bugs.webkit.org/show_bug.cgi?id=301609 and https://bugs.webkit.org/show_bug.cgi?id=320220
- https://github.com/oddbird/popover-polyfill
