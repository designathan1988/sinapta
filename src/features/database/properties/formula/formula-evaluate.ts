// Works a checked formula out for one row. Mistakes that show only with
// the row's values, such as a division by zero, become an error value.
import { FUNCTIONS } from "./formula-functions.ts";
import type { FormulaNode } from "./formula-parse.ts";
import {
  asList,
  asNumber,
  FormulaEmpty,
  FormulaError,
  isDate,
  isEmptyValue,
  isList,
  sameValue,
  valueText,
  type FormulaValue,
} from "./formula-value.ts";

export interface FormulaContext {
  // The value of the row's property of that name.
  readonly valueOf: (name: string) => FormulaValue;
  // Now as "YYYY-MM-DDTHH:MM", for now() and today().
  readonly now: string;
}

export type FormulaResult = FormulaValue | { readonly error: string };

interface Env {
  readonly context: FormulaContext;
  // The list item map() and filter() are working on.
  readonly current: FormulaValue;
}

function divide(a: number, b: number, remainder: boolean): number {
  if (b === 0) throw new FormulaError("Division by zero.");
  return remainder ? a % b : a / b;
}

function add(left: FormulaValue, right: FormulaValue): FormulaValue {
  if (typeof left === "string" || typeof right === "string") {
    return valueText(left) + valueText(right);
  }
  if (isList(left) && isList(right)) return [...left, ...right];
  return asNumber(left, "+") + asNumber(right, "+");
}

function compare(left: FormulaValue, right: FormulaValue): number {
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  if (typeof left === "string" && typeof right === "string") {
    return left.localeCompare(right);
  }
  if (isDate(left) && isDate(right))
    return left.start.localeCompare(right.start);
  throw new FormulaError("These values cannot be compared.");
}

const ARITHMETIC: Readonly<Record<string, (a: number, b: number) => number>> = {
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => divide(a, b, false),
  "%": (a, b) => divide(a, b, true),
  "^": (a, b) => a ** b,
};

const COMPARISON: Readonly<Record<string, (order: number) => boolean>> = {
  "<": (order) => order < 0,
  "<=": (order) => order <= 0,
  ">": (order) => order > 0,
  ">=": (order) => order >= 0,
};

function applyOperator(
  op: string,
  left: FormulaValue,
  right: FormulaValue,
): FormulaValue {
  if (op === "+") return add(left, right);
  if (op === "==") return sameValue(left, right);
  if (op === "!=") return !sameValue(left, right);
  const arithmetic = ARITHMETIC[op];
  if (arithmetic !== undefined) {
    return arithmetic(asNumber(left, op), asNumber(right, op));
  }
  const comparison = COMPARISON[op];
  if (comparison === undefined) throw new FormulaError(`${op} is not known.`);
  return comparison(compare(left, right));
}

function binary(
  node: FormulaNode & { kind: "binary" },
  env: Env,
): FormulaValue {
  const left = evaluate(node.left, env);
  if (node.op === "&&")
    return !isEmptyValue(left) && !isEmptyValue(evaluate(node.right, env));
  if (node.op === "||")
    return !isEmptyValue(left) || !isEmptyValue(evaluate(node.right, env));
  return applyOperator(node.op, left, evaluate(node.right, env));
}

function ifs(args: readonly FormulaNode[], env: Env): FormulaValue {
  for (let index = 0; index + 1 < args.length; index += 2) {
    const test = args[index];
    const then = args[index + 1];
    if (
      test !== undefined &&
      then !== undefined &&
      !isEmptyValue(evaluate(test, env))
    ) {
      return evaluate(then, env);
    }
  }
  const otherwise = args.length % 2 === 1 ? args.at(-1) : undefined;
  return otherwise === undefined ? null : evaluate(otherwise, env);
}

function overList(
  args: readonly FormulaNode[],
  env: Env,
  keep: boolean,
): FormulaValue {
  const [listNode, body] = args;
  if (listNode === undefined || body === undefined) return null;
  const list = asList(evaluate(listNode, env), keep ? "filter" : "map");
  if (!keep) return list.map((current) => evaluate(body, { ...env, current }));
  return list.filter(
    (current) => !isEmptyValue(evaluate(body, { ...env, current })),
  );
}

function call(node: FormulaNode & { kind: "call" }, env: Env): FormulaValue {
  const { name, args } = node;
  const first = args[0];
  if (name === "prop") {
    return first?.kind === "literal"
      ? env.context.valueOf(valueText(first.value))
      : null;
  }
  if (name === "if" || name === "ifs") return ifs(args, env);
  if (name === "map" || name === "filter")
    return overList(args, env, name === "filter");
  const fn = FUNCTIONS[name];
  if (fn === undefined)
    throw new FormulaError(`There is no function named ${name}.`);
  const values = args.map((arg) => evaluate(arg, env));
  try {
    return fn.call(values, env.context.now);
  } catch (error) {
    if (error instanceof FormulaEmpty) return null;
    throw error;
  }
}

function evaluate(node: FormulaNode, env: Env): FormulaValue {
  switch (node.kind) {
    case "literal":
      return node.value;
    case "name":
      return node.name === "current" ? env.current : null;
    case "unary": {
      const value = evaluate(node.operand, env);
      return node.op === "!" ? isEmptyValue(value) : -asNumber(value, "-");
    }
    case "binary":
      return binary(node, env);
    case "call":
      return call(node, env);
    default: {
      const unknown: never = node;
      return unknown;
    }
  }
}

export function evaluateFormula(
  program: FormulaNode,
  context: FormulaContext,
): FormulaResult {
  try {
    return evaluate(program, { context, current: null });
  } catch (error) {
    if (error instanceof FormulaError) return { error: error.message };
    if (error instanceof RangeError)
      return { error: "This formula goes too deep." };
    throw error;
  }
}
