import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import {
  createdByProperty,
  editedByProperty,
} from "./created-by.definition.ts";

const PROPERTY = {
  id: toPropertyId("p"),
  name: "Created by",
  type: "created-by",
};

function passes(operator: string) {
  const found = createdByProperty.filterOperators.find(
    (item) => item.id === operator,
  );
  return (value: unknown, operand = ""): boolean =>
    found?.test(value, operand) ?? false;
}

describe("the created by and last edited by properties", () => {
  it("read the person kept on the row's record, and are never edited", () => {
    expect(createdByProperty.computedFrom).toBe("createdBy");
    expect(editedByProperty.computedFrom).toBe("editedBy");
    expect(createdByProperty.editor).toBe("none");
    expect(createdByProperty.format({ id: "u1", name: "Ada" }, PROPERTY)).toBe(
      "Ada",
    );
  });

  it("filter rows by who made them", () => {
    const ada = { id: "u1", name: "Ada Lovelace" };

    expect(passes("contains")(ada, "LOVE")).toBe(true);
    expect(passes("contains")(ada, "grace")).toBe(false);
    expect(passes("is-empty")(undefined)).toBe(true);
    expect(passes("is-empty")(ada)).toBe(false);
  });
});
