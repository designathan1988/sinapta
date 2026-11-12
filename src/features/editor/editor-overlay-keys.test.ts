// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createInitialState, type Command } from "../../state/index.ts";
import { onBlockKeys } from "./editor-block-keys.view.ts";

describe("onBlockKeys", () => {
  it("leaves Escape pressed in an overlay inside a block to the overlay", () => {
    // The caret still in the block's text, as after editing it.
    document.body.innerHTML = `<div data-block-id="a"><div contenteditable="true" data-text>Hi</div><div data-overlay><input /></div></div>`;
    const text = document.querySelector("[contenteditable]")?.firstChild;
    if (text) document.getSelection()?.collapse(text, 1);
    const sent: Command[] = [];
    const context = {
      state: createInitialState(),
      dispatch: (command: Command) => {
        sent.push(command);
        return { ok: true } as const;
      },
    };
    let handled: boolean | undefined;
    const block = document.querySelector("[data-block-id]");
    block?.addEventListener("keydown", (event) => {
      if (event instanceof KeyboardEvent) handled = onBlockKeys(event, context);
    });

    document
      .querySelector("input")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(handled).toBe(false);
    expect(sent).toEqual([]);
  });
});
