# ADR-0007: Browser support

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

Platform features come first (specification 5.6). Research:
`docs/research/platform-features.md` and the `docs/research/web-*.md`
notes.

## Decision

The latest two versions of Chrome, Edge, Firefox and Safari. On
2026-11-10 that is Chrome and Edge 155 to 156, Firefox 158 to 159 and
Safari 27.1 to 27.2. The default stands.

- Used without fallback: `<dialog>`, `popover="auto"`, CSS nesting,
  `@layer`, container queries, `light-dark()`, `color-scheme`,
  `Intl.Segmenter`, same-document View Transitions (as an enhancement).
- Used behind a gate with a scripted fallback, as the web guidance
  requires:
  - CSS anchor positioning inside `@supports (position-area: block-end)`,
    with a centered or edge-pinned position otherwise.
  - `<dialog closedby="any">` with a backdrop-click handler where
    `closedby` is missing.
  - `popover="hint"` and `Element.moveBefore()` are avoided or
    feature-tested.
- No polyfill packages. The guides name `invokers-polyfill`,
  `@oddbird/css-anchor-positioning` and DOMPurify; the specification allows
  no runtime dependency beyond the five, so each need is met with a small
  scripted fallback owned by `src/ui/overlay/` or the paste parser.

Three points where the guidance and the specification differ, each decided at
the plan review:

1. Overlays. The menu guide opens menus only through the invoker and nests
   submenus; the specification keeps one open overlay in the `ui` slice.
   Decision: the store is the truth. `src/ui/overlay/` calls `showPopover`
   and `showModal` after render and turns the element's `toggle` and
   `close` events into `ui.closeOverlay`. Version 1 menus are flat.
2. Hidden text for assistive technology. The guide's `.visually-hidden`
   uses `!important` and raw `px`. Decision: the same technique written
   with tokens and without `!important`, in `@layer base`.
3. Dragging. WCAG 2.2 SC 2.5.7 needs a single-pointer alternative to drag,
   not only a keyboard one. Decision: every reorder also has "Move up",
   "Move down" and "Move to" menu actions.

## Consequences

- Easier: no polyfill weight, small fallbacks in one owner.
- Harder: each gated feature needs a look in Safari and Firefox.
- Revisit: remove a fallback when its feature is in both supported
  versions of all four browsers.

## Action items

1. [ ] Record the support line in `README.md`.
