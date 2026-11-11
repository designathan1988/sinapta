// Commands that add blocks beside a block: a new block from the "+"
// beside it, and a copy of it.
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import {
  copyBlockTree,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import {
  childList,
  createBlock,
  indexIn,
  withSelection,
} from "./editor-operations.ts";

// The slash menu feature shows the menu; the editor says where the "/" is.
const SLASH_MENU_OVERLAY = "slash-menu";
const SLASH = "/";

// Adds a paragraph holding "/" below the block, with the caret after it
// and the slash menu open, so the next key picks what the block becomes.
export const insertBlockBelow = defineCommand<{ blockId: BlockId }>({
  type: "block.insertBelow",
  newBlockIds: 1,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const id = command.meta.blockIds[0];
    if (block?.parentId == null || id === undefined) return {};
    const record = createBlock({
      id,
      type: PARAGRAPH_TYPE,
      parentId: block.parentId,
      text: [{ text: SLASH }],
      now: command.meta.now,
    });
    const index = indexIn(state, block) + 1;
    const overlay = { kind: SLASH_MENU_OVERLAY, anchorId: id, start: 0 };
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(block.parentId), id, index },
      ],
      ui: { ...withSelection(state, id, SLASH.length), overlay },
    };
  },
});

export interface DuplicatePayload {
  readonly blockId: BlockId;
  // How many blocks the copy holds: the block and everything inside it,
  // so that the dispatcher can create an id for each.
  readonly blockCount: number;
}

export const duplicateBlock = defineCommand<DuplicatePayload>({
  type: "block.duplicate",
  newIds: (payload) => ({ blocks: payload.blockCount }),
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block?.parentId == null) return {};
    const copies = copyBlockTree(state.workspace, {
      rootId: block.id,
      ids: command.meta.blockIds,
      now: command.meta.now,
    });
    const root = copies?.[0];
    if (copies?.length !== command.blockCount || root === undefined) return {};
    const operations: Operation[] = [
      ...copies.map((record): Operation => ({
        type: "record.create",
        kind: "block",
        record,
      })),
      {
        type: "list.insert",
        list: childList(block.parentId),
        id: root.id,
        index: indexIn(state, block) + 1,
      },
    ];
    return { operations };
  },
});

export const editorInsertCommands = [insertBlockBelow, duplicateBlock];
