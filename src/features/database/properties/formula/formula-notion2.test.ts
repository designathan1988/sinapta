import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import {
  compileFormula,
  evaluateFormula,
  type FormulaContext,
  type FormulaProperty,
  type FormulaValue,
} from "./formula.ts";

const PROPERTIES: readonly FormulaProperty[] = [
  { id: toPropertyId("due"), name: "Due", type: "date" },
  { id: toPropertyId("span"), name: "Span", type: "date" },
  { id: toPropertyId("tags"), name: "Tags", type: "multi-select" },
];

const ROW: Readonly<Record<string, FormulaValue>> = {
  Due: { kind: "date", start: "2026-11-10T14:05" },
  Span: { kind: "date", start: "2026-11-01", end: "2026-11-30" },
  Tags: ["Design", "Code", "Design"],
};

const CONTEXT: FormulaContext = {
  valueOf: (name) => ROW[name] ?? null,
  now: "2026-11-11T09:30",
  id: "row-1",
};

function run(expression: string) {
  const compiled = compileFormula(expression, PROPERTIES);
  if (!compiled.ok) return { error: compiled.error };
  return evaluateFormula(compiled.program, CONTEXT);
}

describe("Notion 2.0 formulas", () => {
  it("names values with let and lets", () => {
    expect(run("let(x, 3, x * x)")).toBe(9);
    expect(run('lets(a, 2, b, a + 1, "n" + (a * b))')).toBe("n6");
    expect(run("lets(a, 1, b, 2)")).toEqual({
      error: "lets takes names with values, then a result.",
    });
  });

  it("finds and tests items with current and index", () => {
    expect(run("find([4, 9, 12], current > 5)")).toBe(9);
    expect(run("findIndex([4, 9, 12], current > 5)")).toBe(1);
    expect(run("findIndex([4], current > 5)")).toBe(-1);
    expect(run("some([1, 2], current == 2)")).toBe(true);
    expect(run("every([1, 2], current == 2)")).toBe(false);
    expect(run("map([10, 20], current + index)")).toEqual([10, 21]);
  });

  it("sorts, reverses, deduplicates and flattens lists", () => {
    expect(run("sort([3, 1, 2])")).toEqual([1, 2, 3]);
    expect(run('sort(["b", "a"], current)')).toEqual(["a", "b"]);
    expect(run("reverse([1, 2, 3])")).toEqual([3, 2, 1]);
    expect(run('unique(prop("Tags"))')).toEqual(["Design", "Code"]);
    expect(run('includes(prop("Tags"), "Code")')).toBe(true);
    expect(run("flat([[1, 2], [3]])")).toEqual([1, 2, 3]);
  });

  it("splits, tests, matches, repeats and pads text", () => {
    expect(run('split("a,b,c", ",")')).toEqual(["a", "b", "c"]);
    expect(run('test("Pagecraft", "craft$")')).toBe(true);
    expect(run('match("a1b22", "[0-9]+")')).toEqual(["1", "22"]);
    expect(run('repeat("ab", 3)')).toBe("ababab");
    expect(run('padStart("7", 3, "0") + padEnd("x", 3, ".")')).toBe("007x..");
    expect(run('substring("Pagecraft", 4)')).toBe("craft");
    expect(run('style("Bold", "b", "red") + link("Site", "https://a.b")')).toBe(
      "BoldSite",
    );
  });

  it("does the math Notion offers", () => {
    expect(run("sign(-4) + cbrt(27) + log2(8) + log10(100)")).toBe(7);
    expect(run("round(ln(e()) + exp(0) + pi(), 2)")).toBe(5.14);
    expect(run("mean(1, 2, 6)")).toBe(3);
    expect(run("median([5, 1, 3, 2])")).toBe(2.5);
  });

  it("reads parts of dates as Notion 2.0 does", () => {
    expect(run('day(prop("Due"))')).toBe(2);
    expect(run('date(prop("Due"))')).toBe(10);
    expect(run('hour(prop("Due")) * 100 + minute(prop("Due"))')).toBe(1405);
    expect(run('week(prop("Due"))')).toBe(46);
    expect(run('dateEnd(prop("Span"))')).toEqual({
      kind: "date",
      start: "2026-11-30",
    });
    expect(run('dateStart(prop("Span"))')).toEqual({
      kind: "date",
      start: "2026-11-01",
    });
    expect(run('dateRange(parseDate("2026-01-02"), today())')).toEqual({
      kind: "date",
      start: "2026-01-02",
      end: "2026-11-11",
    });
    expect(run('fromTimestamp(timestamp(prop("Due")))')).toEqual(ROW.Due);
  });

  it("gives the row's id", () => {
    expect(run("id()")).toBe("row-1");
  });
});
