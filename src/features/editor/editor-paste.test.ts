import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../state/index.ts";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { pasteLines } from "./editor-paste.commands.ts";

const A = toBlockId("a");
const plain = (value: string) => [{ text: value }];

describe("block.pasteLines", () => {
  it("puts each pasted line in a block of its own", () => {
    const { store, dispatch, outline } = createApp([text("a", "Hello world")]);

    dispatch(
      pasteLines.create({
        blockId: A,
        start: 5,
        end: 5,
        lines: [plain(" one"), plain("two"), plain("three")],
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
      pasteLines.create({
        blockId: A,
        start: 4,
        end: 7,
        lines: [plain("x"), plain("y")],
      }),
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
      pasteLines.create({
        blockId: A,
        start: 5,
        end: 5,
        lines: [plain("1"), plain("2")],
      }),
    );

    dispatch({ type: UNDO_COMMAND });

    expect(outline()).toEqual(["paragraph:Hello"]);
  });

  it("puts one pasted line inside the text and the caret after it", () => {
    const { store, dispatch, outline } = createApp([text("a", "Hello world")]);

    dispatch(
      pasteLines.create({ blockId: A, start: 5, end: 5, lines: [plain(",")] }),
    );

    expect(outline()).toEqual(["paragraph:Hello, world"]);
    expect(store.getState().ui.selection).toMatchObject({
      blockId: A,
      focusOffset: 6,
    });
  });

  it("keeps the marks and links of what is pasted", () => {
    const { store, dispatch } = createApp([text("a", "ab")]);
    const bold = { text: "B", marks: ["bold" as const] };
    const link = { text: "L", href: "https://example.com/" };

    dispatch(
      pasteLines.create({
        blockId: A,
        start: 1,
        end: 1,
        lines: [[bold, link]],
      }),
    );

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "a" },
      bold,
      link,
      { text: "b" },
    ]);
  });
});
