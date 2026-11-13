// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  addSidebarView,
  createTestApp,
  type Command,
  type OpenOverlay,
} from "../../state/index.ts";
import { addRow, startDatabase } from "../database/index.ts";
import { renderSidebarViewMenu } from "./sidebar-view-menu.view.ts";
import {
  renderSidebarViews,
  SIDEBAR_VIEW_OVERLAY,
} from "./sidebar-views.view.ts";

const props = {
  title: [{ text: "Tasks" }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
};

// A database "Tasks" with one page, its view kept in the sidebar; the
// section's menu open, with a submenu, when asked.
function rendered(open?: { child?: string }) {
  const PAGE = toBlockId("tasks");
  const workspace = buildWorkspace([{ id: "tasks", props }]);
  const app = createTestApp({
    workspace,
    commands: [startDatabase, addRow, addSidebarView],
  });
  app.dispatch(startDatabase.create({ pageId: PAGE, viewType: "table" }));
  app.dispatch(addRow.create({ databaseId: PAGE }));
  const view = Object.values(app.store.getState().workspace.views)[0];
  if (view === undefined) throw new Error("no view");
  app.dispatch(addSidebarView.create({ viewId: view.id }));
  const stored = app.store.getState();
  const overlay: OpenOverlay | null =
    open === undefined
      ? null
      : {
          kind: SIDEBAR_VIEW_OVERLAY,
          anchorId: view.id,
          ...(open.child !== undefined && {
            children: [{ anchorId: `sidebar-view-${view.id}-${open.child}` }],
          }),
        };
  const state = { ...stored, ui: { ...stored.ui, overlay } };
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    [
      renderSidebarViews(state, dispatch),
      renderSidebarViewMenu(state, dispatch),
    ],
    host,
  );
  const item = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")].find(
      (row) => row.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, item, viewId: view.id, pageId: PAGE };
}

describe("a view kept in the sidebar", () => {
  it("starts its new pages empty when Template is Empty", () => {
    const shown = rendered({ child: "template" });

    shown.item("Empty")?.click();

    expect(shown.sent).toContainEqual(
      expect.objectContaining({
        type: "settings.setSidebarView",
        changes: { templateId: null },
      }),
    );
  });

  it("lists the view's pages under the database's name", () => {
    const { host } = rendered();

    expect(host.querySelector(".sidebar__view-name")?.textContent).toContain(
      "Tasks",
    );
    expect(host.querySelectorAll(".sidebar__view .sidebar__item")).toHaveLength(
      1,
    );
  });

  it("opens a page beside the open page, as Notion's", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".sidebar__view .sidebar__item")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "row.open", mode: "side" }),
    ]);
  });

  it("adds a page, opens the database and folds", () => {
    const { host, sent, pageId } = rendered();
    const button = (label: string) =>
      host.querySelector<HTMLElement>(`[aria-label='${label}']`);

    button("Add a page")?.click();
    button("Open")?.click();
    host.querySelector<HTMLElement>(".sidebar__view-name")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "row.add", databaseId: pageId }),
      expect.objectContaining({ type: "ui.setActivePage", pageId }),
      expect.objectContaining({ type: "ui.setActiveView", databaseId: pageId }),
      expect.objectContaining({
        type: "settings.setSidebarView",
        changes: { isCollapsed: true },
      }),
    ]);
  });

  it("lists Notion's actions in its menu", () => {
    const { host } = rendered({});
    const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
      label.textContent.trim(),
    );

    expect(labels).toEqual([
      "Rename",
      "Open in",
      "Show",
      "Show page icon",
      "Source",
      "View",
      "Template",
      "Remove section",
    ]);
  });

  it("shows 10 pages, and removes the section", () => {
    const shown = rendered({ child: "show" });
    const { viewId } = shown;

    shown.item("10")?.click();
    shown.item("Remove section")?.click();

    expect(shown.sent).toContainEqual(
      expect.objectContaining({
        type: "settings.setSidebarView",
        changes: { limit: 10 },
      }),
    );
    expect(shown.sent).toContainEqual(
      expect.objectContaining({ type: "settings.removeSidebarView", viewId }),
    );
  });
});
