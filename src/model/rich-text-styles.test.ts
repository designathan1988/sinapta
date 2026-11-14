import { describe, expect, it } from "vitest";
import type { RichText } from "./rich-text.schema.ts";
import {
  concatRichText,
  deleteRange,
  insertText,
  setLink,
  setTone,
  toggleMark,
} from "./rich-text.ts";

describe("text styles of version 2", () => {
  it("orders underline and strikethrough after the version 1 marks", () => {
    const struck = toggleMark([{ text: "ab", marks: ["underline"] }], {
      start: 0,
      end: 2,
      mark: "strikethrough",
    });
    const bold = toggleMark(struck, { start: 0, end: 2, mark: "bold" });

    expect(bold).toEqual([
      { text: "ab", marks: ["bold", "underline", "strikethrough"] },
    ]);
  });

  it("colors a range and keeps its marks and link", () => {
    const rich: RichText = [
      { text: "abc", marks: ["bold"], href: "https://a.b" },
    ];

    expect(
      setTone(rich, { start: 1, end: 3, key: "color", tone: "red" }),
    ).toEqual([
      { text: "a", marks: ["bold"], href: "https://a.b" },
      { text: "bc", marks: ["bold"], href: "https://a.b", color: "red" },
    ]);
  });

  it("removes a highlight and merges the spans again", () => {
    const rich: RichText = [{ text: "ab" }, { text: "c", highlight: "yellow" }];

    expect(
      setTone(rich, { start: 2, end: 3, key: "highlight", tone: undefined }),
    ).toEqual([{ text: "abc" }]);
  });

  it("keeps spans with different colors apart", () => {
    expect(
      concatRichText([{ text: "a", color: "red" }], [{ text: "b" }]),
    ).toEqual([{ text: "a", color: "red" }, { text: "b" }]);
  });

  it("gives typed text the color of the text before it", () => {
    expect(insertText([{ text: "a", color: "blue" }], 1, "b")).toEqual([
      { text: "ab", color: "blue" },
    ]);
  });

  it("keeps the color when a link is set", () => {
    const linked = setLink([{ text: "a", highlight: "green" }], {
      start: 0,
      end: 1,
      href: "https://a.b",
    });

    expect(linked).toEqual([
      { text: "a", highlight: "green", href: "https://a.b" },
    ]);
  });
});

describe("inline equations", () => {
  const equation = { text: "x^2", equation: "x^2" };

  it("never join the text next to them", () => {
    expect(concatRichText([{ text: "a" }], [equation])).toEqual([
      { text: "a" },
      equation,
    ]);
  });

  it("do not pass on to text typed after them", () => {
    expect(insertText([equation], 3, "!")).toEqual([equation, { text: "!" }]);
  });

  it("go whole when a deleted range cuts into them", () => {
    expect(deleteRange([{ text: "a" }, equation], 2, 3)).toEqual([
      { text: "a" },
    ]);
  });
});
