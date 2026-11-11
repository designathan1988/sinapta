// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { onBlockKeyDown } from "./editor-keys.view.ts";

const mention = { kind: "page" as const, pageId: toBlockId("plan") };

function pressAfterMention(key: string): Command[] {
  const block = document.createElement("div");
  block.dataset.blockId = "a";
  block.innerHTML =
    '<p data-text>see <span class="mention" contenteditable="false">Plan</span></p>';
  document.body.replaceChildren(block);
  const text = block.querySelector("p");
  if (text === null) throw new Error("The test block has no text.");
  // The caret after the mention, at the end of the text.
  document.getSelection()?.setBaseAndExtent(text, 2, text, 2);
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        {
          id: "a",
          type: "paragraph",
          props: { text: [{ text: "see " }, { text: "Plan", mention }] },
        },
      ],
    },
  ]);
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const state = { ...createInitialState(), workspace };
  const event = new KeyboardEvent("keydown", { key, cancelable: true });
  Object.defineProperty(event, "target", { value: text });
  onBlockKeyDown(event, { state, dispatch });
  return sent;
}

describe("keys next to a mention", () => {
  it("deletes the whole mention with Backspace", () => {
    expect(pressAfterMention("Backspace")).toEqual([
      expect.objectContaining({
        type: "text.replace",
        start: 7,
        end: 8,
        text: "",
      }),
    ]);
  });
});
