import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { insertMentionAt } from "./editor-mention.commands.ts";

const A = toBlockId("a");
const span = {
  text: "Plan",
  mention: { kind: "page" as const, pageId: toBlockId("plan") },
};

describe("text.insertMention", () => {
  it("puts the mention where @ and the query were, a space, and the caret after it", () => {
    const { store, dispatch } = createApp([text("a", "see @pl")]);

    dispatch(insertMentionAt.create({ blockId: A, start: 4, end: 7, span }));

    const state = store.getState();
    expect(state.workspace.blocks[A]?.props.text).toEqual([
      { text: "see " },
      span,
      { text: " " },
    ]);
    expect(state.ui.selection?.focusOffset).toBe(9);
  });

  it("adds no space when one follows already", () => {
    const { store, dispatch } = createApp([text("a", "see @pl now")]);

    dispatch(insertMentionAt.create({ blockId: A, start: 4, end: 7, span }));

    const state = store.getState();
    expect(state.workspace.blocks[A]?.props.text).toEqual([
      { text: "see " },
      span,
      { text: " now" },
    ]);
    expect(state.ui.selection?.focusOffset).toBe(9);
  });
});
