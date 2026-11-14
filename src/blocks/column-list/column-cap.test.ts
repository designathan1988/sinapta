import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { columnCommands } from "../column/index.ts";
import { columnListCommands, dropBeside } from "./column-list.commands.ts";
import { tidyColumns } from "./column-list-tidy.ts";

const text = (name: string): BlockSpec => ({
  id: name,
  type: "paragraph",
  props: { text: [{ text: name }] },
});

describe("the column cap", () => {
  it("adds no sixth column, as Notion keeps five at most", () => {
    const columns = ["1", "2", "3", "4", "5"].map((n) => ({
      id: `c${n}`,
      type: "column",
      props: { ratio: 0.2 },
      children: [text(`in${n}`)],
    }));
    const list = { id: "list", type: "column-list", children: columns };
    const workspace = buildWorkspace([
      { id: "page", children: [{ ...list, props: {} }, text("d")] },
    ]);
    const app = createTestApp({
      workspace,
      commands: [...columnListCommands, ...columnCommands],
      tidiers: [tidyColumns],
    });

    app.dispatch(
      dropBeside.create({
        blockId: toBlockId("d"),
        targetId: toBlockId("in3"),
        side: "left",
      }),
    );

    const blocks = app.store.getState().workspace.blocks;
    expect(blocks[toBlockId("list")]?.childIds).toHaveLength(5);
    expect(blocks[toBlockId("page")]?.childIds.at(-1)).toBe("d");
  });
});
