// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { VIEW_TABS_OVERLAY } from "./view-tabs.view.ts";
import { createView, setActiveView } from "./view.commands.ts";

// A database with five views; the fifth is shown when asked.
function rendered(options: { isMoreOpen?: boolean; showsLast?: boolean } = {}) {
  const app = createDatabaseApp([], []);
  const databaseId = app.databaseId;
  for (const name of ["Board", "Calendar", "Timeline", "Chart"]) {
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
  it("shows the first three views and the rest under N more", () => {
    const { host, tabs } = rendered();

    expect(tabs()).toEqual(["Table", "Board", "Calendar"]);
    expect(host.querySelector(".database__more-views")?.textContent).toContain(
      "2 more",
    );
  });

  it("always shows the view that is open", () => {
    const { tabs } = rendered({ showsLast: true });

    expect(tabs()).toEqual(["Table", "Board", "Chart"]);
  });

  it("lists the other views in a menu, each opening its view", () => {
    const { host, sent, viewIds } = rendered({ isMoreOpen: true });
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    rows.at(-1)?.click();

    expect(rows.map((row) => row.textContent.trim())).toEqual([
      "Timeline",
      "Chart",
    ]);
    expect(sent.at(-1)).toMatchObject({
      type: "ui.setActiveView",
      viewId: viewIds.at(-1),
    });
  });
});
