import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../state/index.ts";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { pasteLines } from "./editor-paste.commands.ts";

const A = toBlockId("a");

describe("block.pasteLines", () => {
  it("puts each pasted line in a block of its own", () => {
    const { store, dispatch, outline } = createApp([text("a", "Hello world")]);

    dispatch(
      pasteLines.create({
        blockId: A,
        start: 5,
        end: 5,
        lines: [" one", "two", "three"],
      }),
    );

    expect(outline()).toEqual([
      "paragraph:Hello one",
      "paragraph:two",
      "paragraph:three world",
    ]);
    expect(store.getState().ui.selection).toEqual({
      blockId: toBlockId("new-2"),
      anchorOffset: 5,
      focusOffset: 5,
    });
  });

  it("replaces the selected text and continues a list as list items", () => {
    const { dispatch, outline } = createApp([
      text("a", "one two", "bulleted-list"),
      text("b", "after"),
    ]);

    dispatch(
      pasteLines.create({ blockId: A, start: 4, end: 7, lines: ["x", "y"] }),
    );

    expect(outline()).toEqual([
      "bulleted-list:one x",
      "bulleted-list:y",
      "paragraph:after",
    ]);
  });

  it("is undone in one step", () => {
    const { dispatch, outline } = createApp([text("a", "Hello")]);
    dispatch(
      pasteLines.create({ blockId: A, start: 5, end: 5, lines: ["1", "2"] }),
    );

    dispatch({ type: UNDO_COMMAND });

    expect(outline()).toEqual(["paragraph:Hello"]);
  });
});
