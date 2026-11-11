import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { UNDO_COMMAND } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { convertBlock } from "./editor-convert.commands.ts";
import { setBlockColor } from "./editor-color.commands.ts";

const A = toBlockId("a");
const B = toBlockId("b");

function colorOf(app: ReturnType<typeof createApp>, id = A) {
  return app.store.getState().workspace.blocks[id]?.props.color;
}

describe("block.setColor", () => {
  it("colors several blocks in one step, and undo takes it back", () => {
    const app = createApp([text("a", "one"), text("b", "two")]);

    app.dispatch(setBlockColor.create({ blockIds: [A, B], color: "red" }));
    expect([colorOf(app), colorOf(app, B)]).toEqual(["red", "red"]);

    app.dispatch({ type: UNDO_COMMAND });
    expect([colorOf(app), colorOf(app, B)]).toEqual([undefined, undefined]);
  });

  it("sets a background and removes a color with null", () => {
    const app = createApp([text("a", "one")]);

    app.dispatch(
      setBlockColor.create({ blockIds: [A], color: "blue-background" }),
    );
    expect(colorOf(app)).toBe("blue-background");

    app.dispatch(setBlockColor.create({ blockIds: [A], color: null }));
    expect(colorOf(app)).toBeUndefined();
  });

  it("keeps the color when the block turns into another text type", () => {
    const app = createApp([text("a", "one")]);
    app.dispatch(setBlockColor.create({ blockIds: [A], color: "green" }));

    app.dispatch(convertBlock.create({ blockId: A, blockType: "quote" }));

    expect(colorOf(app)).toBe("green");
  });
});
