// A relation property's config: the database its values come from, and
// whether that database has an inverse property that shows the relation
// from the other side.
import * as v from "valibot";
import { blockIdSchema, propertyIdSchema } from "../../../../model/index.ts";

export const relationConfigSchema = v.object({
  databaseId: blockIdSchema,
  isTwoWay: v.boolean(),
  inversePropertyId: v.optional(propertyIdSchema),
});

export type RelationConfig = v.InferOutput<typeof relationConfigSchema>;

// The config held in memory, already checked on load, read with its type;
// undefined while the property has no database yet.
export function readRelationConfig(
  config: unknown,
): RelationConfig | undefined {
  const result = v.safeParse(relationConfigSchema, config);
  return result.success ? result.output : undefined;
}
