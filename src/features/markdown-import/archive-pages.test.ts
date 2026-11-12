import { describe, expect, it } from "vitest";
import { archivePages, markdownPage } from "./archive-pages.ts";

describe("markdownPage", () => {
  it("takes a first top heading as the title, else the file's name", () => {
    expect(markdownPage("Notes.md", "# Plans\n\nHello").title).toBe("Plans");
    expect(markdownPage("Notes.md", "# Plans\n\nHello").blocks).toHaveLength(1);
    expect(markdownPage("Notes.md", "Hello").title).toBe("Notes");
  });
});

describe("archivePages", () => {
  it("nests each folder's pages under the page of the same name", () => {
    const pages = archivePages([
      { path: "Plans.md", text: "# Plans\n\nHello" },
      { path: "Plans/Ideas.md", text: "# Ideas" },
      { path: "Plans/Ideas/Deep.md", text: "# Deep" },
      { path: "Other.md", text: "# Other" },
      { path: "Lost/Orphan.md", text: "# Orphan" },
    ]);

    const outline = (list: readonly (typeof pages)[number][]): unknown[] =>
      list.map((page) => [page.title, outline(page.subpages ?? [])]);
    expect(outline(pages)).toEqual([
      ["Plans", [["Ideas", [["Deep", []]]]]],
      ["Other", []],
      ["Orphan", []],
    ]);
  });

  it("drops the line that links a page to its subpage, which takes its place", () => {
    const [plans] = archivePages([
      {
        path: "Plans 1a2b.md",
        text: [
          "# Plans",
          "Hello",
          "[Ideas](Plans%201a2b/Ideas%209f8e.md)",
          "[Site](https://example.com)",
        ].join("\n\n"),
      },
      { path: "Plans 1a2b/Ideas 9f8e.md", text: "# Ideas" },
    ]);

    expect(plans?.blocks).toHaveLength(2);
    expect(plans?.subpages?.map((page) => page.title)).toEqual(["Ideas"]);
  });
});
