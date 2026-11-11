import { describe, expect, it } from "vitest";
import {
  hasMarkdownBlocks,
  parseInlineMarkdown,
  parseMarkdownBlocks,
} from "./pasted-markdown.ts";

describe("parseInlineMarkdown", () => {
  it("reads bold, italic, strikethrough and inline code", () => {
    expect(parseInlineMarkdown("a **b** *c* ~~d~~ `e`")).toEqual([
      { text: "a " },
      { text: "b", marks: ["bold"] },
      { text: " " },
      { text: "c", marks: ["italic"] },
      { text: " " },
      { text: "d", marks: ["strikethrough"] },
      { text: " " },
      { text: "e", marks: ["code"] },
    ]);
  });

  it("reads marks inside marks and links with allowed targets", () => {
    expect(parseInlineMarkdown("**bold _both_** [site](https://a.b)")).toEqual([
      { text: "bold ", marks: ["bold"] },
      { text: "both", marks: ["bold", "italic"] },
      { text: " " },
      { text: "site", href: "https://a.b/" },
    ]);
  });

  it("keeps a link with a refused target as plain text", () => {
    expect(parseInlineMarkdown("[x](javascript:alert(1))")).toEqual([
      { text: "x" },
    ]);
  });

  it("leaves text without markup as it is, including lone stars", () => {
    expect(parseInlineMarkdown("2 * 3 = 6")).toEqual([{ text: "2 * 3 = 6" }]);
  });
});

describe("parseMarkdownBlocks", () => {
  it("reads headings, lists, to-dos, quotes and dividers", () => {
    const blocks = parseMarkdownBlocks(
      "# Title\n## Part\n- one\n1. first\n- [x] done\n- [ ] open\n> said\n---\nplain",
    );

    expect(
      blocks.map((block) => [block.kind, block.level, block.isChecked]),
    ).toEqual([
      ["heading", 1, undefined],
      ["heading", 2, undefined],
      ["bulleted-list", undefined, undefined],
      ["numbered-list", undefined, undefined],
      ["to-do", undefined, true],
      ["to-do", undefined, false],
      ["quote", undefined, undefined],
      ["divider", undefined, undefined],
      ["paragraph", undefined, undefined],
    ]);
    expect(blocks[0]?.text).toEqual([{ text: "Title" }]);
  });

  it("nests list items by their indent", () => {
    const blocks = parseMarkdownBlocks("- a\n  - b\n    - c\n- d");

    expect(blocks.map((block) => block.depth)).toEqual([0, 1, 2, 0]);
  });

  it("keeps a fenced code block as one block with its lines", () => {
    const blocks = parseMarkdownBlocks(
      "```ts\nconst a = 1;\n\nlet b;\n```\nafter",
    );

    expect(blocks).toEqual([
      {
        kind: "code",
        depth: 0,
        text: [{ text: "const a = 1;\n\nlet b;" }],
        language: "ts",
      },
      { kind: "paragraph", depth: 0, text: [{ text: "after" }] },
    ]);
  });

  it("skips blank lines between blocks", () => {
    expect(parseMarkdownBlocks("a\n\n\nb")).toHaveLength(2);
  });
});

describe("hasMarkdownBlocks", () => {
  it("is true for text with a block marker", () => {
    expect(hasMarkdownBlocks("intro\n- item")).toBe(true);
  });

  it("is false for plain lines", () => {
    expect(hasMarkdownBlocks("one\ntwo")).toBe(false);
  });

  it("is true for a pipe table", () => {
    expect(hasMarkdownBlocks("| a | b |\n| --- | --- |")).toBe(true);
  });
});

describe("pipe tables", () => {
  it("become a table block with a header row and inline marks", () => {
    const blocks = parseMarkdownBlocks(
      "| a | b |\n| :-- | --: |\n| **c** | d\\|e |\nafter",
    );

    expect(blocks).toEqual([
      {
        kind: "simple-table",
        depth: 0,
        text: [],
        hasHeaderRow: true,
        rows: [
          [[{ text: "a" }], [{ text: "b" }]],
          [[{ text: "c", marks: ["bold"] }], [{ text: "d|e" }]],
        ],
      },
      { kind: "paragraph", depth: 0, text: [{ text: "after" }] },
    ]);
  });

  it("leave a line of pipes without a rule under it as text", () => {
    expect(parseMarkdownBlocks("| a | b |")[0]?.kind).toBe("paragraph");
  });
});
