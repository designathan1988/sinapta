import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp, uiCommands, setActivePage } from "../../state/index.ts";
import { movePage, pageMoveCommands } from "./page-move.commands.ts";
import {
  deletePage,
  pageTrashCommands,
  restorePage,
  trashPage,
} from "./page-trash.commands.ts";
import {
  pageCommands,
  setPageIcon,
  togglePageFavorite,
} from "./page.commands.ts";
import {
  selectBreadcrumbs,
  selectFavoritePages,
  selectPage,
  selectTrashedPages,
} from "./page.selectors.ts";

const A = toBlockId("a");
const A1 = toBlockId("a1");
const A2 = toBlockId("a2");
const B = toBlockId("b");

const props = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "a",
      props: props("Alpha"),
      children: [
        { id: "a1", props: props("One") },
        { id: "a2", props: props("Two") },
      ],
    },
    { id: "b", props: props("Beta") },
  ]);
  const commands = [
    ...pageCommands,
    ...pageTrashCommands,
    ...pageMoveCommands,
    ...uiCommands,
  ];
  return createTestApp({ workspace, commands });
}

describe("page tree commands", () => {
  it("sets and removes a page icon", () => {
    const { store, dispatch } = createApp();

    dispatch(setPageIcon.create({ pageId: A, icon: "📌" }));
    expect(selectPage(store.getState(), A)?.props.icon).toBe("📌");
    dispatch(setPageIcon.create({ pageId: A, icon: null }));

    expect(selectPage(store.getState(), A)?.props.icon).toBeNull();
  });

  it("lists favorite pages by title", () => {
    const { store, dispatch } = createApp();

    dispatch(togglePageFavorite.create({ pageId: B }));
    dispatch(togglePageFavorite.create({ pageId: A1 }));

    const titles = selectFavoritePages(store.getState()).map((page) => page.id);
    expect(titles).toEqual([B, A1]);
  });

  it("trashes a page and closes it when it was open", () => {
    const { store, dispatch } = createApp();
    dispatch(setActivePage.create({ pageId: A1 }));

    dispatch(trashPage.create({ pageId: A }));

    const state = store.getState();
    expect(selectTrashedPages(state).map((page) => page.id)).toEqual([A]);
    expect(state.ui.activePageId).toBeNull();
    expect(state.workspace.blocks[A1]).toBeDefined();
  });

  it("leaves favorites inside a trashed page out of the favorites list", () => {
    const { store, dispatch } = createApp();
    dispatch(togglePageFavorite.create({ pageId: A1 }));

    dispatch(trashPage.create({ pageId: A }));

    expect(selectFavoritePages(store.getState())).toEqual([]);
  });

  it("restores a trashed page", () => {
    const { store, dispatch } = createApp();
    dispatch(trashPage.create({ pageId: A }));

    dispatch(restorePage.create({ pageId: A }));

    expect(selectTrashedPages(store.getState())).toEqual([]);
  });

  it("deletes a trashed page with everything inside it", () => {
    const { store, dispatch } = createApp();
    dispatch(trashPage.create({ pageId: A }));

    const result = dispatch(deletePage.create({ pageId: A }));

    expect(result).toEqual({ ok: true });
    expect(Object.keys(store.getState().workspace.blocks)).toEqual([B]);
    expect(store.getState().workspace.rootIds).toEqual([B]);
  });

  it("does not delete a page that is not in the trash", () => {
    const { store, dispatch } = createApp();

    dispatch(deletePage.create({ pageId: A }));

    expect(store.getState().workspace.blocks[A]).toBeDefined();
  });

  it("brings a deleted page back with undo", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;
    dispatch(trashPage.create({ pageId: A }));
    dispatch(deletePage.create({ pageId: A }));

    dispatch({ type: "history.undo" });
    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });

  it("moves a page within its siblings", () => {
    const { store, dispatch } = createApp();

    dispatch(movePage.create({ pageId: A2, parentId: A, index: 0 }));

    expect(store.getState().workspace.blocks[A]?.childIds).toEqual([A2, A1]);
  });

  it("moves a page to another parent and expands it", () => {
    const { store, dispatch } = createApp();

    const result = dispatch(
      movePage.create({ pageId: A1, parentId: B, index: 0 }),
    );

    const state = store.getState();
    expect(result).toEqual({ ok: true });
    expect(state.workspace.blocks[B]?.childIds).toEqual([A1]);
    expect(state.workspace.blocks[A]?.childIds).toEqual([A2]);
    expect(state.workspace.blocks[A1]?.parentId).toBe(B);
    expect(state.ui.expandedPageIds).toContain(B);
  });

  it("moves a page to the top level", () => {
    const { store, dispatch } = createApp();

    dispatch(movePage.create({ pageId: A1, parentId: null, index: 1 }));

    expect(store.getState().workspace.rootIds).toEqual([A, A1, B]);
  });

  it("does not move a page into itself or its own descendants", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;

    dispatch(movePage.create({ pageId: A, parentId: A1, index: 0 }));

    expect(store.getState().workspace).toBe(before);
  });

  it("lists the pages from the top level down to a page", () => {
    const { store } = createApp();

    const trail = selectBreadcrumbs(store.getState(), A1).map(
      (page) => page.id,
    );

    expect(trail).toEqual([A, A1]);
  });
});
