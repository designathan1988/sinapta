// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { startBlockDrag } from "./editor-block-drag.view.ts";

function setup() {
  const { store } = createApp(
    [text("a", "one"), text("b", "two")],
    [{ id: "other" }],
  );
  const container = document.createElement("div");
  container.innerHTML = `
    <div class="editor__block" data-block-id="a">
      <button data-handle>grip</button><p data-text>one</p></div>
    <div class="editor__block" data-block-id="b"><p data-text>two</p></div>`;
  const sidebarPage = document.createElement("li");
  sidebarPage.dataset.pageDrop = "other";
  document.body.replaceChildren(container, sidebarPage);
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  container.addEventListener("pointerdown", (event) => {
    startBlockDrag(event, { state: store.getState(), dispatch });
  });
  let under: Element = container;
  document.elementFromPoint = () => under;
  const fire = (type: string, target: Element | null, altKey = false) => {
    if (target === null) throw new Error("setup failed");
    under = target;
    // The press is at the top; the drag goes 40 pixels down from it.
    const clientY = type === "pointerdown" ? 0 : 40;
    const init = { bubbles: true, clientY, button: 0, altKey };
    target.dispatchEvent(new PointerEvent(type, init));
  };
  const handle = container.querySelector("[data-handle]");
  const blockB = container.querySelector("[data-block-id=b]");
  // Stand in for layout: the pointer is over the lower part of block b.
  if (blockB !== null) {
    blockB.getBoundingClientRect = () => new DOMRect(0, 0, 100, 44);
  }
  return { commands, fire, handle, blockB, sidebarPage };
}

describe("dragging a block", () => {
  it("moves it to the end of a page dropped on in the sidebar", () => {
    const { commands, fire, handle, sidebarPage } = setup();

    fire("pointerdown", handle);
    fire("pointermove", sidebarPage);
    fire("pointerup", sidebarPage);

    expect(commands).toEqual([
      expect.objectContaining({
        type: "block.moveToPage",
        blockIds: ["a"],
        pageId: "other",
      }),
    ]);
  });

  it("drops a copy where Alt is held at the drop", () => {
    const { commands, fire, handle, blockB } = setup();

    fire("pointerdown", handle);
    fire("pointermove", blockB);
    fire("pointerup", blockB, true);

    expect(commands).toEqual([
      expect.objectContaining({
        type: "block.copyTo",
        blockId: "a",
        targetId: "b",
        position: "after",
        blockCount: 1,
      }),
    ]);
  });
});
