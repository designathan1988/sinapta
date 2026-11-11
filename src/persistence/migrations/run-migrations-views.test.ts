// Migrations of views: filter groups, grouping, calculations, table
// layout, the repair of stale records and board cards. Each is tested on
// its own, from the version before it; run-migrations.test.ts covers the
// chain.
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../model/index.ts";
import { addFilterGroups } from "./0016-filter-groups.ts";
import { addGroupBy } from "./0017-group-by.ts";
import { addCalculations } from "./0018-calculations.ts";
import { addTableLayout } from "./0019-table-layout.ts";
import { repairStaleRecords } from "./0020-repair-stale-records.ts";
import { addBoardCards } from "./0021-board-cards.ts";
import { runMigrations } from "./run-migrations.ts";

const NO_FILTER = { conjunction: "and", items: [] };

describe("version 16", () => {
  it("reads a version 15 view's filters as an and group of them", () => {
    const filters = [
      { propertyId: "a", operator: "is", value: "x" },
      { propertyId: "b", operator: "is-empty", value: "" },
    ];
    const views = { v: { id: "v", filters, sorts: [] } };

    expect(addFilterGroups({ views })).toEqual({
      views: {
        v: {
          id: "v",
          sorts: [],
          filter: { conjunction: "and", items: filters },
        },
      },
    });
  });
});

describe("version 17", () => {
  it("turns a board's group property into its grouping, and drops it from other layouts", () => {
    const views = {
      b: { id: "b", type: "board", groupPropertyId: "p" },
      t: { id: "t", type: "table", groupPropertyId: "p" },
    };

    expect(addGroupBy({ views })).toEqual({
      views: {
        b: {
          id: "b",
          type: "board",
          groupBy: {
            propertyId: "p",
            sort: "manual",
            hideEmpty: false,
            collapsed: [],
            dateBy: "month",
          },
        },
        t: { id: "t", type: "table" },
      },
    });
  });
});

describe("version 18", () => {
  it("gives every view an empty set of calculations", () => {
    expect(addCalculations({ views: { v: { id: "v" } } })).toEqual({
      views: { v: { id: "v", calculations: {} } },
    });
  });
});

describe("version 19", () => {
  it("gives every view no wrapped and no frozen columns", () => {
    expect(addTableLayout({ views: { v: { id: "v" } } })).toEqual({
      views: { v: { id: "v", wrappedPropertyIds: [], frozenCount: 0 } },
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

    const result = repairStaleRecords({ views: { v: stale } });

    expect(result).toMatchObject({
      views: {
        v: {
          filter: { conjunction: "and", items: stale.filters },
          groupBy: { propertyId: "p", sort: "manual" },
          calculations: {},
          wrappedPropertyIds: [],
          frozenCount: 0,
        },
      },
    });
    expect(result.views).not.toHaveProperty("v.filters");
    expect(result.views).not.toHaveProperty("v.groupPropertyId");
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

    expect(repairStaleRecords({ views: { v: view } })).toEqual({
      views: { v: view },
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

    expect(repairStaleRecords({ blocks })).toMatchObject({
      blocks: { row: { props: { values: { due: { start: "2026-11-11" } } } } },
    });
  });
});

describe("version 21", () => {
  it("gives groups no order or hidden ones, and cards their former look", () => {
    const groupBy = { propertyId: "p", sort: "manual" };
    const views = {
      b: { id: "b", type: "board", groupBy },
      g: { id: "g", type: "gallery" },
    };

    expect(addBoardCards({ views })).toEqual({
      views: {
        b: {
          id: "b",
          type: "board",
          groupBy: { ...groupBy, order: [], hidden: [] },
          cardSize: "medium",
          cardPreview: "cover",
          colorColumns: true,
        },
        g: {
          id: "g",
          type: "gallery",
          cardSize: "medium",
          cardPreview: "content",
          colorColumns: true,
        },
      },
    });
  });
});

describe("the chain of view migrations", () => {
  it("takes a version 15 view to the current shape", () => {
    const views = {
      v: { id: "v", type: "board", filters: [], groupPropertyId: "p" },
    };

    expect(runMigrations({ schemaVersion: 15, views })).toMatchObject({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          v: {
            filter: NO_FILTER,
            groupBy: { propertyId: "p", order: [], hidden: [] },
            calculations: {},
            wrappedPropertyIds: [],
            frozenCount: 0,
            cardSize: "medium",
          },
        },
      },
    });
  });
});
