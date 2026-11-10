# Visual direction

Written before any token is defined (Phase 3 input). It replaces the missing
`frontend-design` skill step and is reviewed at the Phase 2 approval stop.

## One-line direction

A quiet paper notebook with an ink accent: warm neutrals, a serif for page
titles, a humanist sans for everything else, and one saturated color used
sparingly. The content is the interface; chrome recedes until hovered or
focused.

## Typography

- System stacks only (specification 5.6: no web fonts).
  - Text: `system-ui` humanist stack (`system-ui, "Segoe UI", Roboto, ...`).
  - Display: a system serif stack (`ui-serif, "Iowan Old Style", "Palatino
    Linotype", Georgia, serif`) for the page title and heading 1 only. This
    is the main thing that separates Pagecraft from a default sans-only
    template.
  - Mono: `ui-monospace` stack for code blocks, inline code and number cells.
- Scale: a 1.2 ratio with six steps, body at 16 CSS px equivalent (1rem) so
  it follows the user's text size. Page title is the largest step; table and
  sidebar text is one step below body.
- Weights: regular 400, medium 500, bold 700. Sidebar and table headers use
  medium, never bold. Headings in the body use the serif at 600 for heading
  1 and sans 600 for heading 2 and 3.
- Line height: 1.6 for body text blocks, 1.25 for titles, 1.4 for dense UI.
- Numbers in tables use `font-variant-numeric: tabular-nums`.

## Color mood

- Warm, slightly yellow neutrals instead of pure gray: paper (`oklch` hue
  around 85) in light, warm charcoal (not black) in dark. No pure white, no
  pure black.
- One accent: ink indigo (hue around 265). It marks selection, focus rings,
  links, the active sidebar item and primary buttons. Nothing else is
  colored by default.
- A small categorical palette (eight hues at equal lightness and chroma) for
  select and multi-select option chips and callouts, tuned separately for
  light and dark so chip text passes AA in both.
- Status colors (danger, success, warning) appear only in the save status,
  destructive confirmations and validation messages.
- Surfaces separate by a hairline border and a half-step lightness change,
  not by shadows. Shadows are reserved for the top layer (menus, dialogs,
  command palette).
- All colors authored in OKLCH in the token files so light and dark steps
  stay perceptually even. Contrast target: 4.5:1 for text, 3:1 for
  interface boundaries and focus rings.

## Density

- Two densities, one per region, not a user setting in version 1:
  - Reading (page body): generous. Content column capped near 46rem and
    centered; block vertical rhythm of one small space step between blocks.
  - Working (sidebar, table, menus): compact. Row height near 2rem, single
    line, truncated with an ellipsis.
- Pointer targets stay at least 24 by 24 CSS px (WCAG 2.2 SC 2.5.8) even in
  compact rows.

## Spacing rhythm

- A 4-based scale in rem: 0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4. Semantic
  aliases name the role (`space.inline.sm`, `space.stack.md`,
  `space.inset.md`), so CSS never picks a raw step.
- Radii: small (controls), medium (menus, cards), full (chips). Squarer than
  the common "everything rounded 12" look; controls use the small radius.
- Motion: two durations (fast for hover and press, medium for overlays and
  view transitions) and one standard easing. Everything collapses to no
  motion under `prefers-reduced-motion`.

## What keeps it from looking like a default template

1. Serif page titles on warm paper: an editorial feel rather than a
   dashboard feel.
2. No card grid, no gradient, no pill buttons, no drop shadows on resting
   surfaces. Hierarchy comes from type size, weight and whitespace.
3. Chrome on demand: block handles, the add button and row actions appear on
   hover and on keyboard focus, and are always reachable by keyboard.
4. A visible, consistent focus ring in the accent color with an offset, the
   same on every control: it is designed, not the browser default.
5. The table looks like a ledger: hairline row rules, no zebra stripes, no
   vertical borders except while resizing a column, tabular numbers,
   uppercase-free medium-weight headers.
6. Dark theme is designed, not inverted: warm charcoal surfaces, lowered
   chroma for the accent and chips, lighter weight for borders.
7. Empty states are one sentence and one action, written in the product's
   plain voice, with no illustration.

## Decision it supports

Token groups and names in Phase 3 (`color`, `space`, `size`, `radius`,
`shadow`, `font`, `duration`, `easing`, `layer`) take their values from this
note. Any later visual choice that this note does not cover is added here
first.

## Sources

- Specification sections 5.4 and 5.6 (`docs/specification.md`).
- WCAG 2.2, SC 1.4.3, 1.4.11, 2.4.7, 2.5.8:
  https://www.w3.org/TR/WCAG22/
- OKLCH in CSS: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
