import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewType } from "../../view-layout.commands.ts";
import {
  selectBoardColumns,
  selectCardMove,
  selectGroupProperty,
} from "./board.selectors.ts";

function createBoard() {
  const app = createDatabaseApp(
    [
      {
        name: "Status",
        type: "select",
        options: [
          { id: "todo", name: "Todo", color: "gray" },
          { id: "done", name: "Done", color: "green" },
        ],
      },
    ],
    [["A", "todo"], ["B", "done"], ["C"], ["D", "gone"]],
  );
  app.dispatch(
    setViewType.create({ viewId: app.view().id, viewType: "board" }),
  );
  const model = () => {
    const found = selectTableModel(app.store.getState(), app.databaseId);
    if (found === undefined) throw new Error("no model");
    return found;
  };
  return { ...app, model };
}

describe("selectBoardColumns", () => {
  it("puts rows without a known option first, then one column per option", () => {
    const { model } = createBoard();

    const columns = selectBoardColumns(model());

    expect(
      columns?.map((column) => [
        column.key,
        column.rows.map((row) => row.title),
      ]),
    ).toEqual([
      ["", ["C", "D"]],
      ["todo", ["A"]],
      ["done", ["B"]],
    ]);
  });

  it("returns nothing for a database with no select property", () => {
    const app = createDatabaseApp([{ name: "Notes", type: "text" }], [["A"]]);
    const model = selectTableModel(app.store.getState(), app.databaseId);
    if (model === undefined) throw new Error("no model");

    expect(selectBoardColumns(model)).toBeUndefined();
  });
});

describe("selectCardMove", () => {
  it("moves a card to the next or previous column, and no further", () => {
    const { model, rowIds } = createBoard();
    const [a, , c] = rowIds;
    if (a === undefined || c === undefined) throw new Error("missing row");
    const columns = selectBoardColumns(model()) ?? [];

    expect(selectCardMove(columns, a, 1)).toBe("done");
    expect(selectCardMove(columns, a, -1)).toBe("");
    expect(selectCardMove(columns, c, -1)).toBeUndefined();
  });
});

describe("selectGroupProperty", () => {
  it("falls back to the first select property when the view has none", () => {
    const app = createDatabaseApp(
      [
        { name: "Notes", type: "text" },
        { name: "Status", type: "select", options: [] },
      ],
      [],
    );
    const model = selectTableModel(app.store.getState(), app.databaseId);
    if (model === undefined) throw new Error("no model");

    expect(selectGroupProperty(model)?.name).toBe("Status");
  });
});
