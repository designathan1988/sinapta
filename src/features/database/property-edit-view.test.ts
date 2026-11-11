// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp, type PropertySpec } from "./database-builder.ts";
import {
  PROPERTY_EDIT_OVERLAY,
  renderPropertyEdit,
} from "./property-edit.view.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const STAGE: PropertySpec = {
  name: "Stage",
  type: "select",
  options: [
    { id: "o1", name: "Todo", color: "gray" },
    { id: "o2", name: "Done", color: "green" },
  ],
};

function rendered(spec: PropertySpec = STAGE, child?: string, panel?: string) {
  const app = createDatabaseApp([spec], []);
  const initial = app.store.getState();
  const anchorId = app.propertyIds[0] ?? "";
  const state = {
    ...initial,
    ui: {
      ...initial.ui,
      overlay: {
        kind: PROPERTY_EDIT_OVERLAY,
        anchorId,
        ...(panel !== undefined && { panel }),
        ...(child !== undefined && {
          child: { anchorId: child.replace("{id}", anchorId) },
        }),
      },
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
  render(renderPropertyEdit({ state, dispatch, model }), host);
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
  return { host, sent, option, pick, row };
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

describe("renderPropertyEdit", () => {
  it("lists the options as chips, each opening its own panel", () => {
    const { host, sent, row } = rendered();

    row("Done").click();

    expect(
      host.querySelector('.menu [data-index] .chip[data-color="green"]'),
    ).not.toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "option:o2",
      }),
    ]);
  });

  it("renames an option from its panel", () => {
    const { host, sent } = rendered(STAGE, undefined, "option:o2");

    change(host.querySelector(".menu__field input"), "Shipped");

    expect(sent).toEqual([
      expect.objectContaining({
        type: "option.rename",
        optionId: "o2",
        name: "Shipped",
      }),
    ]);
  });

  it("recolors an option from its colors, the current one checked", () => {
    const { sent, row } = rendered(STAGE, undefined, "option:o1");

    row("Red").click();

    expect(row("Gray").getAttribute("aria-checked")).toBe("true");
    expect(sent).toEqual([
      expect.objectContaining({ type: "option.recolor", color: "red" }),
    ]);
  });

  it("moves and deletes an option from its panel", () => {
    const { sent, row } = rendered(STAGE, undefined, "option:o1");

    row("Move option down").click();
    row("Delete option").click();

    expect(sent.map((command) => command.type)).toEqual([
      "option.move",
      "option.delete",
      "ui.openOverlayPanel",
    ]);
    expect(sent[0]).toMatchObject({ offset: 1 });
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
