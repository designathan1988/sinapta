import { describe, expect, it } from "vitest";
import { matchInlineMarkdown } from "./inline-markdown.ts";

// The text right after a key was typed, with the caret at its end.
function match(text: string) {
  return matchInlineMarkdown(text, text.length);
}

describe("matchInlineMarkdown", () => {
  it.each([
    ["**bold**", 0, 2, "bold"],
    ["say *this*", 4, 1, "italic"],
    ["say _this_", 4, 1, "italic"],
    ["run `npm`", 4, 1, "code"],
    ["~gone~", 0, 1, "strikethrough"],
    ["~~gone~~", 0, 2, "strikethrough"],
  ])("formats %j", (text, ...expected) => {
    const [start, markerLength, mark] = expected;
    expect(match(text)).toEqual({
      start,
      end: text.length,
      markerLength,
      mark,
    });
  });

  it.each([
    ["a lone *", "*"],
    ["the first half of **bold*", "**bold*"],
    ["empty **", "**"],
    ["spaces inside * no*", "* no*"],
    ["spaces before the end *no *", "*no *"],
    ["an underscore inside a word", "snake_case_"],
  ])("leaves %s alone", (_, text) => {
    expect(match(text)).toBeUndefined();
  });

  it("looks only at the text before the caret", () => {
    expect(matchInlineMarkdown("**bold** and more", 8)).toMatchObject({
      start: 0,
      mark: "bold",
    });
  });
});
