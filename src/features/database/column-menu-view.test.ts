// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OverlayChild } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { renderDatabase } from "./database.view.ts";

// A table with one date column whose menu is open, with these submenus.
function rendered(children: readonly string[] = []) {
  const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
  const [due] = app.propertyIds;
  if (due === undefined) throw new Error("setup");
  const built = app.store.getState();
  const open: OverlayChild[] = children.map((child) => ({
    anchorId: child.replace("{id}", due),
  }));
  const overlay = {
    kind: COLUMN_MENU_OVERLAY,
    anchorId: due,
    ...(open.length > 0 && { children: open }),
  };
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
  const menus = () => [...host.querySelectorAll<HTMLElement>(".menu")];
  // The rows of one menu: the column menu, or a submenu by its depth.
  const rowsOf = (depth = 0) =>
    [
      ...(menus()[depth]?.querySelectorAll<HTMLElement>("[data-index]") ?? []),
    ].filter((row) => row.closest(".menu") === menus()[depth]);
  const labels = (depth = 0) =>
    rowsOf(depth).map((row) =>
      row.querySelector(".menu__label")?.textContent.trim(),
    );
  const row = (label: string, depth = 0) => {
    const found = rowsOf(depth).find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} row`);
    return found;
  };
  return { app, due, host, sent, labels, row, menus };
}

describe("the column menu", () => {
  it("lists Notion's column actions with icons, the name ready to edit", () => {
    const { host, labels, menus } = rendered();

    expect(labels()).toEqual([
      "Edit property",
      "Change type",
      "Filter",
      "Sort",
      "Group",
      "Calculate",
      "Freeze",
      "Hide",
      "Wrap content",
      "Insert left",
      "Insert right",
      "Duplicate property",
      "Move left",
      "Move right",
      "Delete property",
    ]);
    expect(
      [...(menus()[0]?.querySelectorAll("[data-index]") ?? [])].every(
        (item) => item.querySelector(".icon") !== null,
      ),
    ).toBe(true);
    const name = host.querySelector<HTMLInputElement>(".menu__field input");
    expect(name?.value).toBe("Due");
    expect(name?.hasAttribute("data-autofocus")).toBe(true);
  });

  it("filters by the column", () => {
    const { sent, row } = rendered();

    row("Filter").click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeOverlay",
      "view.setFilter",
      "ui.openOverlay",
    ]);
  });

  it("opens the property's settings beside the menu", () => {
    const { sent, row, menus } = rendered(["{id}:edit"]);
    const closed = rendered();

    closed.row("Edit property").click();

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: `${closed.due}:edit`,
        depth: 0,
      }),
    ]);
    expect(row("Edit property").getAttribute("aria-expanded")).toBe("true");
    expect(menus()[1]?.getAttribute("data-placement")).toBe("beside");
    expect(
      menus()[1]?.querySelector(".select[data-variant=row]"),
    ).not.toBeNull();
    expect(sent).toEqual([]);
  });

  it("changes the type from its submenu, the current one checked", () => {
    const { sent, row, labels } = rendered(["{id}:type"]);

    row("Number", 1).click();

    expect(labels(1)).toContain("Text");
    expect(row("Date", 1).getAttribute("aria-checked")).toBe("true");
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
      expect.objectContaining({
        type: "property.changeType",
        propertyType: "number",
        optionNames: [],
      }),
    ]);
  });

  it("sorts and calculates from submenus", () => {
    const sort = rendered(["{id}:sort"]);
    const calculate = rendered(["{id}:calculate", "{id}:calculate:count"]);

    sort.row("Sort high → low", 1).click();
    calculate.row("Count all", 2).click();

    expect(calculate.labels(1)).toEqual([
      "None",
      "Count",
      "Percent",
      "More options",
    ]);
    expect(sort.sent[1]).toMatchObject({
      type: "view.sortBy",
      direction: "descending",
    });
    expect(calculate.sent[1]).toMatchObject({
      type: "view.setCalculation",
      kind: "count-all",
    });
  });

  it("groups by the column, and adds and copies columns beside it", () => {
    const { sent, row } = rendered();

    row("Group").click();
    row("Insert left").click();
    row("Duplicate property").click();

    expect(
      sent.filter((command) => command.type !== "ui.closeOverlay"),
    ).toEqual([
      expect.objectContaining({ type: "view.setGroupBy" }),
      expect.objectContaining({ type: "property.insert", side: "left" }),
      expect.objectContaining({ type: "property.duplicate" }),
    ]);
  });
});
