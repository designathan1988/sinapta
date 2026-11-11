import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import {
  markdownFileName,
  richTextToMarkdown,
  selectPageMarkdown,
} from "./markdown-export.selectors.ts";

function textBlock(
  id: string,
  type: string,
  props: Record<string, unknown>,
): BlockSpec {
  const { text = "", ...rest } = props;
  return { id, type, props: { text: [{ text }], ...rest } };
}

describe("richTextToMarkdown", () => {
  it("writes marks and links and escapes markup characters", () => {
    expect(
      richTextToMarkdown([
        { text: "a*b " },
        { text: "bold", marks: ["bold"] },
        { text: " " },
        { text: "x", marks: ["italic", "strikethrough"] },
        { text: " " },
        { text: "c", marks: ["code"] },
        { text: " " },
        { text: "site", href: "https://a.b/" },
      ]),
    ).toBe(String.raw`a\*b **bold** ~~*x*~~ ` + "`c` [site](https://a.b/)");
  });
});

describe("selectPageMarkdown", () => {
  it("writes the title and every block, nesting children by indent", () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        props: {
          title: [{ text: "Plan" }],
          icon: null,
          isFavorite: false,
          isTrashed: false,
        },
        children: [
          textBlock("h", "heading", { text: "Goals", level: 2 }),
          {
            ...textBlock("b", "bulleted-list", { text: "One" }),
            children: [textBlock("b1", "bulleted-list", { text: "Inner" })],
          },
          textBlock("t", "to-do", { text: "Done", isChecked: true }),
          textBlock("q", "quote", { text: "Said" }),
          { id: "d", type: "divider", props: {} },
          textBlock("c", "code", {
            text: "let a;\nlet b;",
            language: "javascript",
          }),
          {
            id: "i",
            type: "image",
            props: { src: "https://a.b/c.png", caption: "Cat" },
          },
          { id: "sub", type: "page", props: { title: [{ text: "Child" }] } },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    expect(selectPageMarkdown(state, toBlockId("page"))).toBe(
      [
        "# Plan",
        "",
        "## Goals",
        "",
        "- One",
        "  - Inner",
        "",
        "- [x] Done",
        "",
        "> Said",
        "",
        "---",
        "",
        "```javascript",
        "let a;",
        "let b;",
        "```",
        "",
        "![Cat](https://a.b/c.png)",
        "",
      ].join("\n"),
    );
  });
});

describe("markdownFileName", () => {
  it("names the file after the title, without characters files cannot hold", () => {
    expect(markdownFileName("Plan: Q4/2026")).toBe("Plan Q4 2026.md");
    expect(markdownFileName("")).toBe("Untitled.md");
  });
});

describe("plain paragraphs", () => {
  it("escape a block marker at their start, so they stay paragraphs", () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        props: { title: [], icon: null, isFavorite: false, isTrashed: false },
        children: [
          textBlock("a", "paragraph", { text: "# not a heading" }),
          textBlock("b", "paragraph", { text: "1. not a list" }),
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    expect(selectPageMarkdown(state, toBlockId("page"))).toBe(
      String.raw`# Untitled

\# not a heading

1\. not a list
`,
    );
  });
});

describe("simple tables", () => {
  it("are written as pipe tables, with pipes in cells escaped", () => {
    const rows = [
      [[{ text: "Name" }], [{ text: "Note" }]],
      [[{ text: "a|b" }], []],
    ];
    const workspace = buildWorkspace([
      {
        id: "page",
        props: { title: [] },
        children: [
          {
            id: "t",
            type: "simple-table",
            props: { rows, hasHeaderRow: true, hasHeaderColumn: false },
          },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    expect(selectPageMarkdown(state, toBlockId("page"))).toContain(
      ["| Name | Note |", "| --- | --- |", "| a\\|b |  |"].join("\n"),
    );
  });
});

describe("columns", () => {
  it("are written as their blocks, one column after another", () => {
    const column = (id: string, children: BlockSpec[]): BlockSpec => ({
      id,
      type: "column",
      props: { ratio: 0.5 },
      children,
    });
    const workspace = buildWorkspace([
      {
        id: "page",
        props: { title: [] },
        children: [
          {
            id: "list",
            type: "column-list",
            props: {},
            children: [
              column("c1", [textBlock("a", "paragraph", { text: "Left" })]),
              column("c2", [textBlock("b", "paragraph", { text: "Right" })]),
            ],
          },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    expect(selectPageMarkdown(state, toBlockId("page"))).toBe(
      "# Untitled\n\nLeft\n\nRight\n",
    );
  });
});
