// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import { onBeforeInput } from "./editor-input.view.ts";

describe("a forward delete", () => {
  it("says it is forward, so Suggesting leaves the caret past it", () => {
    const block = document.createElement("div");
    block.dataset.blockId = "a";
    const element = document.createElement("p");
    element.dataset.text = "";
    element.textContent = "ab";
    block.append(element);
    document.body.replaceChildren(block);
    const node = element.firstChild ?? element;
    document.getSelection()?.setBaseAndExtent(node, 0, node, 0);
    const workspace = buildWorkspace([
      {
        id: "page",
        children: [
          { id: "a", type: "paragraph", props: { text: [{ text: "ab" }] } },
        ],
      },
    ]);
    const sent: Command[] = [];
    const event = new InputEvent("beforeinput", {
      inputType: "deleteContentForward",
      cancelable: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: element });
    Object.defineProperty(event, "getTargetRanges", { value: () => [] });

    onBeforeInput(event, {
      state: { ...createInitialState(), workspace },
      dispatch: (command: Command) => {
        sent.push(command);
        return { ok: true } as const;
      },
    });

    expect(sent).toEqual([
      expect.objectContaining({
        type: "text.replace",
        start: 0,
        end: 1,
        isForward: true,
      }),
    ]);
  });
});
