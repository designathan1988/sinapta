import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { viewSchema } from "./view.schema.ts";

const TABLE = {
  id: "v-1",
  databaseId: "db-1",
  name: "Table",
  type: "table",
  sorts: [],
  filters: [],
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

  it("rejects a layout it does not know", () => {
    expect(
      v.safeParse(viewSchema, { ...TABLE, type: "timeline" }).success,
    ).toBe(false);
  });
});
