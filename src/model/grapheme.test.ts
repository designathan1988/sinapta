import { describe, expect, it } from "vitest";
import { firstGrapheme } from "./grapheme.ts";

describe("firstGrapheme", () => {
  it.each([
    ["a plain letter", "abc", "a"],
    ["an emoji made of several code points", "👨‍👩‍👧 family", "👨‍👩‍👧"],
    ["a flag", "🇧🇷!", "🇧🇷"],
    ["a letter with a combining mark", "éa", "é"],
    ["an emoji with a skin tone", "👍🏽 ok", "👍🏽"],
  ])("returns %s whole", (_, text, expected) => {
    expect(firstGrapheme(text)).toBe(expected);
  });

  it("returns an empty string for empty text", () => {
    expect(firstGrapheme("")).toBe("");
  });
});
