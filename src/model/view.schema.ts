import * as v from "valibot";
import { blockIdSchema, propertyIdSchema, viewIdSchema } from "./id.schema.ts";

export const filterSchema = v.object({
  propertyId: propertyIdSchema,
  operator: v.string(),
  value: v.unknown(),
});

export const viewSchema = v.object({
  id: viewIdSchema,
  databaseId: blockIdSchema,
  name: v.string(),
  type: v.literal("table"),
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
});

export type Filter = v.InferOutput<typeof filterSchema>;
export type View = v.InferOutput<typeof viewSchema>;
