// A button property's config, as Notion's button automation: its label
// and, in order, what a press does: set values on its row (Edit
// property), add a page to a database, edit the pages of a database that
// pass a filter, ask first (Show confirmation), open a page or a web
// address, and work out variables the values can use (Define variables).
import * as v from "valibot";
import { filterGroupSchema } from "../../../../model/index.ts";

// Property id to the value it takes; { today: true } is the day of the
// press and { variable: "name" } a variable worked out first.
const valuesSchema = v.record(v.string(), v.unknown());

export const buttonActionSchema = v.variant("kind", [
  v.object({ kind: v.literal("set-values"), values: valuesSchema }),
  v.object({
    kind: v.literal("open-page"),
    // This row when neither is set.
    pageId: v.optional(v.string()),
    url: v.optional(v.string()),
  }),
  v.object({
    kind: v.literal("add-page"),
    databaseId: v.string(),
    values: valuesSchema,
  }),
  v.object({
    kind: v.literal("edit-pages"),
    databaseId: v.string(),
    filter: v.optional(filterGroupSchema),
    values: valuesSchema,
  }),
  v.object({ kind: v.literal("confirm"), message: v.string() }),
  v.object({
    kind: v.literal("define-variables"),
    variables: v.array(v.object({ name: v.string(), expression: v.string() })),
  }),
]);

export const buttonPropertyConfigSchema = v.object({
  label: v.string(),
  actions: v.array(buttonActionSchema),
});

export type ButtonPropertyConfig = v.InferOutput<
  typeof buttonPropertyConfigSchema
>;
export type ButtonPropertyAction = ButtonPropertyConfig["actions"][number];
export type ButtonActionKind = ButtonPropertyAction["kind"];

// The config held in memory, already checked on load, read with its type.
export function readButtonPropertyConfig(
  config: unknown,
): ButtonPropertyConfig {
  const result = v.safeParse(buttonPropertyConfigSchema, config);
  return result.success ? result.output : { label: "", actions: [] };
}

// A value to set that stands for the day of the press.
export function isToday(value: unknown): boolean {
  return v.is(v.object({ today: v.literal(true) }), value);
}

// The variable a value to set stands for, if it is one.
export function variableOf(value: unknown): string | undefined {
  return v.is(v.object({ variable: v.string() }), value)
    ? value.variable
    : undefined;
}
