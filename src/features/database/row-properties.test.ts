// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { type Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { SELECT_OVERLAY } from "../../ui/select/index.ts";
import { setRowValue } from "./row.commands.ts";
import { renderRowProperties } from "./row-properties.view.ts";

// Renders the properties of the first row as its page shows them.
function mount(isListOpen = false) {
  const app = createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Done", type: "checkbox" },
      {
        name: "Stage",
        type: "select",
        options: [{ id: "todo", name: "To do", color: "gray" }],
      },
    ],
    [["A", 1]],
  );
  const rowId = app.rowIds[0];
  if (rowId === undefined) throw new Error("setup");
  const commands: Command[] = [];
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  const stage = app.propertyIds[2] ?? "";
  const overlay = isListOpen
    ? { kind: SELECT_OVERLAY, anchorId: `row-${rowId}-${stage}` }
    : null;
  const state = {
    ...app.store.getState(),
    ui: { ...app.store.getState().ui, activePageId: rowId, overlay },
  };
  const dispatch = (command: Command) => {
    commands.push(command);
    return app.dispatch(command);
  };
  render(renderRowProperties(state, dispatch), container);
  const change = (control: Element | null, value: string): void => {
    if (control instanceof HTMLInputElement && control.type === "checkbox")
      control.checked = value === "true";
    else if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLSelectElement
    )
      control.value = value;
    control?.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const values = () => selectPage(app.store.getState(), rowId)?.props.values;
  return { ...app, commands, container, change, values };
}

describe("renderRowProperties", () => {
  it("shows one labeled control per property with the row's value", () => {
    const { container } = mount();

    const names = [...container.querySelectorAll(".database__row-name")];
    const points = container.querySelector<HTMLInputElement>("input");

    expect(names.map((name) => name.textContent.trim())).toEqual([
      "Points",
      "Done",
      "Stage",
    ]);
    expect(points?.value).toBe("1");
  });

  it("stores a changed number", () => {
    const { container, change, values, propertyIds } = mount();

    change(container.querySelector("input"), "42");

    expect(values()?.[propertyIds[0] ?? ""]).toBe(42);
  });

  it("marks text that is not a number and stores nothing", () => {
    const { container, change, commands } = mount();
    const input = container.querySelector("input");

    change(input, "many");

    expect(input?.hasAttribute("aria-invalid")).toBe(true);
    expect(commands).toEqual([]);
  });

  it("stores a checked box and a chosen option", () => {
    const { container, change, values, propertyIds } = mount(true);
    const option = [
      ...container.querySelectorAll<HTMLElement>("[role=option]"),
    ].find((item) => item.textContent.trim() === "To do");

    change(container.querySelector("input[type=checkbox]"), "true");
    option?.click();

    expect(values()).toMatchObject({
      [propertyIds[1] ?? ""]: true,
      [propertyIds[2] ?? ""]: "todo",
    });
  });

  it("clears a value when its field is emptied", () => {
    const { container, change, commands, propertyIds, rowIds } = mount();

    change(container.querySelector("input"), "");

    expect(commands).toEqual([
      expect.objectContaining({
        type: setRowValue.type,
        rowId: rowIds[0],
        propertyId: propertyIds[0],
        value: undefined,
      }),
    ]);
  });

  it("shows nothing for a page that is not a row", () => {
    const { store, container, databaseId } = mount();
    const state = {
      ...store.getState(),
      ui: { ...store.getState().ui, activePageId: databaseId },
    };

    render(
      renderRowProperties(state, () => ({ ok: true })),
      container,
    );

    expect(container.querySelector(".database__row-properties")).toBeNull();
  });
});
