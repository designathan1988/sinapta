// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { onMentionClick } from "./editor-mention.view.ts";

describe("onMentionClick", () => {
  it("opens the page a mention points to", () => {
    const text = document.createElement("p");
    text.innerHTML = `see <span class="mention" data-page-id="plan">Plan</span>`;
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    text.addEventListener("click", (event) => {
      onMentionClick(event, dispatch);
    });

    text.querySelector<HTMLElement>(".mention")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.setActivePage", pageId: "plan" }),
    ]);
  });
});
