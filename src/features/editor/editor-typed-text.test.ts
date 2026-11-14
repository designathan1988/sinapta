import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  applyInlineMarkdown,
  replaceText,
  toggleTextMark,
} from "./editor.commands.ts";

const A = toBlockId("a");

describe("typing after inline Markdown", () => {
  it("is plain where the closing marker was, as Notion's", () => {
    const { store, dispatch } = createApp([text("a", "Make **bold**")]);

    dispatch(
      applyInlineMarkdown.create({
        blockId: A,
        start: 5,
        end: 13,
        markerLength: 2,
        mark: "bold",
      }),
    );
    dispatch(
      replaceText.create({ blockId: A, start: 9, end: 9, text: " and" }),
    );
    dispatch(
      replaceText.create({ blockId: A, start: 13, end: 13, text: " more" }),
    );

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "Make " },
      { text: "bold", marks: ["bold"] },
      { text: " and more" },
    ]);
  });

  it("keeps a bold set by hand going, as Notion's", () => {
    const { store, dispatch } = createApp([text("a", "Make bold")]);

    dispatch(
      toggleTextMark.create({ blockId: A, start: 5, end: 9, mark: "bold" }),
    );
    dispatch(replaceText.create({ blockId: A, start: 9, end: 9, text: "er" }));

    expect(store.getState().workspace.blocks[A]?.props.text).toEqual([
      { text: "Make " },
      { text: "bolder", marks: ["bold"] },
    ]);
  });
});
