// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import type { SimpleTableBlock } from "./simple-table.schema.ts";
import {
  renderSimpleTable,
  SIMPLE_TABLE_MENU,
  tableMenuAnchorId,
} from "./simple-table.view.ts";

const block: SimpleTableBlock = {
  id: toBlockId("t"),
  type: "simple-table",
  parentId: toBlockId("page"),
  childIds: [],
  props: {
    rows: [
      [[{ text: "a" }], [{ text: "b" }]],
      [[{ text: "c" }], []],
    ],
    hasHeaderRow: true,
    hasHeaderColumn: false,
  },
  createdAt: "",
  updatedAt: "",
};

function rendered(state: AppState = createInitialState()) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderSimpleTable(block, dispatch, state), host);
  const cell = (row: number, column: number) => {
    const selector = `[data-row="${String(row)}"][data-column="${String(column)}"]`;
    const element = host.querySelector<HTMLTextAreaElement>(selector);
    if (element === null) throw new Error("no such cell");
    return element;
  };
  return { host, sent, cell };
}

function press(target: Element, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe("renderSimpleTable", () => {
  it("puts what is typed in a cell into the table", () => {
    const { sent, cell } = rendered();
    const target = cell(1, 1);

    target.value = "d";
    target.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "simpleTable.setCell",
        row: 1,
        column: 1,
        text: "d",
      }),
    ]);
  });

  it("adds a row when Tab leaves the last cell", () => {
    const { sent, cell } = rendered();

    const event = press(cell(1, 1), { key: "Tab" });

    expect(event.defaultPrevented).toBe(true);
    expect(sent).toEqual([
      expect.objectContaining({ type: "simpleTable.insertRow", index: 2 }),
    ]);
  });

  it("moves to the next cell with Tab without adding a row", () => {
    const { sent, cell } = rendered();

    press(cell(0, 1), { key: "Tab" });

    expect(sent).toEqual([]);
  });

  it("adds a row when Enter leaves the last row", () => {
    const { sent, cell } = rendered();

    press(cell(1, 0), { key: "Enter" });

    expect(sent).toEqual([
      expect.objectContaining({ type: "simpleTable.insertRow", index: 2 }),
    ]);
  });

  it("opens the cell's menu on a right click", () => {
    const { sent, cell } = rendered();

    cell(0, 1).dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: SIMPLE_TABLE_MENU,
          anchorId: tableMenuAnchorId(block.id, 0, 1),
          point: { x: 0, y: 0 },
        },
      }),
    ]);
  });

  it("deletes the row chosen in the cell's menu", () => {
    const initial = createInitialState();
    const overlay = {
      kind: SIMPLE_TABLE_MENU,
      anchorId: tableMenuAnchorId(block.id, 1, 0),
    };
    const { host, sent } = rendered({
      ...initial,
      ui: { ...initial.ui, overlay },
    });
    const item = [
      ...host.querySelectorAll<HTMLElement>("[role^=menuitem]"),
    ].find((element) => element.textContent.trim() === "Delete row");

    item?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "simpleTable.removeRow", index: 1 }),
    );
  });
});
