# web-viewport-aware-dropdowns

## Guide
- id: `viewport-aware-dropdowns` ("Viewport-Aware Dropdowns"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - Popover: Baseline Newly available since 2025-01-27 (Chrome/Edge 116, Firefox 125, Safari 17, Safari iOS 18.3).
  - Anchor positioning: guide states "Limited availability. Supported by: Safari 27 (Sep 2026). Unsupported in: Chrome, Edge, and Firefox." (Possibly stale data, but either way it is not Widely available, so a fallback is mandatory.)
- Scope: positioning mechanics only. For real menus the `menu` guide takes precedence.

## Rules we will follow
Applies to every anchored overlay that is not an ARIA menu: property cell editors (select, date),
filter and sort panels, emoji/icon picker, link editor.
```html
<button type="button" popovertarget="filter-panel">Filter</button>
<div id="filter-panel" popover="auto" class="overlay-panel">…</div>
```
```css
@supports (position-area: block-end) {
  [popover].overlay-panel {
    inset: auto;
    margin: 0;
    position-area: block-end span-inline-end;
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
  }
}
@supports not (position-area: block-end) {
  /* scripted left/top placement, see Fallbacks */
  [popover].overlay-panel { position: fixed; inset: auto; margin: 0; }
}
```
- Rely on the implicit anchor from `popovertarget` / `commandfor` / `showPopover({ source })`; no per-overlay `anchor-name`.
- Logical keywords only in `position-area` (`block-end`, `span-inline-end`), never mixed with physical ones.
- No `role="menu"` and no `aria-haspopup` on a plain panel trigger unless the full menu keyboard contract exists.
- Offsets between trigger and panel come from tokens (`margin-block-start: var(--space-1)` inside the `@supports` block).

## Fallbacks required
The guide offers two options for missing anchor positioning:
1. Polyfill `@oddbird/css-anchor-positioning`, loaded only when `!CSS.supports("anchor-name: --a")`. Caveats: no implicit anchors (explicit unique `anchor-name` + `position-anchor` per pair), no `position-area` with `position-try-fallbacks` (use `anchor()` on insets), and polyfilled rules must not be wrapped in `@supports`.
2. Progressive enhancement, no polyfill: gate `inset: auto` and `margin: 0` inside `@supports (position-area: block-end)` so unsupported browsers keep the centred popover, or give a matching `@supports not (...)` layout (e.g. a fixed bottom sheet).
- We take option 2 (spec section 5.6 allows no runtime dependency beyond five) combined with the scripted placement the `menu` guide requires in `@supports not`.
- Popover polyfill (`@oddbird/popover-polyfill`) only if `!Object.hasOwn(HTMLElement.prototype, "popover")`; not needed for our targets. If ever used: `setAttribute('popover', …)` rather than the IDL attribute, and `[popover]:is(:popover-open, .\:popover-open)`.

## Verbatim quotes
- "**MANDATORY**: Do not mix physical and logical keywords in `position-area`."
- "do not add `aria-haspopup` to the trigger — its value (`menu`, `listbox`, `tree`, `grid`, or the legacy `true`) is a promise that the target exposes a matching role, which this pattern does not."
- "**DO NOT** set `inset: auto` or `margin: 0` unconditionally on a `[popover]` element that relies on `position-area` or `anchor()`."
- "**Do not wrap polyfilled rules in `@supports`:**"
- "The polyfill does not support implicit anchor associations (such as those created by `popovertarget`, `commandfor`, `interestfor`, or `showPopover({ source })`)."
- "load the polyfill **only** when native support is missing — do NOT load it unconditionally."

## Decision it supports
One shared `.overlay-panel` positioning rule in `src/ui/overlay/`, written as progressive enhancement behind `@supports (position-area: block-end)` with a single scripted placement helper as the fallback, instead of a positioning library or polyfill.

## Sources
- modern-web-guidance id `viewport-aware-dropdowns`
- https://github.com/oddbird/popover-polyfill
- https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js
- https://unpkg.com/@oddbird/css-anchor-positioning
- Related ids named by the guide: `position-aware-tooltips`, `declarative-dialog-popover-control`
