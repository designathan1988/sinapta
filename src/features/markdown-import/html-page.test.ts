// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { htmlPage, isHtmlFile } from "./html-page.ts";

describe("htmlPage", () => {
  it("names the page by its first top heading, as Notion's export writes it", () => {
    const page = htmlPage(
      "Plan 1a2b.html",
      `<html><head><title>Ignored</title></head><body>
        <header><h1 class="page-title">Launch plan</h1></header>
        <h2>Goals</h2><ul><li>Ship <strong>v3</strong></li></ul>
      </body></html>`,
    );

    expect(page.title).toBe("Launch plan");
    expect(page.blocks.map((block) => block.kind)).toEqual([
      "heading",
      "bulleted-list",
    ]);
  });

  it("falls back on the document's title, then on the file's name", () => {
    expect(
      htmlPage("a.html", "<title>Notes &amp; ideas</title><p>Hi</p>").title,
    ).toBe("Notes & ideas");
    expect(htmlPage("folder/Week.htm", "<p>Hi</p>").title).toBe("Week");
  });

  it("knows an HTML file by its name", () => {
    expect(isHtmlFile("page.HTML")).toBe(true);
    expect(isHtmlFile("page.md")).toBe(false);
  });
});
