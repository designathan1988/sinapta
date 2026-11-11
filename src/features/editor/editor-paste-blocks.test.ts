import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { UNDO_COMMAND } from "../../state/index.ts";
import { parseMarkdownBlocks } from "../../ui/rich-text/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import { pasteBlocks } from "./editor-paste-blocks.commands.ts";

const A = toBlockId("a");

describe("block.pasteBlocks", () => {
  it("turns an empty block into the first pasted block and adds the rest after it", () => {
    const { dispatch, outline } = createApp([text("a", ""), text("b", "End")]);
    const blocks = parseMarkdownBlocks("# Plan\n- one\n  - inner\n- [x] done");

    dispatch(pasteBlocks.create({ blockId: A, blocks }));

    expect(outline()).toEqual([
      "heading:Plan",
      "bulleted-list:one",
      "  bulleted-list:inner",
      "to-do:done",
      "paragraph:End",
    ]);
  });

  it("adds the blocks after a block that has text, and undoes in one step", () => {
    const { store, dispatch, outline } = createApp([text("a", "Keep")]);
    const types = () => {
      const { blocks } = store.getState().workspace;
      return (blocks[PAGE]?.childIds ?? []).map((id) => blocks[id]?.type);
    };

    const blocks = parseMarkdownBlocks("> quoted\n---");
    dispatch(pasteBlocks.create({ blockId: A, blocks }));
    expect(types()).toEqual(["paragraph", "quote", "divider"]);
    expect(outline()).toEqual(["paragraph:Keep", "quote:quoted"]);

    dispatch({ type: UNDO_COMMAND });
    expect(outline()).toEqual(["paragraph:Keep"]);
  });

  it("keeps a checked to-do checked and a heading's level", () => {
    const { store, dispatch } = createApp([text("a", "")]);

    dispatch(
      pasteBlocks.create({
        blockId: A,
        blocks: parseMarkdownBlocks("## Two\n- [x] done"),
      }),
    );

    const blocks = Object.values(store.getState().workspace.blocks);
    expect(blocks.find((block) => block.type === "heading")?.props.level).toBe(
      2,
    );
    expect(
      blocks.find((block) => block.type === "to-do")?.props.isChecked,
    ).toBe(true);
  });

  it("puts the caret at the end of the last pasted text", () => {
    const { store, dispatch } = createApp([text("a", "")]);

    dispatch(
      pasteBlocks.create({
        blockId: A,
        blocks: parseMarkdownBlocks("- a\n- bc"),
      }),
    );

    expect(store.getState().ui.selection).toMatchObject({ anchorOffset: 2 });
  });
});
