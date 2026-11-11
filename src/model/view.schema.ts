import * as v from "valibot";
import { blockIdSchema, propertyIdSchema, viewIdSchema } from "./id.schema.ts";

export const filterSchema = v.object({
  propertyId: propertyIdSchema,
  operator: v.string(),
  value: v.unknown(),
});

export const conjunctionSchema = v.picklist(["and", "or"]);

// A group inside the view's filter holds conditions only, so groups are
// at most two deep, as in Notion (version 16).
const innerFilterGroupSchema = v.object({
  conjunction: conjunctionSchema,
  items: v.array(filterSchema),
});

export const filterGroupSchema = v.object({
  conjunction: conjunctionSchema,
  items: v.array(v.union([filterSchema, innerFilterGroupSchema])),
});

// How a view lays out its rows. Every layout but the table was added in
// schema version 3.
export const viewTypeSchema = v.picklist([
  "table",
  "board",
  "gallery",
  "list",
  "calendar",
]);

// How a view groups its rows: by one property's values, the groups in the
// property's own order or by name, and collapsed groups by their key.
export const groupBySchema = v.object({
  propertyId: propertyIdSchema,
  sort: v.picklist(["manual", "ascending", "descending"]),
  hideEmpty: v.boolean(),
  collapsed: v.array(v.string()),
  // The span of the groups of a date property.
  dateBy: v.picklist(["day", "week", "month", "year"]),
  // Group keys in the order placed by hand, first; the others follow.
  order: v.array(v.string()),
  // Group keys not shown.
  hidden: v.array(v.string()),
});

// What a column's footer works out from the rows a view shows. A rollup
// works out the same from related rows, and more.
export const CALCULATION_KINDS = [
  "count-all",
  "count-values",
  "count-unique",
  "count-empty",
  "count-not-empty",
  "percent-empty",
  "percent-not-empty",
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
  "earliest-date",
  "latest-date",
  "date-range",
  "checked",
  "unchecked",
  "percent-checked",
  "percent-unchecked",
] as const;

export const calculationSchema = v.picklist(CALCULATION_KINDS);

// How a calendar shows its rows (version 22): a month or a week, with or
// without Saturdays and Sundays, its weeks starting on Sunday (0) or
// Monday (1).
export const calendarOptionsSchema = v.object({
  mode: v.picklist(["month", "week"]),
  showWeekends: v.boolean(),
  weekStartsOn: v.picklist([0, 1]),
});

export const viewSchema = v.object({
  id: viewIdSchema,
  databaseId: blockIdSchema,
  name: v.string(),
  type: viewTypeSchema,
  sorts: v.array(
    v.object({
      propertyId: propertyIdSchema,
      direction: v.picklist(["ascending", "descending"]),
    }),
  ),
  // Which rows the view shows (version 16; before, a list joined by and).
  filter: filterGroupSchema,
  propertyOrder: v.array(propertyIdSchema),
  propertyWidths: v.record(propertyIdSchema, v.number()),
  hiddenPropertyIds: v.array(propertyIdSchema),
  // The select property a board groups its cards by (version 3).
  groupBy: v.optional(groupBySchema),
  // The calculation shown under each column, by property; the title
  // column's under "title".
  calculations: v.record(propertyIdSchema, calculationSchema),
  // Columns whose text wraps onto more lines instead of being cut.
  wrappedPropertyIds: v.array(propertyIdSchema),
  // How many columns from the start stay in place while the table
  // scrolls sideways.
  frozenCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  // How a board or a gallery shows its cards: how wide, what picture
  // above the title, and whether a board tints each column.
  cardSize: v.picklist(["small", "medium", "large"]),
  cardPreview: v.picklist(["none", "cover", "content"]),
  colorColumns: v.boolean(),
  // The date property a calendar places its rows by (version 3).
  datePropertyId: v.optional(propertyIdSchema),
  calendar: calendarOptionsSchema,
});

export type Filter = v.InferOutput<typeof filterSchema>;
export type FilterGroup = v.InferOutput<typeof filterGroupSchema>;
export type InnerFilterGroup = v.InferOutput<typeof innerFilterGroupSchema>;
export type FilterItem = FilterGroup["items"][number];
export type Conjunction = FilterGroup["conjunction"];
export type GroupBy = v.InferOutput<typeof groupBySchema>;
export type CalculationKind = v.InferOutput<typeof calculationSchema>;
export type View = v.InferOutput<typeof viewSchema>;
export type ViewType = v.InferOutput<typeof viewTypeSchema>;
export type CalendarOptions = v.InferOutput<typeof calendarOptionsSchema>;
