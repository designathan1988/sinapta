// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { renderTable } from "./table.view.ts";

// Renders the table of a small database and re-renders on every change,
// as the app does, recording what is dispatched.
function mount() {
  const app = createDatabaseApp(
    [{ name: "Points", type: "number" }],
    [
      ["A", 1],
      ["B", 2],
    ],
  );
  const commands: Command[] = [];
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  const dispatch = (command: Command) => {
    commands.push(command);
    return app.dispatch(command);
  };
  const draw = (): void => {
    const state = app.store.getState();
    const model = selectTableModel(state, app.databaseId);
    if (model !== undefined)
      render(renderTable({ state, dispatch, model }), container);
  };
  app.store.subscribe(draw);
  draw();
  const cell = (row: number, column: number): HTMLElement => {
    const rows = container.querySelectorAll("tr.database__row");
    const found = rows
      .item(row)
      .querySelectorAll<HTMLElement>("td[data-cell]")
      .item(column);
    return found;
  };
  const press = (target: Element, key: string): void => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  };
  return { ...app, commands, container, cell, press };
}

function editor(container: Element): HTMLInputElement {
  const input = container.querySelector(".database__input");
  if (!(input instanceof HTMLInputElement)) throw new Error("no editor");
  return input;
}

describe("table keys", () => {
  it("edits a cell with Enter and stores the value once", () => {
    const { commands, container, cell, press, rowIds, propertyIds } = mount();

    press(cell(0, 1), "Enter");
    editor(container).value = "42";
    press(editor(container), "Enter");

    const stored = commands.filter(
      (command) => command.type === "row.setValue",
    );
    expect(stored).toEqual([
      {
        type: "row.setValue",
        rowId: rowIds[0],
        propertyId: propertyIds[0],
        value: 42,
      },
    ]);
    expect(container.querySelector(".database__input")).toBeNull();
  });

  it("keeps the editor open and stores nothing for text that does not fit", () => {
    const { commands, container, cell, press } = mount();

    press(cell(0, 1), "Enter");
    editor(container).value = "abc";
    press(editor(container), "Enter");

    expect(commands.some((command) => command.type === "row.setValue")).toBe(
      false,
    );
    expect(editor(container).getAttribute("aria-invalid")).toBe("true");
  });

  it("cancels with Escape without storing", () => {
    const { commands, container, cell, press } = mount();

    press(cell(0, 1), "Enter");
    editor(container).value = "99";
    press(editor(container), "Escape");

    expect(commands.some((command) => command.type === "row.setValue")).toBe(
      false,
    );
    expect(container.querySelector(".database__input")).toBeNull();
  });

  it("renames the row from the title cell", () => {
    const { commands, container, cell, press, rowIds } = mount();

    press(cell(1, 0), "Enter");
    editor(container).value = "Renamed";
    press(editor(container), "Enter");

    expect(commands).toContainEqual({
      type: "page.rename",
      pageId: rowIds[1],
      title: "Renamed",
    });
  });

  it("moves the active cell with the arrow keys", () => {
    const { store, cell, press, rowIds, propertyIds } = mount();
    cell(0, 0).dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    press(cell(0, 0), "ArrowRight");
    press(cell(0, 1), "ArrowDown");

    expect(store.getState().ui.activeCell).toEqual({
      rowId: rowIds[1],
      propertyId: propertyIds[0],
      isEditing: false,
    });
  });

  it("clears a cell with Delete", () => {
    const { commands, cell, press, rowIds, propertyIds } = mount();

    press(cell(0, 1), "Delete");

    expect(commands).toContainEqual({
      type: "row.setValue",
      rowId: rowIds[0],
      propertyId: propertyIds[0],
      value: undefined,
    });
  });
});
