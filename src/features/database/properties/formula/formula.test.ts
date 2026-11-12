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
  { id: toPropertyId("hours"), name: "Hours", type: "number" },
  { id: toPropertyId("missing"), name: "Missing", type: "date" },
  { id: toPropertyId("tags"), name: "Tags", type: "multi-select" },
  {
    id: toPropertyId("f1"),
    name: "First",
    type: "formula",
    config: { expression: 'prop("Second") + 1' },
  },
  {
    id: toPropertyId("f2"),
    name: "Second",
    type: "formula",
    config: { expression: 'prop("First") * 2' },
  },
];

const ROW: Readonly<Record<string, FormulaValue>> = {
  Due: { kind: "date", start: "2026-11-10" },
  Hours: 4,
  Tags: ["Design", "Code"],
};

const CONTEXT: FormulaContext = {
  valueOf: (name) => ROW[name] ?? null,
  now: "2026-11-11T09:30",
};

function run(expression: string) {
  const compiled = compileFormula(expression, PROPERTIES);
  if (!compiled.ok) return { error: compiled.error };
  return evaluateFormula(compiled.program, CONTEXT);
}

describe("formulas", () => {
  it.each([
    ["1 + 2 * 3 ^ 2", 19],
    ["(1 + 2) * 3", 9],
    ["-2 ^ 2", -4],
    ["10 % 4 + 7 / 2", 5.5],
    ["round(2.567, 2)", 2.57],
    ["max(3, 9, 4) - min(3, 9, 4)", 6],
    ['length("Pagecraft")', 9],
    ['prop("Hours") * 1.5', 6],
  ])("works out %s as %d", (expression, expected) => {
    expect(run(expression)).toBe(expected);
  });

  it("joins text and numbers with + as Notion does", () => {
    expect(run('"Week " + 3')).toBe("Week 3");
    expect(run('upper("ab") + lower("CD")')).toBe("ABcd");
  });

  it("decides with if, ifs, and, or and not", () => {
    expect(run('if(prop("Hours") > 3, "long", "short")')).toBe("long");
    expect(run('ifs(false, 1, prop("Hours") == 4, 2, 3)')).toBe(2);
    expect(run("true and not false or false")).toBe(true);
    expect(run('empty("") && !empty(prop("Tags"))')).toBe(true);
  });

  it("does date math on a date property", () => {
    expect(run('dateAdd(prop("Due"), 3, "days")')).toEqual({
      kind: "date",
      start: "2026-11-13",
    });
    expect(
      run(
        'dateBetween(prop("Due"), dateSubtract(prop("Due"), 2, "weeks"), "days")',
      ),
    ).toBe(14);
    expect(run('formatDate(prop("Due"), "YYYY/MM/DD")')).toBe("2026/11/10");
    expect(
      run('year(prop("Due")) + month(prop("Due")) + day(prop("Due"))'),
    ).toBe(2047);
  });

  it("works on lists with map, filter, join, at, first and last", () => {
    expect(run('join(map(prop("Tags"), upper(current)), "-")')).toBe(
      "DESIGN-CODE",
    );
    expect(run('filter(prop("Tags"), contains(current, "o"))')).toEqual([
      "Code",
    ]);
    expect(
      run('first(prop("Tags")) + last(prop("Tags")) + at(prop("Tags"), 1)'),
    ).toBe("DesignCodeCode");
    expect(run('prop("Tags").length()')).toBe(2);
  });

  it("is empty, not an error, when a date it needs is empty, as Notion's", () => {
    expect(run('dateBetween(prop("Missing"), now(), "days")')).toBeNull();
    expect(run('formatDate(prop("Missing"), "YYYY")')).toBeNull();
  });

  it("gives an error value for a division by zero", () => {
    expect(run("1 / 0")).toEqual({ error: "Division by zero." });
  });

  it("refuses a formula that refers to itself through others", () => {
    const self = compileFormula(
      'prop("First")',
      PROPERTIES,
      toPropertyId("f1"),
    );
    const cycle = compileFormula(
      'prop("Second")',
      PROPERTIES,
      toPropertyId("f1"),
    );

    expect(self).toMatchObject({ ok: false, error: "Circular reference." });
    expect(cycle).toMatchObject({ ok: false, error: "Circular reference." });
  });

  it("points at the place of a mistake", () => {
    expect(compileFormula("1 + ", PROPERTIES)).toMatchObject({
      ok: false,
      offset: 4,
    });
    expect(compileFormula('prop("Nope")', PROPERTIES)).toMatchObject({
      ok: false,
      error: 'No property is named "Nope".',
    });
    expect(compileFormula("sqrt()", PROPERTIES)).toMatchObject({
      ok: false,
      error: "sqrt takes 1 argument.",
    });
    expect(compileFormula("spin(1)", PROPERTIES)).toMatchObject({
      ok: false,
      error: "There is no function named spin.",
    });
  });

  it("works out 5,000 rows in under 50 milliseconds", () => {
    const compiled = compileFormula(
      'if(prop("Hours") > 2, round(prop("Hours") * 1.5, 1), 0) + length(join(prop("Tags"), ","))',
      PROPERTIES,
    );
    if (!compiled.ok) throw new Error(compiled.error);
    const times = Array.from({ length: 5 }, () => {
      const start = performance.now();
      for (let row = 0; row < 5000; row += 1) {
        evaluateFormula(compiled.program, CONTEXT);
      }
      return performance.now() - start;
    });

    expect(Math.min(...times)).toBeLessThan(50);
  });
});
