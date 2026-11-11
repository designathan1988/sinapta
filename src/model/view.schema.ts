import * as v from "valibot";
import { blockIdSchema, propertyIdSchema, viewIdSchema } from "./id.schema.ts";

export const filterSchema = v.object({
  propertyId: propertyIdSchema,
  operator: v.string(),
  value: v.unknown(),
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
  filters: v.array(filterSchema),
  propertyOrder: v.array(propertyIdSchema),
  propertyWidths: v.record(propertyIdSchema, v.number()),
  hiddenPropertyIds: v.array(propertyIdSchema),
  // The select property a board groups its cards by (version 3).
  groupPropertyId: v.optional(propertyIdSchema),
  // The date property a calendar places its rows by (version 3).
  datePropertyId: v.optional(propertyIdSchema),
});

export type Filter = v.InferOutput<typeof filterSchema>;
export type View = v.InferOutput<typeof viewSchema>;
export type ViewType = v.InferOutput<typeof viewTypeSchema>;
