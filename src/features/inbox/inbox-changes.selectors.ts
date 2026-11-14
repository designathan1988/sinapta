// The inbox's notices about pages (ADR-0013), as Notion's page updates:
// someone else edited a page this person made, and, for a guest, the
// pages shared with them.
import { isPageLike, type PageBlock } from "../../blocks/page/index.ts";
import {
  parseBlockId,
  type Block,
  type BlockId,
  type Workspace,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { Reminder } from "./inbox.selectors.ts";

// The page itself and the blocks it shows, not the pages inside it.
function ownBlocks(workspace: Workspace, page: Block): Block[] {
  const found: Block[] = [page];
  const visit = (ids: readonly BlockId[]): void => {
    for (const id of ids) {
      const block = workspace.blocks[id];
      if (block === undefined || isPageLike(block)) continue;
      found.push(block);
      visit(block.childIds);
    }
  };
  visit(page.childIds);
  return found;
}

// The newest change another person made on the page.
function lastEditByOthers(
  workspace: Workspace,
  page: Block,
  me: string,
): Block | undefined {
  let latest: Block | undefined;
  for (const block of ownBlocks(workspace, page)) {
    const editor = block.editedBy;
    if (editor === undefined || editor.id === me) continue;
    if (latest === undefined || block.updatedAt > latest.updatedAt) {
      latest = block;
    }
  }
  return latest;
}

export interface NoticeContext {
  readonly me: string;
  readonly read: ReadonlySet<string>;
  readonly titleOf: (page: PageBlock) => string;
}

export function edits(state: AppState, context: NoticeContext): Reminder[] {
  const { me, read, titleOf } = context;
  return Object.values(state.workspace.blocks).flatMap((page): Reminder[] => {
    if (!isPageLike(page) || page.createdBy?.id !== me) return [];
    if (page.props.isTrashed) return [];
    const edit = lastEditByOthers(state.workspace, page, me);
    if (edit?.editedBy === undefined) return [];
    const key = `${page.id}:edit:${edit.updatedAt}`;
    return [
      {
        key,
        blockId: edit.id,
        pageId: page.id,
        pageTitle: titleOf(page),
        date: edit.updatedAt.slice(0, 10),
        text: `${edit.editedBy.name} ${COPY.inbox.edited}`,
        isRead: read.has(key),
        isNotice: true,
      },
    ];
  });
}

// A guest's shared pages, each a notice that it was shared with them.
export function shares(state: AppState, context: NoticeContext): Reminder[] {
  const { read, titleOf } = context;
  return Object.keys(state.persistence.sync.access).flatMap((id) => {
    const blockId = parseBlockId(id);
    const page =
      blockId === undefined ? undefined : state.workspace.blocks[blockId];
    if (page === undefined || !isPageLike(page)) return [];
    const key = `${page.id}:shared`;
    return [
      {
        key,
        blockId: page.id,
        pageId: page.id,
        pageTitle: titleOf(page),
        date: page.updatedAt.slice(0, 10),
        text: COPY.inbox.sharedWithYou,
        isRead: read.has(key),
        isNotice: true,
      },
    ];
  });
}
