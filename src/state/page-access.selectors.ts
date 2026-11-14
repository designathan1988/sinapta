// What this person may do on each page (ADR-0013): a guest has the access
// each page was shared with them at, and the pages inside share it; a
// member's map is empty, and a member may do everything.
import {
  isCommentChange,
  mayChange,
  type BlockId,
  type Operation,
  type PageAccess,
} from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import type { CommandEffect } from "./command-registry.ts";

const isMember = (state: AppState) =>
  Object.keys(state.persistence.sync.access).length === 0;

export function selectBlockAccess(state: AppState, id: BlockId): PageAccess {
  if (isMember(state)) return "full";
  const { access } = state.persistence.sync;
  let block = state.workspace.blocks[id];
  while (block !== undefined) {
    const found = access[block.id];
    if (found !== undefined) return found;
    block =
      block.parentId === null
        ? undefined
        : state.workspace.blocks[block.parentId];
  }
  return "view";
}

// Whether the block's words and blocks may be changed here.
export function selectIsEditable(state: AppState, id: BlockId): boolean {
  const access = selectBlockAccess(state, id);
  return access === "full" || access === "edit";
}

// The block a change to a record is about.
function recordTarget(
  operation: Extract<Operation, { type: "record.update" | "record.delete" }>,
  state: AppState,
): BlockId | undefined {
  if (operation.kind === "block") return operation.id;
  if (operation.kind === "view") {
    return state.workspace.views[operation.id]?.databaseId;
  }
  return undefined;
}

// The block an operation changes or adds to; undefined for the workspace's
// top and its settings.
function targetOf(operation: Operation, state: AppState): BlockId | undefined {
  switch (operation.type) {
    case "record.create":
      return operation.kind === "block"
        ? (operation.record.parentId ?? undefined)
        : operation.record.databaseId;
    case "record.update":
    case "record.delete":
      return recordTarget(operation, state);
    case "list.insert":
    case "list.remove":
      return operation.list.kind === "childIds"
        ? operation.list.blockId
        : undefined;
  }
}

// True when a guest's change reaches a page they may not change this way;
// the server refuses it too.
export function isRefusedByAccess(
  state: AppState,
  effect: CommandEffect,
): boolean {
  if (isMember(state) || effect.isRemote === true) return false;
  return (effect.operations ?? []).some((operation) => {
    const target = targetOf(operation, state);
    if (target === undefined) return true;
    const isComment = isCommentChange(
      operation,
      state.workspace.blocks[target],
    );
    return !mayChange(selectBlockAccess(state, target), isComment);
  });
}
