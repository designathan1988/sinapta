# Research: contenteditable + `beforeinput` editing model

Checked 2026-11-10. Targets (MDN BCD 8.1.8): Chrome/Edge 155-156, Firefox 158-159, Safari 27.1-27.2.
Items marked (unverified) come from older reports and were not re-confirmed against a current primary source.

## Findings

- **Spec status.** Input Events Level 2 is a W3C Working Draft (15 Oct 2026). It requires every `beforeinput` to be cancelable except those fired inside an IME composition (`insertCompositionText`). `beforeinput`, `inputType`, `data`, `dataTransfer`, `getTargetRanges()` and `StaticRange` exist in all targets (Chrome 60, Firefox 87, Safari 10.1).
- **Spec is not reality for cancelability.** MDN: the event "may fire but be non-cancelable ... by autocomplete, by accepting a correction from a spell checker, by password manager autofill, by IME, or in other ways. The details vary by browser and OS", and to override edits in all situations code must also handle `input` and reconcile. So always check `event.cancelable`; an `input`-event read-back path is mandatory, not only for IME.
- **inputTypes to handle** (all cancelable per spec unless noted):

| inputType | Command | Payload |
| --- | --- | --- |
| `insertText` | insert text at target range | `data` |
| `insertReplacementText` (spellcheck, autocorrect, macOS accent menu) | replace target range | `dataTransfer` `text/plain`; fall back to `data` |
| `insertParagraph` | split block | none |
| `insertLineBreak` (Shift+Enter) | insert `\n` (or split; product choice) | none |
| `deleteContentBackward` / `deleteContentForward` | delete target range; at block start/end with collapsed caret: merge blocks | target range |
| `deleteWordBackward/Forward`, `deleteSoftLineBackward/Forward`, `deleteHardLineBackward/Forward`, `deleteEntireSoftLine`, `deleteContent` | delete target range (browser has computed the word/line range) | target range |
| `deleteByCut` | delete selection (clipboard write happens in the `cut` event) | target range |
| `deleteByDrag` + `insertFromDrop` | cancel both in v1 (no text drag inside blocks), or treat as delete + insert | `dataTransfer` |
| `insertFromPaste`, `insertFromPasteAsQuotation` (Firefox only), `insertFromYank` | paste pipeline (see security-csp.md) | `dataTransfer` `text/html`, `text/plain` |
| `insertTranspose` (macOS Ctrl+T) | replace target range | `dataTransfer` |
| `formatBold`, `formatItalic` | toggle mark | none |
| other `format*`, `insertOrderedList`, `insertUnorderedList`, `insertHorizontalRule`, `insertLink` | cancel, no-op | - |
| `historyUndo` / `historyRedo` | cancel, dispatch app undo/redo | none, target ranges empty |
| `insertCompositionText` | NOT cancelable: let the browser edit, read back at `compositionend` | `data` |

- **`getTargetRanges()`** returns `StaticRange[]` for contenteditable, empty for undo/redo and for `<input>`/`<textarea>`. The spec says ranges "cover only the code points the user agent would replace, even if that splits a grapheme cluster". If the array is empty, fall back to the `ui` slice selection.
- **StaticRange -> block offset.** Offsets in text nodes are UTF-16 code units; in elements they are child indexes. Render each `TextSpan` as one element with exactly one text node; offset = total length of text nodes before the container (TreeWalker `SHOW_TEXT`) + offset, or for an element container the summed text length of children before the index. Validate that both containers are inside the block element; otherwise ignore the range.
- **IME.** Order per spec: `compositionstart`, then per update `compositionupdate` -> `beforeinput` (insertCompositionText) -> DOM change -> `input`, then `compositionend`. Between start and end: do not re-render the block, do not set selection, do not dispatch text commands. At `compositionend` read `textContent`, diff against the stored text (common prefix/suffix), dispatch one replace command, then re-render and restore the caret.
- **Safari IME ordering.** WebKit delivered `compositionend` before the confirming Enter `keydown`/`input`, so `isComposing` was already false (bug 165004, closed 2026-04-16 as duplicate of 311717, fixed on main). BCD still flags Safari `isComposing` as partial and no release note confirming the shipped version was found. Guard Enter with `event.isComposing || event.keyCode === 229` and keep an own `isComposing` flag cleared one task after `compositionend`.
- **Android/GBoard** (out of scope, <768 px): almost all typing arrives as composition with `keyCode` 229 and non-cancelable `beforeinput`; the read-back path is what would make it work later.
- **Undo.** Cancelling `beforeinput` leaves the native undo stack empty, and `historyUndo`/`historyRedo` are only fired when the native stack has entries (w3c/editing#509, open). Therefore route Ctrl/Cmd+Z, Shift+Z and Ctrl+Y from `keydown` through the shortcut registry, AND cancel `historyUndo`/`historyRedo` in `beforeinput` (IME and uncancelled edits do create native entries; the context menu and macOS Edit menu use this path). All contenteditables in a document share one native undo manager.
- **`contenteditable="plaintext-only"`**: Chrome 51, Safari 5, Firefox 136, so available in all targets (Baseline newly available, 2025-03-04). It disables rich formatting shortcuts and makes native paste plain text. It does not change the `beforeinput` contract, and Chrome forces `white-space: pre-wrap`. Modest benefit: it makes any uncancelled default (IME, spellcheck, drop) unable to inject markup, which simplifies read-back to `textContent`.
- **Restoring selection.** `Selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset)` is in all targets and preserves direction (focus before anchor = backward selection); `addRange` cannot express a backward selection. Run it synchronously after `render()`, and only when the DOM selection differs from the wanted one.
- **Cross-block selection.** A native selection cannot be edited across separate editing hosts. Known approaches: (a) Gutenberg: when a drag or Shift+Arrow leaves the block, temporarily make a common ancestor editable so the native selection can span blocks, then map it to the model; (b) Notion-like (secondhand reports): switch to whole-block selection once the pointer crosses a block boundary; (c) one contenteditable per page (the spec's "switch if" option).
- **Arrow keys between blocks.** Native ArrowUp/Down stops at the editing host edge. On `keydown`, if the collapsed caret is on the first/last visual line (compare the caret `Range.getClientRects()` with the block's first/last line box, outside render), prevent default and dispatch a focus-move command that keeps the x position (`document.caretPositionFromPoint`: Chrome 128, Firefox 20, Safari 26.2). ArrowLeft/Right at offset 0/end move to the previous end / next start.

## Pitfalls

- lit-html child parts keep comment markers inside the element; uncancelled browser edits can eject them (lit error: "This `ChildPart` has no `parentNode` ..."), and lit diffs against its last value, not the DOM. The inside of an editable block must be projected by one imperative owner (plain DOM calls, skipped while composing), not by an `html` child binding.
- Empty block: no text node, so the caret collapses. Render a placeholder `<br>` (or CSS min-height) and map "element, offset 0" to text offset 0. A trailing `\n` needs a sentinel `<br>` to be visible.
- `preventDefault()` on `keydown` suppresses `beforeinput`; map each key in one place only, or commands fire twice or never.
- Firefox has had gaps where spellcheck replacement fired only `input` (React #24358, Slate) (unverified for 158+). Test, or set `spellcheck="false"` on Firefox as Slate does.
- Safari has historically emitted composition-specific types (`insertFromComposition`, `deleteCompositionText`, `deleteByComposition`) that the current draft no longer lists (unverified for 27). While the composing flag is set, treat every inputType as composition.
- `user-select` unprefixed is still not in Safari: use `-webkit-user-select` on drag handles and other non-editable chrome inside blocks.

## Decision it supports

Keep the default (one contenteditable per block, `beforeinput` -> command -> render -> restore caret), with three additions the ADR must state: (1) an `input`/`compositionend` reconciliation path for every non-cancelable edit, not only IME; (2) undo routed from both `keydown` and `historyUndo`; (3) cross-block selection implemented as block-level selection (approach b) first, since it needs no editing-host toggling. Use `plaintext-only` as a safety net. Offsets inside commands should be UTF-16 snapped to grapheme boundaries (see grapheme-segmentation.md).

## Sources

- Input Events Level 2 (WD 2026-10-15): https://www.w3.org/TR/input-events-2/ and editor's draft https://w3c.github.io/input-events/
- MDN beforeinput: https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event
- MDN getTargetRanges: https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/getTargetRanges
- MDN contenteditable: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- MDN setBaseAndExtent: https://developer.mozilla.org/en-US/docs/Web/API/Selection/setBaseAndExtent
- MDN browser-compat-data 8.1.8 (2026-11-02): https://github.com/mdn/browser-compat-data
- WebKit bug 165004: https://bugs.webkit.org/show_bug.cgi?id=165004 ; fix: https://bugs.webkit.org/show_bug.cgi?id=311717
- Firefox bugs: https://bugzilla.mozilla.org/show_bug.cgi?id=1673558 , https://bugzilla.mozilla.org/show_bug.cgi?id=1763669
- Native undo stack: https://github.com/w3c/editing/issues/509
- Gutenberg writing flow: https://cdn.jsdelivr.net/npm/@wordpress/block-editor@15.21.0/src/components/writing-flow/readme.md
- IME-safe Enter (Modern Web Guidance): https://developer.chrome.com/docs/modern-web-guidance/guides/forms/ime-safe-enter-submit
- lit `live` directive (contenteditable note): https://lit.dev/docs/templates/directives/
