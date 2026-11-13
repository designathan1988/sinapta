import * as v from "valibot";
import { propertyIdSchema } from "./id.schema.ts";

// Each layout's own options, kept apart from the view's shared fields.
// How a calendar shows its rows (version 22): a month or a week, with or
// without Saturdays and Sundays, its weeks starting on Sunday (0) or
// Monday (1).
// How a table draws itself, as Notion's layout switches: lines between
// columns, each row's page icon, and every column's text wrapped.
export const tableOptionsSchema = v.object({
  verticalLines: v.boolean(),
  pageIcons: v.boolean(),
  wrapAll: v.boolean(),
});

export type TableOptions = v.InferOutput<typeof tableOptionsSchema>;

export const DEFAULT_TABLE_OPTIONS: TableOptions = {
  verticalLines: true,
  pageIcons: true,
  wrapAll: false,
};

export const calendarOptionsSchema = v.object({
  mode: v.picklist(["month", "week"]),
  showWeekends: v.boolean(),
  weekStartsOn: v.picklist([0, 1]),
  // "Wrap page titles": a title on more lines instead of cut.
  wrapTitles: v.optional(v.boolean()),
});

// How a timeline shows its rows (version 23): by which date property, how
// much time a screen holds, and whether the table of rows sits beside it.
export const timelineOptionsSchema = v.object({
  datePropertyId: v.optional(propertyIdSchema),
  zoom: v.picklist(["day", "week", "month", "quarter", "year"]),
  showTable: v.boolean(),
  // "Separate start and end dates": the end read from a second property.
  separateDates: v.optional(v.boolean()),
  endDatePropertyId: v.optional(propertyIdSchema),
});

// What a chart shows (version 24): its kind, the property whose values
// make its groups, and what each group measures — its rows, or a number
// property summed, averaged or at its least or most.
export const chartOptionsSchema = v.object({
  kind: v.picklist(["column", "bar", "line", "donut"]),
  groupByPropertyId: v.optional(propertyIdSchema),
  aggregate: v.picklist(["count", "sum", "average", "min", "max"]),
  valuePropertyId: v.optional(propertyIdSchema),
});

// What a form asks (version 25): which questions must be answered, and
// the words above them.
export const formOptionsSchema = v.object({
  requiredPropertyIds: v.array(propertyIdSchema),
  description: v.string(),
});

// How a board's or a gallery's cards lay out their values, as Notion's
// "Card layout": side by side (compact) or one under another (list); and
// whether a card's picture is cut to fill or shown whole ("Fit media").
export const cardOptionsSchema = v.object({
  layout: v.picklist(["compact", "list"]),
  fitMedia: v.boolean(),
});

export type CardOptions = v.InferOutput<typeof cardOptionsSchema>;

export const DEFAULT_CARD_OPTIONS: CardOptions = {
  layout: "list",
  fitMedia: false,
};

// A list's "Directly edit page name": the title edited in place.
export const listOptionsSchema = v.object({ editTitle: v.boolean() });

// A feed's "Wrap properties": values on more lines instead of cut.
export const feedOptionsSchema = v.object({ wrapProperties: v.boolean() });

export type CalendarOptions = v.InferOutput<typeof calendarOptionsSchema>;
export type TimelineOptions = v.InferOutput<typeof timelineOptionsSchema>;
export type ChartOptions = v.InferOutput<typeof chartOptionsSchema>;
export type FormOptions = v.InferOutput<typeof formOptionsSchema>;
export type ListOptions = v.InferOutput<typeof listOptionsSchema>;
export type FeedOptions = v.InferOutput<typeof feedOptionsSchema>;
