// Keys and clipboard for a selection of whole blocks. While blocks are
// selected the container of the blocks has focus, not a block's text.
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import { announce } from "../../ui/announcer/index.ts";
import { readSelection } from "../../ui/caret/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { InputContext } from "./editor-input.view.ts";
import {
  clearBlockSelection,
  deleteSelectedBlocks,
  extendBlockSelection,
} from "./editor-selection.commands.ts";
import { selectSelectedBlocks } from "./editor.selectors.ts";

const DIRECTIONS: Record<string, -1 | 1> = { ArrowUp: -1, ArrowDown: 1 };
const CLEARING = ["Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const DELETING = ["Backspace", "Delete"];

function extend(
  event: KeyboardEvent,
  context: InputContext,
  direction: -1 | 1,
): void {
  const blockId =
    context.state.ui.blockSelection?.focusId ?? readSelection()?.blockId;
  if (blockId === undefined) return;
  const result = context.dispatch(
    extendBlockSelection.create({ blockId, direction }),
  );
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus({ preventScroll: true });
  }
  if (result.ok) announce(COPY.editor.blocksSelected);
}

// Shift with Up or Down, once the text selection has reached that end of
// its block, goes on to select whole blocks.
export function startBlockSelection(
  event: KeyboardEvent,
  context: InputContext,
): boolean {
  const direction = DIRECTIONS[event.key];
  const selection = readSelection();
  if (!event.shiftKey || direction === undefined || selection === null)
    return false;
  const block = context.state.workspace.blocks[selection.blockId];
  const edge =
    direction === -1 || !isTextBlock(block) ? 0 : textOf(block).length;
  if (selection.focusOffset !== edge) return false;
  extend(event, context, direction);
  return true;
}

// Keys while blocks are selected. Keys that mean nothing here, such as
// Tab and the copy shortcut, are left to the browser.
export function onSelectionKeyDown(
  event: KeyboardEvent,
  context: InputContext,
): void {
  const { dispatch } = context;
  const direction = DIRECTIONS[event.key];
  if (event.shiftKey && direction !== undefined) {
    extend(event, context, direction);
  } else if (DELETING.includes(event.key)) {
    dispatch(deleteSelectedBlocks.create({}));
  } else if (CLEARING.includes(event.key)) {
    dispatch(clearBlockSelection.create({ toCaret: true }));
  } else {
    return;
  }
  event.preventDefault();
}

// Copying selected blocks copies their text, one line per block. Cutting
// also deletes them.
export function onSelectionCopy(
  event: ClipboardEvent,
  context: InputContext,
): void {
  const blocks = selectSelectedBlocks(context.state);
  if (blocks.length === 0 || event.clipboardData === null) return;
  const lines = blocks.filter(isTextBlock).map(textOf);
  event.clipboardData.setData("text/plain", lines.join("\n"));
  event.preventDefault();
  if (event.type === "cut") context.dispatch(deleteSelectedBlocks.create({}));
}

// Focus that leaves the blocks, or a press inside them, ends the selection.
export function onSelectionLeave(
  event: FocusEvent | PointerEvent,
  context: InputContext,
): void {
  if (context.state.ui.blockSelection === null) return;
  const next = event instanceof FocusEvent ? event.relatedTarget : null;
  if (next !== null && next === event.currentTarget) return;
  context.dispatch(clearBlockSelection.create({ toCaret: false }));
}
