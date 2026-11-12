// The inbox, as Notion's: the reminders that are due, from date mentions
// set to remind, newest first, each with its page and whether it was read.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Block, BlockId, Workspace } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

export interface Reminder {
  readonly key: string;
  readonly blockId: BlockId;
  readonly pageId: BlockId;
  readonly pageTitle: string;
  // The day it is for, as "2026-11-11".
  readonly date: string;
  readonly text: string;
  readonly isRead: boolean;
}

function pageOf(workspace: Workspace, block: Block): PageBlock | undefined {
  let id = block.parentId;
  while (id !== null) {
    const parent = workspace.blocks[id];
    if (parent === undefined) return undefined;
    if (isPageLike(parent)) return parent;
    id = parent.parentId;
  }
  return undefined;
}

// Every reminder in the workspace, due or not.
export function selectAllReminders(state: AppState): Reminder[] {
  const read = new Set(state.ui.readReminders);
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (!isTextBlock(block)) return [];
    const page = pageOf(state.workspace, block);
    if (page === undefined || selectIsInTrash(state, page)) return [];
    const title = selectPageTitle(page);
    return block.props.text.flatMap((span): Reminder[] => {
      const { mention } = span;
      if (mention?.kind !== "date" || mention.isReminder !== true) return [];
      const key = `${block.id}:${mention.date}`;
      return [
        {
          key,
          blockId: block.id,
          pageId: page.id,
          pageTitle: title === "" ? COPY.sidebar.untitled : title,
          date: mention.date,
          text: textOf(block),
          isRead: read.has(key),
        },
      ];
    });
  });
}

// The reminders due by today, newest first.
export function selectReminders(state: AppState, today: string): Reminder[] {
  return selectAllReminders(state)
    .filter((item) => item.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function selectUnreadCount(state: AppState, today: string): number {
  return selectReminders(state, today).filter((item) => !item.isRead).length;
}
