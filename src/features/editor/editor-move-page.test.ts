import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import { turnIntoPage } from "./editor-convert.commands.ts";
import { copyBlockTo } from "./editor-insert.commands.ts";
import { moveBlocksToPage } from "./editor-move.commands.ts";

const A = toBlockId("a");
const B = toBlockId("b");
const OTHER = toBlockId("other");
const other = { id: "other", children: [text("x", "there")] };

describe("block.moveToPage", () => {
  it("moves a block with its children to the end of another page", () => {
    const { dispatch, outline } = createApp(
      [
        { ...text("a", "one"), children: [text("a1", "inner")] },
        text("b", "two"),
      ],
      [other],
    );

    dispatch(moveBlocksToPage.create({ blockIds: [A], pageId: OTHER }));

    expect(outline()).toEqual(["paragraph:two"]);
    expect(outline(OTHER)).toEqual([
      "paragraph:there",
      "paragraph:one",
      "  paragraph:inner",
    ]);
  });

  it("keeps the order of several moved blocks", () => {
    const { dispatch, outline } = createApp(
      [text("a", "one"), text("b", "two")],
      [other],
    );

    dispatch(moveBlocksToPage.create({ blockIds: [B, A], pageId: OTHER }));

    expect(outline(OTHER)).toEqual([
      "paragraph:there",
      "paragraph:two",
      "paragraph:one",
    ]);
  });

  it("moves a block inside another moved block along with it", () => {
    const { dispatch, outline } = createApp(
      [{ ...text("a", "one"), children: [text("a1", "inner")] }],
      [other],
    );
    const blockIds = [A, toBlockId("a1")];

    dispatch(moveBlocksToPage.create({ blockIds, pageId: OTHER }));

    expect(outline(OTHER)).toEqual([
      "paragraph:there",
      "paragraph:one",
      "  paragraph:inner",
    ]);
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createApp([text("a", "one")], [other]);
    const before = store.getState().workspace;
    dispatch(moveBlocksToPage.create({ blockIds: [A], pageId: OTHER }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});

describe("block.copyTo", () => {
  it("puts a copy of the block and its children at the drop", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "one"), children: [text("a1", "inner")] },
      text("b", "two"),
    ]);

    dispatch(
      copyBlockTo.create({
        blockId: A,
        targetId: B,
        position: "after",
        blockCount: 2,
      }),
    );

    expect(outline()).toEqual([
      "paragraph:one",
      "  paragraph:inner",
      "paragraph:two",
      "paragraph:one",
      "  paragraph:inner",
    ]);
  });

  it("puts the copy after a block that cannot hold blocks", () => {
    const divider = { id: "d", type: "divider", props: {} };
    const { store, dispatch } = createApp([text("a", "one"), divider]);
    const drop = { targetId: toBlockId("d"), position: "inside" } as const;

    dispatch(copyBlockTo.create({ blockId: A, ...drop, blockCount: 1 }));

    expect(store.getState().workspace.blocks[PAGE]?.childIds).toEqual([
      A,
      toBlockId("d"),
      toBlockId("new-1"),
    ]);
  });
});

describe("block.turnIntoPage", () => {
  it("makes a page titled with the text that holds the children", () => {
    const { store, dispatch } = createApp([
      { ...text("a", "Plan"), children: [text("a1", "Step")] },
    ]);

    dispatch(turnIntoPage.create({ blockId: A }));

    const page = store.getState().workspace.blocks[A];
    expect(page).toMatchObject({
      type: "page",
      parentId: PAGE,
      childIds: [toBlockId("a1")],
      props: { title: [{ text: "Plan" }], icon: null, isTrashed: false },
    });
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createApp([text("a", "Plan")]);
    const before = store.getState().workspace;
    dispatch(turnIntoPage.create({ blockId: A }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });

  it("leaves a block inside another block as it is", () => {
    const { store, dispatch } = createApp([
      { ...text("a", "one"), children: [text("a1", "inner")] },
    ]);
    const before = store.getState().workspace;

    dispatch(turnIntoPage.create({ blockId: toBlockId("a1") }));

    expect(store.getState().workspace).toBe(before);
  });
});
