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
  groupPropertyId: v.optional(propertyIdSchema),
  // The date property a calendar places its rows by (version 3).
  datePropertyId: v.optional(propertyIdSchema),
});

export type Filter = v.InferOutput<typeof filterSchema>;
export type FilterGroup = v.InferOutput<typeof filterGroupSchema>;
export type InnerFilterGroup = v.InferOutput<typeof innerFilterGroupSchema>;
export type FilterItem = FilterGroup["items"][number];
export type Conjunction = FilterGroup["conjunction"];
export type View = v.InferOutput<typeof viewSchema>;
export type ViewType = v.InferOutput<typeof viewTypeSchema>;
