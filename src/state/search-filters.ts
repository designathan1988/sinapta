import type { BlockId } from "../model/index.ts";

// How the search narrows, as Notion's: titles only, the pages it looks
// in (and in their subpages), and the days a page was created or last
// edited, once the date filter is added.
export interface SearchFilters {
  readonly isTitleOnly: boolean;
  readonly inPageIds: readonly BlockId[];
  readonly date: SearchDateFilter | null;
}

export interface SearchDateFilter {
  readonly field: "edited" | "created";
  // Today, the last 7 or 30 days, or the days from one to another,
  // "2026-11-03"; null until one is chosen.
  readonly range:
    | { readonly kind: "today" | "week" | "month" }
    | { readonly kind: "days"; readonly from: string; readonly to: string }
    | null;
}

export const NO_SEARCH_FILTERS: SearchFilters = {
  isTitleOnly: false,
  inPageIds: [],
  date: null,
};
