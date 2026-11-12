// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { renderHandle } from "./editor-block-menu.view.ts";
import { createApp, text } from "./editor-builder.ts";

// Block a's handle while an overlay of some kind is open by the block.
function handleWith(kind: string): HTMLElement | null {
  const { store } = createApp([text("a", "Plan")]);
  const state = store.getState();
  const block = state.workspace.blocks[toBlockId("a")];
  const overlay = { kind, anchorId: "a" };
  const host = document.createElement("div");
  if (block === undefined) throw new Error("setup");
  render(
    renderHandle(block, {
      state: { ...state, ui: { ...state.ui, overlay } },
      dispatch: () => ({ ok: true }),
    }),
    host,
  );
  return host.querySelector(".editor__handle");
}

describe("a block's handle", () => {
  it("says it is open only for the block's own menu, as Notion's", () => {
    expect(handleWith("block-menu")?.getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(handleWith("block-color")?.getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(handleWith("callout-icon")?.getAttribute("aria-expanded")).toBe(
      "false",
    );
  });
});
