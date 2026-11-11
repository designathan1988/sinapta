// A unique ID property's config: the text before each number and the
// number the next row gets. Numbers only grow, so none is used twice.
import * as v from "valibot";

export const uniqueIdConfigSchema = v.object({
  prefix: v.string(),
  next: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type UniqueIdConfig = v.InferOutput<typeof uniqueIdConfigSchema>;

// The config held in memory, already checked on load, read with its type.
export function readUniqueIdConfig(config: unknown): UniqueIdConfig {
  return v.is(uniqueIdConfigSchema, config) ? config : { prefix: "", next: 1 };
}
