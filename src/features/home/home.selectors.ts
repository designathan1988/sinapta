// What Home shows: the pages opened lately and the dates coming up in the
// next week, from every date property of every database.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  DATABASE_TYPE,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

const DAY_MS = 86_400_000;
const UPCOMING_DAYS = 7;

export function selectRecentPages(state: AppState): PageBlock[] {
  return state.ui.recentPageIds.flatMap((id) => {
    const page = selectPage(state, id);
    return page === undefined || page.props.isTrashed ? [] : [page];
  });
}

export interface UpcomingDate {
  readonly pageId: BlockId;
  readonly title: string;
  // A day as "2026-11-11".
  readonly date: string;
  readonly propertyName: string;
}

function dayAfter(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function datesOfDatabase(state: AppState, databaseId: BlockId): UpcomingDate[] {
  const database = selectDatabase(state, databaseId);
  if (database === undefined || database.props.isTrashed) return [];
  const dateProperties = database.props.properties.filter(
    (property) => property.type === "date",
  );
  return database.childIds.flatMap((rowId) => {
    const row = selectPage(state, rowId);
    if (row === undefined || row.props.isTrashed) return [];
    return dateProperties.flatMap((property) => {
      const value = row.props.values?.[property.id];
      if (typeof value !== "string") return [];
      const title = selectPageTitle(row);
      return [
        { pageId: row.id, title, date: value, propertyName: property.name },
      ];
    });
  });
}

// Dates from today to a week ahead, soonest first.
export function selectUpcoming(state: AppState, today: string): UpcomingDate[] {
  const last = dayAfter(today, UPCOMING_DAYS);
  const databaseIds = Object.values(state.workspace.blocks)
    .filter((block) => block.type === DATABASE_TYPE)
    .map((block) => block.id);
  return databaseIds
    .flatMap((id) => datesOfDatabase(state, id))
    .filter((item) => item.date >= today && item.date <= last)
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
    );
}
