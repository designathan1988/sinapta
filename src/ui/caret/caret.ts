// Reads the browser's selection as offsets into a block's text, and puts a
// selection from the store back into the document.
import { parseBlockId, type BlockId } from "../../model/index.ts";
import type { TextSelection } from "../../state/index.ts";

const TEXT = "[data-text]";

export function textElementOf(node: Node | null): HTMLElement | null {
  const element =
    node instanceof Element ? node : (node?.parentElement ?? null);
  return element?.closest<HTMLElement>(TEXT) ?? null;
}

export function blockIdOf(node: Node | null): BlockId | undefined {
  const element =
    node instanceof Element ? node : (node?.parentElement ?? null);
  const id = element?.closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
  return parseBlockId(id ?? "");
}

// The text offset of a DOM position inside a text element.
export function offsetWithin(
  text: HTMLElement,
  node: Node,
  nodeOffset: number,
): number {
  const range = document.createRange();
  range.selectNodeContents(text);
  range.setEnd(node, nodeOffset);
  return range.toString().length;
}

// The selection as the store holds it, or null when it is not inside one
// block's text.
export function readSelection(): TextSelection | null {
  const selection = document.getSelection();
  if (selection?.anchorNode == null) return null;
  const text = textElementOf(selection.anchorNode);
  const blockId = blockIdOf(selection.anchorNode);
  const { focusNode } = selection;
  if (text === null || blockId === undefined || focusNode === null) return null;
  if (!text.contains(focusNode)) return null;
  return {
    blockId,
    anchorOffset: offsetWithin(
      text,
      selection.anchorNode,
      selection.anchorOffset,
    ),
    focusOffset: offsetWithin(text, focusNode, selection.focusOffset),
  };
}

interface DomPosition {
  readonly node: Node;
  readonly offset: number;
}

// At a boundary between two text nodes the earlier node wins, so typing
// continues the style of the text before the caret.
function positionAt(text: HTMLElement, offset: number): DomPosition {
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let last: Node | null = null;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
    last = node;
  }
  if (last === null) return { node: text, offset: 0 };
  return { node: last, offset: last.textContent?.length ?? 0 };
}

export function textElementFor(
  root: ParentNode,
  blockId: BlockId,
): HTMLElement | null {
  const block = root.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
  return block?.querySelector<HTMLElement>(TEXT) ?? null;
}

function isSame(a: TextSelection | null, b: TextSelection): boolean {
  return (
    a?.blockId === b.blockId &&
    a.anchorOffset === b.anchorOffset &&
    a.focusOffset === b.focusOffset
  );
}

// Puts the caret in a block's text even when the document's selection is
// already there and only the focus left, as after pressing a button.
export function focusSelection(
  root: ParentNode,
  selection: TextSelection,
): void {
  const text = textElementFor(root, selection.blockId);
  if (text === null) return;
  const anchor = positionAt(text, selection.anchorOffset);
  const focus = positionAt(text, selection.focusOffset);
  text.focus({ preventScroll: true });
  document
    .getSelection()
    ?.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
}

// Makes the document's selection match the store's. Does nothing when it
// already matches, so the browser's own caret movement is left alone. A
// block that was moved in the document keeps its selection but loses
// focus; focus that went nowhere is given back to it.
export function restoreSelection(
  root: ParentNode,
  selection: TextSelection | null,
): void {
  if (selection === null) return;
  // An overlay has the focus; the text takes it back once it closes.
  if (document.activeElement?.closest("[data-overlay]") != null) return;
  const isFocusLost = document.activeElement === document.body;
  if (!isFocusLost && isSame(readSelection(), selection)) return;
  const text = textElementFor(root, selection.blockId);
  if (text === null) return;
  const anchor = positionAt(text, selection.anchorOffset);
  const focus = positionAt(text, selection.focusOffset);
  // Focusing makes the browser lay out the page first. While typing, the
  // block already has focus, and on a long page that layout is most of the
  // cost of a keystroke.
  if (document.activeElement !== text) text.focus({ preventScroll: true });
  document
    .getSelection()
    ?.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
}
