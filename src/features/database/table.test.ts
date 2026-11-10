import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { addOption, setActiveCell, tableCommands } from "./table.commands.ts";
import {
  selectCellNeighbor,
  selectColumnDrop,
  selectRowWindow,
  WINDOW_SIZE,
} from "./table.selectors.ts";

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Stage", type: "select" },
    ],
    [
      ["A", 1],
      ["B", 2],
      ["C", 3],
    ],
  );
  const model = () => {
    const found = selectTableModel(app.store.getState(), app.databaseId);
    if (found === undefined) throw new Error("no model");
    return found;
  };
  return { ...app, model };
}

describe("selectCellNeighbor", () => {
  it("moves right from the title to the first property and down a row", () => {
    const { model, rowIds, propertyIds } = createApp();
    const rowId = rowIds[0];
    if (rowId === undefined) throw new Error("setup");
    const cell = { rowId, propertyId: null, isEditing: false };

    const right = selectCellNeighbor(model(), cell, "right");
    const down = selectCellNeighbor(model(), right, "down");

    expect(right).toEqual({
      rowId: rowIds[0],
      propertyId: propertyIds[0],
      isEditing: false,
    });
    expect(down).toEqual({
      rowId: rowIds[1],
      propertyId: propertyIds[0],
      isEditing: false,
    });
  });

  it("stays in place at the edges of the table", () => {
    const { model, rowIds } = createApp();
    const rowId = rowIds[0];
    if (rowId === undefined) throw new Error("setup");
    const cell = { rowId, propertyId: null, isEditing: false };

    expect(selectCellNeighbor(model(), cell, "up")).toEqual(cell);
    expect(selectCellNeighbor(model(), cell, "left")).toEqual(cell);
  });
});

describe("selectRowWindow", () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: toBlockId(`r${String(index)}`),
      title: String(index),
      values: {},
    }));

  it("shows every row of a short table", () => {
    const window = selectRowWindow(rows(200), 50);

    expect(window).toMatchObject({ before: 0, after: 0, start: 0 });
    expect(window.rows).toHaveLength(200);
  });

  it("shows a window around the first visible row of a long table", () => {
    const window = selectRowWindow(rows(5000), 1000);

    expect(window.rows).toHaveLength(WINDOW_SIZE);
    expect(window.before).toBe(985);
    expect(window.before + window.rows.length + window.after).toBe(5000);
  });

  it("keeps the window inside the table at its end", () => {
    const window = selectRowWindow(rows(5000), 99999);

    expect(window.after).toBe(0);
    expect(window.rows).toHaveLength(WINDOW_SIZE);
  });
});

describe("table commands", () => {
  it("adds options to a select property with different colors", () => {
    const app = createApp();
    const propertyId = app.propertyIds[1];
    if (propertyId === undefined) throw new Error("setup");
    const { store, databaseId } = app;
    const { dispatch } = app;

    dispatch(addOption.create({ databaseId, propertyId, name: " Todo " }));
    dispatch(addOption.create({ databaseId, propertyId, name: "Done" }));
    dispatch(addOption.create({ databaseId, propertyId, name: "  " }));

    const options = app.database().props.properties[1]?.options ?? [];
    expect(options.map((option) => option.name)).toEqual(["Todo", "Done"]);
    expect(new Set(options.map((option) => option.color)).size).toBe(2);
    expect(store.getState().history.undo.length).toBeGreaterThan(0);
  });

  it("is registered with the commands of the table", () => {
    expect(tableCommands).toContain(setActiveCell);
  });
});

describe("selectColumnDrop", () => {
  it("moves a column to the other side of the one it is dropped on", () => {
    const { model, propertyIds } = createApp();
    const [points, stage] = propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");

    const order = selectColumnDrop(model(), {
      sourceId: points,
      targetId: stage,
      position: "after",
    });

    expect(order).toEqual([stage, points]);
  });

  it("puts a column dropped on the title right after the title", () => {
    const { model, propertyIds } = createApp();
    const [points, stage] = propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");

    const order = selectColumnDrop(model(), {
      sourceId: stage,
      targetId: "title",
      position: "before",
    });

    expect(order).toEqual([stage, points]);
  });

  it("reports nothing when the drop leaves the order as it was", () => {
    const { model, propertyIds } = createApp();
    const [points, stage] = propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");
    const drop = { targetId: stage, position: "before" } as const;

    const same = selectColumnDrop(model(), { ...drop, sourceId: points });
    const title = selectColumnDrop(model(), { ...drop, sourceId: "title" });

    expect(same).toBe(undefined);
    expect(title).toBe(undefined);
  });
});
