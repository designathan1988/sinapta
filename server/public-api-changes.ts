// The changes a program makes through the public API (ADR-0013), as the
// operations the server logs for it: a new page, blocks appended, a page
// renamed or moved to the trash. Each is signed with the integration.
import { randomUUID } from "node:crypto";
import {
  parseBlockId,
  type Block,
  type BlockId,
  type Operation,
} from "../src/model/index.ts";
import { blockIn, titleIn } from "./notion-input.schema.ts";

export interface Author {
  readonly id: string;
  readonly name: string;
}

function newId(): BlockId {
  const id = parseBlockId(randomUUID());
  if (id === undefined) throw new Error("no id");
  return id;
}

function append(parent: Block, record: Block, index: number): Operation[] {
  return [
    { type: "record.create", kind: "block", record },
    {
      type: "list.insert",
      list: { kind: "childIds", blockId: parent.id },
      id: record.id,
      index,
    },
  ];
}

// The blocks a program appends under a block, in order; those of a type
// Pagecraft does not take are left out.
export function appended(
  parent: Block,
  children: readonly unknown[],
  by: { readonly author: Author; readonly now: string },
): { readonly blocks: Block[]; readonly operations: Operation[] } {
  const blocks: Block[] = [];
  const operations: Operation[] = [];
  for (const child of children) {
    const placing = {
      id: newId(),
      parentId: parent.id,
      now: by.now,
      by: by.author,
    };
    const block = blockIn(child, placing);
    if (block === undefined) continue;
    operations.push(
      ...append(parent, block, parent.childIds.length + blocks.length),
    );
    blocks.push(block);
  }
  return { blocks, operations };
}

export function newPage(
  parent: Block,
  properties: unknown,
  by: { readonly author: Author; readonly now: string },
): Block {
  return {
    id: newId(),
    type: "page",
    parentId: parent.id,
    childIds: [],
    props: {
      title: titleIn(properties),
      icon: null,
      isFavorite: false,
      isTrashed: false,
    },
    createdAt: by.now,
    updatedAt: by.now,
    createdBy: by.author,
    editedBy: by.author,
  };
}

export function pageCreation(parent: Block, page: Block): Operation[] {
  return append(parent, page, parent.childIds.length);
}

// A page's new title, or its move to the trash or out of it.
export function pageUpdate(
  page: Block,
  change: {
    readonly title?: readonly object[];
    readonly isTrashed?: boolean;
  },
  by: { readonly author: Author; readonly now: string },
): Operation {
  const props = {
    ...page.props,
    ...(change.title !== undefined && { title: change.title }),
    ...(change.isTrashed !== undefined && { isTrashed: change.isTrashed }),
  };
  const { id, ...rest } = page;
  const patch = { ...rest, props, updatedAt: by.now, editedBy: by.author };
  return { type: "record.update", kind: "block", id, patch };
}
