import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import { selectIsSidebarShown } from "./app-state.selectors.ts";
import { createTestApp } from "./state-builder.ts";
import {
  openHome,
  setActivePage,
  toggleSidebar,
  uiCommands,
} from "./ui.commands.ts";
import { setNarrow } from "./viewport.commands.ts";

const PAGE = toBlockId("page");

function createApp() {
  const workspace = buildWorkspace([{ id: "page" }]);
  return createTestApp({ workspace, commands: uiCommands });
}

describe("the sidebar on a narrow window", () => {
  it("is a drawer that starts closed", () => {
    const { store, dispatch } = createApp();

    dispatch(setNarrow.create({ isNarrow: true }));

    expect(store.getState().ui.isNarrow).toBe(true);
    expect(selectIsSidebarShown(store.getState())).toBe(false);
  });

  it("opens and closes from the sidebar button, leaving the wide sidebar as it was", () => {
    const { store, dispatch } = createApp();
    dispatch(setNarrow.create({ isNarrow: true }));

    dispatch(toggleSidebar.create({}));
    expect(selectIsSidebarShown(store.getState())).toBe(true);
    expect(store.getState().ui.isSidebarCollapsed).toBe(false);

    dispatch(toggleSidebar.create({}));
    expect(selectIsSidebarShown(store.getState())).toBe(false);
  });

  it.each([
    ["a page", () => setActivePage.create({ pageId: PAGE })],
    ["home", () => openHome.create({})],
  ])("closes when %s opens", (_name, opening) => {
    const { store, dispatch } = createApp();
    dispatch(setNarrow.create({ isNarrow: true }));
    dispatch(toggleSidebar.create({}));

    dispatch(opening());

    expect(selectIsSidebarShown(store.getState())).toBe(false);
  });

  it("gives the wide sidebar back when the window widens", () => {
    const { store, dispatch } = createApp();
    dispatch(setNarrow.create({ isNarrow: true }));

    dispatch(setNarrow.create({ isNarrow: false }));

    expect(selectIsSidebarShown(store.getState())).toBe(true);
  });
});
