import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../state/index.ts";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import {
  deleteRows,
  duplicateRows,
  moveRow,
  selectRows,
  selectRowsCopySize,
  setRowValues,
} from "./row-bulk.commands.ts";
import { selectRowRange } from "./row-selection.selectors.ts";
import { setFrozenCount, toggleWrapped } from "./table-layout.commands.ts";
import { selectTableModel } from "./table-model.selectors.ts";

function createApp() {
  return createDatabaseApp(
    [{ name: "Notes", type: "text" }],
    [
      ["a", "1"],
      ["b", "2"],
      ["c", "3"],
      ["d", "4"],
    ],
  );
}

function modelOf(app: DatabaseApp) {
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return model;
}

function titles(app: DatabaseApp): string[] {
  return modelOf(app).rows.map((row) => row.title);
}

function id(app: DatabaseApp, index: number) {
  const found = app.rowIds[index];
  if (found === undefined) throw new Error("no row");
  return found;
}

function ids(app: DatabaseApp, ...indexes: number[]) {
  return indexes.map((index) => id(app, index));
}

function notesOf(app: DatabaseApp) {
  const [notes] = app.propertyIds;
  if (notes === undefined) throw new Error("no property");
  return notes;
}

describe("bulk row commands", () => {
  it("sets a value on every selected row in one undo step", () => {
    const app = createApp();
    const notes = notesOf(app);
    const rowIds = ids(app, 0, 2);
    const steps = app.store.getState().history.undo.length;

    app.dispatch(
      setRowValues.create({ rowIds, propertyId: notes, value: "x" }),
    );

    const values = () => modelOf(app).rows.map((row) => row.values[notes]);
    expect(values()).toEqual(["x", "2", "x", "4"]);
    expect(app.store.getState().history.undo).toHaveLength(steps + 1);
    app.dispatch({ type: UNDO_COMMAND });
    expect(values()).toEqual(["1", "2", "3", "4"]);
  });

  it("moves selected rows to the trash and clears the selection", () => {
    const app = createApp();
    const rowIds = ids(app, 1, 3);
    app.dispatch(selectRows.create({ rowIds }));

    app.dispatch(deleteRows.create({ rowIds }));

    expect(titles(app)).toEqual(["a", "c"]);
    expect(app.store.getState().ui.selectedRowIds).toEqual([]);
  });

  it("puts a copy of each row right after it", () => {
    const app = createApp();
    const rowIds = ids(app, 0, 2);

    const size = selectRowsCopySize(app.store.getState(), rowIds);
    app.dispatch(duplicateRows.create({ rowIds, ...size }));

    expect(titles(app)).toEqual(["a", "a (copy)", "b", "c", "c (copy)", "d"]);
  });

  it("moves a row before another, or to the end", () => {
    const app = createApp();

    app.dispatch(
      moveRow.create({ rowId: id(app, 3), beforeRowId: id(app, 0) }),
    );
    expect(titles(app)).toEqual(["d", "a", "b", "c"]);

    app.dispatch(moveRow.create({ rowId: id(app, 0), beforeRowId: null }));
    expect(titles(app)).toEqual(["d", "b", "c", "a"]);
  });

  it("selects the rows between two rows in the order shown", () => {
    const app = createApp();
    const range = selectRowRange(modelOf(app), id(app, 3), id(app, 1));

    expect(range).toEqual(ids(app, 1, 2, 3));
  });
});

describe("table layout of a view", () => {
  it("wraps a column's text and unwraps it", () => {
    const app = createApp();
    const notes = notesOf(app);
    const viewId = app.view().id;

    app.dispatch(toggleWrapped.create({ viewId, propertyId: notes }));
    expect(app.view().wrappedPropertyIds).toEqual([notes]);
    app.dispatch(toggleWrapped.create({ viewId, propertyId: notes }));
    expect(app.view().wrappedPropertyIds).toEqual([]);
  });

  it("freezes columns from the start, no more than the table has", () => {
    const app = createApp();
    const viewId = app.view().id;

    app.dispatch(setFrozenCount.create({ viewId, count: 2 }));
    expect(app.view().frozenCount).toBe(2);
    app.dispatch(setFrozenCount.create({ viewId, count: 9 }));
    expect(app.view().frozenCount).toBe(2);
  });
});
