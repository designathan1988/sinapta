// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState, type Command } from "../../state/index.ts";
import { AI_PROMPT_OVERLAY, renderAiPrompt } from "./ai-prompt.view.ts";

describe("the Ask AI prompt", () => {
  it("puts the caret back on its empty line on Escape", () => {
    const initial = createInitialState();
    const overlay = { kind: AI_PROMPT_OVERLAY, anchorId: "line" };
    const state = { ...initial, ui: { ...initial.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderAiPrompt(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    host
      .querySelector("input")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(sent).toEqual([
      { type: "ui.closeOverlay" },
      {
        type: "ui.setSelection",
        selection: { blockId: "line", anchorOffset: 0, focusOffset: 0 },
      },
    ]);
  });
});
