// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { VIEW_TABS_OVERLAY } from "./view-tabs.view.ts";
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
  readonly isMoreOpen?: boolean;
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
    options.isMoreOpen === true
      ? { kind: VIEW_TABS_OVERLAY, anchorId: databaseId }
      : null;
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

    expect(tabs()).toEqual(["Table", "Board", "Calendar", "Timeline"]);
    expect(host.querySelector(".database__more-views")?.textContent).toContain(
      "4 more",
    );
  });

  it("always shows the view that is open", () => {
    const { tabs } = rendered({ showsLast: true });

    expect(tabs()).toEqual(["Table", "Board", "Finished last quarter"]);
  });

  it("lists the other views in a menu, each opening its view", () => {
    const { host, sent, viewIds } = rendered({ isMoreOpen: true });
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    rows.at(-1)?.click();

    expect(rows.map((row) => row.textContent.trim())).toEqual(LONG.slice(3));
    expect(sent.at(-1)).toMatchObject({
      type: "ui.setActiveView",
      viewId: viewIds.at(-1),
    });
  });
});
