import { describe, expect, it } from "vitest";
import { TEXT_FILTERS } from "./text-filters.ts";

function condition(id: string) {
  const found = TEXT_FILTERS.find((operator) => operator.id === id);
  if (found === undefined) throw new Error(`no ${id} condition`);
  return found;
}

describe("text filters", () => {
  it("offer Notion's eight conditions in its order", () => {
    expect(TEXT_FILTERS.map((operator) => operator.label)).toEqual([
      "Is",
      "Is not",
      "Contains",
      "Does not contain",
      "Starts with",
      "Ends with",
      "Is empty",
      "Is not empty",
    ]);
  });

  it("match whole, opening and closing words without regard to case", () => {
    expect(condition("is").test("Plan", "plan")).toBe(true);
    expect(condition("starts-with").test("Plan the trip", "PLAN")).toBe(true);
    expect(condition("ends-with").test("Plan the trip", "trip")).toBe(true);
    expect(condition("ends-with").test("Plan the trip", "plan")).toBe(false);
  });

  it("let an empty value pass the negative conditions", () => {
    expect(condition("is-not").test(undefined, "plan")).toBe(true);
    expect(condition("does-not-contain").test(undefined, "plan")).toBe(true);
    expect(condition("does-not-contain").test("my plan", "plan")).toBe(false);
  });
});
