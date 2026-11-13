import { describe, expect, it } from "vitest";
import { operatorOf, operatorsOf } from "./filter-operators.ts";
import { propertyType } from "./property-registry.ts";
import { toPropertyId } from "./database-builder.ts";

describe("operatorsOf", () => {
  it("gives a type's own conditions when it builds none", () => {
    const property = { id: toPropertyId("p-1"), name: "Notes", type: "text" };

    expect(operatorsOf(property)).toBe(propertyType("text").filterOperators);
    expect(operatorOf(property, "contains")?.id).toBe("contains");
  });

  it("gives a text column's conditions while no property is chosen", () => {
    expect(operatorsOf(undefined)).toBe(propertyType("text").filterOperators);
  });
});
