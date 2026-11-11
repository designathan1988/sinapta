import { describe, expect, it } from "vitest";
import { SIDEBAR_WIDTH } from "./app-state.ts";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import { createTestApp } from "./state-builder.ts";
import { restoreUi, toPersistedUi } from "./ui.schema.ts";
import { loadWorkspace } from "./workspace.commands.ts";
import { selectIsHomeShown } from "./app-state.selectors.ts";
import {
  closeOverlay,
  openHome,
  openOverlay,
  setActivePage,
  setSidebarWidth,
  togglePageExpanded,
  toggleSidebar,
  uiCommands,
} from "./ui.commands.ts";

function createApp() {
  return createTestApp({ commands: uiCommands });
}

describe("ui commands", () => {
  it("sets the sidebar width", () => {
    const { store, dispatch } = createApp();

    dispatch(setSidebarWidth.create({ width: 20 }));

    expect(store.getState().ui.sidebarWidth).toBe(20);
  });

  it.each([
    [1, SIDEBAR_WIDTH.min],
    [999, SIDEBAR_WIDTH.max],
  ])("clamps a sidebar width of %i to %i", (width, expected) => {
    const { store, dispatch } = createApp();

    dispatch(setSidebarWidth.create({ width }));

    expect(store.getState().ui.sidebarWidth).toBe(expected);
  });

  it("toggles the collapsed flag", () => {
    const { store, dispatch } = createApp();

    dispatch(toggleSidebar.create({}));

    expect(store.getState().ui.isSidebarCollapsed).toBe(true);
  });

  it("replaces an overlay that is already open", () => {
    const { store, dispatch } = createApp();
    dispatch(openOverlay.create({ overlay: { kind: "first" } }));

    dispatch(openOverlay.create({ overlay: { kind: "second" } }));

    expect(store.getState().ui.overlay).toEqual({ kind: "second" });
  });

  it("closes the open overlay", () => {
    const { store, dispatch } = createApp();
    dispatch(openOverlay.create({ overlay: { kind: "settings" } }));

    dispatch(closeOverlay.create({}));

    expect(store.getState().ui.overlay).toBeNull();
  });

  it("opens a page that exists", () => {
    const workspace = buildWorkspace([{ id: "a" }]);
    const { store, dispatch } = createTestApp({
      workspace,
      commands: uiCommands,
    });

    dispatch(setActivePage.create({ pageId: toBlockId("a") }));

    expect(store.getState().ui.activePageId).toBe("a");
  });

  it("does not open a page that does not exist", () => {
    const { store, dispatch } = createApp();

    dispatch(setActivePage.create({ pageId: toBlockId("ghost") }));

    expect(store.getState().ui.activePageId).toBeNull();
  });

  it("expands a page in the tree and collapses it again", () => {
    const { store, dispatch } = createApp();
    const pageId = toBlockId("a");

    dispatch(togglePageExpanded.create({ pageId }));
    expect(store.getState().ui.expandedPageIds).toEqual([pageId]);
    dispatch(togglePageExpanded.create({ pageId }));

    expect(store.getState().ui.expandedPageIds).toEqual([]);
  });
});

describe("recent pages and home", () => {
  function appWithPages(count: number) {
    const ids = Array.from({ length: count }, (_, i) => `p${String(i)}`);
    const workspace = buildWorkspace(ids.map((id) => ({ id })));
    return createTestApp({ workspace, commands: uiCommands });
  }

  it("remembers opened pages newest first, without repeats, at most 20", () => {
    const { store, dispatch } = appWithPages(25);
    const open = (index: number) =>
      dispatch(
        setActivePage.create({ pageId: toBlockId(`p${String(index)}`) }),
      );

    for (let index = 0; index < 25; index += 1) open(index);
    open(10);

    const recent = store.getState().ui.recentPageIds;
    expect(recent).toHaveLength(20);
    expect(recent.slice(0, 2)).toEqual(["p10", "p24"]);
    expect(new Set(recent).size).toBe(20);
  });

  it("opens home, and leaves it when a page opens, even the same page", () => {
    const { store, dispatch } = appWithPages(1);
    const pageId = toBlockId("p0");
    dispatch(setActivePage.create({ pageId }));

    dispatch(openHome.create({}));
    expect(store.getState().ui.isHomeOpen).toBe(true);

    dispatch(setActivePage.create({ pageId }));
    expect(store.getState().ui.isHomeOpen).toBe(false);
  });

  it("keeps recent pages and home across a reload", () => {
    const { store, dispatch } = appWithPages(1);
    dispatch(setActivePage.create({ pageId: toBlockId("p0") }));
    dispatch(openHome.create({}));

    const restored = restoreUi(toPersistedUi(store.getState().ui));

    expect(restored.recentPageIds).toEqual(["p0"]);
    expect(restored.isHomeOpen).toBe(true);
  });

  it("records the page already open when it is opened again", () => {
    const pageId = toBlockId("p0");
    const workspace = buildWorkspace([{ id: "p0" }]);
    const { store, dispatch } = createTestApp({
      commands: [...uiCommands, loadWorkspace],
    });
    const ui = { ...store.getState().ui, activePageId: pageId };
    dispatch(loadWorkspace.create({ workspace, ui, skippedCount: 0 }));

    dispatch(setActivePage.create({ pageId }));

    expect(store.getState().ui.recentPageIds).toEqual(["p0"]);
  });

  it("hides Home as soon as any command opens a page", () => {
    const { store, dispatch } = appWithPages(1);
    dispatch(openHome.create({}));
    expect(selectIsHomeShown(store.getState())).toBe(true);
    expect(store.getState().ui.activePageId).toBeNull();

    const ui = { ...store.getState().ui, activePageId: toBlockId("p0") };

    expect(selectIsHomeShown({ ...store.getState(), ui })).toBe(false);
  });
});
