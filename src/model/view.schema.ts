import * as v from "valibot";
import { blockIdSchema, propertyIdSchema, viewIdSchema } from "./id.schema.ts";
import { toneSchema } from "./rich-text.schema.ts";
import {
  calendarOptionsSchema,
  cardOptionsSchema,
  chartOptionsSchema,
  feedOptionsSchema,
  formOptionsSchema,
  listOptionsSchema,
  tableOptionsSchema,
  timelineOptionsSchema,
} from "./view-options.schema.ts";

export const filterSchema = v.object({
  propertyId: propertyIdSchema,
  operator: v.string(),
  value: v.unknown(),
  // Which end of a date range a date condition tests; absent, the start.
  dateEnd: v.optional(v.picklist(["start", "end"])),
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
// The layouts, in the order Notion lists them.
export const viewTypeSchema = v.picklist([
  "table",
  "board",
  "timeline",
  "calendar",
  "list",
  "gallery",
  "chart",
  "feed",
  "form",
]);

export const VIEW_TYPES = viewTypeSchema.options;

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
  // Text by its whole value or its first letter; absent, the whole value.
  textBy: v.optional(v.picklist(["exact", "alphabetical"])),
  // Numbers by each value or by intervals of a size; absent, each value.
  numberBy: v.optional(
    v.variant("kind", [
      v.object({ kind: v.literal("unique") }),
      v.object({
        kind: v.literal("interval"),
        size: v.pipe(v.number(), v.gtValue(0)),
        // The range the groups cover, as Notion's "Group by interval"
        // from and to; absent, 0 to 1000. Others are out of range.
        from: v.optional(v.number()),
        to: v.optional(v.number()),
      }),
    ]),
  ),
});

// Conditional color: the rows a filter keeps take a color, on their
// background or their title's text; the first rule a row matches wins.
export const colorRuleSchema = v.object({
  id: v.string(),
  filter: filterGroupSchema,
  color: v.union([v.literal("default"), toneSchema]),
  target: v.picklist(["background", "text"]),
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
  // A board's second grouping, as Notion's sub-groups: lanes across the
  // board, each holding every column.
  subGroupBy: v.optional(groupBySchema),
  // The calculation shown under each column, by property; the title
  // column's under "title".
  calculations: v.record(propertyIdSchema, calculationSchema),
  // Columns whose text wraps onto more lines instead of being cut.
  wrappedPropertyIds: v.array(propertyIdSchema),
  // How many columns from the start stay in place while the table
  // scrolls sideways.
  frozenCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  // A table's layout switches; absent, Notion's defaults.
  table: v.optional(tableOptionsSchema),
  // A board's and a gallery's card layout; absent, Notion's defaults.
  card: v.optional(cardOptionsSchema),
  list: v.optional(listOptionsSchema),
  feed: v.optional(feedOptionsSchema),
  // Counts above 99 written "99+" in the footer.
  countCap: v.optional(v.boolean()),
  colorRules: v.optional(v.array(colorRuleSchema)),
  // How a board or a gallery shows its cards: how wide, what picture
  // above the title, and whether a board tints each column.
  cardSize: v.picklist(["small", "medium", "large"]),
  cardPreview: v.picklist(["none", "cover", "content"]),
  colorColumns: v.boolean(),
  // The date property a calendar places its rows by (version 3).
  datePropertyId: v.optional(propertyIdSchema),
  calendar: calendarOptionsSchema,
  timeline: timelineOptionsSchema,
  chart: chartOptionsSchema,
  form: formOptionsSchema,
  // Where the view opens a row (version 26): beside the database, over it,
  // or as its own page.
  openMode: v.picklist(["side", "center", "full"]),
  // Locked (version 28): its filters, sorts, grouping and layout stay as
  // they are.
  isLocked: v.boolean(),
  // The template its new rows start from, when the view has its own: a
  // template, or null for an empty page; absent, the database's default.
  defaultTemplateId: v.optional(v.nullable(blockIdSchema)),
});

export type Filter = v.InferOutput<typeof filterSchema>;
export type FilterGroup = v.InferOutput<typeof filterGroupSchema>;
export type InnerFilterGroup = v.InferOutput<typeof innerFilterGroupSchema>;
export type FilterItem = FilterGroup["items"][number];
export type Conjunction = FilterGroup["conjunction"];
export type GroupBy = v.InferOutput<typeof groupBySchema>;
export type ColorRule = v.InferOutput<typeof colorRuleSchema>;
export type CalculationKind = v.InferOutput<typeof calculationSchema>;
export type View = v.InferOutput<typeof viewSchema>;
export type ViewType = v.InferOutput<typeof viewTypeSchema>;
