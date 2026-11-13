// What the search's filters let through, and how their chips read, as
// Notion's: the pages it looks in, with their subpages, and the days a
// page was created or last edited.
import {
  isPageLike,
  selectPage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type {
  AppState,
  SearchDateFilter,
  SearchFilters,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectPageLastEdit } from "../page-info/index.ts";
import {
  selectPagePath,
  titleOf,
} from "./command-palette-preview.selectors.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const TEXT = COPY.palette;

// How many days back each preset reaches, today included.
const PRESET_DAYS = { today: 1, week: 7, month: 30 } as const;

// The local day of a time, "2026-11-13".
function dayOf(time: number): string {
  return new Date(time).toLocaleDateString("en-CA");
}

// True when a filter would narrow the search.
export function hasSearchFilters(filters: SearchFilters): boolean {
  return (
    filters.inPageIds.length > 0 ||
    (filters.date !== null && filters.date.range !== null)
  );
}

// The first and last day a date filter lets through.
export function dateBounds(
  date: SearchDateFilter,
  today: string,
): { readonly from: string; readonly to: string } | undefined {
  const { range } = date;
  if (range === null) return undefined;
  if (range.kind === "days") return { from: range.from, to: range.to };
  const back = PRESET_DAYS[range.kind] - 1;
  const from = dayOf(Date.parse(`${today}T12:00:00`) - back * DAY_MS);
  return { from, to: today };
}

// True when the page or one of the pages it is in was chosen.
function isInPages(
  state: AppState,
  page: PageBlock,
  ids: readonly BlockId[],
): boolean {
  if (ids.length === 0) return true;
  let id: BlockId | null = page.id;
  while (id !== null) {
    if (ids.includes(id)) return true;
    id = state.workspace.blocks[id]?.parentId ?? null;
  }
  return false;
}

function isInDays(
  state: AppState,
  page: PageBlock,
  context: { readonly filters: SearchFilters; readonly today: string },
): boolean {
  const { date } = context.filters;
  const bounds = date === null ? undefined : dateBounds(date, context.today);
  if (date === null || bounds === undefined) return true;
  const time =
    date.field === "edited"
      ? selectPageLastEdit(state, page.id)
      : Date.parse(page.createdAt);
  const day = dayOf(time);
  return day >= bounds.from && day <= bounds.to;
}

// True when the filters let the page through.
export function selectPassesFilters(
  state: AppState,
  page: PageBlock,
  context: { readonly filters: SearchFilters; readonly today: string },
): boolean {
  return (
    isInPages(state, page, context.filters.inPageIds) &&
    isInDays(state, page, context)
  );
}

// "In page", or "In page: Budget, Salary" once pages are chosen.
export function selectInPageLabel(
  state: AppState,
  filters: SearchFilters,
): string {
  const names = filters.inPageIds.flatMap((id) => {
    const page = selectPage(state, id);
    return page === undefined ? [] : [titleOf(page)];
  });
  return names.length === 0
    ? TEXT.inPage
    : `${TEXT.inPage}: ${names.join(", ")}`;
}

// "Date", or the field and the days it lets through.
export function dateLabel(date: SearchDateFilter): string {
  const { range } = date;
  if (range === null) return TEXT.date;
  const field = TEXT.dateFields[date.field];
  if (range.kind !== "days") return `${field}: ${TEXT.datePresets[range.kind]}`;
  const days =
    range.from === range.to ? range.from : `${range.from} → ${range.to}`;
  return `${field}: ${days}`;
}

export interface PageChoice {
  readonly id: BlockId;
  readonly title: string;
  // The pages it is in, "Budget / Income"; empty at the top.
  readonly path: string;
}

// The pages "In page" offers: every page and row out of the trash that is
// not chosen yet, by title.
export function selectPageChoices(
  state: AppState,
  chosen: readonly BlockId[],
): PageChoice[] {
  return Object.values(state.workspace.blocks)
    .flatMap((block) =>
      isPageLike(block) && !block.props.isTrashed && !chosen.includes(block.id)
        ? [
            {
              id: block.id,
              title: titleOf(block),
              path: selectPagePath(state, block),
            },
          ]
        : [],
    )
    .sort((a, b) => a.title.localeCompare(b.title, "en-US"));
}
