import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const EQUATION_TYPE = "equation";

// A block equation: its TeX source, drawn as MathML (version 11).
export const equationPropsSchema = v.object({
  expression: v.string(),
});

export type EquationProps = v.InferOutput<typeof equationPropsSchema>;
export type EquationBlock = TypedBlock<typeof EQUATION_TYPE, EquationProps>;
