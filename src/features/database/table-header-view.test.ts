// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { PROPERTY_EDIT_OVERLAY } from "./property-edit.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";

describe("the table's header", () => {
  it("anchors a property's settings to its column, as its menu was", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const [due] = app.propertyIds;
    if (due === undefined) throw new Error("setup");
    const built = app.store.getState();
    const overlay = { kind: PROPERTY_EDIT_OVERLAY, anchorId: due };
    const state = { ...built, ui: { ...built.ui, overlay } };
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderDatabase(state, () => ({ ok: true })),
      host,
    );

    const button = host.querySelector(
      `th[data-property-id="${due}"] .database__column-menu`,
    );
    expect(button?.getAttribute("aria-expanded")).toBe("true");
  });

  it("lists Notion's column actions with icons, and filters by the column", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const [due] = app.propertyIds;
    if (due === undefined) throw new Error("setup");
    const built = app.store.getState();
    const overlay = { kind: COLUMN_MENU_OVERLAY, anchorId: due };
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
    const labels = rows.map((row) =>
      row.querySelector(".menu__label")?.textContent.trim(),
    );

    rows.find((row) => row.textContent.includes("Filter"))?.click();

    expect(labels).toEqual([
      "Edit property",
      "Filter",
      "Sort ascending",
      "Sort descending",
      "Freeze up to this column",
      "Hide in this view",
      "Wrap text",
      "Move left",
      "Move right",
      "Delete property",
    ]);
    expect(rows.every((row) => row.querySelector(".icon") !== null)).toBe(true);
    expect(
      host.querySelector<HTMLInputElement>(".menu__field input")?.value,
    ).toBe("Due");
    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeOverlay",
      "view.setFilter",
      "ui.openOverlay",
    ]);
  });
});
