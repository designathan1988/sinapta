// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { projectRichText } from "./rich-text-projection.ts";

describe("projectRichText", () => {
  it("shows a page mention as one piece the caret cannot enter", () => {
    const element = document.createElement("p");
    const mention = { kind: "page" as const, pageId: toBlockId("plan") };

    projectRichText(element, [{ text: "see " }, { text: "Plan", mention }]);

    const piece = element.querySelector<HTMLElement>(".mention");
    expect(piece?.textContent).toBe("Plan");
    expect(piece?.getAttribute("contenteditable")).toBe("false");
    expect(piece?.dataset.pageId).toBe("plan");
    expect(element.textContent).toBe("see Plan");
  });

  it("marks a date mention with its day", () => {
    const element = document.createElement("p");
    const mention = { kind: "date" as const, date: "2026-11-11" };

    projectRichText(element, [{ text: "Nov 11, 2026", mention }]);

    expect(element.querySelector<HTMLElement>(".mention")?.dataset.date).toBe(
      "2026-11-11",
    );
  });
});
