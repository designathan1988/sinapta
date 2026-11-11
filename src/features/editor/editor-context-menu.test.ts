// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { onBlockContextMenu } from "./editor-context-menu.view.ts";

function setup() {
  const container = document.createElement("div");
  container.innerHTML = `<div class="editor__block" data-block-id="a">
    <p data-text>Hello</p></div>`;
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const text = container.querySelector("[data-text]");
  return { text, commands, dispatch };
}

describe("onBlockContextMenu", () => {
  it("opens the block's menu at the pointer on a right click", () => {
    const { text, commands, dispatch } = setup();
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 5,
      clientY: 6,
    });
    text?.addEventListener("contextmenu", (e) => {
      onBlockContextMenu(e, dispatch);
    });

    text?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "block-menu", anchorId: "a", point: { x: 5, y: 6 } },
      }),
    ]);
  });
});
