import { describe, expect, it } from "vitest";
import { isPageLike, type PageBlock } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { selectSuggestionEntries } from "./page-updates-suggestions.selectors.ts";

function pageWith(isResolved: boolean): PageBlock {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        title: [{ text: "Plan" }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
        discussions: [
          {
            id: toBlockId("d1"),
            blockId: toBlockId("line"),
            quote: "zz",
            isResolved,
            suggestion: "insert",
            suggestedAt: "2026-11-13T10:00:00.000Z",
            comments: [
              {
                id: toBlockId("c1"),
                text: "",
                createdAt: "2026-11-13T10:00:00.000Z",
                author: { id: "u1", name: "Ada" },
              },
            ],
          },
        ],
      },
    },
  ]);
  const page = workspace.blocks[toBlockId("page")];
  if (page === undefined || !isPageLike(page)) throw new Error("setup");
  return page;
}

describe("the page's suggested edits among its updates", () => {
  it("list each open one with who suggested it, when and what", () => {
    expect(selectSuggestionEntries(pageWith(false))).toEqual([
      {
        id: "d1",
        at: "2026-11-13T10:00:00.000Z",
        author: "Ada",
        kind: "insert",
        text: "zz",
      },
    ]);
  });

  it("leave out one already accepted or rejected", () => {
    expect(selectSuggestionEntries(pageWith(true))).toEqual([]);
  });
});
