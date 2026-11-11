import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow } from "./row.commands.ts";
import { setViewDateProperty, setViewType } from "./view-layout.commands.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { createView } from "./view.commands.ts";

function createApp() {
  const app = createDatabaseApp(
    [
      {
        name: "Status",
        type: "select",
        options: [
          { id: "o-1", name: "Todo", color: "gray" },
          { id: "o-2", name: "Done", color: "green" },
        ],
      },
      { name: "Due", type: "date" },
      {
        name: "Stage",
        type: "select",
        options: [{ id: "o-3", name: "A", color: "blue" }],
      },
    ],
    [["One", undefined, { start: "2026-11-10" }]],
  );
  return app;
}

describe("view.setType", () => {
  it("turns a table into a board grouped by the first select property", () => {
    const app = createApp();
    const status = app.propertyIds[0];

    app.dispatch(
      setViewType.create({ viewId: app.view().id, viewType: "board" }),
    );

    expect(app.view()).toMatchObject({
      type: "board",
      groupBy: { propertyId: status },
    });
  });

  it("turns a view into a calendar placed by the first date property", () => {
    const app = createApp();

    app.dispatch(
      setViewType.create({ viewId: app.view().id, viewType: "calendar" }),
    );

    expect(app.view()).toMatchObject({
      type: "calendar",
      datePropertyId: app.propertyIds[1],
    });
  });
});

describe("view.setGroupBy and view.setDateProperty", () => {
  it("groups by another property, and places rows by a date property only", () => {
    const app = createApp();
    const viewId = app.view().id;
    const [status, due, stage] = app.propertyIds;
    if (status === undefined || due === undefined || stage === undefined)
      throw new Error("missing property");

    app.dispatch(setViewGroupBy.create({ viewId, propertyId: stage }));
    expect(app.view().groupBy?.propertyId).toBe(stage);

    app.dispatch(setViewDateProperty.create({ viewId, propertyId: due }));
    app.dispatch(setViewDateProperty.create({ viewId, propertyId: stage }));
    expect(app.view().datePropertyId).toBe(due);
  });
});

describe("view.create with a layout", () => {
  it("creates a board view with its defaults", () => {
    const app = createApp();

    app.dispatch(
      createView.create({
        databaseId: app.databaseId,
        name: "Board",
        viewType: "board",
      }),
    );

    const viewId = app.database().props.viewIds[1];
    const view =
      viewId === undefined
        ? undefined
        : app.store.getState().workspace.views[viewId];
    expect(view).toMatchObject({
      type: "board",
      groupBy: { propertyId: app.propertyIds[0] },
    });
  });
});

describe("row.add with values", () => {
  it("starts the row with the given values and opens it as a page", () => {
    const app = createApp();
    const status = app.propertyIds[0];
    if (status === undefined) throw new Error("missing property");

    app.dispatch(
      addRow.create({
        databaseId: app.databaseId,
        values: { [status]: "o-1" },
        opensPage: true,
      }),
    );

    const rowId = app.database().childIds.at(-1);
    const row =
      rowId === undefined
        ? undefined
        : app.store.getState().workspace.blocks[rowId];
    expect(row?.props.values).toEqual({ [status]: "o-1" });
    expect(app.store.getState().ui.activePageId).toBe(rowId);
  });
});
