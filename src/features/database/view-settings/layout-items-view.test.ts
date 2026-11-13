// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ViewType } from "../../../model/index.ts";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { setCalendarOptions } from "../calendar-options.commands.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { setFeedOptions } from "../feed-options.commands.ts";
import { setViewType } from "../view-layout.commands.ts";
import { VIEW_SETTINGS_OVERLAY } from "./index.ts";

type App = ReturnType<typeof createDatabaseApp>;

// A database of one dated row, laid out as asked, its layout panel open
// when asked.
function rendered(type: ViewType, panel: boolean, change?: (app: App) => void) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Notes", type: "text" },
    ],
    [["Ship", { start: "2026-11-13" }, "soon"]],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: type }));
  change?.(app);
  const built = app.store.getState();
  const overlay: OpenOverlay | null = panel
    ? { kind: VIEW_SETTINGS_OVERLAY, anchorId: app.databaseId, panel: "layout" }
    : null;
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui: { ...built.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const row = (label: string) =>
    [...host.querySelectorAll<HTMLElement>(".menu [data-index]")].find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, row, viewId };
}

describe("each layout's own options", () => {
  it("lays a gallery's cards out as a list or compact, and fits media", () => {
    const { host, row, sent, viewId } = rendered("gallery", true);
    const tiles = [
      ...host.querySelectorAll<HTMLElement>(".view-settings__box .tiles__tile"),
    ];

    expect(tiles.map((tile) => tile.textContent.trim())).toEqual([
      "Compact",
      "List",
    ]);
    tiles[0]?.click();
    row("Fit media")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setCardOptions",
        viewId,
        options: { card: { layout: "compact" } },
      }),
      expect.objectContaining({
        type: "view.setCardOptions",
        viewId,
        options: { card: { fitMedia: true } },
      }),
    ]);
  });

  it("wraps a calendar's titles", () => {
    const { row, sent } = rendered("calendar", true);
    row("Wrap page titles")?.click();
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "view.setCalendarOptions",
        options: { wrapTitles: true },
      }),
    );

    const wrapped = rendered("calendar", false, (app) => {
      const options = { wrapTitles: true };
      app.dispatch(
        setCalendarOptions.create({ viewId: app.view().id, options }),
      );
    });
    expect(
      wrapped.host.querySelector(".calendar")?.hasAttribute("data-wrap"),
    ).toBe(true);
  });

  it("separates a timeline's start and end dates", () => {
    const { row, sent } = rendered("timeline", true);
    row("Separate start and end dates")?.click();
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "view.setTimelineOptions",
        options: { separateDates: true },
      }),
    );
  });

  it("edits a list's titles in place, and wraps a feed's values", () => {
    const list = rendered("list", true);
    list.row("Directly edit page name")?.click();
    expect(list.sent).toContainEqual(
      expect.objectContaining({
        type: "view.setListOptions",
        options: { editTitle: true },
      }),
    );

    const feed = rendered("feed", false, (app) => {
      const options = { wrapProperties: true };
      app.dispatch(setFeedOptions.create({ viewId: app.view().id, options }));
    });
    expect(feed.host.querySelector(".feed")?.hasAttribute("data-wrap")).toBe(
      true,
    );
    expect(feed.host.querySelector(".feed__values")?.textContent).toContain(
      "soon",
    );
  });
});
