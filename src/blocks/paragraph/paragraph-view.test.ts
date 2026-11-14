// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { ParagraphBlock } from "./paragraph.schema.ts";
import { renderParagraph } from "./paragraph.view.ts";

describe("renderParagraph", () => {
  it("offers AI and commands in an empty line, as Notion's", () => {
    const block: ParagraphBlock = {
      id: toBlockId("a"),
      type: "paragraph",
      parentId: toBlockId("page"),
      childIds: [],
      props: { text: [] },
      createdAt: "2026-11-14T00:00:00.000Z",
      updatedAt: "2026-11-14T00:00:00.000Z",
    };
    const host = document.createElement("div");

    render(renderParagraph(block), host);

    expect(
      host.querySelector("[data-text]")?.getAttribute("data-placeholder"),
    ).toBe("Press ‘space’ for AI or ‘/’ for commands");
  });
});
