// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  BLOCK_COLOR_OVERLAY,
  renderColorMenu,
} from "./editor-color-menu.view.ts";

function rendered() {
  const { store } = createApp([text("a", "one")]);
  const state = store.getState();
  const overlay = { kind: BLOCK_COLOR_OVERLAY, anchorId: "a" };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(
    renderColorMenu({ ...state, ui: { ...state.ui, overlay } }, dispatch),
    host,
  );
  return { host, sent };
}

describe("renderColorMenu", () => {
  it("lists the default, eight text colors and eight backgrounds", () => {
    const items = rendered().host.querySelectorAll("[role^=menuitem]");

    expect(items).toHaveLength(17);
  });

  it("colors the block with the chosen background", () => {
    const { host, sent } = rendered();
    const item = [
      ...host.querySelectorAll<HTMLElement>("[role^=menuitem]"),
    ].find((element) => element.textContent.trim() === "Red background");

    item?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "block.setColor",
        blockIds: ["a"],
        color: "red-background",
      }),
    );
  });
});
