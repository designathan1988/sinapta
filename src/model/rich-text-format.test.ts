import { describe, expect, it } from "vitest";
import type { RichText } from "./rich-text.schema.ts";
import { clearFormat } from "./rich-text.ts";

const FORMATTED: RichText = [
  { text: "bold ", marks: ["bold"] },
  { text: "link ", href: "https://example.com", marks: ["italic"] },
  { text: "red", color: "red", highlight: "yellow" },
];

describe("clearFormat", () => {
  it("leaves plain text over the whole range", () => {
    expect(clearFormat(FORMATTED, { start: 0, end: 13 })).toEqual([
      { text: "bold link red" },
    ]);
  });

  it("splits runs at the ends of a part of the range", () => {
    expect(clearFormat(FORMATTED, { start: 2, end: 7 })).toEqual([
      { text: "bo", marks: ["bold"] },
      { text: "ld li" },
      { text: "nk ", href: "https://example.com", marks: ["italic"] },
      { text: "red", color: "red", highlight: "yellow" },
    ]);
  });

  it("keeps a mention, and changes nothing for an empty range", () => {
    const mention: RichText = [
      {
        text: "Nov 13",
        mention: { kind: "date", date: "2026-11-13" },
        marks: ["bold"],
      },
    ];

    expect(clearFormat(mention, { start: 0, end: 6 })).toEqual([
      { text: "Nov 13", mention: { kind: "date", date: "2026-11-13" } },
    ]);
    expect(clearFormat(FORMATTED, { start: 3, end: 3 })).toBe(FORMATTED);
  });
});
