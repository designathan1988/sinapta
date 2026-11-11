import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { matchBlockShortcut } from "./block-shortcut.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import { convertBlock } from "./editor-convert.commands.ts";

const A = toBlockId("a");
const NEW = toBlockId("new-1");

describe("block.convert", () => {
  it("turns a paragraph into a heading of a level and drops the shortcut", () => {
    const { store, dispatch, outline } = createApp([text("a", "##Plan")]);

    dispatch(
      convertBlock.create({
        blockId: A,
        blockType: "heading",
        extraProps: { level: 2 },
        removePrefix: 2,
      }),
    );

    expect(outline()).toEqual(["heading:Plan"]);
    expect(store.getState().workspace.blocks[A]?.props.level).toBe(2);
  });

  it("follows a divider with a paragraph that takes the caret", () => {
    const { store, dispatch } = createApp([text("a", "---")]);

    dispatch(
      convertBlock.create({
        blockId: A,
        blockType: "divider",
        removePrefix: 3,
      }),
    );

    const state = store.getState();
    const types = state.workspace.blocks[PAGE]?.childIds.map(
      (id) => state.workspace.blocks[id]?.type,
    );
    expect(types).toEqual(["divider", "paragraph"]);
    expect(state.ui.selection?.blockId).toBe(NEW);
  });

  it("does nothing for a type that does not exist", () => {
    const { dispatch, outline } = createApp([text("a", "x")]);

    dispatch(convertBlock.create({ blockId: A, blockType: "hologram" }));

    expect(outline()).toEqual(["paragraph:x"]);
  });
});

describe("matchBlockShortcut", () => {
  it.each([
    ["#", "heading"],
    ["###", "heading"],
    ["-", "bulleted-list"],
    ["*", "bulleted-list"],
    ["+", "bulleted-list"],
    ["1.", "numbered-list"],
    ["a.", "numbered-list"],
    ["i.", "numbered-list"],
    ["[]", "to-do"],
    ["[x]", "to-do"],
    ['"', "quote"],
    [">", "toggle"],
    ["```", "code"],
    ["---", "divider"],
  ])("matches %j as %s", (prefix, type) => {
    expect(matchBlockShortcut(prefix)?.blockType).toBe(type);
  });

  it("checks a to-do typed as [x]", () => {
    expect(matchBlockShortcut("[x]")?.extraProps).toEqual({ isChecked: true });
  });

  it("makes #### a heading of level 4", () => {
    expect(matchBlockShortcut("####")?.extraProps).toEqual({ level: 4 });
  });

  it.each(["", "#####", "hello", "constructor"])(
    "does not match %j",
    (prefix) => {
      expect(matchBlockShortcut(prefix)).toBeUndefined();
    },
  );
});

describe("turning text into a synced block", () => {
  it("puts the text in a paragraph inside it, with the caret there", () => {
    const { store, dispatch } = createApp([text("a", "Shared")]);

    dispatch(convertBlock.create({ blockId: A, blockType: "synced-block" }));

    const { blocks } = store.getState().workspace;
    expect(blocks[A]).toMatchObject({ type: "synced-block", childIds: [NEW] });
    expect(blocks[NEW]).toMatchObject({
      type: "paragraph",
      parentId: A,
      props: { text: [{ text: "Shared" }] },
    });
    expect(store.getState().ui.selection).toMatchObject({ blockId: NEW });
    expect(blocks[PAGE]?.childIds).toEqual([A]);
  });
});
