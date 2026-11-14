// "+" and a name, as Notion's: "New subpage" makes a page there, and a
// page picked under "Link to page" is linked there. A line that holds
// only what was typed becomes the subpage or the link itself; otherwise
// what was typed goes and the new block comes after the line.
import { PAGE_LINK_TYPE } from "../../blocks/page-link/index.ts";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { closed, placeAt, type Typed } from "./editor-place.ts";

export const createSubpageAt = defineCommand<Typed & { title: string }>({
  type: "page.createFromPlus",
  newBlockIds: 1,
  handle(state, command) {
    const parentId = state.workspace.blocks[command.blockId]?.parentId;
    const parent = parentId ? state.workspace.blocks[parentId] : undefined;
    if (parent?.type !== PAGE_TYPE) return {};
    const title = command.title.trim();
    const props = {
      title: title === "" ? [] : [{ text: title }],
      ...{ icon: null, isFavorite: false, isTrashed: false },
    };
    const operations = placeAt(state, command, {
      type: PAGE_TYPE,
      props,
      newId: command.meta.blockIds[0],
      now: command.meta.now,
    });
    return operations.length === 0 ? {} : { operations, ui: closed(state) };
  },
});

export const linkPageAt = defineCommand<Typed & { pageId: BlockId }>({
  type: "block.linkFromPlus",
  newBlockIds: 1,
  handle(state, command) {
    const operations = placeAt(state, command, {
      type: PAGE_LINK_TYPE,
      props: { pageId: command.pageId },
      newId: command.meta.blockIds[0],
      now: command.meta.now,
    });
    return operations.length === 0 ? {} : { operations, ui: closed(state) };
  },
});

// "New page “…” in…": the page made where the person chose, at the end of
// that page or teamspace or at the top level, and the line links to it.
export const createPageInAt = defineCommand<
  Typed & { title: string; parentId: BlockId | null }
>({
  type: "page.createInFromPlus",
  newBlockIds: 2,
  handle(state, command) {
    const [pageId, linkId] = command.meta.blockIds;
    if (pageId === undefined) return {};
    const { now } = command.meta;
    const { parentId } = command;
    const title = command.title.trim();
    const page = {
      ...{ id: pageId, type: PAGE_TYPE, parentId, childIds: [] },
      props: {
        title: title === "" ? [] : [{ text: title }],
        ...{ icon: null, isFavorite: false, isTrashed: false },
      },
      ...{ createdAt: now, updatedAt: now },
    };
    const index = siblingIds(state.workspace, parentId).length;
    const link = placeAt(state, command, {
      type: PAGE_LINK_TYPE,
      props: { pageId },
      newId: linkId,
      now,
    });
    if (link.length === 0) return {};
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record: page },
      { type: "list.insert", list: listOf(parentId), id: pageId, index },
      ...link,
    ];
    return { operations, ui: closed(state) };
  },
});

export const editorPlusCommands = [createSubpageAt, linkPageAt, createPageInAt];
