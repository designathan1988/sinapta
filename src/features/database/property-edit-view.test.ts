// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp, type PropertySpec } from "./database-builder.ts";
import { renderColumnMenu } from "./column-menu.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const STAGE: PropertySpec = {
  name: "Stage",
  type: "select",
  options: [
    { id: "o1", name: "Todo", color: "gray" },
    { id: "o2", name: "Done", color: "green" },
  ],
};

// The column menu with its "Edit property" submenu open, and inside it
// the submenus or lists named, "{id}" standing for the property's id.
function rendered(spec: PropertySpec = STAGE, ...opened: string[]) {
  const app = createDatabaseApp([spec], []);
  const initial = app.store.getState();
  const anchorId = app.propertyIds[0] ?? "";
  const children = ["{id}:edit", ...opened].map((child) => ({
    anchorId: child.replace("{id}", anchorId),
  }));
  const state = {
    ...initial,
    ui: {
      ...initial.ui,
      overlay: { kind: COLUMN_MENU_OVERLAY, anchorId, children },
    },
  };
  const model = selectTableModel(state, app.databaseId);
  if (model === undefined) throw new Error("no table");
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderColumnMenu({ state, dispatch, model }), host);
  // The innermost submenu open.
  const inner = () => [...host.querySelectorAll(".menu")].at(-1);
  const option = (id: string) => {
    const item = host.querySelector(`[data-option-id="${id}"]`);
    if (item === null) throw new Error(`no option ${id}`);
    return item;
  };
  const pick = (label: string) => {
    const found = [...host.querySelectorAll<HTMLElement>("[role=option]")].find(
      (item) => item.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} option`);
    found.click();
  };
  const row = (label: string) => {
    const found = [
      ...host.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} row`);
    return found;
  };
  return { host, sent, option, pick, row, inner, anchorId };
}

function change(field: Element | null, value: string): void {
  if (!(
    field instanceof HTMLInputElement || field instanceof HTMLSelectElement
  )) {
    throw new Error("no field");
  }
  field.value = value;
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("the Edit property submenu", () => {
  it("lists the options as chips, each opening its own submenu", () => {
    const { host, sent, row, anchorId } = rendered();

    row("Done").click();

    expect(
      host.querySelector('.menu [data-index] .chip[data-color="green"]'),
    ).not.toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: `${anchorId}:option:o2`,
        depth: 1,
      }),
    ]);
  });

  it("renames an option from its submenu", () => {
    const { sent, inner } = rendered(STAGE, "{id}:option:o2");

    change(inner()?.querySelector(".menu__field input") ?? null, "Shipped");

    expect(sent).toEqual([
      expect.objectContaining({
        type: "option.rename",
        optionId: "o2",
        name: "Shipped",
      }),
    ]);
  });

  it("recolors an option from its colors, the current one checked", () => {
    const { sent, row } = rendered(STAGE, "{id}:option:o1");

    row("Red").click();

    expect(
      row("Red").querySelector('.chip__swatch[data-color="red"]'),
    ).not.toBeNull();
    expect(row("Red").querySelector(".chip")).toBeNull();
    expect(row("Gray").getAttribute("aria-checked")).toBe("true");
    expect(
      row("Default").querySelector('.chip__swatch[data-color="default"]'),
    ).not.toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({ type: "option.recolor", color: "red" }),
    ]);
  });

  it("moves and deletes an option, which closes its submenu", () => {
    const { sent, row } = rendered(STAGE, "{id}:option:o1");

    row("Move option down").click();
    row("Delete option").click();

    expect(sent.map((command) => command.type)).toEqual([
      "option.move",
      "option.delete",
      "ui.closeChildOverlay",
    ]);
    expect(sent[0]).toMatchObject({ offset: 1 });
    expect(sent[2]).toMatchObject({ depth: 1 });
  });

  it("stores the property's description", () => {
    const { host, sent } = rendered();
    const field = host.querySelector("textarea");
    if (field === null) throw new Error("no description field");

    field.value = "Where the work is";
    field.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "property.change",
        description: "Where the work is",
      }),
    ]);
  });

  it("shows a number property's format and stores a new one", () => {
    const { sent, pick } = rendered(
      { name: "Price", type: "number" },
      "{id}-format",
    );

    pick("Number with commas");

    expect(sent.slice(1)).toEqual([
      expect.objectContaining({
        type: "property.setConfig",
        config: { format: "comma", display: "number" },
      }),
    ]);
  });
});
