import { describe, expect, it } from "vitest";
import { selectPage } from "../../../../blocks/page/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { setViewGroupBy } from "../../group.commands.ts";
import {
  setViewSubGroupBy,
  toggleSubGroupCollapsed,
} from "../../sub-group.commands.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewType } from "../../view-layout.commands.ts";
import { moveCard } from "./board-card.commands.ts";
import { selectBoardLanes } from "./board.selectors.ts";

// A board by Status, in lanes by Owner.
function createLanes() {
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
      {
        name: "Owner",
        type: "select",
        options: [
          { id: "ana", name: "Ana", color: "blue" },
          { id: "bo", name: "Bo", color: "red" },
        ],
      },
    ],
    [
      ["A", "todo", "ana"],
      ["B", "done", "ana"],
      ["C", "todo", "bo"],
    ],
  );
  const viewId = app.view().id;
  const [statusId, ownerId] = app.propertyIds;
  if (statusId === undefined || ownerId === undefined) throw new Error("setup");
  app.dispatch(setViewType.create({ viewId, viewType: "board" }));
  app.dispatch(setViewGroupBy.create({ viewId, propertyId: statusId }));
  app.dispatch(setViewSubGroupBy.create({ viewId, propertyId: ownerId }));
  const lanes = () => {
    const model = selectTableModel(app.store.getState(), app.databaseId);
    return model === undefined ? undefined : selectBoardLanes(model);
  };
  return { ...app, viewId, statusId, ownerId, lanes };
}

const titles = (rows: readonly { readonly title: string }[]) =>
  rows.map((row) => row.title);

describe("board lanes", () => {
  it("puts each sub-group in a lane holding every column", () => {
    const { lanes } = createLanes();

    const ana = lanes()?.lanes.find((lane) => lane.label === "Ana");
    const bo = lanes()?.lanes.find((lane) => lane.label === "Bo");

    expect(ana?.columns.map((column) => titles(column.rows))).toEqual([
      [],
      ["A"],
      ["B"],
    ]);
    expect(bo?.columns.map((column) => titles(column.rows))).toEqual([
      [],
      ["C"],
      [],
    ]);
  });

  it("collapses a lane", () => {
    const { dispatch, viewId, lanes } = createLanes();

    dispatch(toggleSubGroupCollapsed.create({ viewId, key: "bo" }));

    expect(lanes()?.lanes.find((lane) => lane.key === "bo")?.isCollapsed).toBe(
      true,
    );
  });

  it("moves a card into another lane, changing both values in one step", () => {
    const app = createLanes();
    const [, , rowC] = app.rowIds;
    if (rowC === undefined) throw new Error("setup");

    app.dispatch(
      moveCard.create({
        rowId: rowC,
        beforeRowId: null,
        change: { propertyId: app.statusId, value: "done" },
        laneChange: { propertyId: app.ownerId, value: "ana" },
      }),
    );

    const values = selectPage(app.store.getState(), rowC)?.props.values;
    expect(values?.[app.statusId]).toBe("done");
    expect(values?.[app.ownerId]).toBe("ana");
  });

  it("stops sub-grouping", () => {
    const { dispatch, viewId, lanes } = createLanes();

    dispatch(setViewSubGroupBy.create({ viewId, propertyId: null }));

    expect(lanes()).toBeUndefined();
  });
});
