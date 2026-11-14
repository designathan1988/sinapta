import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import type { PropertyType } from "../../property-definition.ts";
import { personProperty } from "./person.definition.ts";

const PROPERTY = { id: toPropertyId("p"), name: "People", type: "person" };

const ADA = [{ id: "u1", name: "Ada Lovelace" }];
const BOTH = [...ADA, { id: "u2", name: "Grace Hopper" }];

function passes(type: PropertyType, operator: string) {
  const found = type.filterOperators.find((item) => item.id === operator);
  return (value: unknown, operand = ""): boolean =>
    found?.test(value, operand) ?? false;
}

describe("the person property", () => {
  it("shows the people's names, as kept when chosen", () => {
    expect(personProperty.format(BOTH, PROPERTY)).toBe(
      "Ada Lovelace, Grace Hopper",
    );
    expect(personProperty.format([{ id: 3 }], PROPERTY)).toBe("");
  });

  it("filters rows by a name the people contain, in any case", () => {
    const contains = passes(personProperty, "contains");

    expect(contains(BOTH, "grace")).toBe(true);
    expect(contains(ADA, "grace")).toBe(false);
    expect(contains(undefined, "grace")).toBe(false);
  });

  it("filters rows with no one, or with someone", () => {
    expect(passes(personProperty, "is-empty")(undefined)).toBe(true);
    expect(passes(personProperty, "is-empty")(ADA)).toBe(false);
    expect(passes(personProperty, "is-not-empty")(ADA)).toBe(true);
  });
});
