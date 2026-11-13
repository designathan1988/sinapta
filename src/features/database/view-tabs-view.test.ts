// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import {
  splitViews,
  VIEW_LIST_OVERLAY,
  VIEW_TABS_OVERLAY,
} from "./view-tabs.view.ts";
import { createView, setActiveView } from "./view.commands.ts";

const SHORT = ["Board", "Calendar", "Timeline", "Chart"];
// Names too long for every tab to fit beside the toolbar.
const LONG = [
  ...SHORT,
  "Everything due this week",
  "Waiting on someone else",
  "Finished last quarter",
];

interface Options {
  readonly names?: readonly string[];
  // The overlay open over the database.
  readonly open?: string;
  readonly showsLast?: boolean;
}

// A database with a "Table" view and one view per name; the last is
// open when asked.
function rendered(options: Options = {}) {
  const app = createDatabaseApp([], []);
  const databaseId = app.databaseId;
  for (const name of options.names ?? LONG) {
    app.dispatch(createView.create({ databaseId, name, viewType: "board" }));
  }
  const viewIds = app.database().props.viewIds;
  // New views open as they are made: the first is opened again unless the
  // test shows the last.
  const opened = options.showsLast === true ? viewIds.at(-1) : viewIds[0];
  if (opened !== undefined) {
    app.dispatch(setActiveView.create({ databaseId, viewId: opened }));
  }
  const built = app.store.getState();
  const overlay: OpenOverlay | null =
    options.open === undefined
      ? null
      : { kind: options.open, anchorId: databaseId };
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
  const tabs = () =>
    [...host.querySelectorAll(".database__tab")].map((tab) =>
      tab.textContent.trim(),
    );
  return { host, sent, tabs, viewIds };
}

describe("the view tabs", () => {
  it("shows every view when all the tabs fit", () => {
    const { host, tabs } = rendered({ names: SHORT });

    expect(tabs()).toEqual(["Table", ...SHORT]);
    expect(host.querySelector(".database__tabs")?.textContent).not.toContain(
      "more…",
    );
  });

  it("shows the views that fit and the rest under N more", () => {
    const { host, tabs } = rendered();

    expect(tabs()).toEqual(["Table", ...SHORT, "Everything due this week"]);
    expect(host.querySelector(".database__more-views")?.textContent).toContain(
      "2 more",
    );
  });

  // A database inside a page has its column's width, not the window's.
  it("fits fewer tabs in an inline database's narrower row", () => {
    const app = createDatabaseApp([], []);
    for (const name of LONG) {
      app.dispatch(
        createView.create({
          databaseId: app.databaseId,
          name,
          viewType: "board",
        }),
      );
    }
    const { views } = app.store.getState().workspace;
    const all = app.database().props.viewIds.flatMap((id) => views[id] ?? []);
    const first = all[0];
    if (first === undefined) throw new Error("setup");

    const { shown } = splitViews(all, first.id, {
      place: "inline",
      style: "text-icon",
    });

    expect(shown.map((id) => views[id]?.name)).toEqual([
      "Table",
      "Board",
      "Calendar",
      "Timeline",
    ]);
    const icons = splitViews(all, first.id, { place: "inline", style: "icon" });
    expect(icons.shown.length).toBeGreaterThan(shown.length);
  });

  it("always shows the view that is open", () => {
    const { tabs } = rendered({ showsLast: true });

    expect(tabs()).toEqual(["Table", ...SHORT, "Finished last quarter"]);
  });

  it("lists the other views in a menu, each opening its view", () => {
    const { host, sent, viewIds } = rendered({ open: VIEW_TABS_OVERLAY });
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    rows.at(-1)?.click();

    expect(rows.map((row) => row.textContent.trim())).toEqual(LONG.slice(5));
    expect(sent.at(-1)).toMatchObject({
      type: "ui.setActiveView",
      viewId: viewIds.at(-1),
    });
  });
});

// Where the tabs do not fit, as beside a side peek, Notion shows the open
// view as one button that lists them all.
describe("the view switch", () => {
  it("names the open view and opens the list of views", () => {
    const { host, sent } = rendered({ names: SHORT });
    const toggle = host.querySelector<HTMLElement>(".database__switch");

    toggle?.click();

    expect(toggle?.textContent.trim()).toBe("Table");
    expect(sent.at(-1)).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: VIEW_LIST_OVERLAY },
    });
  });

  it("lists every view, the open one checked, each opening its view", () => {
    const { host, sent, viewIds } = rendered({
      names: SHORT,
      open: VIEW_LIST_OVERLAY,
    });
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    rows.at(-1)?.click();

    expect(rows.map((row) => row.textContent.trim())).toEqual([
      "Table",
      ...SHORT,
    ]);
    expect(rows[0]?.getAttribute("aria-checked")).toBe("true");
    expect(sent.at(-1)).toMatchObject({
      type: "ui.setActiveView",
      viewId: viewIds.at(-1),
    });
  });
});
