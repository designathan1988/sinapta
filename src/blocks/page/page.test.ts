import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { createPage, pageCommands, renamePage } from "./page.commands.ts";
import { selectPage, selectPageTitle } from "./page.selectors.ts";

const A = toBlockId("a");
const NEW = toBlockId("new-1");

describe("page commands", () => {
  it("creates an untitled top-level page and opens it", () => {
    const { store, dispatch } = createTestApp({ commands: pageCommands });

    dispatch(createPage.create({ parentId: null }));

    const state = store.getState();
    expect(state.workspace.rootIds).toEqual([NEW]);
    expect(state.ui.activePageId).toBe(NEW);
    expect(selectPage(state, NEW)?.props).toEqual({
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
    });
  });

  it("creates a page inside another and expands the parent", () => {
    const workspace = buildWorkspace([{ id: "a" }]);
    const { store, dispatch } = createTestApp({
      workspace,
      commands: pageCommands,
    });

    dispatch(createPage.create({ parentId: A }));

    const state = store.getState();
    expect(state.workspace.blocks[A]?.childIds).toEqual([NEW]);
    expect(state.workspace.blocks[NEW]?.parentId).toBe(A);
    expect(state.ui.expandedPageIds).toEqual([A]);
  });

  it("creates a page at a place among its parent's blocks", () => {
    const workspace = buildWorkspace([
      { id: "p", children: [{ id: "x" }, { id: "y" }] },
    ]);
    const { store, dispatch } = createTestApp({
      workspace,
      commands: pageCommands,
    });

    dispatch(createPage.create({ parentId: toBlockId("p"), index: 1 }));

    expect(store.getState().workspace.blocks[toBlockId("p")]?.childIds).toEqual(
      ["x", "new-1", "y"],
    );
  });

  it("renames a page", () => {
    const { store, dispatch } = createTestApp({ commands: pageCommands });
    dispatch(createPage.create({ parentId: null }));

    dispatch(renamePage.create({ pageId: NEW, title: "Roadmap" }));

    const page = selectPage(store.getState(), NEW);
    expect(page && selectPageTitle(page)).toBe("Roadmap");
  });

  it("stores an empty title as no spans", () => {
    const { store, dispatch } = createTestApp({ commands: pageCommands });
    dispatch(createPage.create({ parentId: null }));
    dispatch(renamePage.create({ pageId: NEW, title: "Draft" }));

    dispatch(renamePage.create({ pageId: NEW, title: "" }));

    expect(selectPage(store.getState(), NEW)?.props.title).toEqual([]);
  });

  it("undoes creating a page", () => {
    const { store, dispatch } = createTestApp({ commands: pageCommands });
    dispatch(createPage.create({ parentId: null }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace.rootIds).toEqual([]);
  });
});
