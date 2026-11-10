# Research: grapheme segmentation with `Intl.Segmenter`

Checked 2026-11-10. Targets: Chrome/Edge 155-156, Firefox 158-159, Safari 27.1-27.2.

## Findings

- **Support.** `Intl.Segmenter` is Baseline widely available (newly 2024-04-16, widely 2026-10-16): Chrome/Edge 87, Safari 14.1, Firefox 125. Also in Node 16+, so Vitest runs it without a polyfill. No fallback is needed.
- **API.**
  - `const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })`. Create once per module; construction is the expensive part.
  - `segmenter.segment(text)` returns an iterable `Segments`; each item is `{ segment, index, input }`, where `index` is the UTF-16 code unit offset of the segment start in `text`.
  - `segments.containing(codeUnitIndex)` returns the segment that covers a UTF-16 offset, without iterating from the start in user code.
- **Offsets are UTF-16 everywhere else.** DOM `Range`/`StaticRange`/`Selection` offsets in text nodes, `String.prototype.slice`, and `getTargetRanges()` all use UTF-16 code units. The Input Events spec explicitly allows a target range to split a grapheme cluster. Conversion is therefore needed at every DOM boundary.
- **Conversions** (pure functions in one module):
  - grapheme index -> UTF-16: iterate segments, return the `index` of the n-th segment (or `text.length` when n equals the count).
  - UTF-16 -> grapheme index: count segments whose `index` is below the offset.
  - snap: `containing(offset).index` rounds a UTF-16 offset down to a cluster start; `index + segment.length` rounds up.
  - previous/next boundary for Backspace, Delete and arrow keys: `containing(offset - 1)` and `containing(offset)`.
- **Rules behind it.** UAX #29 revision 49 (Unicode 18.0, 2026-09-01): extended grapheme clusters are the recommended default; GB11 keeps emoji ZWJ sequences together, GB9c keeps Indic conjuncts together. "Each emoji sequence in the RGI emoji set is a single grapheme cluster."
- **Backspace.** UAX #29 notes that "the backspace key might delete by code point, while the delete key may delete an entire cluster". Platform practice: one Backspace removes a whole emoji (flags, skin tones, ZWJ families), but for a base letter with combining marks, and in Indic scripts, native editors often remove only the last code point. With `beforeinput` this decision is already made by the browser: `deleteContentBackward` carries the target range the platform would delete. Use that range instead of computing "one grapheme back"; compute it yourself only when the range is empty or outside the block.
- **Normalization.** Cluster boundaries are the same for all canonically equivalent forms (NFC and NFD), but UTF-16 offsets and string equality are not. Do not normalize stored text: it would change what the user typed or pasted and shift every offset. Normalize (NFC, or NFKC plus case folding) only derived values such as search keys.
- **Performance.** No authoritative V8/JSC/SpiderMonkey benchmark was found. Third-party numbers (unicode-segmenter author) put a hand-written segmenter at 3-8x faster than native `Intl.Segmenter` in Node 20, and one wrapper library reports failures past roughly 40-50k characters when segments are spread into arrays; both are vendor claims. Practical consequences:
  - Never segment a whole page. Work per block, and blocks are short.
  - Typing does not need a full pass: caret movement and deletion need only `containing()` near the caret.
  - A grapheme count of a block (text length for display) is a full pass. Compute it lazily in a selector memoized on the span's `text` string identity; RichText spans are immutable, so the cache key is free.
  - Fast path: if the text matches `/^[\x20-\x7E]*$/`, grapheme index equals UTF-16 index and no segmentation is needed.
  - Measure in milestone 3 against the 16 ms keystroke target before adding any wider cache.

## Pitfalls

- **Grapheme counts are not stable across browsers or versions.** Boundaries depend on the Unicode/ICU version bundled with each engine and "additional changes to the rules are made when new information becomes available" (UAX #29). GB9c is a recent example. A grapheme index saved by one browser can point somewhere else in another. Persisted or logged positions (workspace JSON, undo operations, a later sync log) should therefore be UTF-16 offsets that were snapped to a boundary at creation time; grapheme indexes are safe only as transient, same-session values.
- Lone surrogates: slicing at an unsnapped UTF-16 offset can split a surrogate pair and produce ill-formed strings that break JSON round trips in some tools. Snap every offset from the DOM before use; `String.prototype.isWellFormed()` (all targets) is a cheap assertion for tests and import.
- A mark boundary (bold start/end) must also be snapped, otherwise a cluster is split across two spans and renders as two glyphs. Segment the block's concatenated text, not each span separately, when a caret sits near a span edge.
- During IME composition the browser moves by its own units; do not snap or rewrite the caret until `compositionend`.
- `"\r\n"` is one grapheme cluster (GB3); normalize line endings to `\n` at the paste/import boundary.
- The locale argument does not matter for grapheme granularity in practice, but pass `undefined` rather than a hard-coded locale.
- `[...text]` and `Array.from(text)` iterate code points, not graphemes; ban them for caret math by lint rule or review.

## Decision it supports

Use one shared grapheme `Intl.Segmenter` in a single text-utility module, with no polyfill and no extra dependency. Count graphemes for what the user sees (caret steps, deletion units, displayed lengths), take deletion ranges from `getTargetRanges()` first, and keep UTF-16 offsets (snapped to cluster boundaries) as the unit inside commands, history and persisted state. This differs from the wording of specification 5.3; see the report to the plan review.

## Sources

- MDN Intl.Segmenter: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
- MDN Segments (`containing`, iteration): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment/Segments
- ECMA-402 Segmenter objects: https://tc39.es/ecma402/#segmenter-objects
- UAX #29 Unicode Text Segmentation, revision 49: https://www.unicode.org/reports/tr29/
- Baseline status (web-features `intl-segmenter`): https://webstatus.dev/features/intl-segmenter
- Input Events Level 2, target ranges may split a cluster: https://www.w3.org/TR/input-events-2/
- Third-party performance claims: https://github.com/cometkim/unicode-segmenter
- web.dev, Intl.Segmenter in Baseline: https://web.dev/blog/intl-segmenter
