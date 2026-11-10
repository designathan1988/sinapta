import type { BlockId, ListRef, Operation } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { listContaining } from "./page-trash.commands.ts";
import { selectPage } from "./page.selectors.ts";

function idsIn(state: AppState, list: ListRef): readonly BlockId[] {
  if (list.kind === "rootIds") return state.workspace.rootIds;
  return state.workspace.blocks[list.blockId]?.childIds ?? [];
}

function isSelfOrInside(
  state: AppState,
  parentId: BlockId | null,
  pageId: BlockId,
): boolean {
  let current = parentId;
  while (current !== null) {
    if (current === pageId) return true;
    current = state.workspace.blocks[current]?.parentId ?? null;
  }
  return false;
}

export interface MovePagePayload {
  readonly pageId: BlockId;
  readonly parentId: BlockId | null;
  // Position among the new siblings, counted without the moved page.
  readonly index: number;
}

// Moves a page to a parent and position. A page cannot move into itself.
export const movePage = defineCommand<MovePagePayload>({
  type: "page.move",
  handle(state, command) {
    const { pageId, parentId } = command;
    const page = selectPage(state, pageId);
    if (page === undefined || isSelfOrInside(state, parentId, pageId))
      return {};
    if (parentId !== null && selectPage(state, parentId) === undefined)
      return {};
    const from = listContaining(page);
    const to: ListRef =
      parentId === null
        ? { kind: "rootIds" }
        : { kind: "childIds", blockId: parentId };
    const siblings = idsIn(state, to).filter((id) => id !== pageId);
    const index = Math.max(0, Math.min(command.index, siblings.length));
    if (
      page.parentId === parentId &&
      idsIn(state, from).indexOf(pageId) === index
    ) {
      return {};
    }
    const operations: Operation[] = [
      { type: "list.remove", list: from, id: pageId },
      { type: "list.insert", list: to, id: pageId, index },
      { type: "record.update", kind: "block", id: pageId, patch: { parentId } },
    ];
    const expanded = state.ui.expandedPageIds;
    const expandedPageIds =
      parentId === null || expanded.includes(parentId)
        ? expanded
        : [...expanded, parentId];
    return { operations, ui: { ...state.ui, expandedPageIds } };
  },
});

export const pageMoveCommands = [movePage];
