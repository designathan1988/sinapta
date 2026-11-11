// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createInitialState, type Command } from "../../state/index.ts";
import { onBeforeInput } from "./editor-input.view.ts";

function typeInto(element: Element): { event: InputEvent; sent: Command[] } {
  const sent: Command[] = [];
  const context = {
    state: createInitialState(),
    dispatch: (command: Command) => {
      sent.push(command);
      return { ok: true } as const;
    },
  };
  const event = new InputEvent("beforeinput", {
    inputType: "insertText",
    data: "a",
    cancelable: true,
    bubbles: true,
  });
  element.addEventListener("beforeinput", (input) => {
    if (input instanceof InputEvent) onBeforeInput(input, context);
  });
  element.dispatchEvent(event);
  return { event, sent };
}

describe("onBeforeInput", () => {
  it("leaves typing in a form field inside a block to the field", () => {
    const block = document.createElement("div");
    const field = document.createElement("input");
    block.append(field);

    const { event, sent } = typeInto(field);

    expect(event.defaultPrevented).toBe(false);
    expect(sent).toEqual([]);
  });
});
