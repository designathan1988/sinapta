// The functions formulas can call, besides the special forms below, which
// the evaluator works out itself.
import { graphemeCount } from "../../../../model/index.ts";
import { DATE_FUNCTIONS, type FormulaFunction } from "./formula-dates.ts";
import { LIST_FUNCTIONS } from "./formula-lists.ts";
import {
  asList,
  asNumber,
  asText,
  FormulaError,
  isEmptyValue,
  isList,
  sameValue,
  valueText,
  type FormulaValue,
} from "./formula-value.ts";

const MANY = Number.POSITIVE_INFINITY;

function numbers(args: readonly FormulaValue[], name: string): number[] {
  return args
    .flatMap((arg) => (isList(arg) ? arg : [arg]))
    .map((arg) => asNumber(arg, name));
}

function math(
  name: string,
  apply: (...values: number[]) => number,
): FormulaFunction {
  return {
    arity: [1, 1],
    call: (args) => apply(asNumber(args[0] ?? null, name)),
  };
}

function aggregate(
  name: string,
  apply: (values: number[]) => number,
): FormulaFunction {
  return {
    arity: [1, MANY],
    call: (args) => {
      const values = numbers(args, name);
      if (values.length === 0)
        throw new FormulaError(`${name} needs a number.`);
      return apply(values);
    },
  };
}

function textOnly(
  name: string,
  apply: (text: string) => FormulaValue,
): FormulaFunction {
  return { arity: [1, 1], call: (args) => apply(asText(args[0] ?? null)) };
}

function pattern(source: FormulaValue, flags: string): RegExp {
  try {
    return new RegExp(asText(source), flags);
  } catch {
    throw new FormulaError("The pattern cannot be read.");
  }
}

function replacer(flags: string): FormulaFunction {
  return {
    arity: [3, 3],
    call: ([text = null, find = null, replacement = null]) =>
      asText(text).replace(pattern(find, flags), asText(replacement)),
  };
}

function round(args: readonly FormulaValue[]): FormulaValue {
  const value = asNumber(args[0] ?? null, "round");
  const places = args[1] === undefined ? 0 : asNumber(args[1], "round");
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function slice(args: readonly FormulaValue[]): FormulaValue {
  const [target = null, startValue = 0, endValue] = args;
  const start = asNumber(startValue, "slice");
  const end = endValue === undefined ? undefined : asNumber(endValue, "slice");
  return isList(target)
    ? target.slice(start, end)
    : asText(target).slice(start, end);
}

function contains(args: readonly FormulaValue[]): FormulaValue {
  const [target = null, item = null] = args;
  if (isList(target)) return target.some((each) => sameValue(each, item));
  return asText(target).includes(asText(item));
}

function concat(args: readonly FormulaValue[]): FormulaValue {
  if (args.every(isList)) return args.flat();
  return args.map(valueText).join("");
}

function at(list: readonly FormulaValue[], index: number): FormulaValue {
  return list.at(index) ?? null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 1
    ? high
    : ((sorted[middle - 1] ?? 0) + high) / 2;
}

function constant(value: number): FormulaFunction {
  return { arity: [0, 0], call: () => value };
}

function toNumber(args: readonly FormulaValue[]): FormulaValue {
  const value = args[0] ?? null;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number.parseFloat(asText(value));
  return Number.isNaN(parsed) ? null : parsed;
}

export const FUNCTIONS: Readonly<Record<string, FormulaFunction>> = {
  ...DATE_FUNCTIONS,
  ...LIST_FUNCTIONS,
  and: {
    arity: [1, MANY],
    call: (args) => args.every((arg) => !isEmptyValue(arg)),
  },
  or: {
    arity: [1, MANY],
    call: (args) => args.some((arg) => !isEmptyValue(arg)),
  },
  not: { arity: [1, 1], call: (args) => isEmptyValue(args[0] ?? null) },
  empty: { arity: [1, 1], call: (args) => isEmptyValue(args[0] ?? null) },
  length: {
    arity: [1, 1],
    call: ([value = null]) =>
      isList(value) ? value.length : graphemeCount(asText(value)),
  },
  contains: { arity: [2, 2], call: contains },
  concat: { arity: [1, MANY], call: concat },
  join: {
    arity: [2, 2],
    call: ([list = null, separator = null]) =>
      asList(list, "join").map(valueText).join(asText(separator)),
  },
  lower: textOnly("lower", (text) => text.toLowerCase()),
  upper: textOnly("upper", (text) => text.toUpperCase()),
  replace: replacer(""),
  replaceAll: replacer("g"),
  slice: { arity: [2, 3], call: slice },
  format: { arity: [1, 1], call: ([value = null]) => valueText(value) },
  toNumber: { arity: [1, 1], call: toNumber },
  round: { arity: [1, 2], call: round },
  floor: math("floor", Math.floor),
  ceil: math("ceil", Math.ceil),
  abs: math("abs", Math.abs),
  sqrt: math("sqrt", Math.sqrt),
  cbrt: math("cbrt", Math.cbrt),
  sign: math("sign", Math.sign),
  exp: math("exp", Math.exp),
  ln: math("ln", Math.log),
  log10: math("log10", Math.log10),
  log2: math("log2", Math.log2),
  pi: constant(Math.PI),
  e: constant(Math.E),
  mean: aggregate(
    "mean",
    (values) =>
      values.reduce((total, value) => total + value, 0) / values.length,
  ),
  median: aggregate("median", median),
  min: aggregate("min", (values) => Math.min(...values)),
  max: aggregate("max", (values) => Math.max(...values)),
  sum: aggregate("sum", (values) =>
    values.reduce((total, value) => total + value, 0),
  ),
  mod: {
    arity: [2, 2],
    call: ([a = null, b = null]) => {
      const divisor = asNumber(b, "mod");
      if (divisor === 0) throw new FormulaError("Division by zero.");
      return asNumber(a, "mod") % divisor;
    },
  },
  pow: {
    arity: [2, 2],
    call: ([a = null, b = null]) => asNumber(a, "pow") ** asNumber(b, "pow"),
  },
  at: {
    arity: [2, 2],
    call: ([list = null, index = null]) =>
      at(asList(list, "at"), asNumber(index, "at")),
  },
  first: {
    arity: [1, 1],
    call: ([list = null]) => at(asList(list, "first"), 0),
  },
  last: {
    arity: [1, 1],
    call: ([list = null]) => at(asList(list, "last"), -1),
  },
};

// Functions whose arguments the evaluator works out itself, one by one.
export const SPECIAL_FORMS: Readonly<
  Record<string, readonly [number, number]>
> = {
  prop: [1, 1],
  if: [3, 3],
  ifs: [3, MANY],
  map: [2, 2],
  filter: [2, 2],
  find: [2, 2],
  findIndex: [2, 2],
  some: [2, 2],
  every: [2, 2],
  sort: [1, 2],
  let: [3, 3],
  lets: [3, MANY],
  id: [0, 0],
};

export type { FormulaFunction };
