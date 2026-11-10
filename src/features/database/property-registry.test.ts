import { describe, expect, it } from "vitest";
import { toPropertyId } from "./database-builder.ts";
import { PROPERTY_TYPES, propertyType } from "./property-registry.ts";

const property = {
  id: toPropertyId("p"),
  name: "Stage",
  type: "select",
  options: [
    { id: "o1", name: "Todo", color: "gray" },
    { id: "o2", name: "Done", color: "green" },
  ],
};

function operator(type: string, id: string) {
  const found = propertyType(type).filterOperators.find(
    (item) => item.id === id,
  );
  if (found === undefined) throw new Error(`no operator ${id}`);
  return found;
}

describe("the property registry", () => {
  it("holds the seven property types of version 1", () => {
    expect(PROPERTY_TYPES.map((item) => item.type)).toEqual([
      "text",
      "number",
      "select",
      "multi-select",
      "date",
      "checkbox",
      "url",
    ]);
  });

  it("reads an unknown type as text", () => {
    expect(propertyType("hologram").type).toBe("text");
  });
});

describe.each(PROPERTY_TYPES)("property type $type", (type) => {
  it("reads an empty cell as empty or unchecked", () => {
    expect(type.read(undefined) ?? false).toBe(false);
  });

  it("parses empty text as a cleared cell", () => {
    expect(type.parse("")).toBeUndefined();
  });

  it("offers at least one filter operator", () => {
    expect(type.filterOperators.length).toBeGreaterThan(0);
  });
});

describe("property values", () => {
  it.each([
    ["number", "12,5", 12.5],
    ["number", "abc", undefined],
    ["date", "2026-11-10", "2026-11-10"],
    ["date", "10/11/2026", undefined],
    ["date", "2026-13-45", undefined],
    ["url", "example.com/a", "https://example.com/a"],
    ["url", "javascript:alert(1)", undefined],
    ["checkbox", "true", true],
    ["text", "  kept as typed  ", "  kept as typed  "],
  ])("parses %s text %j", (type, text, expected) => {
    expect(propertyType(type).parse(text)).toEqual(expected);
  });

  it("ignores a stored value of the wrong kind", () => {
    expect(propertyType("number").read("12")).toBeUndefined();
    expect(propertyType("multi-select").read("o1")).toBeUndefined();
  });

  it("formats a select value as its option name", () => {
    expect(propertyType("select").format("o2", property)).toBe("Done");
    expect(propertyType("multi-select").format(["o1", "o2"], property)).toBe(
      "Todo, Done",
    );
  });

  it("orders numbers by value and text without regard to case", () => {
    expect(propertyType("number").compare(2, 10)).toBeLessThan(0);
    expect(propertyType("text").compare("apple", "Banana")).toBeLessThan(0);
    expect(propertyType("text").compare("item 2", "item 10")).toBeLessThan(0);
  });
});

describe("filter operators", () => {
  it.each([
    ["text", "contains", "Hello World", "WORLD", true],
    ["text", "contains", "Hello", "bye", false],
    ["text", "is-empty", undefined, "", true],
    ["number", "greater-than", 5, "3", true],
    ["number", "greater-than", undefined, "3", false],
    ["number", "equals", 2.5, "2,5", true],
    ["date", "before", "2026-01-01", "2026-06-01", true],
    ["date", "after", "2026-01-01", "2026-06-01", false],
    ["select", "is", "o1", "o1", true],
    ["select", "is-not", undefined, "o1", true],
    ["multi-select", "contains", ["o1", "o2"], "o2", true],
    ["multi-select", "does-not-contain", ["o1"], "o2", true],
    ["checkbox", "is-checked", true, "", true],
    ["checkbox", "is-not-checked", undefined, "", true],
  ] as const)("%s %s", (...row) => {
    const [type, id, value, operand, expected] = row;

    expect(operator(type, id).test(value, operand)).toBe(expected);
  });
});
