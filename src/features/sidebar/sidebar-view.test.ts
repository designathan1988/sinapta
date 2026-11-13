// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import {
  renderSidebarMenu,
  SIDEBAR_APPS_OVERLAY,
  SIDEBAR_WORKSPACE_OVERLAY,
} from "./sidebar-footer.view.ts";
import { renderSidebar } from "./sidebar.view.ts";

const props = { title: [], icon: null, isFavorite: false, isTrashed: false };

// A page with one page inside, and a page alone.
function stateOf(overlay: OpenOverlay | null = null): AppState {
  const state = createInitialState();
  return {
    ...state,
    ui: { ...state.ui, overlay },
    workspace: buildWorkspace([
      { id: "page", props, children: [{ id: "inner", props }] },
      { id: "alone", props },
    ]),
  };
}

function rendered(state: AppState = stateOf()) {
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderSidebar(state, dispatch), host);
  return { host, commands, dispatch };
}

function button(host: HTMLElement, label: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>("button")].find(
    (element) =>
      element.textContent.trim() === label ||
      element.getAttribute("aria-label") === label,
  );
}

// The rows of a footer menu, opened as the overlay.
function menuRows(kind: string) {
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderSidebarMenu(stateOf({ kind }), dispatch), host);
  const rows = [...host.querySelectorAll<HTMLElement>("[data-index]")];
  return { rows, commands, labels: rows.map((row) => row.textContent.trim()) };
}

describe("renderSidebar", () => {
  it("shows a page glyph for a page without an icon", () => {
    const icon = rendered().host.querySelector(".sidebar__row .sidebar__icon");

    expect(icon?.querySelector("svg")).not.toBeNull();
  });

  it("puts hiding the sidebar, the inbox and a new page in its top row", () => {
    const top = rendered().host.querySelector(".sidebar__top");

    expect(
      [...(top?.querySelectorAll("button") ?? [])].map((item) =>
        item.getAttribute("aria-label"),
      ),
    ).toEqual(["Hide sidebar", "Inbox", "New page"]);
  });

  it("opens the command palette from the Search field", () => {
    const { host, commands } = rendered();
    const search = host.querySelector<HTMLElement>(".sidebar__search");

    expect(search?.getAttribute("aria-keyshortcuts")).toBe("Control+K");
    search?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "command-palette" },
      }),
    ]);
  });

  it("titles the page tree as a section for screen readers", () => {
    const headings = [...rendered().host.querySelectorAll("h2")].map((h) =>
      h.textContent.trim(),
    );

    expect(headings).toContain("Private");
  });

  it("shows a page's icon where its chevron appears, as Notion's", () => {
    const rows = [
      ...rendered().host.querySelectorAll<HTMLElement>("[role=treeitem]"),
    ];
    const [parent, alone] = rows;

    expect(
      parent?.querySelector(".sidebar__toggle .sidebar__icon"),
    ).not.toBeNull();
    expect(parent?.querySelector(".sidebar__toggle .icon")).not.toBeNull();
    expect(alone?.querySelector(".sidebar__toggle")).toBeNull();
    expect(alone?.querySelector(".sidebar__icon")).not.toBeNull();
  });

  it("opens a page's menu where its row is right-clicked", () => {
    const { host, commands } = rendered();
    const row = host.querySelector(".sidebar__row");

    row?.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 30,
        clientY: 40,
      }),
    );

    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: "page-menu",
          anchorId: "tree:page",
          point: { x: 30, y: 40 },
        },
      }),
    ]);
  });

  it("opens Home from the Home item", () => {
    const { host, commands } = rendered();

    button(host, "Home")?.click();

    expect(commands).toContainEqual(
      expect.objectContaining({ type: "ui.openHome" }),
    );
  });

  it("keeps the workspace, help and the apps menu at its foot", () => {
    const footer = rendered().host.querySelector(".sidebar__footer");

    expect(
      [...(footer?.querySelectorAll("button") ?? [])].map(
        (item) => item.getAttribute("aria-label") ?? item.textContent.trim(),
      ),
    ).toEqual([
      "Pagecraft",
      "Help and keyboard shortcuts",
      "Templates, trash and more",
    ]);
  });

  it("opens the keyboard shortcuts from the help button at its foot", () => {
    const { host, commands } = rendered();

    button(host, "Help and keyboard shortcuts")?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "shortcut-help" },
      }),
    ]);
  });

  it("opens the workspace and apps menus from their buttons", () => {
    const { host, commands } = rendered();

    button(host, "Pagecraft")?.click();
    button(host, "Templates, trash and more")?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        overlay: { kind: SIDEBAR_WORKSPACE_OVERLAY },
      }),
      expect.objectContaining({ overlay: { kind: SIDEBAR_APPS_OVERLAY } }),
    ]);
  });
});

describe("renderSidebarMenu", () => {
  it("offers Settings and Import in the workspace menu", () => {
    expect(menuRows(SIDEBAR_WORKSPACE_OVERLAY).labels).toEqual([
      "Settings",
      "Import",
    ]);
  });

  it("offers Templates and the trash in the apps menu, and opens them", () => {
    const { labels, rows, commands } = menuRows(SIDEBAR_APPS_OVERLAY);

    rows.at(-1)?.click();

    expect(labels).toEqual(["Templates", "Trash"]);
    expect(commands).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "trash" },
      }),
    );
  });
});
