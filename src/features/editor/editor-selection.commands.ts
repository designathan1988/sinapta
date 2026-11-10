// Selecting whole blocks together, and what is done to such a selection.
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import type { BlockId } from "../../model/index.ts";
import { defineCommand, type NoPayload } from "../../state/index.ts";
import { deleteOperations } from "./editor-move.commands.ts";
import { caretAt } from "./editor.commands.ts";
import {
  selectBlockOrder,
  selectPageIdOf,
  selectSelectedBlocks,
} from "./editor.selectors.ts";

export interface ExtendBlockSelectionPayload {
  // The block the selection starts from when there is none yet.
  readonly blockId: BlockId;
  // Toward the start of the page (-1) or its end (1).
  readonly direction: -1 | 1;
}

// The first press selects the block the caret is in. Each press after it
// moves the far end of the selection one block along the page.
export const extendBlockSelection = defineCommand<ExtendBlockSelectionPayload>({
  type: "ui.extendBlockSelection",
  handle(state, command) {
    const current = state.ui.blockSelection;
    const anchorId = current?.anchorId ?? command.blockId;
    const pageId = selectPageIdOf(state, anchorId);
    if (pageId === undefined) return {};
    const order = selectBlockOrder(state, pageId);
    const from = order.findIndex((block) => block.id === current?.focusId);
    const next = from === -1 ? undefined : order[from + command.direction];
    const focusId = next?.id ?? current?.focusId ?? anchorId;
    const blockSelection = { anchorId, focusId };
    return { ui: { ...state.ui, selection: null, blockSelection } };
  },
});

// Ends a block selection. With `toCaret` the caret goes to the start of
// the block the selection ended on.
export const clearBlockSelection = defineCommand<{ toCaret: boolean }>({
  type: "ui.clearBlockSelection",
  handle(state, command) {
    const current = state.ui.blockSelection;
    if (current === null) return {};
    const focus = state.workspace.blocks[current.focusId];
    const selection =
      command.toCaret && isTextBlock(focus) ? caretAt(focus.id, 0) : null;
    return { ui: { ...state.ui, blockSelection: null, selection } };
  },
});

// Deletes every selected block with what is inside it, as one step. The
// caret goes to the end of the text block before the selection.
export const deleteSelectedBlocks = defineCommand<NoPayload>({
  type: "block.deleteSelected",
  handle(state) {
    const selected = selectSelectedBlocks(state);
    const [first] = selected;
    const pageId =
      first === undefined ? undefined : selectPageIdOf(state, first.id);
    if (first === undefined || pageId === undefined) return {};
    const ids = new Set(selected.map((block) => block.id));
    // A block inside a selected block goes with it.
    const roots = selected.filter(
      (block) => block.parentId === null || !ids.has(block.parentId),
    );
    const order = selectBlockOrder(state, pageId);
    const before = order.slice(0, order.indexOf(first)).findLast(isTextBlock);
    const selection =
      before === undefined ? null : caretAt(before.id, textOf(before).length);
    return {
      operations: roots.flatMap((block) => deleteOperations(state, block)),
      ui: { ...state.ui, blockSelection: null, selection },
    };
  },
});

export const editorSelectionCommands = [
  extendBlockSelection,
  clearBlockSelection,
  deleteSelectedBlocks,
];
