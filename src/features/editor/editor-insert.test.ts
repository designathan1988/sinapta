import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { UNDO_COMMAND } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { duplicateBlock, insertBlockBelow } from "./editor-insert.commands.ts";

const A = toBlockId("a");
const NEW = toBlockId("new-1");

describe("block.insertBelow", () => {
  it("adds a paragraph with a slash after the block and opens the slash menu", () => {
    const { store, dispatch, outline } = createApp([
      text("a", "One"),
      text("b", "Two"),
    ]);

    dispatch(insertBlockBelow.create({ blockId: A }));

    expect(outline()).toEqual([
      "paragraph:One",
      "paragraph:/",
      "paragraph:Two",
    ]);
    expect(store.getState().ui.selection).toEqual({
      blockId: NEW,
      anchorOffset: 1,
      focusOffset: 1,
    });
    expect(store.getState().ui.overlay).toEqual({
      kind: "slash-menu",
      anchorId: NEW,
      start: 0,
    });
  });
});

describe("block.duplicate", () => {
  it("puts a copy with its children right after the block", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "One"), children: [text("a1", "Inner")] },
      text("b", "Two"),
    ]);

    dispatch(duplicateBlock.create({ blockId: A, blockCount: 2 }));

    expect(outline()).toEqual([
      "paragraph:One",
      "  paragraph:Inner",
      "paragraph:One",
      "  paragraph:Inner",
      "paragraph:Two",
    ]);
  });

  it("is undone in one step", () => {
    const { dispatch, outline } = createApp([text("a", "One")]);

    dispatch(duplicateBlock.create({ blockId: A, blockCount: 1 }));
    dispatch({ type: UNDO_COMMAND });

    expect(outline()).toEqual(["paragraph:One"]);
  });

  it("does nothing when the count does not match the block's tree", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "One"), children: [text("a1", "Inner")] },
    ]);

    dispatch(duplicateBlock.create({ blockId: A, blockCount: 1 }));

    expect(outline()).toEqual(["paragraph:One", "  paragraph:Inner"]);
  });
});
