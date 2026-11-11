// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { INLINE_EQUATION_OVERLAY } from "./editor-equation.commands.ts";
import {
  equationKey,
  renderInlineEquationEditor,
} from "./editor-equation.view.ts";

// happy-dom has no Popover API; the editor only needs to be shown.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

function recorder() {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  return { sent, dispatch };
}

describe("Ctrl+Shift+E", () => {
  it("turns the selected text into an inline equation", () => {
    const block = document.createElement("div");
    block.dataset.blockId = "a";
    block.innerHTML = "<p data-text>so x^2</p>";
    document.body.replaceChildren(block);
    const paragraph = block.querySelector("p")?.firstChild;
    if (paragraph == null) throw new Error("setup failed");
    document.getSelection()?.setBaseAndExtent(paragraph, 3, paragraph, 6);
    const { store } = createApp([text("a", "so x^2")]);
    const { sent, dispatch } = recorder();
    const event = new KeyboardEvent("keydown", {
      key: "E",
      ctrlKey: true,
      shiftKey: true,
    });

    const isHandled = equationKey(event, { state: store.getState(), dispatch });

    expect(isHandled).toBe(true);
    expect(sent).toEqual([
      expect.objectContaining({ type: "text.makeEquation", start: 3, end: 6 }),
    ]);
  });
});

describe("the inline equation editor", () => {
  it("changes the equation as its source is typed", () => {
    const { store } = createApp([
      {
        id: "a",
        type: "paragraph",
        props: { text: [{ text: "so " }, { text: "x", equation: "x" }] },
      },
    ]);
    const initial = store.getState();
    const overlay = {
      kind: INLINE_EQUATION_OVERLAY,
      anchorId: "a",
      start: 3,
      end: 4,
    };
    const state = { ...initial, ui: { ...initial.ui, overlay } };
    const { sent, dispatch } = recorder();
    const host = document.createElement("div");
    render(renderInlineEquationEditor(state, dispatch), host);
    const field = host.querySelector("input");
    if (field === null) throw new Error("no editor");

    expect(field.value).toBe("x");
    field.value = "x^2";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "text.setEquation",
        start: 3,
        end: 4,
        source: "x^2",
      }),
    ]);
  });
});
