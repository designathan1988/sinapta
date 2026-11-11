// A formula property's config: the formula as it was written.
import * as v from "valibot";

export const formulaConfigSchema = v.object({
  expression: v.string(),
});

export type FormulaConfig = v.InferOutput<typeof formulaConfigSchema>;

// The config held in memory, already checked on load, read with its type.
export function readFormulaConfig(config: unknown): FormulaConfig {
  return v.is(formulaConfigSchema, config) ? config : { expression: "" };
}
