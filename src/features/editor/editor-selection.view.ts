// Keys and clipboard for a selection of whole blocks. While blocks are
// selected the container of the blocks has focus, not a block's text.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import {
  countBlockTree,
  parseBlockId,
  type BlockId,
} from "../../model/index.ts";
import { readSelection } from "../../ui/caret/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import {
  clearBlockSelection,
  deleteSelectedBlocks,
  extendBlockSelection,
  indentSelectedBlocks,
  moveSelectedBlocksBy,
  outdentSelectedBlocks,
  selectBlockRange,
} from "./editor-selection.commands.ts";
import { copyBlocksByKey } from "./editor-clipboard.view.ts";
import { duplicateBlock } from "./editor-insert.commands.ts";
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

// Arrows with Shift grow or shrink the selection; with Alt, or Ctrl and
// Shift, they move the selected blocks.
function arrowAction(event: KeyboardEvent, context: InputContext) {
  const direction = DIRECTIONS[event.key];
  if (direction === undefined) return undefined;
  const hasMod = event.ctrlKey || event.metaKey;
  if (event.altKey || (hasMod && event.shiftKey)) {
    return () => {
      const command = moveSelectedBlocksBy.create({ offset: direction });
      if (context.dispatch(command).ok) announce(COPY.blockMenu.moved);
    };
  }
  return event.shiftKey
    ? () => {
        extend(event, context, direction);
      }
    : undefined;
}

// Each selected block whose parent is not selected too, with everything
// inside it, is copied below itself.
export function duplicateSelected(context: {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}): void {
  const blocks = selectSelectedBlocks(context.state);
  const ids = new Set(blocks.map((block) => block.id));
  for (const block of blocks) {
    if (block.parentId !== null && ids.has(block.parentId)) continue;
    const blockCount = countBlockTree(context.state.workspace, block.id);
    context.dispatch(duplicateBlock.create({ blockId: block.id, blockCount }));
  }
}

function otherAction(event: KeyboardEvent, context: InputContext) {
  const { dispatch } = context;
  const hasMod = event.ctrlKey || event.metaKey;
  if (hasMod && event.key.toLowerCase() === "d") {
    return () => {
      duplicateSelected(context);
    };
  }
  if (hasMod && ["c", "x"].includes(event.key.toLowerCase())) {
    return () => {
      copyBlocksByKey(event, context);
    };
  }
  if (event.key === "Tab") {
    const command = event.shiftKey
      ? outdentSelectedBlocks
      : indentSelectedBlocks;
    return () => dispatch(command.create({}));
  }
  if (DELETING.includes(event.key)) {
    return () => dispatch(deleteSelectedBlocks.create({}));
  }
  if (CLEARING.includes(event.key)) {
    return () => dispatch(clearBlockSelection.create({ toCaret: true }));
  }
  return undefined;
}

// Keys while blocks are selected. Keys that mean nothing here, such as
// the copy shortcut, are left to the browser.
export function onSelectionKeyDown(
  event: KeyboardEvent,
  context: InputContext,
): void {
  const action = arrowAction(event, context) ?? otherAction(event, context);
  if (action === undefined) return;
  event.preventDefault();
  action();
}

// Focus that leaves the blocks, or a press inside them, ends the selection;
// as Notion's, a selected block's handle and the menu it opens keep it,
// so the menu acts on, and counts, every block selected.
export function onSelectionLeave(
  event: FocusEvent | PointerEvent,
  context: InputContext,
): void {
  if (context.state.ui.blockSelection === null) return;
  if (event instanceof FocusEvent) {
    if (keepsFocusNear(event.currentTarget, event.relatedTarget)) return;
  } else if (isSelectedHandle(event.target, context)) {
    return;
  }
  context.dispatch(clearBlockSelection.create({ toCaret: false }));
}

function keepsFocusNear(
  blocks: EventTarget | null,
  next: EventTarget | null,
): boolean {
  if (!(next instanceof Element)) return false;
  const isInside = blocks instanceof Element && blocks.contains(next);
  return isInside || next.closest("[data-overlay]") !== null;
}

function isSelectedHandle(
  target: EventTarget | null,
  context: InputContext,
): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-handle]") === null) return false;
  const id = blockAt(target);
  return selectSelectedBlocks(context.state).some((block) => block.id === id);
}

const BLOCK = ".editor__block";
const NOT_TEXT =
  "[data-handle], button, input, select, textarea, a, [role='slider'], .database";

function blockAt(target: EventTarget | null): BlockId | undefined {
  const block =
    target instanceof Element ? target.closest<HTMLElement>(BLOCK) : null;
  return parseBlockId(block?.dataset.blockId ?? "");
}

function selectRange(
  container: HTMLElement,
  range: { anchorId: BlockId; focusId: BlockId },
  context: InputContext,
): void {
  context.dispatch(selectBlockRange.create(range));
  document.getSelection()?.removeAllRanges();
  container.focus({ preventScroll: true });
}

// A press in one block dragged into another selects whole blocks, and so
// does a press with Shift in a block other than the caret's. Inside one
// block the browser selects text as usual.
export function startPointerSelection(
  event: PointerEvent,
  context: InputContext,
): void {
  const container = event.currentTarget;
  const pressed = blockAt(event.target);
  const isText =
    event.target instanceof Element && event.target.closest(NOT_TEXT) === null;
  if (!(container instanceof HTMLElement) || pressed === undefined) return;
  if (!isText || event.button !== 0) return;
  const anchorId = event.shiftKey ? readSelection()?.blockId : pressed;
  if (anchorId === undefined) return;
  if (anchorId !== pressed) {
    event.preventDefault();
    selectRange(container, { anchorId, focusId: pressed }, context);
  }
  const drag = new AbortController();
  let focusId = pressed;
  const onMove = (move: PointerEvent): void => {
    const over = blockAt(document.elementFromPoint(move.clientX, move.clientY));
    if (over === undefined || over === focusId) return;
    focusId = over;
    selectRange(container, { anchorId, focusId }, context);
  };
  const end = (): void => {
    drag.abort();
  };
  container.addEventListener("pointermove", onMove, { signal: drag.signal });
  document.addEventListener("pointerup", end, { signal: drag.signal });
  document.addEventListener("pointercancel", end, { signal: drag.signal });
}
