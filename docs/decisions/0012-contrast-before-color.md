# ADR-0012: Notion's colors and the 4.5:1 contrast floor

**Status:** Accepted
**Date:** 2026-11-13 (decided under the owner's standing delegation of
2026-11-10, as ADR-0011)
**Deciders:** Project owner

## Context

Two rules of the constitution meet on a few colors:

- Principle IV: Pagecraft matches Notion's look, measured in
  `docs/notion-study.md`.
- Principle VI and `docs/design-system.md`: text meets 4.5:1 on what it is
  drawn on; "accessibility is part of parity". ADR-0011 D3 keeps
  Pagecraft's own tokens.

Some of Notion's measured colors put text under 4.5:1: its accent fill
rgb(39, 131, 222) under a white number (3.9:1), its faintest grey on the
page, today's circle rgb(229, 100, 88) under a white number (3.3:1), and a
filter pill's words on the open pill in dark (Pagecraft's accent text
3.4:1, Notion's own lower). `scripts/token-contrast.test.ts` checks text
on surfaces, but the date picker's and the pill's pairs were not in it, so
today's red and the pill's words went in unchecked (n76, 2026-11-13).

## Decision

When a color measured on Notion would leave text under 4.5:1, Pagecraft
keeps Notion's surface, its hue and its chroma, and moves only the
lightness, by the least that reaches 4.5:1 (to a step of 0.005 in OKLCH).
Every such pair is listed in `scripts/token-contrast.test.ts`, which fails
under 4.5:1 in either theme. The study records Notion's own value beside
Pagecraft's.

Today: the accent fill (`accent.fill`), the faintest grey
(`text.tertiary`), today's circle (`status.today`, oklch(0.585 0.1631
27.7) against Notion's 0.661), and a pill's words in dark (`text.pill`,
oklch(0.77 0.1008 238.1); in light the accent text, 4.58:1).

## Options considered

### Option A: Lightness to the floor, hue and chroma kept (chosen)

| Dimension | Assessment |
| --- | --- |
| Parity | The surface and the hue stay Notion's; only the lightness moves |
| Accessibility | Every listed pair at 4.5:1 or more, checked by a test |
| Cost | One token per pair; one line per pair in the test |

### Option B: Notion's colors as measured

Matches the photos to the pixel, and fails WCAG AA for the numbers in the
date picker and a pill's words, against Principle VI.

### Option C: A different color for the text instead

Changes words that Notion draws in its own blue or white; further from
Notion than a lighter or darker shade of the same color.

## Consequences

- Photos of these four places differ from Notion's in lightness only;
  `docs/notion-study.md` names each.
- A new color taken from Notion gets its text pairs in the contrast test in
  the same change.
