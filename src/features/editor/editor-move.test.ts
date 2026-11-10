import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import {
  deleteBlock,
  moveBlock,
  moveBlockBy,
  selectBlockDrop,
} from "./editor-move.commands.ts";

const A = toBlockId("a");
const B = toBlockId("b");
const C = toBlockId("c");
const divider = { id: "d", type: "divider", props: {} };

describe("block.move", () => {
  it("moves a block under another text block", () => {
    const { dispatch, outline } = createApp([
      text("a", "one"),
      text("b", "two"),
    ]);

    dispatch(moveBlock.create({ blockId: B, parentId: A, index: 0 }));

    expect(outline()).toEqual(["paragraph:one", "  paragraph:two"]);
  });

  it("does not move a block to the top level", () => {
    const { store, dispatch } = createApp([text("a", "one")]);
    const before = store.getState().workspace;

    dispatch(moveBlock.create({ blockId: A, parentId: null, index: 0 }));

    expect(store.getState().workspace).toBe(before);
  });

  it("does not move a block into one that cannot hold blocks", () => {
    const { store, dispatch } = createApp([text("a", "one"), divider]);
    const before = store.getState().workspace;

    dispatch(
      moveBlock.create({ blockId: A, parentId: toBlockId("d"), index: 0 }),
    );

    expect(store.getState().workspace).toBe(before);
  });
});

describe("selectBlockDrop", () => {
  it("drops after a block that cannot hold blocks instead of inside it", () => {
    const { store } = createApp([text("a", "one"), divider]);
    const drop = { targetId: toBlockId("d"), position: "inside" } as const;

    expect(selectBlockDrop(store.getState(), A, drop)).toEqual({
      blockId: A,
      parentId: PAGE,
      index: 1,
    });
  });
});

describe("block.moveBy", () => {
  it("moves a block down one place", () => {
    const { dispatch, outline } = createApp([
      text("a", "one"),
      text("b", "two"),
    ]);

    dispatch(moveBlockBy.create({ blockId: A, offset: 1 }));

    expect(outline()).toEqual(["paragraph:two", "paragraph:one"]);
  });

  it("leaves the first block in place when moved up", () => {
    const { dispatch, outline } = createApp([
      text("a", "one"),
      text("b", "two"),
    ]);

    dispatch(moveBlockBy.create({ blockId: A, offset: -1 }));

    expect(outline()).toEqual(["paragraph:one", "paragraph:two"]);
  });
});

describe("block.delete", () => {
  it("deletes a block with its children and moves the caret to the block before", () => {
    const { store, dispatch, outline } = createApp([
      text("a", "one"),
      { ...text("b", "two"), children: [text("c", "inside")] },
    ]);

    dispatch(deleteBlock.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:one"]);
    expect(store.getState().workspace.blocks[C]).toBeUndefined();
    expect(store.getState().ui.selection).toEqual({
      blockId: A,
      anchorOffset: 3,
      focusOffset: 3,
    });
  });

  it("restores the deleted blocks with undo", () => {
    const { store, dispatch } = createApp([text("a", "one"), text("b", "two")]);
    const before = store.getState().workspace;
    dispatch(deleteBlock.create({ blockId: B }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
