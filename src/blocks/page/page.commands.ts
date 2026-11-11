import {
  renameMentions,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { isTextBlock } from "../text-block.ts";
import { PAGE_TYPE, type PageProps } from "./page.schema.ts";
import { selectPage } from "./page.selectors.ts";

function emptyPageProps(): PageProps {
  return { title: [], icon: null, isFavorite: false, isTrashed: false };
}

function siblingCount(state: AppState, parentId: BlockId | null): number {
  if (parentId === null) return state.workspace.rootIds.length;
  return state.workspace.blocks[parentId]?.childIds.length ?? 0;
}

// Creates an empty page at the end of its parent (or of the top level),
// opens it and reveals it in the tree.
export const createPage = defineCommand<{
  parentId: BlockId | null;
  // Where among the parent's blocks; at the end when left out.
  index?: number;
}>({
  type: "page.create",
  newBlockIds: 1,
  handle(state, command) {
    const id = command.meta.blockIds[0];
    const { parentId } = command;
    if (id === undefined) return {};
    const { now } = command.meta;
    const record = {
      id,
      type: PAGE_TYPE,
      parentId,
      childIds: [],
      props: emptyPageProps(),
      createdAt: now,
      updatedAt: now,
    };
    const list =
      parentId === null
        ? ({ kind: "rootIds" } as const)
        : ({ kind: "childIds", blockId: parentId } as const);
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record },
      {
        type: "list.insert",
        list,
        id,
        index: command.index ?? siblingCount(state, parentId),
      },
    ];
    const expanded = state.ui.expandedPageIds;
    const expandedPageIds =
      parentId === null || expanded.includes(parentId)
        ? expanded
        : [...expanded, parentId];
    return {
      operations,
      ui: { ...state.ui, activePageId: id, expandedPageIds },
    };
  },
});

// The title is edited as plain text and stored as one span.
// Every text that mentions the page shows its new title.
function renamedMentions(
  state: AppState,
  pageId: BlockId,
  title: string,
): Operation[] {
  return Object.values(state.workspace.blocks).flatMap((block): Operation[] => {
    if (!isTextBlock(block)) return [];
    const text = renameMentions(block.props.text, pageId, title);
    if (text === block.props.text) return [];
    const props = { ...block.props, text };
    return [
      { type: "record.update", kind: "block", id: block.id, patch: { props } },
    ];
  });
}

export const renamePage = defineCommand<{ pageId: BlockId; title: string }>({
  type: "page.rename",
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    if (page === undefined) return {};
    const title = command.title === "" ? [] : [{ text: command.title }];
    const label = command.title === "" ? COPY.sidebar.untitled : command.title;
    return {
      mergeKey: `page.rename:${command.pageId}`,
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: command.pageId,
          patch: {
            props: { ...page.props, title },
            updatedAt: command.meta.now,
          },
        },
        ...renamedMentions(state, command.pageId, label),
      ],
    };
  },
});

function updateProps(
  state: AppState,
  pageId: BlockId,
  change: (props: PageProps) => PageProps,
): Operation[] {
  const page = selectPage(state, pageId);
  if (page === undefined) return [];
  const props = change(page.props);
  return [
    { type: "record.update", kind: "block", id: pageId, patch: { props } },
  ];
}

// Sets the icon to one emoji, or removes it with null.
export const setPageIcon = defineCommand<{
  pageId: BlockId;
  icon: string | null;
}>({
  type: "page.setIcon",
  handle: (state, command) => ({
    operations: updateProps(state, command.pageId, (props) => ({
      ...props,
      icon: command.icon,
    })),
  }),
});

export const togglePageFavorite = defineCommand<{ pageId: BlockId }>({
  type: "page.toggleFavorite",
  handle: (state, command) => ({
    operations: updateProps(state, command.pageId, (props) => ({
      ...props,
      isFavorite: !props.isFavorite,
    })),
  }),
});

export const pageCommands = [
  createPage,
  renamePage,
  setPageIcon,
  togglePageFavorite,
];
