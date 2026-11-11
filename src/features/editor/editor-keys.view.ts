// Keys inside text blocks that are not text input: indenting, moving
// between blocks, and the inline code and strikethrough shortcuts.
import {
  isTextBlock,
  textOf,
  type TextBlock,
} from "../../blocks/text-block.ts";
import type { Mark } from "../../model/index.ts";
import { setSelection } from "../../state/index.ts";
import { readSelection, textElementOf } from "../../ui/caret/index.ts";
import { openBlockMenu } from "./editor-block-menu.view.ts";
import { openLinkField } from "./editor-link.view.ts";
import {
  onSelectionKeyDown,
  startBlockSelection,
} from "./editor-selection.view.ts";
import { indentBlock, outdentBlock } from "./editor-structure.commands.ts";
import { caretAt, toggleTextMark } from "./editor.commands.ts";
import type { InputContext } from "./editor-input.view.ts";
import { selectNeighborTextBlock } from "./editor.selectors.ts";

type Edge = "first" | "last";

// Whether the caret is on the first or last visual line of its block. Read
// from layout, in the event handler and never during render.
function isOnEdgeLine(text: HTMLElement, edge: Edge): boolean {
  const selection = document.getSelection();
  const caret = selection?.rangeCount
    ? selection.getRangeAt(0).getClientRects()[0]
    : undefined;
  if (caret === undefined) return true;
  const box = text.getBoundingClientRect();
  const slack = caret.height / 2;
  return edge === "first"
    ? caret.top - box.top < slack
    : box.bottom - caret.bottom < slack;
}

interface Caret {
  readonly block: TextBlock;
  readonly offset: number;
  readonly text: HTMLElement;
}

// The collapsed caret and the block it is in, or undefined when there is
// a range selected or the caret is not in a text block.
function caretIn(
  event: KeyboardEvent,
  context: InputContext,
): Caret | undefined {
  const selection = readSelection();
  const text = textElementOf(
    event.target instanceof Node ? event.target : null,
  );
  if (selection === null || text === null) return undefined;
  if (selection.anchorOffset !== selection.focusOffset) return undefined;
  const block = context.state.workspace.blocks[selection.blockId];
  return isTextBlock(block)
    ? { block, offset: selection.focusOffset, text }
    : undefined;
}

// -1 or 1 when the key would take the caret out of the block that way.
function leavingDirection(key: string, caret: Caret): -1 | 1 | undefined {
  const { text, offset, block } = caret;
  const leaves: Record<string, () => -1 | 1 | undefined> = {
    ArrowUp: () => (isOnEdgeLine(text, "first") ? -1 : undefined),
    ArrowLeft: () => (offset === 0 ? -1 : undefined),
    ArrowDown: () => (isOnEdgeLine(text, "last") ? 1 : undefined),
    ArrowRight: () => (offset === textOf(block).length ? 1 : undefined),
  };
  return leaves[key]?.();
}

// Moves the caret into the neighboring block when it cannot move further
// inside this one.
function moveBetweenBlocks(
  event: KeyboardEvent,
  context: InputContext,
): boolean {
  const caret = event.shiftKey ? undefined : caretIn(event, context);
  const direction =
    caret === undefined ? undefined : leavingDirection(event.key, caret);
  if (caret === undefined || direction === undefined) return false;
  const neighbor = selectNeighborTextBlock(
    context.state,
    caret.block.id,
    direction,
  );
  if (neighbor === undefined) return false;
  const target = direction === -1 ? textOf(neighbor).length : 0;
  context.dispatch(
    setSelection.create({ selection: caretAt(neighbor.id, target) }),
  );
  return true;
}

function indent(event: KeyboardEvent, context: InputContext): boolean {
  const selection = readSelection();
  if (event.key !== "Tab" || selection === null) return false;
  const command = event.shiftKey ? outdentBlock : indentBlock;
  context.dispatch(command.create({ blockId: selection.blockId }));
  return true;
}

// Bold, italic and underline arrive as input events. Inline code and
// strikethrough have no key the browser maps to an input type.
function keyMark(event: KeyboardEvent): Mark | undefined {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return undefined;
  const key = event.key.toLowerCase();
  if (key === "e" && !event.shiftKey) return "code";
  if (key === "s" && event.shiftKey) return "strikethrough";
  return undefined;
}

function inlineMark(event: KeyboardEvent, context: InputContext): boolean {
  const selection = readSelection();
  const mark = keyMark(event);
  if (mark === undefined || selection === null) return false;
  const { blockId, anchorOffset, focusOffset } = selection;
  context.dispatch(
    toggleTextMark.create({
      blockId,
      start: anchorOffset,
      end: focusOffset,
      mark,
    }),
  );
  return true;
}

// Ctrl or Command with "/" opens the menu of the block the caret is in;
// with "k" it opens the link field for the selected text.
function menuKeys(event: KeyboardEvent, context: InputContext): boolean {
  const selection = readSelection();
  if (!(event.ctrlKey || event.metaKey) || selection === null) return false;
  if (event.key === "/" && !event.shiftKey) {
    openBlockMenu(selection.blockId, context.dispatch, selection);
    return true;
  }
  return (
    event.key.toLowerCase() === "k" &&
    openLinkField(selection, context.dispatch)
  );
}

export function onBlockKeyDown(
  event: KeyboardEvent,
  context: InputContext,
): void {
  if (event.isComposing) return;
  if (context.state.ui.blockSelection !== null) {
    onSelectionKeyDown(event, context);
    return;
  }
  const isHandled =
    startBlockSelection(event, context) ||
    indent(event, context) ||
    inlineMark(event, context) ||
    menuKeys(event, context) ||
    moveBetweenBlocks(event, context);
  if (isHandled) event.preventDefault();
}
