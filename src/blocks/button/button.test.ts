import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  buttonCommands,
  pressButton,
  selectPressSize,
} from "./button.commands.ts";
import type { ButtonAction } from "./button.schema.ts";

const PAGE = toBlockId("page");
const BUTTON = toBlockId("b");
const DATABASE = toBlockId("db");

function createApp(actions: ButtonAction[]) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        { id: "b", type: "button", props: { label: "Go", actions } },
        { id: "after", type: "paragraph", props: { text: [] } },
      ],
    },
    { id: "db", type: "database", props: { title: [] } },
    { id: "target", props: { title: [] } },
  ]);
  const app = createTestApp({ workspace, commands: buttonCommands });
  const press = () => {
    const blockCount = selectPressSize(app.store.getState(), BUTTON);
    app.dispatch(pressButton.create({ blockId: BUTTON, blockCount }));
  };
  return { ...app, press };
}

const insert: ButtonAction = {
  kind: "insert-blocks",
  blocks: [
    { type: "heading", text: [{ text: "Notes" }], level: 2 },
    { type: "to-do", text: [{ text: "Follow up" }] },
  ],
};

describe("button.press", () => {
  it("inserts a copy of the template blocks below the button", () => {
    const { store, press } = createApp([insert]);

    press();
    press();

    const { blocks } = store.getState().workspace;
    expect(blocks[PAGE]?.childIds).toEqual([
      "b",
      "new-3",
      "new-4",
      "new-1",
      "new-2",
      "after",
    ]);
    expect(blocks[toBlockId("new-1")]).toMatchObject({
      type: "heading",
      props: { text: [{ text: "Notes" }], level: 2 },
    });
    expect(blocks[toBlockId("new-2")]).toMatchObject({
      type: "to-do",
      props: { isChecked: false },
    });
  });

  it("adds a row with the values to a database", () => {
    const values = { status: "Open" };
    const { store, press } = createApp([
      { kind: "add-row", databaseId: DATABASE, values },
    ]);

    press();

    const { blocks } = store.getState().workspace;
    expect(blocks[DATABASE]?.childIds).toEqual(["new-1"]);
    expect(blocks[toBlockId("new-1")]?.props).toMatchObject({ values });
  });

  it("runs every action in one step that one undo takes back", () => {
    const { store, dispatch, press } = createApp([
      insert,
      { kind: "add-row", databaseId: DATABASE, values: {} },
      { kind: "open-page", pageId: toBlockId("target") },
    ]);
    const before = store.getState().workspace;

    press();
    expect(store.getState().ui.activePageId).toBe("target");
    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
