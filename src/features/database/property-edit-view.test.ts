// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp, type PropertySpec } from "./database-builder.ts";
import {
  PROPERTY_EDIT_OVERLAY,
  renderPropertyEdit,
} from "./property-edit.view.ts";
import { selectTableModel } from "./table-model.selectors.ts";

// happy-dom has no Popover API; the panel only needs to be shown.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

const STAGE: PropertySpec = {
  name: "Stage",
  type: "select",
  options: [
    { id: "o1", name: "Todo", color: "gray" },
    { id: "o2", name: "Done", color: "green" },
  ],
};

function rendered(spec: PropertySpec = STAGE) {
  const app = createDatabaseApp([spec], []);
  const initial = app.store.getState();
  const anchorId = app.propertyIds[0] ?? "";
  const state = {
    ...initial,
    ui: { ...initial.ui, overlay: { kind: PROPERTY_EDIT_OVERLAY, anchorId } },
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
  return { host, sent, option };
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
  it("renames an option from its field", () => {
    const { sent, option } = rendered();

    change(option("o2").querySelector("input"), "Shipped");

    expect(sent).toEqual([
      expect.objectContaining({
        type: "option.rename",
        optionId: "o2",
        name: "Shipped",
      }),
    ]);
  });

  it("recolors an option from its color list", () => {
    const { sent, option } = rendered();

    change(option("o1").querySelector("select"), "red");

    expect(sent[0]).toMatchObject({ type: "option.recolor", color: "red" });
  });

  it("moves and deletes an option with its buttons", () => {
    const { sent, option } = rendered();
    const buttons = option("o1").querySelectorAll("button");

    for (const button of buttons) button.click();

    expect(sent.map((command) => command.type)).toEqual([
      "option.move",
      "option.move",
      "option.delete",
    ]);
    expect(sent[1]).toMatchObject({ offset: 1 });
  });

  it("shows a number property's format and stores a new one", () => {
    const { host, sent } = rendered({ name: "Price", type: "number" });

    change(host.querySelector('[data-field="format"]'), "comma");

    expect(sent).toEqual([
      expect.objectContaining({
        type: "property.setConfig",
        config: { format: "comma", display: "number" },
      }),
    ]);
  });
});
