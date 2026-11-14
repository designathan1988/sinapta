// The inbox, as Notion's: the reminders that are due, from date mentions
// set to remind and from rows' dates set to remind, newest first, each
// with its page and whether it was read.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { selectDatabase } from "../../blocks/database/index.ts";
import { readDateValue, reminderDay } from "../database/index.ts";
import {
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Block, BlockId, Workspace } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectNotices } from "./inbox-notices.selectors.ts";

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

function titleOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

// A row's dates set to remind: each falls due on the day it names, and
// opens the row; its text is the date property's name.
function rowReminders(
  state: AppState,
  block: Block,
  read: ReadonlySet<string>,
): Reminder[] {
  if (!isPageLike(block) || selectIsInTrash(state, block)) return [];
  const database = selectDatabase(state, block.parentId);
  const values = block.props.values ?? {};
  return (database?.props.properties ?? []).flatMap((property) => {
    const value = readDateValue(values[property.id]);
    const date = value === undefined ? undefined : reminderDay(value);
    if (property.type !== "date" || date === undefined) return [];
    const key = `${block.id}:${property.id}:${date}`;
    const pageTitle = titleOf(block);
    const isRead = read.has(key);
    return [
      {
        key,
        blockId: block.id,
        pageId: block.id,
        pageTitle,
        date,
        text: property.name,
        isRead,
      },
    ];
  });
}

// Every reminder in the workspace, due or not.
export function selectAllReminders(state: AppState): Reminder[] {
  const read = new Set(state.ui.readReminders);
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (!isTextBlock(block)) return rowReminders(state, block, read);
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
  return [...selectAllReminders(state), ...selectNotices(state)]
    .filter((item) => item.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function selectUnreadCount(state: AppState, today: string): number {
  return selectReminders(state, today).filter((item) => !item.isRead).length;
}
