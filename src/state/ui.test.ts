import { describe, expect, it } from "vitest";
import { SIDEBAR_WIDTH } from "./app-state.ts";
import { createTestApp } from "./state-builder.ts";
import {
  closeOverlay,
  openOverlay,
  setSidebarWidth,
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
});
