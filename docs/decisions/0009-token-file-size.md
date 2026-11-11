# ADR-0009: Token files and the file size limit

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner)
**Deciders:** Project owner

## Context

The specification sets two rules that cannot both hold for design tokens:

- "No file over 250 lines" (sections 2.4, 8 and 9).
- Exactly four token files: `tokens/base.tokens.json`,
  `tokens/semantic.tokens.json` and the two theme files (section 3).

The Design Tokens Format 2025.10 nests one JSON object per token, and each
color value is an object with a color space, components and a hex fallback.
With the full scales from `docs/research/visual-direction.md`,
`base.tokens.json` has 779 lines and `semantic.tokens.json` 459. The lint
configuration enforces the limit on TypeScript only, so nothing failed; a
check of the acceptance lines found it.

The limit exists to stop god files: one module that does many things.
A token file holds no behavior. Its size grows with the number of values,
one entry per value, and every entry has one owner already: the file of its
tier.

## Decision

Token files (`tokens/*.tokens.json`) are exempt from the 250-line file
limit. The four files stay as section 3 lists them. The limit still applies
to every TypeScript, CSS and other code file.

## Options considered

### Option A: Exempt token files (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low: one sentence in the specification |
| Cost | None to the build script or the docs that name the four files |
| Change in one place | A token's tier still decides its file |

**Pros:** keeps the three-tier layout the specification, the design system
and the build script share; the token owner stays one file per tier.
**Cons:** a long file to scroll; readers search by token path instead.

### Option B: One file per group (`tokens/base/color.tokens.json`, ...)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: the build script reads a folder, the docs change |
| Cost | Edits to sections 3 and 5.4, `docs/design-system.md` and the build script |
| Change in one place | Two keys to find a token: tier and group |

**Pros:** every file under 250 lines.
**Cons:** splits data that has no behavior to separate, and changes the
layout every document describes.

## Trade-off analysis

The rule's goal is one owner per concern and no file that does many things.
A token file does nothing; it is a table of values with one owner. Splitting
it would satisfy the line count while adding a second key to every lookup,
which works against the goal the rule serves.

## Consequences

- Section 2.4 of the specification lists a third exemption.
- The file limit, as lint enforces it, is unchanged.
- Revisit if a token file starts to hold anything other than token values.
