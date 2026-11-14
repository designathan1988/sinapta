// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderFormulaConfig } from "./formula-config.view.ts";

function mount() {
  const app = createDatabaseApp(
    [
      { name: "Budget", type: "number" },
      { name: "Double", type: "formula" },
    ],
    [["Launch", 1200, undefined]],
  );
  const double = app.database().props.properties[1];
  if (double === undefined) throw new Error("no formula");
  const saved: unknown[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const context = {
    databaseId: app.databaseId,
    state: app.store.getState(),
    dispatch: app.dispatch,
  };
  render(
    renderFormulaConfig(double, (config) => saved.push(config), context),
    host,
  );
  const field = host.querySelector("textarea");
  if (field === null) throw new Error("no field");
  return { field, saved };
}

const key = (field: Element, init: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  field.dispatchEvent(event);
  return event;
};

describe("the formula field", () => {
  it("keeps the formula when Escape closes the settings", () => {
    const { field, saved } = mount();
    field.value = 'prop("Budget") * 2';

    key(field, { key: "Escape" });

    expect(saved).toEqual([{ expression: 'prop("Budget") * 2' }]);
  });

  it("keeps it on Enter, and Shift+Enter starts a new line", () => {
    const { field, saved } = mount();
    field.value = 'prop("Budget")';

    const shifted = key(field, { key: "Enter", shiftKey: true });
    const entered = key(field, { key: "Enter" });

    expect(shifted.defaultPrevented).toBe(false);
    expect(entered.defaultPrevented).toBe(true);
    expect(saved).toEqual([{ expression: 'prop("Budget")' }]);
  });
});
