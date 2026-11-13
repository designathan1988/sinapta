import { describe, expect, it } from "vitest";
import {
  setFavoritesLimit,
  setSidebarSections,
  setSidebarShortcuts,
} from "./sidebar-layout.commands.ts";
import { createTestApp } from "./state-builder.ts";

function app() {
  const test = createTestApp({
    commands: [setSidebarShortcuts, setSidebarSections, setFavoritesLimit],
  });
  const settings = () => test.store.getState().workspace.settings;
  return { ...test, settings };
}

describe("the sidebar as the owner arranges it", () => {
  it("keeps shortcuts and sections in order, each once, outside undo", () => {
    const { dispatch, settings } = app();

    dispatch(
      setSidebarShortcuts.create({
        keys: ["settings", "new-page", "settings"],
      }),
    );
    dispatch(setSidebarSections.create({ keys: ["private", "favorites"] }));
    dispatch({ type: "history.undo" });

    expect(settings().sidebarShortcuts).toEqual(["settings", "new-page"]);
    expect(settings().sidebarSections).toEqual(["private", "favorites"]);
  });

  it("sets how many favorites the sidebar lists", () => {
    const { dispatch, settings } = app();

    dispatch(setFavoritesLimit.create({ limit: 10 }));

    expect(settings().favoritesLimit).toBe(10);
  });
});
