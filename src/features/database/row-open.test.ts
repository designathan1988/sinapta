import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { openRow, setOpenMode } from "./row-open.commands.ts";

function createApp() {
  const app = createDatabaseApp([], [["One"], ["Two"]]);
  const rowId = app.rowIds[0];
  if (rowId === undefined) throw new Error("setup");
  return { ...app, rowId, viewId: app.view().id };
}

describe("openRow", () => {
  it("opens a row in side peek, the database staying the open page", () => {
    const app = createApp();
    const page = app.store.getState().ui.activePageId;

    app.dispatch(openRow.create({ rowId: app.rowId, viewId: app.viewId }));

    const { ui } = app.store.getState();
    expect(ui.activePageId).toBe(page);
    expect(ui.peek).toEqual({
      pageId: app.rowId,
      viewId: app.viewId,
      mode: "side",
    });
  });

  it("opens a row as its own page when the view opens pages in full", () => {
    const app = createApp();
    app.dispatch(setOpenMode.create({ viewId: app.viewId, openMode: "full" }));

    app.dispatch(openRow.create({ rowId: app.rowId, viewId: app.viewId }));

    const { ui } = app.store.getState();
    expect(ui.activePageId).toBe(app.rowId);
    expect(ui.peek).toBeNull();
  });
});
