// Formulas (design D7): Pagecraft's own expression language, a subset of
// Notion's formulas 2.0. compileFormula reads and checks a formula once;
// evaluateFormula works it out for a row. Values are derived, never
// stored (specification 2.1).
import { checkFormula, type FormulaProperty } from "./formula-check.ts";
import {
  FormulaSyntaxError,
  parseFormula,
  type FormulaNode,
} from "./formula-parse.ts";
import { tokenizeFormula } from "./formula-tokenize.ts";

export type CompileResult =
  | { readonly ok: true; readonly program: FormulaNode }
  | { readonly ok: false; readonly error: string; readonly offset: number };

export function compileFormula(
  expression: string,
  properties: readonly FormulaProperty[],
  selfId?: string,
): CompileResult {
  const tokens = tokenizeFormula(expression);
  if (!tokens.ok) return tokens;
  try {
    const program = parseFormula(tokens.tokens);
    checkFormula(program, properties, selfId);
    return { ok: true, program };
  } catch (error) {
    if (!(error instanceof FormulaSyntaxError)) throw error;
    return { ok: false, error: error.message, offset: error.offset };
  }
}

export {
  evaluateFormula,
  type FormulaContext,
  type FormulaResult,
} from "./formula-evaluate.ts";
export type { FormulaProperty } from "./formula-check.ts";
export type { FormulaNode as FormulaProgram } from "./formula-parse.ts";
export type { FormulaDate, FormulaValue } from "./formula-value.ts";
