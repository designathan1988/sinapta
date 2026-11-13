// The search's filters, as Notion's: they stay set while the search is
// closed, until they are changed or taken away.
import { defineCommand, type SearchFilters } from "../../state/index.ts";

export const setSearchFilters = defineCommand<{ filters: SearchFilters }>({
  type: "search.setFilters",
  handle: (state, command) => ({
    ui: { ...state.ui, searchFilters: command.filters },
  }),
});

export const searchFilterCommands = [setSearchFilters];
