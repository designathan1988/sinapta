import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { viewSchema } from "./view.schema.ts";

const TABLE = {
  id: "v-1",
  databaseId: "db-1",
  name: "Table",
  type: "table",
  sorts: [],
  filter: { conjunction: "and", items: [] },
  propertyOrder: [],
  propertyWidths: {},
  hiddenPropertyIds: [],
};

describe("viewSchema", () => {
  it("reads a version 2 table view, which has no layout properties", () => {
    expect(v.safeParse(viewSchema, TABLE).success).toBe(true);
  });

  it.each(["board", "gallery", "list", "calendar"])(
    "reads a %s view",
    (type) => {
      const view = {
        ...TABLE,
        type,
        groupPropertyId: "p-1",
        datePropertyId: "p-2",
      };

      expect(v.parse(viewSchema, view)).toMatchObject({
        type,
        groupPropertyId: "p-1",
        datePropertyId: "p-2",
      });
    },
  );

  it("reads a filter group with one group inside it", () => {
    const filter = { propertyId: "p-1", operator: "is", value: "x" };
    const view = {
      ...TABLE,
      filter: {
        conjunction: "or",
        items: [filter, { conjunction: "and", items: [filter, filter] }],
      },
    };

    expect(v.safeParse(viewSchema, view).success).toBe(true);
  });

  it("refuses groups more than two deep", () => {
    const deep = {
      conjunction: "and",
      items: [
        { conjunction: "or", items: [{ conjunction: "and", items: [] }] },
      ],
    };

    expect(v.safeParse(viewSchema, { ...TABLE, filter: deep }).success).toBe(
      false,
    );
  });

  it("rejects a layout it does not know", () => {
    expect(
      v.safeParse(viewSchema, { ...TABLE, type: "timeline" }).success,
    ).toBe(false);
  });
});
