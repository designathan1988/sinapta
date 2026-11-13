import { describe, expect, it } from "vitest";
import { buildWorkspace, parseViewId, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { toPropertyId } from "./database-builder.ts";
import { emptyView } from "./database.commands.ts";
import {
  createLinkedView,
  linkedViewCommands,
  setLinkedViewSource,
} from "./linked-view.commands.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { createView, deleteView, setViewFilter } from "./view.commands.ts";

const SOURCE = toBlockId("db");
const LINKED = toBlockId("new-1");

function viewId(text: string) {
  const id = parseViewId(text);
  if (id === undefined) throw new Error("bad view id");
  return id;
}

function row(id: string, stage: string) {
  return {
    id,
    props: {
      title: [{ text: id }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values: { stage },
    },
  };
}

function createApp() {
  const blocks = buildWorkspace([
    {
      id: "page",
      children: [{ id: "a", type: "paragraph", props: { text: [] } }],
    },
    {
      id: "db",
      type: "database",
      props: {
        title: [{ text: "Tasks" }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
        properties: [{ id: "stage", name: "Stage", type: "text" }],
        viewIds: ["source-view"],
        templateIds: [],
        defaultTemplateId: null,
      },
      children: [row("r1", "open"), row("r2", "done")],
    },
  ]);
  const sourceView = emptyView(viewId("source-view"), SOURCE, "All");
  const workspace = { ...blocks, views: { [sourceView.id]: sourceView } };
  const app = createTestApp({
    workspace,
    commands: [...linkedViewCommands, createView, deleteView, setViewFilter],
  });
  app.dispatch(createLinkedView.create({ blockId: toBlockId("a") }));
  app.dispatch(
    setLinkedViewSource.create({ blockId: LINKED, databaseId: SOURCE }),
  );
  const linkedViews = (): readonly unknown[] => {
    const props = app.store.getState().workspace.blocks[LINKED]?.props;
    return Array.isArray(props?.viewIds) ? props.viewIds : [];
  };
  const sourceViews = () =>
    app.store.getState().workspace.blocks[SOURCE]?.props.viewIds;
  return { ...app, linkedViews, sourceViews };
}

describe("linked views", () => {
  it("shows the source's rows through a view of its own", () => {
    const { store, linkedViews, sourceViews } = createApp();

    const model = selectTableModel(store.getState(), LINKED);

    expect(model?.database.id).toBe(SOURCE);
    expect(model?.rows.map((each) => each.title)).toEqual(["r1", "r2"]);
    expect(linkedViews()).toHaveLength(1);
    expect(model?.viewIds).toEqual(linkedViews());
    expect(sourceViews()).toEqual(["source-view"]);
  });

  it("filters without changing the source's views", () => {
    const { store, dispatch, linkedViews } = createApp();
    const filter = {
      propertyId: toPropertyId("stage"),
      operator: "contains",
      value: "done",
    };

    dispatch(
      setViewFilter.create({
        viewId: viewId(String(linkedViews()[0])),
        filter: { conjunction: "and", items: [filter] },
      }),
    );

    const state = store.getState();
    const titles = selectTableModel(state, LINKED)?.rows.map((r) => r.title);
    expect(titles).toEqual(["r2"]);
    expect(selectTableModel(state, SOURCE)?.rows).toHaveLength(2);
  });

  it("adds and deletes views of its own", () => {
    const { dispatch, linkedViews, sourceViews } = createApp();
    const [first] = linkedViews();

    dispatch(createView.create({ databaseId: LINKED, name: "Board" }));
    expect(linkedViews()).toHaveLength(2);
    dispatch(deleteView.create({ viewId: viewId(String(linkedViews()[1])) }));

    expect(linkedViews()).toEqual([first]);
    expect(sourceViews()).toEqual(["source-view"]);
  });
});

describe("a new linked view", () => {
  it("opens its database chooser at once, as Notion's", () => {
    const blocks = buildWorkspace([
      {
        id: "page",
        props: { title: [], icon: null, isFavorite: false, isTrashed: false },
        children: [{ id: "a", type: "paragraph", props: { text: [] } }],
      },
    ]);
    const app = createTestApp({
      workspace: blocks,
      commands: [...linkedViewCommands],
    });

    app.dispatch(createLinkedView.create({ blockId: toBlockId("a") }));

    expect(app.store.getState().ui.overlay).toEqual({
      kind: "select",
      anchorId: `linked-${LINKED}`,
    });
  });
});
