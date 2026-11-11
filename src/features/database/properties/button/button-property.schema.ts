// A button property's config: its label and what a press does to its
// row: set some of the row's values, and open the row as a page.
import * as v from "valibot";

export const buttonPropertyConfigSchema = v.object({
  label: v.string(),
  actions: v.array(
    v.variant("kind", [
      v.object({
        kind: v.literal("set-values"),
        // Property id to the value it takes; { today: true } is the day
        // of the press.
        values: v.record(v.string(), v.unknown()),
      }),
      v.object({ kind: v.literal("open-page") }),
    ]),
  ),
});

export type ButtonPropertyConfig = v.InferOutput<
  typeof buttonPropertyConfigSchema
>;
export type ButtonPropertyAction = ButtonPropertyConfig["actions"][number];

// The config held in memory, already checked on load, read with its type.
export function readButtonPropertyConfig(
  config: unknown,
): ButtonPropertyConfig {
  return v.is(buttonPropertyConfigSchema, config)
    ? config
    : { label: "", actions: [] };
}

// A value to set that stands for the day of the press.
export function isToday(value: unknown): boolean {
  return v.is(v.object({ today: v.literal(true) }), value);
}
