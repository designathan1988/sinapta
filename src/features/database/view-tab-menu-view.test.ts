// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ViewTabStyle } from "../../model/index.ts";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { VIEW_TAB_MENU_OVERLAY } from "./view-tabs.view.ts";
import { createView, setActiveView } from "./view.commands.ts";

interface Setup {
  readonly style?: ViewTabStyle;
  readonly child?: string;
  readonly isOpen?: boolean;
}

// A database open as its page, with a Table and a Board view, the Table
// open; the tab menu open when asked.
function rendered(setup: Setup = {}) {
  const app = createDatabaseApp([], []);
  const { databaseId } = app;
  app.dispatch(
    createView.create({ databaseId, name: "Board", viewType: "board" }),
  );
  const table = app.database().props.viewIds[0];
  if (table !== undefined)
    app.dispatch(setActiveView.create({ databaseId, viewId: table }));
  const stored = app.store.getState();
  // The style is the owner's setting, outside the database's commands.
  const settings = { ...stored.workspace.settings, viewTabStyle: setup.style };
  const built = { ...stored, workspace: { ...stored.workspace, settings } };
  const overlay: OpenOverlay | null =
    setup.isOpen === true
      ? {
          kind: VIEW_TAB_MENU_OVERLAY,
          anchorId: databaseId,
          ...(setup.child !== undefined && {
            children: [{ anchorId: setup.child }],
          }),
        }
      : null;
  const ui = { ...built.ui, overlay, activePageId: databaseId };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const tabs = [...host.querySelectorAll<HTMLElement>(".database__tab")];
  const item = (label: string) =>
    [...document.querySelectorAll<HTMLElement>("[role^=menuitem]")].find(
      (row) => row.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, tabs, item, databaseId };
}

describe("the open view's tab menu", () => {
  it("opens from the open view's tab, while another tab opens its view", () => {
    const { tabs, sent, databaseId } = rendered();

    tabs[0]?.click();
    tabs[1]?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: VIEW_TAB_MENU_OVERLAY, anchorId: databaseId },
      }),
      expect.objectContaining({ type: "ui.setActiveView" }),
    ]);
  });

  it("lists Notion's actions in order", () => {
    const { host } = rendered({ isOpen: true });
    const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
      label.textContent.trim(),
    );

    expect(labels).toEqual([
      "Rename",
      "Display as",
      "Edit view",
      "Source",
      "Copy link to view",
      "Add view to sidebar",
      "Duplicate view",
      "Delete view",
    ]);
  });

  it("draws Notion's icons beside Rename, Display as and Source", () => {
    const { item } = rendered({ isOpen: true });
    const icon = (label: string) =>
      item(label)?.querySelector(".icon")?.getAttribute("data-icon");

    expect(icon("Rename")).toBe("pencil");
    expect(icon("Display as")).toBe("brush");
    expect(icon("Source")).toBe("source");
  });

  it("shows tabs as text only from Show as, for the owner alone", () => {
    const { item, sent } = rendered({
      isOpen: true,
      child: "view-tab-show-as",
    });

    item("Text only")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "settings.setViewTabStyle",
        style: "text",
      }),
    );
    expect(document.body.textContent).toContain("Only applies to you");
  });

  it("keeps the view in the sidebar", () => {
    const { item, sent } = rendered({ isOpen: true });

    item("Add view to sidebar")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "settings.addSidebarView" }),
    );
  });

  it("shows the database the view reads beside Source", () => {
    const { item } = rendered({ isOpen: true });

    expect(item("Source")?.textContent).toContain("Untitled database");
  });

  it("duplicates the view", () => {
    const { item, sent } = rendered({ isOpen: true });

    item("Duplicate view")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "view.duplicate" }),
    );
  });
});

describe("view tabs as the owner shows them", () => {
  it("hides icons with text only, and names with icon only", () => {
    const text = rendered({ style: "text" }).tabs[0];
    expect(text?.querySelector(".icon")).toBeNull();
    expect(text?.textContent.trim()).toBe("Table");

    const icon = rendered({ style: "icon" }).tabs[0];
    expect(icon?.querySelector(".icon")).not.toBeNull();
    expect(icon?.textContent.trim()).toBe("");
    expect(icon?.getAttribute("aria-label")).toBe("Table");
  });
});
