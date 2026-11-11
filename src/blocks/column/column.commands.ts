import type { Block, BlockId } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { MIN_COLUMN_SHARE, setShareOps, shareOf } from "./column-share.ts";
import { COLUMN_TYPE } from "./column.schema.ts";

function columnAt(state: AppState, id: BlockId | undefined): Block | undefined {
  const block = id === undefined ? undefined : state.workspace.blocks[id];
  return block?.type === COLUMN_TYPE ? block : undefined;
}

// Moves the boundary after the column at the index of a column list: that
// column takes the share asked for, within limits, and its right
// neighbour the rest of what the two had, so the shares still add up.
export const resizeColumns = defineCommand<{
  blockId: BlockId;
  index: number;
  share: number;
}>({
  type: "columns.resize",
  handle(state, command) {
    const list = state.workspace.blocks[command.blockId];
    if (list === undefined) return {};
    const count = list.childIds.length;
    const left = columnAt(state, list.childIds[command.index]);
    const right = columnAt(state, list.childIds[command.index + 1]);
    if (left === undefined || right === undefined) return {};
    const total = shareOf(left, count) + shareOf(right, count);
    const share = Math.min(
      total - MIN_COLUMN_SHARE,
      Math.max(MIN_COLUMN_SHARE, command.share),
    );
    const operations = [
      ...setShareOps(left, share),
      ...setShareOps(right, total - share),
    ];
    // Steps taken one after another, as with the arrow keys, undo as one.
    return { operations, mergeKey: `columns.resize:${list.id}` };
  },
});

export const columnCommands = [resizeColumns];
