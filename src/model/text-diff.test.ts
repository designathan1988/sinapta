import { describe, expect, it } from "vitest";
import { diffText } from "./text-diff.ts";

describe("diffText", () => {
  it("returns nothing for equal texts", () => {
    expect(diffText("same", "same")).toBeUndefined();
  });

  it.each([
    {
      name: "an insertion in the middle",
      before: "Helo",
      after: "Hello",
      edit: { start: 3, end: 3, text: "l" },
    },
    {
      name: "an insertion at the end",
      before: "Hi",
      after: "Hi!",
      edit: { start: 2, end: 2, text: "!" },
    },
    {
      name: "a deletion",
      before: "Hello",
      after: "Hlo",
      edit: { start: 1, end: 3, text: "" },
    },
    {
      name: "a replacement",
      before: "teh cat",
      after: "the cat",
      edit: { start: 1, end: 3, text: "he" },
    },
    {
      name: "text typed into nothing",
      before: "",
      after: "日本",
      edit: { start: 0, end: 0, text: "日本" },
    },
    {
      name: "everything removed",
      before: "abc",
      after: "",
      edit: { start: 0, end: 3, text: "" },
    },
    {
      name: "a repeated letter",
      before: "aa",
      after: "aaa",
      edit: { start: 2, end: 2, text: "a" },
    },
  ])("finds $name", ({ before, after, edit }) => {
    expect(diffText(before, after)).toEqual(edit);
  });
});
