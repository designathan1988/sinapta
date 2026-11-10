import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { replaceText, toggleTextMark } from "./editor.commands.ts";

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
