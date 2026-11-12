import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { htmlFileName, selectPageHtml } from "./html-export.selectors.ts";

const text = (value: string) => ({ text: [{ text: value }] });

function html(): string {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        title: [{ text: "Plans & <ideas>" }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
      },
      children: [
        { id: "h", type: "heading", props: { ...text("Goals"), level: 1 } },
        {
          id: "p",
          type: "paragraph",
          props: {
            text: [
              { text: "Read " },
              { text: "the plan", marks: ["bold"], href: "https://x.test/a" },
              { text: " <now>" },
            ],
          },
        },
        { id: "b1", type: "bulleted-list", props: text("One") },
        { id: "b2", type: "bulleted-list", props: text("Two") },
        {
          id: "t",
          type: "to-do",
          props: { ...text("Ship"), isChecked: true },
        },
        {
          id: "c",
          type: "code",
          props: { text: [{ text: "<script>alert(1)</script>" }] },
        },
        { id: "q", type: "quote", props: text("Said so") },
        { id: "d", type: "divider", props: {} },
      ],
    },
  ]);
  return selectPageHtml(
    { ...createInitialState(), workspace },
    toBlockId("page"),
  );
}

describe("a page as HTML", () => {
  it("is a whole document titled as the page", () => {
    const page = html();

    expect(page.startsWith("<!doctype html>")).toBe(true);
    expect(page).toContain("<title>Plans &amp; &lt;ideas&gt;</title>");
    expect(page).toContain("<h1>Plans &amp; &lt;ideas&gt;</h1>");
  });

  it("writes each block as its element, a list as one list", () => {
    const page = html();

    expect(page).toContain("<h2>Goals</h2>");
    expect(page).toContain(
      '<p>Read <a href="https://x.test/a"><strong>the plan</strong></a> &lt;now&gt;</p>',
    );
    expect(page).toContain("<ul><li>One</li><li>Two</li></ul>");
    expect(page).toContain(
      '<ul class="to-do"><li><input type="checkbox" disabled checked> Ship</li></ul>',
    );
    expect(page).toContain(
      "<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>",
    );
    expect(page).toContain("<blockquote>Said so</blockquote>");
    expect(page).toContain("<hr>");
    expect(page).not.toContain("<script>");
  });

  it("is named as the page", () => {
    expect(htmlFileName("Plans: Q4")).toBe("Plans Q4.html");
  });
});
