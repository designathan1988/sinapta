import { describe, expect, it } from "vitest";
import type { RichText } from "./rich-text.schema.ts";
import {
  concatRichText,
  deleteRange,
  insertText,
  plainText,
  setLink,
  splitRichText,
  toggleMark,
} from "./rich-text.ts";

const HELLO: RichText = [
  { text: "Hello " },
  { text: "world", marks: ["bold"] },
];

describe("plainText", () => {
  it("joins the text of every span", () => {
    expect(plainText(HELLO)).toBe("Hello world");
  });
});

describe("insertText", () => {
  it("leaves text typed at a link's end out of the link, as Notion", () => {
    const link = [{ text: "here", href: "https://example.com/" }];

    expect(insertText(link, 4, " more")).toEqual([
      { text: "here", href: "https://example.com/" },
      { text: " more" },
    ]);
    expect(insertText(link, 2, "x")).toEqual([
      { text: "hexre", href: "https://example.com/" },
    ]);
  });

  it("inserts into the middle of a span", () => {
    expect(insertText([{ text: "Helo" }], 2, "l")).toEqual([{ text: "Hello" }]);
  });

  it("inserts into empty text", () => {
    expect(insertText([], 0, "a")).toEqual([{ text: "a" }]);
  });

  it("takes the marks of the text before the insertion point", () => {
    const result = insertText(HELLO, 11, "!");

    expect(result).toEqual([
      { text: "Hello " },
      { text: "world!", marks: ["bold"] },
    ]);
  });

  it("stays plain at the boundary after plain text", () => {
    const result = insertText(HELLO, 6, "big ");

    expect(result).toEqual([
      { text: "Hello big " },
      { text: "world", marks: ["bold"] },
    ]);
  });

  it("stores inserted text in composed form", () => {
    const result = insertText([], 0, "é");

    expect(result).toEqual([{ text: "é" }]);
  });
});

describe("deleteRange", () => {
  it("deletes inside one span", () => {
    expect(deleteRange([{ text: "Hello" }], 1, 3)).toEqual([{ text: "Hlo" }]);
  });

  it("deletes across spans and drops spans left empty", () => {
    expect(deleteRange(HELLO, 3, 11)).toEqual([{ text: "Hel" }]);
  });

  it("returns no spans when everything is deleted", () => {
    expect(deleteRange(HELLO, 0, 11)).toEqual([]);
  });

  it("accepts the range in either order", () => {
    expect(deleteRange([{ text: "Hello" }], 3, 1)).toEqual([{ text: "Hlo" }]);
  });
});

describe("splitRichText", () => {
  it("splits inside a span and keeps the marks on both sides", () => {
    const [before, after] = splitRichText(HELLO, 8);

    expect(before).toEqual([
      { text: "Hello " },
      { text: "wo", marks: ["bold"] },
    ]);
    expect(after).toEqual([{ text: "rld", marks: ["bold"] }]);
  });

  it("gives an empty second half when split at the end", () => {
    expect(splitRichText(HELLO, 11)[1]).toEqual([]);
  });
});

describe("concatRichText", () => {
  it("joins two texts and merges spans with the same marks", () => {
    const result = concatRichText([{ text: "Hel" }], [{ text: "lo" }]);

    expect(result).toEqual([{ text: "Hello" }]);
  });

  it("keeps spans with different marks apart", () => {
    expect(
      concatRichText([{ text: "a" }], [{ text: "b", marks: ["bold"] }]),
    ).toEqual([{ text: "a" }, { text: "b", marks: ["bold"] }]);
  });
});

describe("toggleMark", () => {
  it("adds a mark to part of a span", () => {
    const result = toggleMark([{ text: "Hello" }], {
      start: 1,
      end: 3,
      mark: "italic",
    });

    expect(result).toEqual([
      { text: "H" },
      { text: "el", marks: ["italic"] },
      { text: "lo" },
    ]);
  });

  it("removes a mark when the whole range already has it", () => {
    const result = toggleMark(HELLO, { start: 6, end: 11, mark: "bold" });

    expect(result).toEqual([{ text: "Hello world" }]);
  });

  it("adds the mark everywhere when only part of the range has it", () => {
    const result = toggleMark(HELLO, { start: 0, end: 11, mark: "bold" });

    expect(result).toEqual([{ text: "Hello world", marks: ["bold"] }]);
  });

  it("keeps other marks and orders marks the same way every time", () => {
    const bold: RichText = [{ text: "x", marks: ["bold"] }];
    const result = toggleMark(bold, { start: 0, end: 1, mark: "italic" });

    expect(result).toEqual([{ text: "x", marks: ["bold", "italic"] }]);
  });

  it("changes nothing for an empty range", () => {
    expect(toggleMark(HELLO, { start: 4, end: 4, mark: "bold" })).toEqual(
      HELLO,
    );
  });
});

describe("setLink", () => {
  it("links a range and keeps its marks", () => {
    const result = setLink(HELLO, {
      start: 6,
      end: 11,
      href: "https://example.com/",
    });

    expect(result).toEqual([
      { text: "Hello " },
      { text: "world", marks: ["bold"], href: "https://example.com/" },
    ]);
  });

  it("removes a link", () => {
    const linked: RichText = [{ text: "site", href: "https://example.com/" }];

    expect(setLink(linked, { start: 0, end: 4, href: undefined })).toEqual([
      { text: "site" },
    ]);
  });
});
