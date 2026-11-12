import { describe, expect, it } from "vitest";
import { parseTypedDate } from "./date-parse.ts";

const TODAY = "2026-11-11";

describe("parseTypedDate", () => {
  it.each([
    ["2026-12-03", "2026-12-03"],
    ["12/3/2026", "2026-12-03"],
    ["12/03/2026", "2026-12-03"],
    ["Dec 3, 2026", "2026-12-03"],
    ["December 3, 2026", "2026-12-03"],
    ["dec 3 2026", "2026-12-03"],
    ["3 Dec 2026", "2026-12-03"],
    ["Dec 3", "2026-12-03"],
    ["  Jan 15, 2027 ", "2027-01-15"],
  ])("reads %s as %s", (text, day) => {
    expect(parseTypedDate(text, TODAY)).toBe(day);
  });

  it.each([
    ["today", "2026-11-11"],
    ["Tomorrow", "2026-11-12"],
    ["yesterday", "2026-11-10"],
  ])("reads %s from today", (text, day) => {
    expect(parseTypedDate(text, TODAY)).toBe(day);
  });

  it.each(["", "soon", "2026-02-30", "13/1/2026", "Foo 3, 2026", "Dec 32"])(
    "finds no day in %j",
    (text) => {
      expect(parseTypedDate(text, TODAY)).toBeUndefined();
    },
  );
});
