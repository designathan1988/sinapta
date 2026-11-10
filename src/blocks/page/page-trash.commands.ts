import type { Block, BlockId, ListRef, Operation } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import { selectPage } from "./page.selectors.ts";

function isInside(
  state: AppState,
  blockId: BlockId | null,
  ancestorId: BlockId,
): boolean {
  let current = blockId;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = state.workspace.blocks[current]?.parentId ?? null;
  }
  return false;
}

// Closes the open page when it is the given page or inside it.
function closeIfInside(state: AppState, pageId: BlockId): UiState {
  if (!isInside(state, state.ui.activePageId, pageId)) return state.ui;
  return { ...state.ui, activePageId: null };
}

function setTrashed(
  state: AppState,
  pageId: BlockId,
  isTrashed: boolean,
): Operation[] {
  const page = selectPage(state, pageId);
  if (page === undefined || page.props.isTrashed === isTrashed) return [];
  const props = { ...page.props, isTrashed };
  return [
    { type: "record.update", kind: "block", id: pageId, patch: { props } },
  ];
}

// Trashing hides a page and everything inside it; nothing is deleted.
export const trashPage = defineCommand<{ pageId: BlockId }>({
  type: "page.trash",
  handle: (state, command) => ({
    operations: setTrashed(state, command.pageId, true),
    ui: closeIfInside(state, command.pageId),
  }),
});

export const restorePage = defineCommand<{ pageId: BlockId }>({
  type: "page.restore",
  handle: (state, command) => ({
    operations: setTrashed(state, command.pageId, false),
  }),
});

function subtree(state: AppState, block: Block): Block[] {
  const children = block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    return child === undefined ? [] : subtree(state, child);
  });
  return [block, ...children];
}

export function listContaining(block: Block): ListRef {
  return block.parentId === null
    ? { kind: "rootIds" }
    : { kind: "childIds", blockId: block.parentId };
}

// Removes a trashed page and everything inside it for good.
export const deletePage = defineCommand<{ pageId: BlockId }>({
  type: "page.delete",
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    if (!page?.props.isTrashed) return {};
    const deletions = subtree(state, page).map((block): Operation => ({
      type: "record.delete",
      kind: "block",
      id: block.id,
    }));
    return {
      operations: [
        { type: "list.remove", list: listContaining(page), id: page.id },
        ...deletions,
      ],
      ui: closeIfInside(state, page.id),
    };
  },
});

export const pageTrashCommands = [trashPage, restorePage, deletePage];
