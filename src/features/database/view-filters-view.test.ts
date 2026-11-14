// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { FILTERS_OVERLAY } from "./database-menus.view.ts";
import {
  ruleAnchorId,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import { renderDatabase } from "./database.view.ts";
import { ADD_RULE_ID } from "./filter-panel-actions.view.ts";
import { TITLE_PROPERTY_ID } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

function rendered(child?: string) {
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
  const overlay = {
    kind: FILTERS_OVERLAY,
    anchorId: app.databaseId,
    ...(child !== undefined && { children: [{ anchorId: child }] }),
  };
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
  // Typing fires input as each key goes in; a select fires change.
  const type = control instanceof HTMLInputElement ? "input" : "change";
  control.dispatchEvent(new Event(type, { bubbles: true }));
}

describe("the advanced filter's foot", () => {
  it("deletes the whole filter and closes, as Notion's", () => {
    const { host, sent } = rendered();
    const remove = [...host.querySelectorAll("button")].find(
      (item) => item.textContent.trim() === "Delete filter",
    );

    remove?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setFilter",
        filter: { conjunction: "and", items: [] },
      }),
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });
});

describe("the filter editor", () => {
  it("adds a group holding one new condition from Add filter rule's list, as Notion's", () => {
    const { host, sent, rule } = rendered(ADD_RULE_ID);
    const add = [...host.querySelectorAll<HTMLElement>("[role=menuitem]")].find(
      (item) => item.textContent.includes("Add filter group"),
    );

    add?.click();

    expect(sent).toContainEqual(
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
    );
  });

  it("opens the join's list inside the popover and joins with or", () => {
    const closed = rendered();
    [...closed.host.querySelectorAll<HTMLElement>(".select")]
      .find(
        (select) =>
          select.querySelector(".select__name")?.textContent ===
          "Join conditions with",
      )
      ?.click();
    const open = rendered("filter-join-");
    const or = [
      ...open.host.querySelectorAll<HTMLElement>("[role=option]"),
    ].find((option) => option.textContent.trim() === "Or");

    or?.click();

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "filter-join-",
      }),
    ]);
    expect(open.sent).toHaveLength(2);
    expect(open.sent[0]).toMatchObject({ type: "ui.closeChildOverlay" });
    expect(open.sent[1]).toMatchObject({ filter: { conjunction: "or" } });
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

describe("the filter editor of a view with no filter", () => {
  it("lists the properties to filter by, searchable, and adds a condition", () => {
    const app = createDatabaseApp([{ name: "Notes", type: "text" }], [["A"]]);
    const [notes] = app.propertyIds;
    const built = app.store.getState();
    const overlay = { kind: FILTERS_OVERLAY, anchorId: app.databaseId };
    const state = { ...built, ui: { ...built.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    rows.find((row) => row.textContent.trim() === "Notes")?.click();

    expect(
      host.querySelector<HTMLInputElement>(".menu__search input")?.placeholder,
    ).toBe("Filter by…");
    expect(rows.map((row) => row.textContent.trim())).toEqual([
      "Name",
      "Notes",
      "Add advanced filter",
    ]);
    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setFilter",
        filter: {
          conjunction: "and",
          items: [expect.objectContaining({ propertyId: notes, value: "" })],
        },
      }),
      // Then the new rule opens by its pill, as Notion's.
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: VIEW_FILTER_RULE_OVERLAY,
          anchorId: ruleAnchorId(app.databaseId, 0),
        },
      }),
    ]);
  });
});

describe("Add advanced filter", () => {
  it("starts the advanced filter with a rule on the name, as Notion's", () => {
    const app = createDatabaseApp([{ name: "Notes", type: "text" }], [["A"]]);
    const built = app.store.getState();
    const overlay = { kind: FILTERS_OVERLAY, anchorId: app.databaseId };
    const state = { ...built, ui: { ...built.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    [...host.querySelectorAll<HTMLElement>(".menu [data-index]")]
      .find((row) => row.textContent.trim() === "Add advanced filter")
      ?.click();

    expect(sent[0]).toMatchObject({
      type: "view.setFilter",
      filter: {
        isAdvanced: true,
        items: [{ propertyId: TITLE_PROPERTY_ID, value: "" }],
      },
    });
  });
});
