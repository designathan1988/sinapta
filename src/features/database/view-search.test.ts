import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { setViewSearch } from "./view-search.commands.ts";
import { selectSearchedModel } from "./view-search.selectors.ts";

function createApp() {
  return createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [{ id: "o-1", name: "Shipping", color: "blue" }],
      },
      { name: "Notes", type: "text" },
    ],
    [["Launch plan", undefined, "café menu"], ["Budget", "o-1"], ["Hiring"]],
  );
}

function titles(app: ReturnType<typeof createApp>): string[] {
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return selectSearchedModel(app.store.getState(), model).rows.map(
    (row) => row.title,
  );
}

describe("searching a view", () => {
  it("shows every row while the search is empty", () => {
    expect(titles(createApp())).toEqual(["Launch plan", "Budget", "Hiring"]);
  });

  it("keeps rows whose title or shown values match, without regard to case or accents in the query's form", () => {
    const app = createApp();
    const viewId = app.view().id;

    app.dispatch(setViewSearch.create({ viewId, query: "SHIP" }));
    expect(titles(app)).toEqual(["Budget"]);

    app.dispatch(setViewSearch.create({ viewId, query: "café" }));
    expect(titles(app)).toEqual(["Launch plan"]);

    app.dispatch(setViewSearch.create({ viewId, query: "hir" }));
    expect(titles(app)).toEqual(["Hiring"]);
  });

  it("is interface state: it is not recorded for undo", () => {
    const app = createApp();
    const undoSteps = app.store.getState().history.undo.length;

    app.dispatch(setViewSearch.create({ viewId: app.view().id, query: "x" }));

    expect(app.store.getState().history.undo).toHaveLength(undoSteps);
    expect(app.store.getState().ui.viewSearches[app.view().id]).toBe("x");
  });
});
