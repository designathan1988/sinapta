// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewType } from "./view-layout.commands.ts";
import { VIEW_TAB_MENU_OVERLAY } from "./view-tabs.view.ts";

describe("a calendar's toolbar", () => {
  it("lists the view in the Calendar tab from Manage in Calendar, and shows it", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const viewId = app.view().id;
    app.dispatch(setViewType.create({ viewId, viewType: "calendar" }));
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

    host.querySelector<HTMLElement>(".database__manage-calendar")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "settings.setCalendarView",
        viewId,
        isShown: true,
      }),
      // The sidebar turns to the Calendar tab, where the pages now show.
      expect.objectContaining({
        type: "settings.setSidebarTab",
        tab: "calendar",
      }),
    ]);
  });

  it("draws Notion's dated calendar beside Manage in Calendar", () => {
    const app = createDatabaseApp([{ name: "Due", type: "date" }], []);
    const viewId = app.view().id;
    app.dispatch(setViewType.create({ viewId, viewType: "calendar" }));
    const built = app.store.getState();
    const overlay = { kind: VIEW_TAB_MENU_OVERLAY, anchorId: app.databaseId };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase({ ...built, ui: { ...built.ui, overlay } }, () => ({
        ok: true,
      })),
      host,
    );
    const row = [...document.querySelectorAll("[role^=menuitem]")].find(
      (each) =>
        each.querySelector(".menu__label")?.textContent.trim() ===
        "Manage in Calendar",
    );

    expect(row?.querySelector(".icon")?.getAttribute("data-icon")).toBe(
      "calendar-date",
    );
  });
});
