import { describe, expect, it } from "vitest";
import { createInitialState, type AppState } from "../../state/index.ts";
import {
  droppedKeys,
  movedKeys,
  selectHiddenSections,
  selectSections,
  selectShortcuts,
} from "./sidebar-layout.selectors.ts";

function withSettings(settings: Partial<AppState["workspace"]["settings"]>) {
  const state = createInitialState();
  return {
    ...state,
    workspace: {
      ...state.workspace,
      settings: { ...state.workspace.settings, ...settings },
    },
  };
}

describe("the sidebar's arrangement", () => {
  it("starts as Notion's: New page, New chat and New database, Favorites and Private", () => {
    const state = createInitialState();

    expect(selectShortcuts(state)).toEqual([
      "new-page",
      "new-chat",
      "new-database",
    ]);
    expect(selectSections(state)).toEqual(["favorites", "private"]);
    expect(selectHiddenSections(state)).toEqual([]);
  });

  it("leaves out what the owner removed and what no longer exists", () => {
    const state = withSettings({
      sidebarShortcuts: ["settings", "page:gone"],
      sidebarSections: ["private"],
    });

    expect(selectShortcuts(state)).toEqual(["settings"]);
    expect(selectSections(state)).toEqual(["private"]);
    expect(selectHiddenSections(state)).toEqual(["favorites"]);
  });

  it("moves a key a place, or onto another's place", () => {
    expect(movedKeys(["a", "b", "c"], "c", -1)).toEqual(["a", "c", "b"]);
    expect(movedKeys(["a", "b"], "a", -1)).toEqual(["a", "b"]);
    expect(droppedKeys(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
    expect(droppedKeys(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  });
});
