import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  applyInlineMarkdown,
  clearTextFormat,
  replaceText,
  setTextLink,
  setTextTone,
  toggleTextMark,
} from "./editor.commands.ts";
import { UNDO_COMMAND } from "../../state/index.ts";

const A = toBlockId("a");
const FAMILY = "👨‍👩‍👧";

describe("text.replace", () => {
  it("inserts typed text and moves the caret after it", () => {
    const { store, dispatch, outline } = createApp([text("a", "Helo")]);

    dispatch(replaceText.create({ blockId: A, start: 2, end: 2, text: "l" }));

    expect(outline()).toEqual(["paragraph:Hello"]);
    expect(store.getState().ui.selection).toEqual({
      blockId: A,
      anchorOffset: 3,
      focusOffset: 3,
    });
  });

  it("replaces a selected range", () => {
    const { dispatch, outline } = createApp([text("a", "Hello world")]);

    dispatch(
      replaceText.create({ blockId: A, start: 6, end: 11, text: "there" }),
    );

    expect(outline()).toEqual(["paragraph:Hello there"]);
  });

  it("widens a range that cuts through an emoji to the whole emoji", () => {
    const { dispatch, outline } = createApp([text("a", `a${FAMILY}b`)]);

    dispatch(
      replaceText.create({
        blockId: A,
        start: 3,
        end: 1 + FAMILY.length,
        text: "",
      }),
    );

    expect(outline()).toEqual(["paragraph:ab"]);
  });

  it("widens a range that ends inside an emoji to the whole emoji", () => {
    const { dispatch, outline } = createApp([text("a", `a${FAMILY}b`)]);

    dispatch(replaceText.create({ blockId: A, start: 0, end: 3, text: "" }));

    expect(outline()).toEqual(["paragraph:b"]);
  });

  it("undoes a run of typed letters in one step", () => {
    const { dispatch, outline } = createApp([text("a", "")]);
    dispatch(replaceText.create({ blockId: A, start: 0, end: 0, text: "H" }));
    dispatch(replaceText.create({ blockId: A, start: 1, end: 1, text: "i" }));

    dispatch({ type: "history.undo" });

    expect(outline()).toEqual(["paragraph:"]);
  });
});

describe("text.toggleMark", () => {
  it("marks a range bold", () => {
    const { store, dispatch } = createApp([text("a", "Hello")]);

    dispatch(
      toggleTextMark.create({ blockId: A, start: 0, end: 2, mark: "bold" }),
    );

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "He", marks: ["bold"] },
      { text: "llo" },
    ]);
  });
});

describe("text.setLink", () => {
  it("links a range to an allowed target", () => {
    const { store, dispatch } = createApp([text("a", "see site")]);

    dispatch(
      setTextLink.create({
        blockId: A,
        start: 4,
        end: 8,
        href: "https://example.com",
      }),
    );

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "see " },
      { text: "site", href: "https://example.com/" },
    ]);
  });

  it("refuses a script target", () => {
    const { store, dispatch } = createApp([text("a", "click")]);
    const before = store.getState().workspace;

    dispatch(
      setTextLink.create({
        blockId: A,
        start: 0,
        end: 5,
        href: "javascript:alert(1)",
      }),
    );

    expect(store.getState().workspace).toBe(before);
  });
});

describe("text.setTone", () => {
  it("highlights a range and undoes it in one step", () => {
    const { store, dispatch } = createApp([text("a", "Hello")]);
    const textOfA = () => store.getState().workspace.blocks[A]?.props.text;

    dispatch(
      setTextTone.create({
        blockId: A,
        start: 0,
        end: 5,
        key: "highlight",
        tone: "yellow",
      }),
    );
    expect(textOfA()).toEqual([{ text: "Hello", highlight: "yellow" }]);

    dispatch({ type: UNDO_COMMAND });
    expect(textOfA()).toEqual([{ text: "Hello" }]);
  });

  it("removes a color", () => {
    const { store, dispatch } = createApp([text("a", "Hello")]);
    const color = { blockId: A, start: 0, end: 5, key: "color" } as const;

    dispatch(setTextTone.create({ ...color, tone: "red" }));
    dispatch(setTextTone.create({ ...color, tone: null }));

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "Hello" },
    ]);
  });
});

describe("text.clearFormat", () => {
  it("clears marks, links and colors over the range, undone in one step", () => {
    const { store, dispatch } = createApp([text("a", "Hello")]);
    const textOfA = () => store.getState().workspace.blocks[A]?.props.text;
    const range = { blockId: A, start: 0, end: 5 } as const;
    dispatch(toggleTextMark.create({ ...range, mark: "bold" }));
    dispatch(setTextTone.create({ ...range, key: "color", tone: "red" }));

    dispatch(clearTextFormat.create(range));
    expect(textOfA()).toEqual([{ text: "Hello" }]);

    dispatch({ type: UNDO_COMMAND });
    expect(textOfA()).toEqual([
      { text: "Hello", marks: ["bold"], color: "red" },
    ]);
  });
});

describe("text.applyInlineMarkdown", () => {
  const bold = { blockId: A, start: 0, end: 8, markerLength: 2 } as const;

  it("marks the text between the markers and drops the markers", () => {
    const { store, dispatch } = createApp([text("a", "**bold**")]);

    dispatch(applyInlineMarkdown.create({ ...bold, mark: "bold" }));

    const block = store.getState().workspace.blocks[A];
    expect(block?.props.text).toEqual([{ text: "bold", marks: ["bold"] }]);
    expect(store.getState().ui.selection?.focusOffset).toBe(4);
  });

  it("brings the typed markers back with one undo", () => {
    const { dispatch, outline } = createApp([text("a", "**bold*")]);
    dispatch(replaceText.create({ blockId: A, start: 7, end: 7, text: "*" }));
    dispatch(applyInlineMarkdown.create({ ...bold, mark: "bold" }));

    dispatch({ type: UNDO_COMMAND });

    expect(outline()).toEqual(["paragraph:**bold**"]);
  });

  it("leaves markers inside inline code alone", () => {
    const code = [{ text: "**x**", marks: ["code" as const] }];
    const { store, dispatch } = createApp([
      { id: "a", type: "paragraph", props: { text: code } },
    ]);
    const before = store.getState();

    dispatch(
      applyInlineMarkdown.create({
        blockId: A,
        start: 0,
        end: 5,
        markerLength: 2,
        mark: "bold",
      }),
    );

    expect(store.getState()).toBe(before);
  });
});
