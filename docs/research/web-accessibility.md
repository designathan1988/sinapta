# web-accessibility

## Guide
- id: `accessibility` ("Accessibility Coding Guidelines"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support: no Baseline blocks; rules are tied to WCAG success criteria (A/AA) instead. Platform features it relies on: `:focus-visible`, `forced-colors`, `inert`, native `<dialog>` (Widely available since 2022-03-14 per `css-layout`), `ElementInternals`, `clip-path`.

## Rules we will follow
Sidebar tree (ARIA is allowed here because HTML has no tree element):
```html
<ul role="tree" aria-label="Pages">
  <li role="treeitem" aria-expanded="true" aria-level="1" aria-current="page" tabindex="0">
    <span>Roadmap</span>
    <ul role="group"><li role="treeitem" aria-level="2" tabindex="-1">Q1</li></ul>
  </li>
</ul>
<p id="announcer-polite" role="status" class="visually-hidden"></p>
<p id="announcer-assertive" role="alert" class="visually-hidden"></p>
```
```css
:where(a:any-link, button, [role="treeitem"], [contenteditable]):focus-visible {
  outline: var(--size-focus-ring) solid var(--color-focus-ring);
  outline-offset: var(--space-1);
}
.ui-icon-button { min-inline-size: var(--size-target-min); min-block-size: var(--size-target-min); }
@media (pointer: coarse) { .ui-icon-button { min-inline-size: var(--size-target-coarse); min-block-size: var(--size-target-coarse); } }
```
- Roles must match behaviour: a `treeitem` gets the full tree keyboard contract (arrows, Home/End, Enter); custom widgets handle Enter on `keydown` and Space on `keyup`. No key handlers on native buttons.
- Focus rings: `:focus-visible` with `outline` + `outline-offset`, at least 3:1 against adjacent colours. Never `outline: none` without a replacement.
- Targets at least 24 by 24 CSS px via `min-inline-size`/`min-block-size` (token `--size-target-min`).
- Exactly one polite and one assertive live region, owned by one announcer module; save status ("Saved") and drag results are polite; storage failure is assertive. No "Saving…" spam; debounce; never update a region that is inert behind a modal.
- Table: `<table>`, `<caption>` (may be visually hidden), `<th scope="col">`.
- Accessible names: visible text included verbatim; `aria-labelledby` over `aria-label` when a visible label exists; no role words or state words in labels; repeated row buttons are disambiguated ("Open Roadmap").
- `disabled` vs `aria-disabled="true"` chosen deliberately (menu items and toolbar buttons stay focusable).
- `<title>` updates on route change; `lang` on `<html>`; a skip link to the page title (`<h1 id tabindex="-1">`).
- Safari drops list semantics with `list-style: none`: add `role="list"` to styled plain lists.
- Verify with axe-core/Lighthouse plus keyboard-only and screen-reader passes; scores alone do not pass acceptance.

## Fallbacks required
- No Baseline fallback section. Required safety nets stated in the guide:
  - If `box-shadow` is used for a focus ring, add an `outline` fallback under `forced-colors` (we use `outline` only, so none needed).
  - Custom overlays that cannot be `<dialog>`: `inert` on outside content, `role="dialog"`, move focus in. We avoid this path.
  - Skip-link target not focusable: make the first meaningful element the target with `tabindex="-1"`.

## Verbatim quotes
- "**Match ARIA implementations to actual behavior:** When applying `role="tab"` to an element, it must then behave like a tab — including keyboard interactions."
- "**Centralize live regions for non-visible announcements:** A single `polite` region and a single `assertive` region per page"
- "**Don't use live regions for interstitial states** like "Loading…" or "Updating…" unless they're meaningfully informative"
- "**Don't use `touch-action: none;` for custom gestures:** This disables page scrolling through the element."
- "**Do size interactive elements to have a target of at least 24x24 CSS pixels:**"
- "**Prefer `outline` over other properties for focus rings:**"

## Decision it supports
One announcer owner with two regions, one focus-ring rule in `@layer base`, a token for minimum target size, and ARIA only on the sidebar tree. Notes for ADRs: the guide's `.visually-hidden` utility uses `!important` and `1px`, both forbidden by the spec (use the `dynamic-sort` variant with size tokens); and its `touch-action: none` warning is narrowed by `drag-and-drop`, which permits it on a small dedicated handle.

## Sources
- modern-web-guidance id `accessibility`
- Related ids named by the guide: `color`, `typography`, `motion`, `accessible-generated-content`
