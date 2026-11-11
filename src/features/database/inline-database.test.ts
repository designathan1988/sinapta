import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../blocks/database/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { createInlineDatabase } from "./inline-database.commands.ts";

const PAGE = toBlockId("page");

function createApp(text: string) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        { id: "a", type: "paragraph", props: { text: [{ text }] } },
        { id: "b", type: "paragraph", props: { text: [{ text: "after" }] } },
      ],
    },
  ]);
  return createTestApp({ workspace, commands: [createInlineDatabase] });
}

describe("database.createInline", () => {
  it("puts a database with a table view in the page after the block", () => {
    const { store, dispatch } = createApp("notes");

    dispatch(createInlineDatabase.create({ blockId: toBlockId("a") }));

    const state = store.getState();
    expect(state.workspace.blocks[PAGE]?.childIds).toEqual(["a", "new-1", "b"]);
    const database = selectDatabase(state, toBlockId("new-1"));
    expect(database?.props).toMatchObject({ isInline: true, properties: [] });
    expect(database?.props.viewIds).toHaveLength(1);
    expect(state.ui.activePageId).not.toBe("new-1");
  });

  it("takes the place of an empty line, in one undo step", () => {
    const { store, dispatch } = createApp("");
    const before = store.getState().workspace;

    dispatch(createInlineDatabase.create({ blockId: toBlockId("a") }));
    expect(store.getState().workspace.blocks[PAGE]?.childIds).toEqual([
      "new-1",
      "b",
    ]);
    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
