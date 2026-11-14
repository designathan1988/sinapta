import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import {
  appendParagraph,
  indentBlock,
  mergeBlockBackward,
  outdentBlock,
  splitBlock,
} from "./editor-structure.commands.ts";
import { selectBlockOrder } from "./editor.selectors.ts";

const A = toBlockId("a");
const B = toBlockId("b");
const NEW = toBlockId("new-1");

describe("block.split", () => {
  it("moves the text after the caret to a new block below", () => {
    const { store, dispatch, outline } = createApp([
      text("a", "Hello world"),
      text("b", "next"),
    ]);

    dispatch(splitBlock.create({ blockId: A, offset: 5 }));

    expect(outline()).toEqual([
      "paragraph:Hello",
      "paragraph: world",
      "paragraph:next",
    ]);
    expect(store.getState().ui.selection).toEqual({
      blockId: NEW,
      anchorOffset: 0,
      focusOffset: 0,
    });
  });

  it("continues a list with another list item", () => {
    const { dispatch, outline } = createApp([
      text("a", "one", "bulleted-list"),
    ]);

    dispatch(splitBlock.create({ blockId: A, offset: 3 }));

    expect(outline()).toEqual(["bulleted-list:one", "bulleted-list:"]);
  });

  it("starts a paragraph after a heading", () => {
    const heading = {
      id: "a",
      type: "heading",
      props: { level: 1, text: [{ text: "Title" }] },
    };
    const { dispatch, outline } = createApp([heading]);

    dispatch(splitBlock.create({ blockId: A, offset: 5 }));

    expect(outline()).toEqual(["heading:Title", "paragraph:"]);
  });

  it("leaves the list when Enter is pressed in an empty item", () => {
    const { dispatch, outline } = createApp([text("a", "", "to-do")]);

    dispatch(splitBlock.create({ blockId: A, offset: 0 }));

    expect(outline()).toEqual(["paragraph:"]);
  });
});

describe("block.split in an empty nested list item", () => {
  it("moves the item out one level and keeps it a list item, as Notion", () => {
    const { dispatch, outline } = createApp([
      {
        ...text("a", "second", "numbered-list"),
        children: [text("b", "", "numbered-list")],
      },
    ]);

    dispatch(splitBlock.create({ blockId: B, offset: 0 }));

    expect(outline()).toEqual(["numbered-list:second", "numbered-list:"]);
  });
});

describe("block.split in an empty nested paragraph", () => {
  it("moves the paragraph out one level instead of adding a block", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "parent"), children: [text("b", "")] },
    ]);

    dispatch(splitBlock.create({ blockId: B, offset: 0 }));

    expect(outline()).toEqual(["paragraph:parent", "paragraph:"]);
  });
});

describe("block.mergeBackward", () => {
  it("joins a paragraph onto the one before and puts the caret at the seam", () => {
    const { store, dispatch, outline } = createApp([
      text("a", "Hello"),
      text("b", " world"),
    ]);

    dispatch(mergeBlockBackward.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:Hello world"]);
    expect(store.getState().ui.selection).toEqual({
      blockId: A,
      anchorOffset: 5,
      focusOffset: 5,
    });
  });

  it("turns a list item into a paragraph first", () => {
    const { dispatch, outline } = createApp([
      text("a", "x"),
      text("b", "item", "bulleted-list"),
    ]);

    dispatch(mergeBlockBackward.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:x", "paragraph:item"]);
  });

  it("moves a nested paragraph out one level before joining", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "parent"), children: [text("b", "child")] },
    ]);

    dispatch(mergeBlockBackward.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:parent", "paragraph:child"]);
  });

  it("keeps the children of the joined block", () => {
    const { dispatch, outline } = createApp([
      text("a", "one"),
      { ...text("b", "two"), children: [text("c", "kept")] },
    ]);

    dispatch(mergeBlockBackward.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:onetwo", "paragraph:kept"]);
  });

  it("does nothing at the first block of the page", () => {
    const { store, dispatch } = createApp([text("a", "first")]);
    const before = store.getState().workspace;

    dispatch(mergeBlockBackward.create({ blockId: A }));

    expect(store.getState().workspace).toBe(before);
  });
});

describe("block.indent and block.outdent", () => {
  it("makes a block the last child of the block above it", () => {
    const { dispatch, outline } = createApp([
      text("a", "one"),
      text("b", "two"),
    ]);

    dispatch(indentBlock.create({ blockId: B }));

    expect(outline()).toEqual(["paragraph:one", "  paragraph:two"]);
  });

  it("nests a block inside a toggle heading", () => {
    const heading = {
      id: "a",
      type: "heading",
      props: {
        text: [{ text: "Plan" }],
        level: 2,
        isToggleable: true,
        isOpen: true,
      },
    };
    const { dispatch, outline } = createApp([heading, text("b", "two")]);

    dispatch(indentBlock.create({ blockId: B }));

    expect(outline()).toEqual(["heading:Plan", "  paragraph:two"]);
  });

  it("does not indent the first block", () => {
    const { dispatch, outline } = createApp([text("a", "one")]);

    dispatch(indentBlock.create({ blockId: A }));

    expect(outline()).toEqual(["paragraph:one"]);
  });

  it("moves a nested block out to just after its parent", () => {
    const { dispatch, outline } = createApp([
      { ...text("a", "one"), children: [text("b", "two")] },
      text("c", "three"),
    ]);

    dispatch(outdentBlock.create({ blockId: B }));

    expect(outline()).toEqual([
      "paragraph:one",
      "paragraph:two",
      "paragraph:three",
    ]);
  });
});

describe("block.append", () => {
  it("adds an empty paragraph at the end of the page", () => {
    const { store, dispatch, outline } = createApp([text("a", "one")]);

    dispatch(appendParagraph.create({ pageId: PAGE }));

    expect(outline()).toEqual(["paragraph:one", "paragraph:"]);
    expect(store.getState().ui.selection?.blockId).toBe(NEW);
  });
});

describe("selectBlockOrder", () => {
  it("lists blocks depth first", () => {
    const { store } = createApp([
      { ...text("a", "one"), children: [text("b", "two")] },
      text("c", "three"),
    ]);

    const ids = selectBlockOrder(store.getState(), PAGE).map(
      (block) => block.id,
    );

    expect(ids).toEqual(["a", "b", "c"]);
  });
});
