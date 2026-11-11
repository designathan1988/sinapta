// A database inside a page's body, as Notion's inline databases: it goes
// after the block it was made from, or in its place when that block is an
// empty line, with one table view, and the page stays open.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { DATABASE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  type Block,
  type BlockId,
  type Operation,
  type ViewId,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { DEFAULT_VIEW_NAME, emptyView } from "./database.commands.ts";

function databaseRecord(
  id: BlockId,
  parentId: BlockId,
  meta: { readonly now: string; readonly viewId: ViewId },
): Block {
  return {
    id,
    type: DATABASE_TYPE,
    parentId,
    childIds: [],
    props: {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      isInline: true,
      properties: [],
      viewIds: [meta.viewId],
    },
    createdAt: meta.now,
    updatedAt: meta.now,
  };
}

interface Place {
  readonly parentId: BlockId;
  readonly index: number;
  // The empty line the database takes the place of, removed first.
  readonly removal: readonly Operation[];
}

// Where the database goes: after the block, or in its place when the
// block is an empty line.
export function placeFor(state: AppState, blockId: BlockId): Place | undefined {
  const block = state.workspace.blocks[blockId];
  const parentId = block?.parentId ?? null;
  const parent =
    parentId === null ? undefined : state.workspace.blocks[parentId];
  if (block === undefined || parent === undefined) return undefined;
  const at = parent.childIds.indexOf(block.id);
  const isEmptyLine =
    isTextBlock(block) && textOf(block) === "" && block.childIds.length === 0;
  if (!isEmptyLine) return { parentId: parent.id, index: at + 1, removal: [] };
  const removal: Operation[] = [
    { type: "list.remove", list: listOf(parent.id), id: block.id },
    { type: "record.delete", kind: "block", id: block.id },
  ];
  return { parentId: parent.id, index: at, removal };
}

export const createInlineDatabase = defineCommand<{ blockId: BlockId }>({
  type: "database.createInline",
  newIds: { blocks: 1, views: 1 },
  handle(state, command) {
    const place = placeFor(state, command.blockId);
    const id = command.meta.blockIds[0];
    const viewId = command.meta.viewIds[0];
    if (place === undefined || id === undefined || viewId === undefined) {
      return {};
    }
    const { now } = command.meta;
    const record = databaseRecord(id, place.parentId, { now, viewId });
    const list = listOf(place.parentId);
    return {
      operations: [
        ...place.removal,
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list, id, index: place.index },
        {
          type: "record.create",
          kind: "view",
          record: emptyView(viewId, id, DEFAULT_VIEW_NAME),
        },
      ],
      ui: { ...state.ui, selection: null },
    };
  },
});
