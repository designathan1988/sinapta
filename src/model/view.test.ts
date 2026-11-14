import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { viewSchema } from "./view.schema.ts";
import { SCHEMA_VERSION } from "./workspace.schema.ts";

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
  calculations: {},
  wrappedPropertyIds: [],
  frozenCount: 0,
  cardSize: "medium",
  cardPreview: "cover",
  colorColumns: true,
  calendar: { mode: "month", showWeekends: true, weekStartsOn: 0 },
  timeline: { zoom: "month", showTable: true },
  chart: { kind: "column", aggregate: "count" },
  form: { requiredPropertyIds: [], description: "" },
  openMode: "side",
  isLocked: false,
};

const GROUP_BY = {
  propertyId: "p-1",
  sort: "manual",
  hideEmpty: false,
  collapsed: ["o-1"],
  dateBy: "month",
  order: ["o-2"],
  hidden: [],
};

describe("viewSchema", () => {
  it("reads a version 2 table view, which has no layout properties", () => {
    expect(v.safeParse(viewSchema, TABLE).success).toBe(true);
  });

  it.each(["board", "gallery", "list", "calendar"])(
    "reads a %s view",
    (type) => {
      const view = { ...TABLE, type, groupBy: GROUP_BY, datePropertyId: "p-2" };

      expect(v.parse(viewSchema, view)).toMatchObject({
        type,
        groupBy: GROUP_BY,
        datePropertyId: "p-2",
      });
    },
  );

  it("reads a calendar's options, and refuses a mode it does not know", () => {
    const week = { mode: "week", showWeekends: false, weekStartsOn: 1 };
    const byDay = { ...week, mode: "day" };

    expect(v.parse(viewSchema, { ...TABLE, calendar: week })).toMatchObject({
      calendar: week,
    });
    expect(v.safeParse(viewSchema, { ...TABLE, calendar: byDay }).success).toBe(
      false,
    );
  });

  it("refuses a grouping with a sort or a date step it does not know", () => {
    const bySort = { ...TABLE, groupBy: { ...GROUP_BY, sort: "random" } };
    const byStep = { ...TABLE, groupBy: { ...GROUP_BY, dateBy: "hour" } };

    expect(v.safeParse(viewSchema, bySort).success).toBe(false);
    expect(v.safeParse(viewSchema, byStep).success).toBe(false);
  });

  it("reads a calculation per property and refuses one it does not know", () => {
    const summed = {
      ...TABLE,
      calculations: { "p-1": "sum", title: "count-all" },
    };
    const odd = { ...TABLE, calculations: { "p-1": "show-original" } };

    expect(v.parse(viewSchema, summed).calculations).toEqual({
      "p-1": "sum",
      title: "count-all",
    });
    expect(v.safeParse(viewSchema, odd).success).toBe(false);
  });

  it("reads wrapped and frozen columns, and refuses a negative count", () => {
    const view = { ...TABLE, wrappedPropertyIds: ["p-1"], frozenCount: 1 };

    expect(v.parse(viewSchema, view)).toMatchObject({ frozenCount: 1 });
    expect(v.safeParse(viewSchema, { ...TABLE, frozenCount: -1 }).success).toBe(
      false,
    );
  });

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
    expect(v.safeParse(viewSchema, { ...TABLE, type: "kanban" }).success).toBe(
      false,
    );
  });

  it("reads a view with every option added for Notion's finer settings", () => {
    const filter = {
      propertyId: "p-2",
      operator: "relative",
      value: "this:week",
      dateEnd: "end",
    };
    const view = {
      ...TABLE,
      filter: { conjunction: "and", items: [filter] },
      groupBy: {
        ...GROUP_BY,
        textBy: "alphabetical",
        numberBy: { kind: "interval", size: 10 },
      },
      card: { layout: "compact", fitMedia: true },
      list: { editTitle: true },
      feed: { wrapProperties: true },
      countCap: true,
      colorRules: [
        {
          id: "r-1",
          filter: { conjunction: "and", items: [filter] },
          color: "red",
          target: "background",
        },
      ],
      calendar: { ...TABLE.calendar, wrapTitles: true },
      timeline: {
        ...TABLE.timeline,
        separateDates: true,
        endDatePropertyId: "p-3",
      },
    };

    expect(v.safeParse(viewSchema, view).success).toBe(true);
  });

  it("refuses an interval of no size and a color it does not know", () => {
    const zero = {
      ...TABLE,
      groupBy: { ...GROUP_BY, numberBy: { kind: "interval", size: 0 } },
    };
    const rule = {
      id: "r",
      filter: { conjunction: "and", items: [] },
      color: "teal",
      target: "text",
    };

    expect(v.safeParse(viewSchema, zero).success).toBe(false);
    expect(
      v.safeParse(viewSchema, { ...TABLE, colorRules: [rule] }).success,
    ).toBe(false);
  });

  it("keeps the stored format's version", () => {
    expect(SCHEMA_VERSION).toBe(36);
  });
});
