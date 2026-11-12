// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { restoreSelection } from "./caret.ts";

function mount(): HTMLElement {
  document.body.innerHTML = `<div data-block-id="a">
    <p data-text contenteditable="true" tabindex="0">hello</p>
  </div><button>other</button>`;
  const text = document.querySelector<HTMLElement>("[data-text]");
  if (text === null) throw new Error("setup");
  return text;
}

const CARET = { blockId: toBlockId("a"), anchorOffset: 2, focusOffset: 2 };

describe("restoreSelection", () => {
  it("puts the caret and focus in the block the store names", () => {
    const text = mount();

    restoreSelection(document, CARET);

    expect(document.activeElement).toBe(text);
    expect(document.getSelection()?.anchorOffset).toBe(2);
  });

  it("gives focus back to a block that lost it without losing its caret", () => {
    const text = mount();
    restoreSelection(document, CARET);
    text.blur();

    restoreSelection(document, CARET);

    expect(document.activeElement).toBe(text);
  });

  it("does not focus a block that already has focus, so typing forces no layout", () => {
    const text = mount();
    text.focus();
    let focusCalls = 0;
    text.focus = () => {
      focusCalls += 1;
    };

    restoreSelection(document, { ...CARET, anchorOffset: 4, focusOffset: 4 });

    expect(focusCalls).toBe(0);
    expect(document.getSelection()?.anchorOffset).toBe(4);
  });

  it("leaves focus in an overlay, and gives it back once the overlay is gone", () => {
    const text = mount();
    const overlay = document.createElement("div");
    overlay.dataset.overlay = "";
    overlay.append(document.createElement("input"));
    document.body.append(overlay);
    const input = overlay.querySelector("input");
    input?.focus();

    restoreSelection(document, CARET);
    expect(document.activeElement).toBe(input);

    overlay.remove();
    restoreSelection(document, CARET);
    expect(document.activeElement).toBe(text);
  });

  it("leaves focus alone when there is no selection to restore", () => {
    mount();
    const button = document.querySelector("button");
    button?.focus();

    restoreSelection(document, null);

    expect(document.activeElement).toBe(button);
  });
});
