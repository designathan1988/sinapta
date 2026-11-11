// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { FILTERS_OVERLAY } from "./database-menus.view.ts";
import { renderDatabase } from "./database.view.ts";
import { TITLE_PROPERTY_ID } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

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

function rendered() {
  const app = createDatabaseApp([{ name: "Notes", type: "text" }], [["A"]]);
  const [notes] = app.propertyIds;
  if (notes === undefined) throw new Error("no property");
  const rule = { propertyId: notes, operator: "contains", value: "x" };
  app.dispatch(
    setViewFilter.create({
      viewId: app.view().id,
      filter: {
        conjunction: "and",
        items: [rule, { conjunction: "or", items: [rule] }],
      },
    }),
  );
  const filtered = app.store.getState();
  const overlay = { kind: FILTERS_OVERLAY, anchorId: app.databaseId };
  const state = { ...filtered, ui: { ...filtered.ui, overlay } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(state, dispatch), host);
  return { host, sent, rule };
}

function change(control: Element | null, value: string): void {
  if (
    !(control instanceof HTMLSelectElement) &&
    !(control instanceof HTMLInputElement)
  ) {
    throw new Error("no control");
  }
  control.value = value;
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("the filter editor", () => {
  it("adds a group holding one new condition", () => {
    const { host, sent, rule } = rendered();
    const add = [...host.querySelectorAll("button")].find(
      (item) => item.textContent.trim() === "Add filter group",
    );

    add?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setFilter",
        filter: {
          conjunction: "and",
          items: [
            rule,
            { conjunction: "or", items: [rule] },
            {
              conjunction: "and",
              items: [
                {
                  propertyId: TITLE_PROPERTY_ID,
                  operator: "contains",
                  value: "",
                },
              ],
            },
          ],
        },
      }),
    ]);
  });

  it("joins the top conditions with or", () => {
    const { host, sent } = rendered();

    change(
      host.querySelector('[data-path=""][data-field="conjunction"]'),
      "or",
    );

    expect(sent[0]).toMatchObject({ filter: { conjunction: "or" } });
  });

  it("changes the value of a condition inside a group", () => {
    const { host, sent, rule } = rendered();

    change(host.querySelector('[data-path="1.0"] [data-field="value"]'), "y");

    expect(sent[0]).toMatchObject({
      filter: {
        items: [rule, { conjunction: "or", items: [{ ...rule, value: "y" }] }],
      },
    });
  });
});
