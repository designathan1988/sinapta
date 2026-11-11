import { describe, expect, it } from "vitest";
import type { FilterGroup } from "../../model/index.ts";
import { toPropertyId } from "./database-builder.ts";
import {
  addFilter,
  addGroup,
  removeAt,
  setConjunction,
  updateAt,
} from "./filter-edit.ts";

const a = { propertyId: toPropertyId("a"), operator: "is", value: "1" };
const b = { propertyId: toPropertyId("b"), operator: "is", value: "2" };

const GROUP: FilterGroup = {
  conjunction: "and",
  items: [a, { conjunction: "or", items: [a, b] }],
};

describe("filter edits", () => {
  it("changes a condition at the top or inside a group", () => {
    const top = updateAt(GROUP, [0], (filter) => ({ ...filter, value: "9" }));
    const inner = updateAt(GROUP, [1, 1], (filter) => ({
      ...filter,
      value: "8",
    }));

    expect(top.items[0]).toEqual({ ...a, value: "9" });
    expect(inner.items[1]).toEqual({
      conjunction: "or",
      items: [a, { ...b, value: "8" }],
    });
  });

  it("removes a condition, and a group with its last condition", () => {
    const once = removeAt(GROUP, [1, 0]);
    const twice = removeAt(once, [1, 0]);

    expect(once.items[1]).toEqual({ conjunction: "or", items: [b] });
    expect(twice.items).toEqual([a]);
  });

  it("joins the top or an inner group with and or or", () => {
    expect(setConjunction(GROUP, [], "or").conjunction).toBe("or");
    expect(setConjunction(GROUP, [1], "and").items[1]).toMatchObject({
      conjunction: "and",
    });
  });

  it("adds a condition at the top, inside a group, and a new group", () => {
    expect(addFilter(GROUP, [], b).items).toHaveLength(3);
    expect(addFilter(GROUP, [1], b).items[1]).toMatchObject({
      items: [a, b, b],
    });
    expect(addGroup(GROUP, b).items[2]).toEqual({
      conjunction: "and",
      items: [b],
    });
  });
});
