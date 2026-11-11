import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  plainText,
  toBlockId,
  type RichText,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  insertTableColumn,
  insertTableRow,
  removeTableColumn,
  removeTableRow,
  setTableCell,
  simpleTableCommands,
  toggleTableHeader,
} from "./simple-table.commands.ts";

const TABLE = toBlockId("t");

function cell(text: string): RichText {
  return text === "" ? [] : [{ text }];
}

function createApp(
  rows: string[][] = [
    ["a", "b"],
    ["c", "d"],
  ],
) {
  const props = {
    rows: rows.map((row) => row.map(cell)),
    hasHeaderRow: false,
    hasHeaderColumn: false,
  };
  const workspace = buildWorkspace([
    { id: "page", children: [{ id: "t", type: "simple-table", props }] },
  ]);
  const app = createTestApp({ workspace, commands: simpleTableCommands });
  const props_ = () => app.store.getState().workspace.blocks[TABLE]?.props;
  const grid = (): string[][] => {
    const value = props_()?.rows;
    return Array.isArray(value)
      ? value.map((row: RichText[]) => row.map(plainText))
      : [];
  };
  return { ...app, grid, props: props_ };
}

describe("simple table commands", () => {
  it("set a cell's text", () => {
    const { dispatch, grid } = createApp();

    dispatch(
      setTableCell.create({ blockId: TABLE, row: 1, column: 0, text: "x" }),
    );

    expect(grid()).toEqual([
      ["a", "b"],
      ["x", "d"],
    ]);
  });

  it("insert a row and a column and keep a rectangle", () => {
    const { dispatch, grid } = createApp();

    dispatch(insertTableRow.create({ blockId: TABLE, index: 1 }));
    dispatch(insertTableColumn.create({ blockId: TABLE, index: 2 }));

    expect(grid()).toEqual([
      ["a", "b", ""],
      ["", "", ""],
      ["c", "d", ""],
    ]);
  });

  it("remove a row and a column and keep a rectangle", () => {
    const { dispatch, grid } = createApp([
      ["a", "b", "c"],
      ["d", "e", "f"],
    ]);

    dispatch(removeTableRow.create({ blockId: TABLE, index: 0 }));
    dispatch(removeTableColumn.create({ blockId: TABLE, index: 1 }));

    expect(grid()).toEqual([["d", "f"]]);
  });

  it("keep the last row and the last column", () => {
    const { dispatch, grid } = createApp([["a"]]);

    dispatch(removeTableRow.create({ blockId: TABLE, index: 0 }));
    dispatch(removeTableColumn.create({ blockId: TABLE, index: 0 }));

    expect(grid()).toEqual([["a"]]);
  });

  it("turn the header row and the header column on and off", () => {
    const { dispatch, props } = createApp();

    dispatch(toggleTableHeader.create({ blockId: TABLE, axis: "row" }));
    dispatch(toggleTableHeader.create({ blockId: TABLE, axis: "column" }));
    dispatch(toggleTableHeader.create({ blockId: TABLE, axis: "column" }));

    expect(props()).toMatchObject({
      hasHeaderRow: true,
      hasHeaderColumn: false,
    });
  });

  it("undo typing in one cell in one step", () => {
    const { dispatch, grid } = createApp();
    for (const text of ["x", "xy", "xyz"]) {
      dispatch(
        setTableCell.create({ blockId: TABLE, row: 0, column: 0, text }),
      );
    }

    dispatch({ type: "history.undo" });

    expect(grid()[0]).toEqual(["a", "b"]);
  });
});
