// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";

describe("the table's header", () => {
  it("anchors the column's menu to its column", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const [due] = app.propertyIds;
    if (due === undefined) throw new Error("setup");
    const built = app.store.getState();
    const overlay = { kind: COLUMN_MENU_OVERLAY, anchorId: due };
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
});
