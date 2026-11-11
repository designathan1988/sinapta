import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../../../state/index.ts";
import { setCardOptions } from "../../card.commands.ts";
import { createDatabaseApp, type DatabaseApp } from "../../database-builder.ts";
import { setViewGroupBy } from "../../group.commands.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewType } from "../../view-layout.commands.ts";
import { moveCard } from "./board-card.commands.ts";
import { selectBoardColumns } from "./board.selectors.ts";

const STAGE = {
  name: "Stage",
  type: "select",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

function createBoard(): DatabaseApp {
  const app = createDatabaseApp(
    [STAGE],
    [
      ["a", "todo"],
      ["b", "todo"],
      ["c", "done"],
    ],
  );
  app.dispatch(
    setViewType.create({ viewId: app.view().id, viewType: "board" }),
  );
  return app;
}

function columns(app: DatabaseApp) {
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return (selectBoardColumns(model) ?? []).map((column) => [
    column.label,
    column.rows.map((row) => row.title),
  ]);
}

function row(app: DatabaseApp, index: number) {
  const id = app.rowIds[index];
  if (id === undefined) throw new Error("no row");
  return id;
}

describe("moving cards", () => {
  it("moves a card into another column at a place, in one undo step", () => {
    const app = createBoard();
    const [stage] = app.propertyIds;
    if (stage === undefined) throw new Error("no property");
    const steps = app.store.getState().history.undo.length;

    app.dispatch(
      moveCard.create({
        rowId: row(app, 2),
        beforeRowId: row(app, 1),
        change: { propertyId: stage, value: "todo" },
      }),
    );

    expect(columns(app)).toEqual([
      ["No Stage", []],
      ["Todo", ["a", "c", "b"]],
      ["Done", []],
    ]);
    expect(app.store.getState().history.undo).toHaveLength(steps + 1);
    app.dispatch({ type: UNDO_COMMAND });
    expect(columns(app)[2]).toEqual(["Done", ["c"]]);
  });

  it("reorders a card within its column", () => {
    const app = createBoard();

    app.dispatch(
      moveCard.create({
        rowId: row(app, 1),
        beforeRowId: row(app, 0),
        change: null,
      }),
    );

    expect(columns(app)[1]).toEqual(["Todo", ["b", "a"]]);
  });
});

describe("board columns of other types", () => {
  it("groups by a checkbox and by a date's month", () => {
    const app = createDatabaseApp(
      [
        { name: "Done", type: "checkbox" },
        { name: "Due", type: "date" },
      ],
      [
        ["a", true, { start: "2026-11-02" }],
        ["b", undefined, { start: "2026-12-24" }],
      ],
    );
    const viewId = app.view().id;
    const [done, due] = app.propertyIds;
    if (done === undefined || due === undefined) throw new Error("setup");
    app.dispatch(setViewType.create({ viewId, viewType: "board" }));

    app.dispatch(setViewGroupBy.create({ viewId, propertyId: done }));
    expect(columns(app)).toEqual([
      ["Checked", ["a"]],
      ["Unchecked", ["b"]],
    ]);

    app.dispatch(setViewGroupBy.create({ viewId, propertyId: due }));
    expect(columns(app)).toEqual([
      ["November 2026", ["a"]],
      ["December 2026", ["b"]],
    ]);
  });
});

describe("card options", () => {
  it("sizes the cards, chooses their picture and tints the columns", () => {
    const app = createBoard();
    const viewId = app.view().id;

    app.dispatch(
      setCardOptions.create({
        viewId,
        options: {
          cardSize: "large",
          cardPreview: "none",
          colorColumns: false,
        },
      }),
    );

    expect(app.view()).toMatchObject({
      cardSize: "large",
      cardPreview: "none",
      colorColumns: false,
    });
  });
});
