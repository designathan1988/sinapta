// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { toBlockId, type BlockSpec } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { continueWriting } from "./editor-blocks.view.ts";
import { createApp, text } from "./editor-builder.ts";
import { appendParagraph } from "./editor-structure.commands.ts";

function clicked(blocks: BlockSpec[]): Command[] {
  const { store } = createApp(blocks);
  const sent: Command[] = [];
  continueWriting(toBlockId("page"), {
    state: store.getState(),
    dispatch: (command) => {
      sent.push(command);
      return { ok: true };
    },
  });
  return sent;
}

describe("clicking below a page's blocks", () => {
  it("adds a line to the page after a block with an empty line inside it", () => {
    const sent = clicked([
      {
        id: "t",
        type: "toggle",
        props: { text: [{ text: "Details" }] },
        children: [text("inner", "")],
      },
    ]);

    expect(sent.map((command) => command.type)).toEqual(["block.append"]);
  });

  it("goes to the page's own empty last line instead of adding one", () => {
    const sent = clicked([text("a", "Hello"), text("b", "")]);

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setSelection",
        selection: { blockId: "b", anchorOffset: 0, focusOffset: 0 },
      }),
    ]);
  });

  it("adds no line inside a database, which holds rows only", () => {
    const { store, dispatch } = createApp([
      {
        id: "db",
        type: "database",
        props: {
          title: [],
          icon: null,
          properties: [],
          viewIds: [],
          templateIds: [],
          defaultTemplateId: null,
        },
      },
    ]);

    dispatch(appendParagraph.create({ pageId: toBlockId("db") }));

    expect(
      store.getState().workspace.blocks[toBlockId("db")]?.childIds,
    ).toEqual([]);
  });
});
