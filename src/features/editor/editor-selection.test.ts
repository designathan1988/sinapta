import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../state/index.ts";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  clearBlockSelection,
  deleteSelectedBlocks,
  extendBlockSelection,
} from "./editor-selection.commands.ts";
import { selectSelectedBlocks } from "./editor.selectors.ts";

const B = toBlockId("b");

function createPage() {
  const app = createApp([
    text("a", "one"),
    { ...text("b", "two"), children: [text("b1", "inside")] },
    text("c", "three"),
    text("d", "four"),
  ]);
  const extend = (direction: -1 | 1): void => {
    app.dispatch(extendBlockSelection.create({ blockId: B, direction }));
  };
  const selected = () =>
    selectSelectedBlocks(app.store.getState()).map((block) => block.id);
  return { ...app, extend, selected };
}

describe("block selection", () => {
  it("selects the block of the caret first and removes the caret", () => {
    const { store, extend, selected } = createPage();

    extend(1);

    expect(selected()).toEqual(["b"]);
    expect(store.getState().ui.selection).toBeNull();
  });

  it("grows along the page in reading order, through nested blocks", () => {
    const { extend, selected } = createPage();

    extend(1);
    extend(1);
    extend(1);

    expect(selected()).toEqual(["b", "b1", "c"]);
  });

  it("shrinks again and crosses over its anchor", () => {
    const { extend, selected } = createPage();
    extend(1);
    extend(1);

    extend(-1);
    extend(-1);

    expect(selected()).toEqual(["a", "b"]);
  });

  it("stops at the end of the page", () => {
    const { extend, selected } = createPage();

    for (let press = 0; press < 9; press += 1) extend(1);

    expect(selected()).toEqual(["b", "b1", "c", "d"]);
  });

  it("returns to a caret at the start of the block it ended on", () => {
    const { store, dispatch, extend } = createPage();
    extend(1);
    extend(1);

    dispatch(clearBlockSelection.create({ toCaret: true }));

    expect(store.getState().ui.blockSelection).toBeNull();
    expect(store.getState().ui.selection).toMatchObject({
      blockId: "b1",
      focusOffset: 0,
    });
  });

  it("deletes the selected blocks in one step that undo brings back", () => {
    const { store, dispatch, extend, outline } = createPage();
    extend(1);
    extend(1);
    extend(1);

    dispatch(deleteSelectedBlocks.create({}));

    expect(outline()).toEqual(["paragraph:one", "paragraph:four"]);
    expect(store.getState().ui.selection).toMatchObject({
      blockId: "a",
      focusOffset: 3,
    });
    dispatch({ type: UNDO_COMMAND });
    expect(outline()).toEqual([
      "paragraph:one",
      "paragraph:two",
      "  paragraph:inside",
      "paragraph:three",
      "paragraph:four",
    ]);
  });
});
