# ADR-0001: Rendering

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

Views must be pure functions of the store with no component state
(specification 2.1, 5.2). The typing target is 16 ms per keystroke on a
page of 1,000 blocks. Research: `docs/research/lit-html.md`,
`docs/research/web-dynamic-sort.md`,
`docs/research/contenteditable-beforeinput.md`.

## Decision

`lit-html` 3.3.3, one root `render` in `src/app/bootstrap.ts`, re-run after
every store commit. The default stands, with three precisions:

1. Besides `html`, `render` and `nothing`, three stateless directives from
   the same package are used: `repeat` (keyed lists, so existing DOM nodes
   are moved, not recreated), `keyed` (rebuild one block after an
   uncancelled browser edit) and `ref` (hand an element to an imperative
   owner). No directive classes are written and no component classes exist.
   The specification was updated to list them.
2. The inside of a `contenteditable` block is not a lit child binding.
   Browser edits can eject lit's comment markers. `src/ui/rich-text/`
   projects `RichText` into the element with plain DOM calls, through a
   `ref` callback, and skips the projection when the DOM already matches.
3. Dynamic sizes (sidebar width, column widths) are set through the CSSOM in
   a `ref` callback as custom properties, never through a `style` attribute,
   so `style-src 'self'` holds.

## Options considered

| Option | Complexity | Typing cost at 1,000 blocks | Fit with "no view state" |
| --- | --- | --- | --- |
| A. lit-html, one root render, keyed lists | Low | One template walk per keystroke; unchanged bindings are skipped | Full |
| B. lit-html, render per block with its own subscription | Medium | Lowest | Breaks "views never subscribe" |
| C. Hand-written DOM updates | High | Lowest | Full, but every view becomes imperative |

## Trade-off analysis

A is the simplest and keeps one render path. Its cost grows with the number
of bindings, so it must be measured. Selectors return the same reference
for unchanged records, and each block template is guarded by record
identity, so an unchanged block costs one comparison.

## Consequences

- Easier: one place to debug rendering; views stay trivially testable.
- Harder: caret must be restored after every render (`src/ui/caret/`).
- Revisit: if milestone 3 profiling shows the 1,000-block keystroke above
  16 ms, switch to option B for the block list only, as the specification
  allows, and record it here.

## Action items

1. [ ] Add a 1,000-block typing benchmark task to milestone 3.
2. [ ] Own rich text projection in `src/ui/rich-text/`.
