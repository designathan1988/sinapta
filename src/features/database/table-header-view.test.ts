// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
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
      `th[data-property-id="${due}"] .database__header-button`,
    );
    expect(button?.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens the column's menu, not a sort, when its header is pressed", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const [due] = app.propertyIds;
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(app.store.getState(), (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    host
      .querySelector<HTMLElement>(
        `th[data-property-id="${String(due)}"] .database__header-button`,
      )
      ?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: COLUMN_MENU_OVERLAY, anchorId: due },
      }),
    ]);
  });
});
