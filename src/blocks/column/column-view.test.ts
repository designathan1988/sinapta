// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, isBlockOfType, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import type { ColumnBlock } from "./column.schema.ts";
import { renderColumn } from "./column.view.ts";

function rendered(columnId: string) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        {
          id: "list",
          type: "column-list",
          props: {},
          children: [
            { id: "c1", type: "column", props: { ratio: 0.5 } },
            { id: "c2", type: "column", props: { ratio: 0.5 } },
          ],
        },
      ],
    },
  ]);
  const state = { ...createInitialState(), workspace };
  const column = workspace.blocks[toBlockId(columnId)];
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  const view =
    column !== undefined && isBlockOfType<ColumnBlock>(column, "column")
      ? renderColumn(column, dispatch, state)
      : undefined;
  if (view !== undefined) render(view, host);
  return { host, sent };
}

describe("renderColumn", () => {
  it("moves the boundary before the column with the arrow keys", () => {
    const { host, sent } = rendered("c2");
    const gutter = host.querySelector("[role=separator]");

    gutter?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "columns.resize",
        index: 0,
        share: 0.55,
      }),
    ]);
  });

  it("has no boundary before the first column", () => {
    expect(rendered("c1").host.querySelector("[role=separator]")).toBeNull();
  });
});
