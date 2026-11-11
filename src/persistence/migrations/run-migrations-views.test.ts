// Migrations of views: filter groups, grouping, calculations and table
// layout.
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../model/index.ts";
import { runMigrations } from "./run-migrations.ts";

describe("version 16", () => {
  it("reads a version 15 view's filters as an and group of them", () => {
    const filters = [
      { propertyId: "a", operator: "is", value: "x" },
      { propertyId: "b", operator: "is-empty", value: "" },
    ];
    const views = { v: { id: "v", filters, sorts: [] } };

    expect(runMigrations({ schemaVersion: 15, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          v: {
            id: "v",
            sorts: [],
            filter: { conjunction: "and", items: filters },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
        },
      },
    });
  });
});

describe("version 17", () => {
  it("turns a board's group property into its grouping, and drops it from other layouts", () => {
    const views = {
      b: {
        id: "b",
        type: "board",
        groupPropertyId: "p",
        filter: { conjunction: "and", items: [] },
      },
      t: {
        id: "t",
        type: "table",
        groupPropertyId: "p",
        filter: { conjunction: "and", items: [] },
      },
    };

    expect(runMigrations({ schemaVersion: 16, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          b: {
            id: "b",
            type: "board",
            filter: { conjunction: "and", items: [] },
            groupBy: {
              propertyId: "p",
              sort: "manual",
              hideEmpty: false,
              collapsed: [],
              dateBy: "month",
            },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
          t: {
            id: "t",
            type: "table",
            filter: { conjunction: "and", items: [] },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
        },
      },
    });
  });
});

describe("version 18", () => {
  it("gives every view an empty set of calculations", () => {
    const views = {
      v: { id: "v", type: "table", filter: { conjunction: "and", items: [] } },
    };

    expect(runMigrations({ schemaVersion: 17, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          v: {
            id: "v",
            type: "table",
            filter: { conjunction: "and", items: [] },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
        },
      },
    });
  });
});

describe("version 19", () => {
  it("gives every view no wrapped and no frozen columns", () => {
    const views = {
      v: {
        id: "v",
        calculations: {},
        filter: { conjunction: "and", items: [] },
      },
    };

    expect(runMigrations({ schemaVersion: 18, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          v: {
            id: "v",
            calculations: {},
            filter: { conjunction: "and", items: [] },
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
        },
      },
    });
  });
});

describe("version 20", () => {
  it("brings a view stored in an older shape under a newer version to the current shape", () => {
    const stale = {
      id: "v",
      type: "board",
      filters: [{ propertyId: "a", operator: "is", value: "x" }],
      groupPropertyId: "p",
    };

    const result = runMigrations({ schemaVersion: 19, views: { v: stale } });

    expect(result).toMatchObject({
      ok: true,
      file: {
        views: {
          v: {
            filter: { conjunction: "and", items: stale.filters },
            groupBy: { propertyId: "p", sort: "manual" },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
          },
        },
      },
    });
    expect(result.ok && result.file.views).not.toHaveProperty("v.filters");
  });

  it("leaves a view already in the current shape as it is", () => {
    const view = {
      id: "v",
      type: "table",
      filter: { conjunction: "or", items: [] },
      calculations: { p: "sum" },
      wrappedPropertyIds: ["p"],
      frozenCount: 2,
    };

    expect(runMigrations({ schemaVersion: 19, views: { v: view } })).toEqual({
      ok: true,
      file: { schemaVersion: SCHEMA_VERSION, views: { v: view } },
    });
  });

  it("turns a date still stored as text into a date value", () => {
    const blocks = {
      db: {
        type: "database",
        props: { properties: [{ id: "due", type: "date" }] },
      },
      row: {
        type: "page",
        parentId: "db",
        props: { values: { due: "2026-11-11" } },
      },
    };

    const result = runMigrations({ schemaVersion: 19, blocks });

    expect(result).toMatchObject({
      ok: true,
      file: {
        blocks: {
          row: { props: { values: { due: { start: "2026-11-11" } } } },
        },
      },
    });
  });
});
