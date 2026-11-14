// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type OpenOverlay,
} from "../../state/index.ts";
import { SIDEBAR_CUSTOMIZE_OVERLAY } from "./sidebar-customize.view.ts";
import { renderSidebar } from "./sidebar.view.ts";

const props = { title: [], icon: null, isFavorite: false, isTrashed: false };

// A workspace with one page; the sidebar customized when asked, with one
// of its menus open.
function rendered(options: { isCustomizing?: boolean; child?: string } = {}) {
  const state = createInitialState();
  const overlay: OpenOverlay | null =
    options.isCustomizing === true
      ? {
          kind: SIDEBAR_CUSTOMIZE_OVERLAY,
          ...(options.child !== undefined && {
            children: [{ anchorId: options.child }],
          }),
        }
      : null;
  const built: AppState = {
    ...state,
    ui: { ...state.ui, overlay },
    workspace: buildWorkspace([{ id: "page", props }]),
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSidebar(built, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const row = (label: string) =>
    [...host.querySelectorAll<HTMLElement>(".sidebar__edit-row")].find(
      (one) => one.querySelector(".sidebar__title")?.textContent === label,
    );
  const item = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")].find(
      (one) => one.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, row, item };
}

describe("Customize sidebar", () => {
  it("opens from the sidebar's foot", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".sidebar__customize-open")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: SIDEBAR_CUSTOMIZE_OVERLAY },
      }),
    ]);
  });

  it("lists each shortcut and section with a grip, then Done", () => {
    const { host } = rendered({ isCustomizing: true });
    const titles = [
      ...host.querySelectorAll(".sidebar__edit-row .sidebar__title"),
    ].map((title) => title.textContent);

    expect(titles).toEqual([
      "New page",
      "New chat",
      "New database",
      "Favorites",
      "Private",
    ]);
    expect(host.querySelectorAll(".sidebar__grip")).toHaveLength(5);
    expect(host.querySelector(".sidebar__edit-done")?.textContent.trim()).toBe(
      "Done",
    );
  });

  it("removes a shortcut, and Done ends the mode", () => {
    const { host, sent, row } = rendered({ isCustomizing: true });

    row("New database")
      ?.querySelector<HTMLElement>("[aria-label='Remove from sidebar']")
      ?.click();
    host.querySelector<HTMLElement>(".sidebar__edit-done")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "settings.setSidebarShortcuts",
        keys: ["new-page", "new-chat"],
      }),
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });

  it("moves a section down from its menu, as dragging it would", () => {
    const { sent, item } = rendered({
      isCustomizing: true,
      child: "sections-favorites",
    });

    item("Move down")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "settings.setSidebarSections",
        keys: ["private", "favorites"],
      }),
    );
  });

  it("adds Settings as a shortcut", () => {
    const { sent, item } = rendered({
      isCustomizing: true,
      child: "add-shortcut",
    });

    item("Settings")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "settings.setSidebarShortcuts",
        keys: ["new-page", "new-chat", "new-database", "settings"],
      }),
    );
  });
});
