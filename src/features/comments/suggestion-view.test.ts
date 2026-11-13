// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import { toBlockId } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { renderSuggestionHead } from "./suggestion.view.ts";

const page: PageBlock = {
  id: toBlockId("page"),
  type: "page",
  parentId: null,
  childIds: [],
  props: { title: [], icon: null, isFavorite: false, isTrashed: false },
  createdAt: "2026-11-13T10:00",
  updatedAt: "2026-11-13T10:00",
};

function rendered(suggestion: "insert" | "delete") {
  const discussion: Discussion = {
    id: toBlockId("d1"),
    blockId: toBlockId("t"),
    isResolved: false,
    comments: [],
    quote: " zz",
    suggestion,
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSuggestionHead(discussion, page, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const press = (label: string) =>
    host.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.click();
  return { host, sent, press };
}

describe("a suggestion's card", () => {
  it("says what it adds, and accepts it", () => {
    const { host, sent, press } = rendered("insert");

    press("Accept");

    expect(host.textContent).toContain("Add:");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "suggestion.accept",
        pageId: page.id,
        discussionId: "d1",
      }),
    ]);
  });

  it("says what it deletes, and rejects it", () => {
    const { host, sent, press } = rendered("delete");

    press("Reject");

    expect(host.textContent).toContain("Delete:");
    expect(sent[0]?.type).toBe("suggestion.reject");
  });
});
