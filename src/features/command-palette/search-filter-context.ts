// What the search's filter views share: the state, the dispatcher and
// the filters as they are, and the one way they change.
import type { AppState, Dispatch, SearchFilters } from "../../state/index.ts";
import { setSearchFilters } from "./search-filters.commands.ts";

export interface FilterContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly filters: SearchFilters;
}

export function changeFilters(
  context: FilterContext,
  change: Partial<SearchFilters>,
): void {
  const filters = { ...context.filters, ...change };
  context.dispatch(setSearchFilters.create({ filters }));
}
