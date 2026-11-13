# ADR-0006: Text editing

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

The store's `RichText` is the truth and the DOM is a projection
(specification 5.3). Research:
`docs/research/contenteditable-beforeinput.md`,
`docs/research/grapheme-segmentation.md`, `docs/research/security-csp.md`.

## Decision

One `contenteditable` element per text block, driven by `beforeinput`. The
default stands, with five precisions.

1. **Cancelable input.** `beforeinput` is cancelled, its `inputType` and
   `getTargetRanges()` are translated into one command, and the caret is
   restored from `ui.selection` after the render.
2. **Non-cancelable input.** IME composition is not the only case:
   spellcheck replacement, autocorrect and autofill can also edit first.
   One read-back path handles all of them: on `input` or `compositionend`
   the block text is read from the DOM, diffed against the store and
   dispatched as one `block.replaceText` command. The specification names
   IME as "the one case"; the specification was widened to match.
3. **Undo.** `historyUndo` and `historyRedo`, and the shortcut keys, are
   cancelled and routed to app history. The browser undo stack is never
   used.
4. **Offsets.** The specification says positions "count grapheme clusters".
   DOM ranges are UTF-16, target ranges can split a cluster, and cluster
   boundaries differ between browser ICU versions, so a persisted grapheme
   count can point at a different place after a browser update. Decision:
   offsets in commands, history and the `ui` slice are UTF-16 code unit
   indices that are always snapped to grapheme boundaries by
   `src/model/grapheme.ts` (`Intl.Segmenter`). Caret movement and deletion
   still act on whole clusters, which is the behavior the specification
   asks for. The specification sentence was changed to match.
5. **Cross-block selection.** Selection inside one block is native. Once a
   selection crosses a block boundary it becomes a block-level selection
   (whole blocks) held in the `ui` slice. This keeps one editing host per
   block.

Paste reads `text/html` into an inert document with `DOMParser`, walks it
for text and the four marks, and falls back to `text/plain`. Nothing pasted
is inserted as HTML. Link targets pass `src/model/link-href.ts`.

## Options considered

| Option | Native feel | Cross-block text selection | Complexity |
| --- | --- | --- | --- |
| A. One editable per block | High within a block | Block-level only | Medium |
| B. One editable per page | High | Yes | High: every edit maps a page-wide range |
| C. Hidden textarea, drawn caret | Low | Yes | Very high |

## Consequences

- Easier: each block maps to one record and one DOM element.
- Harder: arrow keys between blocks and the read-back path need care.
- Revisit: if partial text selection across blocks is required, switch to
  option B with the same commands, as the specification allows.

## Action items

1. [x] Milestone 3 tasks for the read-back path, emoji and IME checks (`caret.test.ts`, `selection-sync.test.ts`, `emoji-search.test.ts`).
