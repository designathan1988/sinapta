// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { renderTable } from "./table.view.ts";

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
  const state = app.store.getState();
  const model = selectTableModel(state, app.databaseId);
  if (model !== undefined)
    render(renderTable({ state, dispatch, model }), container);
  const cell = (row: number, column: number): HTMLElement =>
    container
      .querySelectorAll("tr.database__row")
      .item(row)
      .querySelectorAll<HTMLElement>("td[data-cell]")
      .item(column);
  return { commands, cell };
}

// A clipboard event with its data, as the browser sends it.
function clip(type: "copy" | "paste", text = ""): ClipboardEvent {
  const data = new DataTransfer();
  data.setData("text/plain", text);
  const event = new ClipboardEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: data });
  return event;
}

describe("copying and pasting a cell, as Notion's", () => {
  it("copies a cell's value as text", () => {
    const { cell } = mount();
    const event = clip("copy");

    cell(0, 1).dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(event.clipboardData?.getData("text/plain")).toBe("1");
  });

  it("pastes text into a cell as its property's type", () => {
    const { cell, commands } = mount();

    cell(1, 1).dispatchEvent(clip("paste", "7"));

    expect(commands).toContainEqual(
      expect.objectContaining({ type: "row.setValue", value: 7 }),
    );
  });

  it("pastes into a name", () => {
    const { cell, commands } = mount();

    cell(1, 0).dispatchEvent(clip("paste", "Renamed"));

    expect(commands).toContainEqual(
      expect.objectContaining({ type: "page.rename", title: "Renamed" }),
    );
  });
});
