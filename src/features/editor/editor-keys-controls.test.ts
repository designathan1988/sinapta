// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { onBlockKeyDown } from "./editor-keys.view.ts";

describe("keys in a control inside a block", () => {
  it.each([
    ["a list", "<select><option>x</option></select>"],
    ["a slider", '<div role="slider" tabindex="0"></div>'],
    [
      "an inline database's cell",
      '<section class="database"><table><tr><td tabindex="0">x</td></tr></table></section>',
    ],
  ])("are left to %s even while a caret is in the text", (_, control) => {
    const block = document.createElement("div");
    block.dataset.blockId = "a";
    block.innerHTML = `<p data-text>one</p>${control}`;
    document.body.replaceChildren(block);
    const paragraph = block.querySelector("p");
    const select = block.lastElementChild;
    if (paragraph === null || select === null) throw new Error("setup failed");
    document.getSelection()?.setBaseAndExtent(paragraph, 0, paragraph, 0);
    const { store } = createApp([text("a", "one")]);
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const event = new KeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      cancelable: true,
    });
    Object.defineProperty(event, "target", { value: select });

    onBlockKeyDown(event, { state: store.getState(), dispatch });

    expect(sent).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("Ctrl+/ in a block's text", () => {
  it("opens the block's menu at the caret, which holds Turn into", () => {
    const block = document.createElement("div");
    block.dataset.blockId = "a";
    block.innerHTML = "<p data-text>one</p>";
    document.body.replaceChildren(block);
    const paragraph = block.querySelector("p");
    if (paragraph?.firstChild == null) throw new Error("setup failed");
    document
      .getSelection()
      ?.setBaseAndExtent(paragraph.firstChild, 1, paragraph.firstChild, 1);
    const { store } = createApp([text("a", "one")]);
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const event = new KeyboardEvent("keydown", {
      key: "/",
      ctrlKey: true,
      cancelable: true,
    });
    Object.defineProperty(event, "target", { value: paragraph });

    onBlockKeyDown(event, { state: store.getState(), dispatch });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "block-menu", anchorId: "a" },
    });
    expect(event.defaultPrevented).toBe(true);
  });
});
