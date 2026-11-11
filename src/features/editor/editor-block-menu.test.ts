// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import type { BlockSpec } from "../../model/index.ts";
import type { Command, Dispatch } from "../../state/index.ts";
import {
  BLOCK_MENU_OVERLAY,
  renderBlockMenu,
} from "./editor-block-menu.view.ts";
import { createApp, text } from "./editor-builder.ts";

function choose(label: string, blocks: BlockSpec[] = [text("a", "Plan")]) {
  const { store } = createApp(blocks);
  const state = store.getState();
  const overlay = { kind: BLOCK_MENU_OVERLAY, anchorId: "a" };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(
    renderBlockMenu({ ...state, ui: { ...state.ui, overlay } }, dispatch),
    host,
  );
  const item = [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")].find(
    (element) => element.textContent.trim() === label,
  );
  item?.click();
  return { item, sent };
}

describe("the block menu", () => {
  it("turns the block into a page", () => {
    const { sent } = choose("Turn into page");

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "block.turnIntoPage", blockId: "a" }),
    );
  });

  it("does not offer a page for a block inside another block", () => {
    const blocks = [{ ...text("b", "Outer"), children: [text("a", "Inner")] }];

    expect(choose("Turn into page", blocks).item).toBeUndefined();
  });

  it("puts the block in a new column", () => {
    const { sent } = choose("Move to new column", [
      text("b", "Before"),
      text("a", "Plan"),
    ]);

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "columns.moveToNewColumn",
        blockId: "a",
      }),
    );
  });

  it("opens the dialog to move the block to another page", () => {
    const { sent } = choose("Move to");

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "move-to", anchorId: "a" },
      }),
    );
  });

  it("copies a link that opens the page at the block", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    choose("Copy link to block");
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(/#\/page\/page\?block=a$/),
    );
  });
});
