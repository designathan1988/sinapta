// A number property's config: how its values are written and shown.
import * as v from "valibot";

export const NUMBER_FORMATS = [
  "number",
  "comma",
  "percent",
  "currency",
] as const;
export const NUMBER_DISPLAYS = ["number", "bar", "ring"] as const;

export const numberConfigSchema = v.object({
  format: v.picklist(NUMBER_FORMATS),
  // An ISO 4217 code, such as "BRL", for the currency format.
  currency: v.optional(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))),
  display: v.picklist(NUMBER_DISPLAYS),
  // Digits after the point, as Notion's "Decimal places"; unset is the
  // format's own default.
  decimals: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(5)),
  ),
  // What a full bar or ring stands for; 100 when unset.
  divideBy: v.optional(v.pipe(v.number(), v.finite(), v.gtValue(0))),
});

export type NumberConfig = v.InferOutput<typeof numberConfigSchema>;
export type NumberFormat = NumberConfig["format"];
export type NumberDisplay = NumberConfig["display"];

export const DEFAULT_NUMBER_CONFIG: NumberConfig = {
  format: "number",
  display: "number",
};

// The config held in memory, already checked on load, read with its type.
export function readNumberConfig(config: unknown): NumberConfig {
  return v.is(numberConfigSchema, config) ? config : DEFAULT_NUMBER_CONFIG;
}
