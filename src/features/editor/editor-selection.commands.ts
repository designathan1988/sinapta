// Selecting whole blocks together, and what is done to such a selection.
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import { isPageLike } from "../../blocks/page/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type BlockSelection,
  type NoPayload,
} from "../../state/index.ts";
import { deleteOperations } from "./editor-move.commands.ts";
import { indexIn, moveOperations } from "./editor-operations.ts";
import { caretAt } from "./editor.commands.ts";
import {
  selectBlockOrder,
  selectChildBlocks,
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

// Selects every block between two blocks, both included.
export const selectBlockRange = defineCommand<BlockSelection>({
  type: "ui.selectBlockRange",
  handle(state, command) {
    const { anchorId, focusId } = command;
    const { blocks } = state.workspace;
    if (blocks[anchorId] === undefined || blocks[focusId] === undefined)
      return {};
    const blockSelection = { anchorId, focusId };
    return { ui: { ...state.ui, selection: null, blockSelection } };
  },
});

// The selected blocks that move as a group: those at the top of the
// selection that share the first one's parent. Blocks inside a selected
// block move with it.
function selectedSiblings(state: AppState): Block[] {
  const selected = selectSelectedBlocks(state);
  const ids = new Set(selected.map((block) => block.id));
  const roots = selected.filter(
    (block) => block.parentId === null || !ids.has(block.parentId),
  );
  return roots.filter((block) => block.parentId === roots[0]?.parentId);
}

// Tab: the selected blocks become the last children of the block above.
export const indentSelectedBlocks = defineCommand<NoPayload>({
  type: "block.indentSelected",
  handle(state) {
    const group = selectedSiblings(state);
    const [first] = group;
    if (first?.parentId == null) return {};
    const siblings = selectChildBlocks(state, first.parentId);
    const above = siblings[siblings.indexOf(first) - 1];
    if (!isTextBlock(above)) return {};
    const start = above.childIds.length;
    return {
      operations: group.flatMap((block, position) =>
        moveOperations(block, above.id, start + position),
      ),
    };
  },
});

// Shift+Tab: the selected blocks move out, to just after their parent.
export const outdentSelectedBlocks = defineCommand<NoPayload>({
  type: "block.outdentSelected",
  handle(state) {
    const group = selectedSiblings(state);
    const parentId = group[0]?.parentId ?? null;
    const parent =
      parentId === null ? undefined : state.workspace.blocks[parentId];
    if (!isTextBlock(parent) || parent.parentId === null) return {};
    const target = parent.parentId;
    const start = indexIn(state, parent) + 1;
    return {
      operations: group.flatMap((block, position) =>
        moveOperations(block, target, start + position),
      ),
    };
  },
});

// Moves the selected blocks one place up (-1) or down (1) among their
// siblings, by taking the block on that side to their other side.
export const moveSelectedBlocksBy = defineCommand<{ offset: -1 | 1 }>({
  type: "block.moveSelectedBy",
  handle(state, command) {
    const group = selectedSiblings(state);
    const first = group[0];
    const last = group.at(-1);
    if (first?.parentId == null || last === undefined) return {};
    const parent = state.workspace.blocks[first.parentId];
    const from = indexIn(state, first);
    const to = indexIn(state, last);
    const stepped = command.offset === -1 ? from - 1 : to + 1;
    const neighborId = parent?.childIds[stepped];
    const neighbor =
      neighborId === undefined ? undefined : state.workspace.blocks[neighborId];
    if (neighbor === undefined || isPageLike(neighbor)) return {};
    const index = command.offset === -1 ? to : from;
    return { operations: moveOperations(neighbor, first.parentId, index) };
  },
});

export const editorSelectionCommands = [
  extendBlockSelection,
  clearBlockSelection,
  deleteSelectedBlocks,
  selectBlockRange,
  indentSelectedBlocks,
  outdentSelectedBlocks,
  moveSelectedBlocksBy,
];
