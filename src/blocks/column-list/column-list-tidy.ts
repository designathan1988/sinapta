// Keeps columns tidy after any change: a column left empty goes and its
// share is given to the others, and a list left with one column gives its
// blocks back to the page in its place.
import {
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type Workspace,
} from "../../model/index.ts";
import type { Tidier } from "../../state/index.ts";
import { COLUMN_TYPE, setShareOps, shareOf } from "../column/index.ts";
import { moveOps, removeOps } from "./column-operations.ts";
import { COLUMN_LIST_TYPE } from "./column-list.schema.ts";

function rescaleOps(columns: readonly Block[]): Operation[] {
  const total = columns.reduce(
    (sum, column) => sum + shareOf(column, columns.length),
    0,
  );
  return columns.flatMap((column) =>
    setShareOps(column, shareOf(column, columns.length) / total),
  );
}

function unwrapOps(
  workspace: Workspace,
  list: Block,
  column: Block | undefined,
): Operation[] {
  const parentId = list.parentId;
  if (parentId === null) return [];
  const index = siblingIds(workspace, parentId).indexOf(list.id);
  const children = (column?.childIds ?? []).flatMap(
    (childId) => workspace.blocks[childId] ?? [],
  );
  const moves = children.flatMap((child, offset) =>
    moveOps(child, { parentId, index: index + offset }),
  );
  return [...moves, ...(column ? removeOps(column) : []), ...removeOps(list)];
}

function tidyList(workspace: Workspace, listId: BlockId): Operation[] {
  const list = workspace.blocks[listId];
  if (list?.type !== COLUMN_LIST_TYPE) return [];
  const columns = list.childIds.flatMap((id) => workspace.blocks[id] ?? []);
  const kept = columns.filter((column) => column.childIds.length > 0);
  const isTidy = kept.length === columns.length && kept.length >= 2;
  if (isTidy) return [];
  const removals = columns
    .filter((column) => column.childIds.length === 0)
    .flatMap(removeOps);
  if (kept.length >= 2) return [...removals, ...rescaleOps(kept)];
  return [...removals, ...unwrapOps(workspace, list, kept[0])];
}

export const tidyColumns: Tidier = (workspace, changed) => {
  const listIds = new Set<BlockId>();
  for (const id of changed) {
    const block = workspace.blocks[id];
    if (block?.type === COLUMN_LIST_TYPE) listIds.add(block.id);
    if (block?.type === COLUMN_TYPE && block.parentId !== null) {
      listIds.add(block.parentId);
    }
  }
  return [...listIds].flatMap((listId) => tidyList(workspace, listId));
};
