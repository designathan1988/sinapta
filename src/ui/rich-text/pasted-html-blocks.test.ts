// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { parsePastedHtmlBlocks } from "./pasted-html-blocks.ts";

function kinds(html: string) {
  return parsePastedHtmlBlocks(html).map((block) => [
    block.kind,
    block.depth,
    block.text.map((span) => span.text).join(""),
  ]);
}

describe("parsePastedHtmlBlocks", () => {
  it("reads headings and paragraphs, keeping marks", () => {
    const blocks = parsePastedHtmlBlocks(
      "<h1>Title</h1><h2>Part</h2><p>Some <b>bold</b> text</p>",
    );

    expect(blocks.map((b) => [b.kind, b.level])).toEqual([
      ["heading", 1],
      ["heading", 2],
      ["paragraph", undefined],
    ]);
    expect(blocks[2]?.text).toEqual([
      { text: "Some " },
      { text: "bold", marks: ["bold"] },
      { text: " text" },
    ]);
  });

  it("reads nested lists with their depth", () => {
    expect(
      kinds(
        "<ul><li>one<ul><li>inner</li></ul></li><li>two</li></ul><ol><li>first</li></ol>",
      ),
    ).toEqual([
      ["bulleted-list", 0, "one"],
      ["bulleted-list", 1, "inner"],
      ["bulleted-list", 0, "two"],
      ["numbered-list", 0, "first"],
    ]);
  });

  it("reads a list item with a checkbox as a to-do", () => {
    const [todo] = parsePastedHtmlBlocks(
      '<ul><li><input type="checkbox" checked>Done</li></ul>',
    );

    expect(todo).toMatchObject({ kind: "to-do", isChecked: true });
  });

  it("reads quotes, code, dividers and images", () => {
    const blocks = parsePastedHtmlBlocks(
      '<blockquote>Said</blockquote><pre>a\nb</pre><hr><img src="https://example.com/a.png">',
    );

    expect(blocks.map((b) => b.kind)).toEqual([
      "quote",
      "code",
      "divider",
      "image",
    ]);
    expect(blocks[1]?.text).toEqual([{ text: "a\nb" }]);
    expect(blocks[3]?.src).toBe("https://example.com/a.png");
  });

  it("reads a table as one line per row", () => {
    expect(kinds("<table><tr><td>a</td><td>b</td></tr></table>")).toEqual([
      ["paragraph", 0, "a | b"],
    ]);
  });

  it("leaves out scripts and styles", () => {
    expect(
      kinds("<script>alert(1)</script><style>p{}</style><p>kept</p>"),
    ).toEqual([["paragraph", 0, "kept"]]);
  });
});
