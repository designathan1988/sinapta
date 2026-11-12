import {
  listOf,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import { selectPage, selectTrashedPages } from "./page.selectors.ts";
import type { PageBlock } from "./page.schema.ts";

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
  trashedAt: string | null,
): Operation[] {
  const page = selectPage(state, pageId);
  const isTrashed = trashedAt !== null;
  if (page === undefined || page.props.isTrashed === isTrashed) return [];
  const { trashedAt: _before, ...kept } = page.props;
  const props = {
    ...kept,
    isTrashed,
    ...(trashedAt !== null && { trashedAt }),
  };
  return [
    { type: "record.update", kind: "block", id: pageId, patch: { props } },
  ];
}

// Trashing hides a page and everything inside it; nothing is deleted.
export const trashPage = defineCommand<{ pageId: BlockId }>({
  type: "page.trash",
  handle: (state, command) => ({
    operations: setTrashed(state, command.pageId, command.meta.now),
    ui: closeIfInside(state, command.pageId),
  }),
});

export const restorePage = defineCommand<{ pageId: BlockId }>({
  type: "page.restore",
  handle: (state, command) => ({
    operations: setTrashed(state, command.pageId, null),
  }),
});

function subtree(state: AppState, block: Block): Block[] {
  const children = block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    return child === undefined ? [] : subtree(state, child);
  });
  return [block, ...children];
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
        { type: "list.remove", list: listOf(page.parentId), id: page.id },
        ...deletions,
      ],
      ui: closeIfInside(state, page.id),
    };
  },
});

const TRASH_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// When a page went to the trash; one trashed before the date was kept,
// when it last changed.
function trashedAtOf(page: PageBlock): number {
  return Date.parse(page.props.trashedAt ?? page.updatedAt);
}

// Deletes for good the pages kept in the trash over 30 days, with all
// inside them, as Notion's trash does; run as the workspace loads.
export const emptyOldTrash = defineCommand<Record<string, never>>({
  type: "page.emptyOldTrash",
  handle(state, command) {
    const cutoff = Date.parse(command.meta.now) - TRASH_DAYS * DAY_MS;
    const old = selectTrashedPages(state).filter(
      (page) => trashedAtOf(page) < cutoff,
    );
    const operations = old.flatMap((page): Operation[] => [
      { type: "list.remove", list: listOf(page.parentId), id: page.id },
      ...subtree(state, page).map((block): Operation => ({
        type: "record.delete",
        kind: "block",
        id: block.id,
      })),
    ]);
    return operations.length === 0 ? {} : { operations };
  },
});

export const pageTrashCommands = [
  trashPage,
  restorePage,
  deletePage,
  emptyOldTrash,
];
