import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  parseViewId,
  toBlockId,
  type View,
} from "../../model/index.ts";
import { createTestApp, UNDO_COMMAND } from "../../state/index.ts";
import {
  duplicatePage,
  pageDuplicateCommands,
  selectPageCopySize,
} from "./page-duplicate.commands.ts";

const A = toBlockId("a");
const VIEW = parseViewId("v1");

function createApp() {
  const pageProps = (title: string) => ({
    title: [{ text: title }],
    icon: null,
    isFavorite: true,
    isTrashed: false,
  });
  const base = buildWorkspace([
    {
      id: "a",
      props: pageProps("Plan"),
      children: [
        { id: "p", type: "paragraph", props: { text: [{ text: "Hi" }] } },
        { id: "s", props: pageProps("Sub") },
        {
          id: "d",
          type: "database",
          props: { ...pageProps("Tasks"), properties: [], viewIds: ["v1"] },
        },
      ],
    },
  ]);
  if (VIEW === undefined) throw new Error("bad view id");
  const view: View = {
    id: VIEW,
    databaseId: toBlockId("d"),
    name: "Table",
    type: "table",
    sorts: [],
    filter: { conjunction: "and", items: [] },
    propertyOrder: [],
    propertyWidths: {},
    hiddenPropertyIds: [],
    calculations: {},
    wrappedPropertyIds: [],
    frozenCount: 0,
    cardSize: "medium",
    cardPreview: "cover",
    colorColumns: true,
    calendar: { mode: "month", showWeekends: true, weekStartsOn: 0 },
  };
  const workspace = { ...base, views: { [VIEW]: view } };
  return createTestApp({ workspace, commands: pageDuplicateCommands });
}

describe("page.duplicate", () => {
  it("copies the page with its blocks, subpages and databases, after the page", () => {
    const { store, dispatch } = createApp();
    const size = selectPageCopySize(store.getState(), A);

    dispatch(duplicatePage.create({ pageId: A, ...size }));

    const { workspace, ui } = store.getState();
    const copy = toBlockId("new-1");
    expect(size).toEqual({ blockCount: 4, viewCount: 1 });
    expect(workspace.rootIds).toEqual([A, copy]);
    expect(workspace.blocks[copy]?.props).toMatchObject({
      title: [{ text: "Plan (copy)" }],
      isFavorite: false,
    });
    expect(workspace.blocks[copy]?.childIds).toHaveLength(3);
    const database = toBlockId("new-4");
    const views = Object.values(workspace.views);
    const viewCopy = views.find((view) => view.databaseId === database);
    expect(views.map((view) => view.databaseId)).toEqual(["d", database]);
    expect(workspace.blocks[database]?.props.viewIds).toEqual([viewCopy?.id]);
    expect(ui.activePageId).toBe(copy);
  });

  it("names the copy of an untitled page as an untitled copy", () => {
    const { store, dispatch } = createTestApp({
      workspace: buildWorkspace([
        {
          id: "u",
          props: { title: [], icon: null, isFavorite: false, isTrashed: false },
        },
      ]),
      commands: pageDuplicateCommands,
    });
    const pageId = toBlockId("u");

    dispatch(
      duplicatePage.create({
        pageId,
        ...selectPageCopySize(store.getState(), pageId),
      }),
    );

    expect(
      store.getState().workspace.blocks[toBlockId("new-1")]?.props.title,
    ).toEqual([{ text: "Untitled (copy)" }]);
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;

    const size = selectPageCopySize(store.getState(), A);
    dispatch(duplicatePage.create({ pageId: A, ...size }));
    dispatch({ type: UNDO_COMMAND });

    expect(store.getState().workspace.rootIds).toEqual(before.rootIds);
    expect(Object.keys(store.getState().workspace.views)).toEqual(["v1"]);
  });
});
