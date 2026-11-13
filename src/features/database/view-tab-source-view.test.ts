// @vitest-environment happy-dom
import { html, render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabaseSection } from "./database.view.ts";
import { setSourceTitleHidden } from "./source-title.commands.ts";
import { VIEW_TAB_MENU_OVERLAY } from "./view-tabs.view.ts";
import { createView, setActiveView } from "./view.commands.ts";

// A database inside a page, with two views, its tab menu open when asked.
function inPage(options: { isOpen?: boolean; isHidden?: boolean } = {}) {
  const app = createDatabaseApp([], []);
  const { databaseId } = app;
  app.dispatch(
    createView.create({ databaseId, name: "Board", viewType: "board" }),
  );
  app.dispatch(setActiveView.create({ databaseId, viewId: app.view().id }));
  if (options.isHidden === true) {
    app.dispatch(
      setSourceTitleHidden.create({ viewId: app.view().id, isHidden: true }),
    );
  }
  const stored = app.store.getState();
  const overlay =
    options.isOpen === true
      ? { kind: VIEW_TAB_MENU_OVERLAY, anchorId: databaseId }
      : null;
  const state = {
    ...stored,
    ui: { ...stored.ui, overlay, activePageId: null },
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabaseSection(
      state,
      (command) => {
        sent.push(command);
        return { ok: true };
      },
      { holderId: databaseId, header: html`<b class="name">Tasks</b>` },
    ),
    host,
  );
  const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
    label.textContent.trim(),
  );
  return { host, sent, labels, app };
}

describe("a view inside a page", () => {
  it("offers Open as full page and Hide data source titles, as Notion's", () => {
    const { labels } = inPage({ isOpen: true });

    expect(labels).toEqual([
      "Rename",
      "Show as",
      "Edit view",
      "Source",
      "Copy link to view",
      "Add view to sidebar",
      "Open as full page",
      "Hide data source titles",
      "Duplicate view",
      "Delete view",
    ]);
  });

  it("hides the database's name over its tabs, and shows it again", () => {
    expect(inPage().host.querySelector(".name")).not.toBeNull();

    const hidden = inPage({ isOpen: true, isHidden: true });
    expect(hidden.host.querySelector(".name")).toBeNull();
    expect(hidden.labels).toContain("Show data source titles");
  });
});

describe("view.setSourceTitleHidden", () => {
  it("is kept on the view and undone with it", () => {
    const { app } = inPage();
    const viewId = app.view().id;

    app.dispatch(setSourceTitleHidden.create({ viewId, isHidden: true }));
    expect(app.view().isSourceTitleHidden).toBe(true);

    app.dispatch({ type: "history.undo" });
    expect(app.view().isSourceTitleHidden).toBeUndefined();
  });
});
