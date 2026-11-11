// A status property's config: its options sorted into three fixed groups.
import * as v from "valibot";

export const STATUS_GROUP_IDS = ["to-do", "in-progress", "complete"] as const;

export const statusConfigSchema = v.object({
  groups: v.array(
    v.object({
      id: v.picklist(STATUS_GROUP_IDS),
      optionIds: v.array(v.string()),
    }),
  ),
});

export type StatusGroupId = (typeof STATUS_GROUP_IDS)[number];
export type StatusConfig = v.InferOutput<typeof statusConfigSchema>;

// The config held in memory, already checked on load, read with its type.
export function readStatusConfig(config: unknown): StatusConfig | undefined {
  return v.is(statusConfigSchema, config) ? config : undefined;
}
