import { describe, expect, it } from "vitest";
import {
  firstGrapheme,
  nextBoundary,
  previousBoundary,
  snapToBoundary,
} from "./grapheme.ts";

const FAMILY = "👨‍👩‍👧";
const ACCENTED = "é";

describe("firstGrapheme", () => {
  it.each([
    ["a plain letter", "abc", "a"],
    ["an emoji made of several code points", `${FAMILY} family`, FAMILY],
    ["a flag", "🇧🇷!", "🇧🇷"],
    ["a letter with a combining mark", `${ACCENTED}a`, ACCENTED],
    ["an emoji with a skin tone", "👍🏽 ok", "👍🏽"],
  ])("returns %s whole", (_, text, expected) => {
    expect(firstGrapheme(text)).toBe(expected);
  });

  it("returns an empty string for empty text", () => {
    expect(firstGrapheme("")).toBe("");
  });
});

describe("previousBoundary", () => {
  it("steps back over one letter", () => {
    expect(previousBoundary("abc", 2)).toBe(1);
  });

  it("steps back over a whole emoji sequence", () => {
    const text = `a${FAMILY}`;

    expect(previousBoundary(text, text.length)).toBe(1);
  });

  it("steps back over a letter and its combining mark together", () => {
    expect(previousBoundary(`x${ACCENTED}`, 3)).toBe(1);
  });

  it("stays at the start of the text", () => {
    expect(previousBoundary("abc", 0)).toBe(0);
  });
});

describe("nextBoundary", () => {
  it("steps forward over a whole emoji sequence", () => {
    expect(nextBoundary(`${FAMILY}b`, 0)).toBe(FAMILY.length);
  });

  it("stays at the end of the text", () => {
    expect(nextBoundary("abc", 3)).toBe(3);
  });
});

describe("snapToBoundary", () => {
  it("keeps an offset that is already between characters", () => {
    expect(snapToBoundary("abc", 2)).toBe(2);
  });

  it("moves an offset inside an emoji back to its start", () => {
    expect(snapToBoundary(`a${FAMILY}`, 3)).toBe(1);
  });

  it("clamps an offset beyond the text to its end", () => {
    expect(snapToBoundary("abc", 99)).toBe(3);
  });

  it("clamps a negative offset to the start", () => {
    expect(snapToBoundary("abc", -4)).toBe(0);
  });
});
