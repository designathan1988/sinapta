import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type Workspace,
} from "../../model/index.ts";
import {
  createInitialState,
  createTestApp,
  NO_SEARCH_FILTERS,
  type AppState,
  type SearchFilters,
} from "../../state/index.ts";
import { selectPaletteItems } from "./command-palette.selectors.ts";
import {
  searchFilterCommands,
  setSearchFilters,
} from "./search-filters.commands.ts";
import {
  dateBounds,
  dateLabel,
  selectInPageLabel,
} from "./search-filters.selectors.ts";

const TODAY = "2026-11-10";

const page = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});

// Budget holds Income, which holds Salary; Notes stands apart and was
// created in October.
function createState(): AppState {
  const built = buildWorkspace([
    {
      id: "budget",
      props: page("Budget"),
      children: [
        {
          id: "income",
          props: page("Income"),
          children: [{ id: "salary", props: page("Salary") }],
        },
      ],
    },
    { id: "notes", props: page("Notes") },
  ]);
  const notes = built.blocks[toBlockId("notes")];
  if (notes === undefined) throw new Error("setup");
  const old = "2026-10-01T12:00:00.000Z";
  const workspace: Workspace = {
    ...built,
    blocks: {
      ...built.blocks,
      [notes.id]: { ...notes, createdAt: old, updatedAt: old },
    },
  };
  return { ...createInitialState(), workspace };
}

function labels(query: string, change: Partial<SearchFilters>): string[] {
  const filters = { ...NO_SEARCH_FILTERS, ...change };
  return selectPaletteItems(createState(), query, { filters, today: TODAY })
    .map((item) => item.label)
    .sort();
}

describe("the search's filters", () => {
  it("look in the chosen pages and their subpages", () => {
    expect(labels("", { inPageIds: [toBlockId("income")] })).toEqual([
      "Income",
      "Salary",
    ]);
  });

  it("keep the pages created or edited on the chosen days", () => {
    const week = {
      field: "created" as const,
      range: { kind: "week" as const },
    };
    const october = {
      field: "edited" as const,
      range: { kind: "days" as const, from: "2026-10-01", to: "2026-10-02" },
    };

    expect(labels("", { date: week })).toEqual(["Budget", "Income", "Salary"]);
    expect(labels("", { date: october })).toEqual(["Notes"]);
  });

  it("list only pages once set, never the commands", () => {
    const found = labels("e", { inPageIds: [toBlockId("budget")] });

    expect(found).toEqual(["Budget", "Income"]);
  });

  it("let everything through while the date has no days chosen", () => {
    const shown = labels("", { date: { field: "edited", range: null } });

    expect(shown).toContain("New page");
  });

  it("reach back 7 and 30 days, today included", () => {
    const date = (kind: "week" | "month") => ({
      field: "edited" as const,
      range: { kind },
    });

    expect(dateBounds(date("week"), TODAY)).toEqual({
      from: "2026-11-04",
      to: TODAY,
    });
    expect(dateBounds(date("month"), TODAY)?.from).toBe("2026-10-12");
  });

  it("name their chips by what they hold", () => {
    const state = createState();
    const inPage = { ...NO_SEARCH_FILTERS, inPageIds: [toBlockId("budget")] };

    expect(selectInPageLabel(state, NO_SEARCH_FILTERS)).toBe("In page");
    expect(selectInPageLabel(state, inPage)).toBe("In page: Budget");
    expect(dateLabel({ field: "edited", range: null })).toBe("Date");
    expect(dateLabel({ field: "created", range: { kind: "today" } })).toBe(
      "Created: Today",
    );
  });

  it("stay set in the ui state until changed", () => {
    const app = createTestApp({ commands: searchFilterCommands });
    const filters = { ...NO_SEARCH_FILTERS, isTitleOnly: true };

    app.dispatch(setSearchFilters.create({ filters }));

    expect(app.store.getState().ui.searchFilters).toEqual(filters);
  });
});
